from flask import Blueprint, request, jsonify
from flask_login import current_user
from models import db, Product, ActivityLog
from routes import admin_required, login_required_api

products_bp = Blueprint('products', __name__, url_prefix='/api/products')


def log_activity(user_id, action, product_id=None, description=''):
    activity = ActivityLog(
        user_id=user_id,
        action=action,
        product_id=product_id,
        description=description,
    )
    db.session.add(activity)


@products_bp.route('', methods=['GET'])
@login_required_api
def list_products():
    products = Product.query.order_by(Product.name).all()
    return jsonify({'success': True, 'products': [p.to_dict() for p in products]})


@products_bp.route('', methods=['POST'])
@admin_required
def create_product():
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    sku = (data.get('sku') or '').strip()
    category = (data.get('category') or 'General').strip()
    initial_stock = int(data.get('initial_stock', 0))
    price = float(data.get('price', 0))

    if not name or not sku:
        return jsonify({'success': False, 'message': 'Name and SKU are required'}), 400

    if Product.query.filter_by(sku=sku).first():
        return jsonify({'success': False, 'message': 'SKU already exists'}), 400

    product = Product(
        name=name,
        sku=sku,
        price=price,
        category=category,
        current_stock=max(0, initial_stock),
    )
    db.session.add(product)
    db.session.flush()

    log_activity(
        current_user.id,
        'product_create',
        product.id,
        f'Created product {name} (SKU: {sku}) with initial stock {initial_stock}',
    )
    db.session.commit()

    return jsonify({'success': True, 'product': product.to_dict()}), 201


@products_bp.route('/<int:product_id>', methods=['PUT'])
@admin_required
def update_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404

    data = request.get_json() or {}
    if 'name' in data:
        product.name = data['name'].strip()
    if 'sku' in data:
        sku = data['sku'].strip()
        existing = Product.query.filter_by(sku=sku).first()
        if existing and existing.id != product_id:
            return jsonify({'success': False, 'message': 'SKU already exists'}), 400
        product.sku = sku
    if 'price' in data:
        product.price = float(data['price'])
    if 'category' in data:
        product.category = data['category'].strip()
    if 'reorder_level' in data:
        product.reorder_level = int(data['reorder_level'])

    log_activity(
        current_user.id,
        'product_update',
        product.id,
        f'Updated product {product.name}',
    )
    db.session.commit()

    return jsonify({'success': True, 'product': product.to_dict()})


@products_bp.route('/<int:product_id>', methods=['DELETE'])
@admin_required
def delete_product(product_id):
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'success': False, 'message': 'Product not found'}), 404

    name = product.name
    log_activity(
        current_user.id,
        'product_delete',
        product_id,
        f'Deleted product {name}',
    )
    db.session.delete(product)
    db.session.commit()

    return jsonify({'success': True, 'message': f'Product {name} deleted'})
