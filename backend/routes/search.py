import json
from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_login import current_user
from models import db, Product, SavedFilter
from models.transaction import StockTransaction
from routes import login_required_api, admin_required

search_bp = Blueprint('search', __name__, url_prefix='/api/search')


@search_bp.route('/products', methods=['POST'])
@login_required_api
def search_products():
    """Search products with optional filters, sorting, and pagination."""
    data = request.get_json() or {}

    q = data.get('query', '').strip()
    category = data.get('category', '').strip()
    price_min = data.get('price_min')
    price_max = data.get('price_max')
    stock_min = data.get('stock_min')
    stock_max = data.get('stock_max')
    in_stock_only = data.get('in_stock_only', False)
    low_stock_only = data.get('low_stock_only', False)
    sort_by = data.get('sort_by', 'name')          # name | price | stock | date
    sort_dir = data.get('sort_dir', 'asc')          # asc | desc
    page = max(1, int(data.get('page', 1)))
    per_page = min(100, max(1, int(data.get('per_page', 20))))

    query = Product.query

    if q:
        like = f'%{q}%'
        query = query.filter(
            Product.name.ilike(like)
            | Product.sku.ilike(like)
            | Product.category.ilike(like)
            | Product.barcode.ilike(like)
        )
    if category:
        query = query.filter(Product.category.ilike(f'%{category}%'))
    if price_min is not None:
        query = query.filter(Product.price >= float(price_min))
    if price_max is not None:
        query = query.filter(Product.price <= float(price_max))
    if stock_min is not None:
        query = query.filter(Product.current_stock >= int(stock_min))
    if stock_max is not None:
        query = query.filter(Product.current_stock <= int(stock_max))
    if in_stock_only:
        query = query.filter(Product.current_stock > 0)
    if low_stock_only:
        query = query.filter(Product.current_stock <= Product.reorder_level)

    sort_col_map = {
        'name': Product.name,
        'price': Product.price,
        'stock': Product.current_stock,
        'date': Product.created_at,
    }
    col = sort_col_map.get(sort_by, Product.name)
    query = query.order_by(col.desc() if sort_dir == 'desc' else col.asc())

    total = query.count()
    products = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'success': True,
        'products': [p.to_dict() for p in products],
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page,
    })


@search_bp.route('/transactions', methods=['POST'])
@admin_required
def search_transactions():
    """Search transactions with filters (admin only)."""
    data = request.get_json() or {}

    txn_type = data.get('type', '').strip()
    product_id = data.get('product_id')
    user_id = data.get('user_id')
    date_from = data.get('date_from')
    date_to = data.get('date_to')
    qty_min = data.get('qty_min')
    qty_max = data.get('qty_max')
    page = max(1, int(data.get('page', 1)))
    per_page = min(100, max(1, int(data.get('per_page', 20))))

    query = StockTransaction.query

    if txn_type:
        query = query.filter(StockTransaction.transaction_type == txn_type)
    if product_id:
        query = query.filter(StockTransaction.product_id == int(product_id))
    if user_id:
        query = query.filter(StockTransaction.user_id == int(user_id))
    if date_from:
        try:
            query = query.filter(StockTransaction.created_at >= datetime.fromisoformat(date_from))
        except ValueError:
            pass
    if date_to:
        try:
            query = query.filter(StockTransaction.created_at <= datetime.fromisoformat(date_to))
        except ValueError:
            pass
    if qty_min is not None:
        query = query.filter(StockTransaction.quantity >= int(qty_min))
    if qty_max is not None:
        query = query.filter(StockTransaction.quantity <= int(qty_max))

    query = query.order_by(StockTransaction.created_at.desc())
    total = query.count()
    txns = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'success': True,
        'transactions': [t.to_dict() for t in txns],
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page,
    })


@search_bp.route('/suggestions', methods=['GET'])
@login_required_api
def suggestions():
    """Autocomplete: return top matching product names, SKUs, and categories."""
    q = (request.args.get('q') or '').strip()
    if len(q) < 1:
        return jsonify({'success': True, 'suggestions': []})

    like = f'%{q}%'
    products = (
        Product.query
        .filter(Product.name.ilike(like) | Product.sku.ilike(like))
        .order_by(Product.name)
        .limit(8)
        .all()
    )
    cats = (
        db.session.query(Product.category)
        .filter(Product.category.ilike(like))
        .distinct()
        .limit(4)
        .all()
    )

    result = []
    for p in products:
        result.append({'type': 'product', 'label': p.name, 'sub': p.sku, 'id': p.id})
    for (cat,) in cats:
        result.append({'type': 'category', 'label': cat, 'sub': 'Category'})

    return jsonify({'success': True, 'suggestions': result[:10]})


# ─── Saved Filters ────────────────────────────────────────────────────────────

@search_bp.route('/filters', methods=['GET'])
@login_required_api
def list_filters():
    """List the current user's saved filters."""
    filters = SavedFilter.query.filter_by(user_id=current_user.id).order_by(SavedFilter.created_at.desc()).all()
    return jsonify({'success': True, 'filters': [f.to_dict() for f in filters]})


@search_bp.route('/filters/save', methods=['POST'])
@login_required_api
def save_filter():
    """Save a new filter set."""
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    filter_type = data.get('filter_type', 'product')
    filters = data.get('filters', {})

    if not name:
        return jsonify({'success': False, 'message': 'Filter name is required'}), 400

    sf = SavedFilter(
        user_id=current_user.id,
        name=name,
        filter_type=filter_type,
        filters_json=json.dumps(filters),
    )
    db.session.add(sf)
    db.session.commit()
    return jsonify({'success': True, 'filter': sf.to_dict()}), 201


@search_bp.route('/filters/<int:filter_id>', methods=['PUT'])
@login_required_api
def update_filter(filter_id):
    """Update a saved filter."""
    sf = SavedFilter.query.filter_by(id=filter_id, user_id=current_user.id).first()
    if not sf:
        return jsonify({'success': False, 'message': 'Filter not found'}), 404

    data = request.get_json() or {}
    if 'name' in data:
        sf.name = data['name'].strip()
    if 'filters' in data:
        sf.filters_json = json.dumps(data['filters'])
    db.session.commit()
    return jsonify({'success': True, 'filter': sf.to_dict()})


@search_bp.route('/filters/<int:filter_id>', methods=['DELETE'])
@login_required_api
def delete_filter(filter_id):
    """Delete a saved filter."""
    sf = SavedFilter.query.filter_by(id=filter_id, user_id=current_user.id).first()
    if not sf:
        return jsonify({'success': False, 'message': 'Filter not found'}), 404
    db.session.delete(sf)
    db.session.commit()
    return jsonify({'success': True})
