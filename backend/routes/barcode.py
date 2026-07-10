import io
import base64
from flask import Blueprint, request, jsonify
from flask_login import current_user
from models import db, Product
from routes import login_required_api

barcode_bp = Blueprint('barcode', __name__, url_prefix='/api/barcode')


@barcode_bp.route('/lookup', methods=['POST'])
@login_required_api
def lookup():
    """Find a product by barcode, SKU, or name (partial)."""
    data = request.get_json() or {}
    code = (data.get('code') or '').strip()
    if not code:
        return jsonify({'success': False, 'message': 'Code is required'}), 400

    # Try barcode exact match first, then SKU, then name partial
    product = (
        Product.query.filter_by(barcode=code).first()
        or Product.query.filter_by(sku=code).first()
        or Product.query.filter(Product.name.ilike(f'%{code}%')).first()
    )

    if not product:
        return jsonify({'success': False, 'message': f'No product found for code: {code}'}), 404

    return jsonify({'success': True, 'product': product.to_dict()})


@barcode_bp.route('/generate', methods=['POST'])
@login_required_api
def generate():
    """Generate a QR code PNG (base64) for a product."""
    data = request.get_json() or {}
    product_id = data.get('product_id')
    if not product_id:
        return jsonify({'success': False, 'message': 'product_id is required'}), 400

    product = Product.query.get(product_id)
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404

    try:
        import qrcode  # type: ignore
        qr_data = f"SKU:{product.sku}|NAME:{product.name}|PRICE:{product.price}"
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color='black', back_color='white')

        buf = io.BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)
        img_b64 = base64.b64encode(buf.read()).decode('utf-8')

        return jsonify({
            'success': True,
            'qr_code': f'data:image/png;base64,{img_b64}',
            'product': product.to_dict(),
        })
    except ImportError:
        # Graceful fallback: return SVG-based simple barcode representation
        svg = _make_simple_svg_barcode(product.sku)
        return jsonify({
            'success': True,
            'qr_code': f'data:image/svg+xml;base64,{base64.b64encode(svg.encode()).decode()}',
            'product': product.to_dict(),
        })


@barcode_bp.route('/batch-lookup', methods=['POST'])
@login_required_api
def batch_lookup():
    """Look up multiple codes at once."""
    data = request.get_json() or {}
    codes = data.get('codes', [])
    if not codes or not isinstance(codes, list):
        return jsonify({'success': False, 'message': 'codes array is required'}), 400

    results = []
    for code in codes[:50]:  # cap at 50
        code = str(code).strip()
        product = (
            Product.query.filter_by(barcode=code).first()
            or Product.query.filter_by(sku=code).first()
        )
        results.append({
            'code': code,
            'found': product is not None,
            'product': product.to_dict() if product else None,
        })

    found_count = sum(1 for r in results if r['found'])
    return jsonify({'success': True, 'results': results, 'found': found_count, 'total': len(results)})


def _make_simple_svg_barcode(sku: str) -> str:
    """Minimal fallback SVG when qrcode library is unavailable."""
    bars = ''.join(
        f'<rect x="{i * 4}" y="0" width="3" height="80" fill="{"black" if ord(c) % 2 else "white"}"/>'
        for i, c in enumerate(sku.ljust(20)[:20])
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">'
        f'<rect width="100" height="100" fill="white"/>{bars}'
        f'<text x="10" y="95" font-size="8" fill="black">{sku}</text></svg>'
    )
