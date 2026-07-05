from datetime import datetime, timedelta
from collections import defaultdict
from flask import Blueprint, request, jsonify
from sqlalchemy import func
from models import db, Product, StockTransaction, User
from routes import admin_required, login_required_api

reports_bp = Blueprint('reports', __name__, url_prefix='/api/reports')


@reports_bp.route('/stock-summary', methods=['GET'])
@login_required_api
def stock_summary():
    products = Product.query.all()
    total_products = len(products)
    total_units = sum(p.current_stock for p in products)
    total_value = sum(p.current_stock * p.price for p in products)
    return jsonify({
        'success': True,
        'total_products': total_products,
        'total_units': total_units,
        'total_value': round(total_value, 2),
    })


@reports_bp.route('/transactions-by-type', methods=['GET'])
@admin_required
def transactions_by_type():
    days = request.args.get('days', 30, type=int)
    since = datetime.utcnow() - timedelta(days=days)

    transactions = StockTransaction.query.filter(
        StockTransaction.created_at >= since
    ).all()

    daily = defaultdict(lambda: {'in': 0, 'out': 0})
    total_in = 0
    total_out = 0

    for t in transactions:
        day = t.created_at.strftime('%Y-%m-%d') if t.created_at else 'unknown'
        daily[day][t.transaction_type] += t.quantity
        if t.transaction_type == 'in':
            total_in += t.quantity
        else:
            total_out += t.quantity

    chart_data = [
        {'date': date, 'stock_in': vals['in'], 'stock_out': vals['out']}
        for date, vals in sorted(daily.items())
    ]

    return jsonify({
        'success': True,
        'chart_data': chart_data,
        'total_in': total_in,
        'total_out': total_out,
        'distribution': {
            'in': total_in,
            'out': total_out,
            'in_percent': round(total_in / (total_in + total_out) * 100, 1) if (total_in + total_out) else 0,
            'out_percent': round(total_out / (total_in + total_out) * 100, 1) if (total_in + total_out) else 0,
        },
    })


@reports_bp.route('/transactions-by-product', methods=['GET'])
@admin_required
def transactions_by_product():
    days = request.args.get('days', 30, type=int)
    since = datetime.utcnow() - timedelta(days=days)

    transactions = (
        StockTransaction.query
        .filter(StockTransaction.created_at >= since)
        .all()
    )

    product_stats = defaultdict(lambda: {'in': 0, 'out': 0, 'name': '', 'sku': ''})
    for t in transactions:
        key = t.product_id
        product_stats[key]['in' if t.transaction_type == 'in' else 'out'] += t.quantity
        if t.product:
            product_stats[key]['name'] = t.product.name
            product_stats[key]['sku'] = t.product.sku

    result = [
        {
            'product_id': pid,
            'name': stats['name'],
            'sku': stats['sku'],
            'stock_in': stats['in'],
            'stock_out': stats['out'],
            'total': stats['in'] + stats['out'],
        }
        for pid, stats in product_stats.items()
    ]
    result.sort(key=lambda x: x['total'], reverse=True)

    top_stock = Product.query.order_by(Product.current_stock.desc()).limit(5).all()
    top_stock_data = [{'name': p.name, 'stock': p.current_stock} for p in top_stock]

    return jsonify({
        'success': True,
        'products': result[:10],
        'top_stock': top_stock_data,
    })


@reports_bp.route('/staff-metrics', methods=['GET'])
@admin_required
def staff_metrics():
    staff_users = User.query.filter_by(role='staff').all()
    metrics = []

    for user in staff_users:
        txns = StockTransaction.query.filter_by(user_id=user.id).all()
        stock_in = sum(t.quantity for t in txns if t.transaction_type == 'in')
        stock_out = sum(t.quantity for t in txns if t.transaction_type == 'out')
        metrics.append({
            'user_id': user.id,
            'username': user.username,
            'total_transactions': len(txns),
            'stock_in': stock_in,
            'stock_out': stock_out,
        })

    today = datetime.utcnow().date()
    today_txns = StockTransaction.query.filter(
        func.date(StockTransaction.created_at) == today
    ).count()

    active_staff = len([m for m in metrics if m['total_transactions'] > 0])

    return jsonify({
        'success': True,
        'staff_metrics': metrics,
        'today_transactions': today_txns,
        'active_staff': active_staff or len(staff_users),
    })


@reports_bp.route('/low-stock', methods=['GET'])
@login_required_api
def low_stock():
    products = Product.query.filter(
        Product.current_stock <= Product.reorder_level
    ).order_by(Product.current_stock).all()

    category_totals = (
        db.session.query(Product.category, func.sum(Product.current_stock))
        .group_by(Product.category)
        .all()
    )

    return jsonify({
        'success': True,
        'low_stock_products': [p.to_dict() for p in products],
        'category_distribution': [
            {'category': cat, 'stock': int(stock)} for cat, stock in category_totals
        ],
    })


@reports_bp.route('/monthly-trends', methods=['GET'])
@admin_required
def monthly_trends():
    days = request.args.get('days', 90, type=int)
    since = datetime.utcnow() - timedelta(days=days)

    transactions = StockTransaction.query.filter(
        StockTransaction.created_at >= since
    ).all()

    monthly = defaultdict(lambda: {'in': 0, 'out': 0})
    for t in transactions:
        month = t.created_at.strftime('%Y-%m') if t.created_at else 'unknown'
        monthly[month][t.transaction_type] += t.quantity

    chart_data = [
        {'month': month, 'stock_in': vals['in'], 'stock_out': vals['out']}
        for month, vals in sorted(monthly.items())
    ]

    total_days = max(days, 1)
    total_in = sum(v['in'] for v in monthly.values())
    total_out = sum(v['out'] for v in monthly.values())

    return jsonify({
        'success': True,
        'monthly_data': chart_data,
        'avg_daily_in': round(total_in / total_days, 2),
        'avg_daily_out': round(total_out / total_days, 2),
    })
