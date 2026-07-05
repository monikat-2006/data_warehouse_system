from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_login import current_user
from models import db, Product, StockTransaction, ActivityLog
from routes import login_required_api

transactions_bp = Blueprint('transactions', __name__, url_prefix='/api/stock')


def log_activity(user_id, action, product_id=None, description=''):
    activity = ActivityLog(
        user_id=user_id,
        action=action,
        product_id=product_id,
        description=description,
    )
    db.session.add(activity)


def _process_stock(product_id, quantity, transaction_type, notes):
    product = Product.query.get(product_id)
    if not product:
        return None, 'Product not found'

    if quantity <= 0:
        return None, 'Quantity must be greater than zero'

    if transaction_type == 'out' and product.current_stock < quantity:
        return None, f'Insufficient stock. Available: {product.current_stock}'

    if transaction_type == 'in':
        product.current_stock += quantity
    else:
        product.current_stock -= quantity

    txn = StockTransaction(
        product_id=product_id,
        transaction_type=transaction_type,
        quantity=quantity,
        user_id=current_user.id,
        notes=notes,
    )
    db.session.add(txn)
    db.session.flush()

    action = 'stock_in' if transaction_type == 'in' else 'stock_out'
    log_activity(
        current_user.id,
        action,
        product_id,
        f'{"Stocked in" if transaction_type == "in" else "Stocked out"} {quantity} units of {product.name}'
        + (f' — {notes}' if notes else ''),
    )

    return txn, None


@transactions_bp.route('/in', methods=['POST'])
@login_required_api
def stock_in():
    data = request.get_json() or {}
    product_id = data.get('product_id')
    quantity = int(data.get('quantity', 0))
    notes = (data.get('notes') or '').strip()

    if not product_id:
        return jsonify({'success': False, 'message': 'Product is required'}), 400

    txn, error = _process_stock(product_id, quantity, 'in', notes)
    if error:
        return jsonify({'success': False, 'message': error}), 400

    db.session.commit()
    product = Product.query.get(product_id)
    return jsonify({
        'success': True,
        'message': f'Stocked in {quantity} units',
        'transaction': txn.to_dict(),
        'current_stock': product.current_stock,
    })


@transactions_bp.route('/out', methods=['POST'])
@login_required_api
def stock_out():
    data = request.get_json() or {}
    product_id = data.get('product_id')
    quantity = int(data.get('quantity', 0))
    notes = (data.get('notes') or '').strip()

    if not product_id:
        return jsonify({'success': False, 'message': 'Product is required'}), 400

    txn, error = _process_stock(product_id, quantity, 'out', notes)
    if error:
        return jsonify({'success': False, 'message': error}), 400

    db.session.commit()
    product = Product.query.get(product_id)
    return jsonify({
        'success': True,
        'message': f'Stocked out {quantity} units',
        'transaction': txn.to_dict(),
        'current_stock': product.current_stock,
    })


@transactions_bp.route('/transactions', methods=['GET'])
@login_required_api
def get_transactions():
    query = StockTransaction.query

    user_id = request.args.get('user_id', type=int)
    product_id = request.args.get('product_id', type=int)
    txn_type = request.args.get('type')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    if current_user.role != 'admin':
        query = query.filter_by(user_id=current_user.id)
    elif user_id:
        query = query.filter_by(user_id=user_id)

    if product_id:
        query = query.filter_by(product_id=product_id)
    if txn_type in ('in', 'out'):
        query = query.filter_by(transaction_type=txn_type)
    if date_from:
        query = query.filter(StockTransaction.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(StockTransaction.created_at <= datetime.fromisoformat(date_to + 'T23:59:59'))

    transactions = query.order_by(StockTransaction.created_at.desc()).all()
    return jsonify({'success': True, 'transactions': [t.to_dict() for t in transactions]})
