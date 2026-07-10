from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_login import current_user
from sqlalchemy import func
from models import db, Product, Notification
from models.transaction import StockTransaction
from routes import login_required_api, admin_required

alerts_bp = Blueprint('alerts', __name__, url_prefix='/api/alerts')


@alerts_bp.route('/low-stock', methods=['GET'])
@login_required_api
def low_stock():
    """Return all products where current_stock <= reorder_level."""
    products = Product.query.filter(
        Product.current_stock <= Product.reorder_level
    ).order_by(Product.current_stock.asc()).all()

    items = []
    for p in products:
        d = p.to_dict()
        if p.reorder_level > 0:
            d['stock_percentage'] = round((p.current_stock / p.reorder_level) * 100, 1)
        else:
            d['stock_percentage'] = 0
        d['severity'] = (
            'critical' if p.current_stock == 0
            else 'high' if p.current_stock <= p.reorder_level // 2
            else 'medium'
        )
        items.append(d)

    return jsonify({'success': True, 'low_stock_products': items, 'count': len(items)})


@alerts_bp.route('/reorder-suggestions', methods=['GET'])
@login_required_api
def reorder_suggestions():
    """Smart reorder suggestions based on recent stock-out velocity."""
    cutoff = datetime.utcnow() - timedelta(days=30)

    # Aggregate stock-out quantities per product in last 30 days
    usage = (
        db.session.query(
            StockTransaction.product_id,
            func.sum(StockTransaction.quantity).label('used')
        )
        .filter(
            StockTransaction.transaction_type == 'stock_out',
            StockTransaction.created_at >= cutoff,
        )
        .group_by(StockTransaction.product_id)
        .all()
    )

    usage_map = {row.product_id: row.used for row in usage}
    products = Product.query.all()
    suggestions = []

    for p in products:
        daily_usage = usage_map.get(p.id, 0) / 30
        days_until_stockout = (p.current_stock / daily_usage) if daily_usage > 0 else None
        suggested_qty = max(p.reorder_quantity, int(daily_usage * (p.lead_time_days + 14)))

        if days_until_stockout is not None and days_until_stockout <= p.lead_time_days + 7:
            urgency = 'urgent' if days_until_stockout <= p.lead_time_days else 'soon'
            suggestions.append({
                **p.to_dict(),
                'daily_usage': round(daily_usage, 2),
                'days_until_stockout': round(days_until_stockout, 1),
                'suggested_order_qty': suggested_qty,
                'urgency': urgency,
            })
        elif p.current_stock <= p.reorder_level:
            suggestions.append({
                **p.to_dict(),
                'daily_usage': round(daily_usage, 2),
                'days_until_stockout': None,
                'suggested_order_qty': p.reorder_quantity,
                'urgency': 'below_reorder',
            })

    suggestions.sort(key=lambda x: (x['urgency'] != 'urgent', x['current_stock']))
    return jsonify({'success': True, 'suggestions': suggestions})


@alerts_bp.route('/notifications', methods=['GET'])
@login_required_api
def get_notifications():
    """Return user's notifications, auto-generating them from current DB state."""
    _auto_generate_notifications(current_user.id)

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    query = Notification.query.filter_by(user_id=current_user.id).order_by(
        Notification.created_at.desc()
    )
    total = query.count()
    items = query.offset((page - 1) * per_page).limit(per_page).all()
    unread = Notification.query.filter_by(user_id=current_user.id, is_read=False).count()

    return jsonify({
        'success': True,
        'notifications': [n.to_dict() for n in items],
        'unread_count': unread,
        'total': total,
        'page': page,
        'per_page': per_page,
    })


@alerts_bp.route('/notifications/<int:notif_id>/read', methods=['PUT'])
@login_required_api
def mark_read(notif_id):
    """Mark a single notification as read."""
    notif = Notification.query.filter_by(id=notif_id, user_id=current_user.id).first()
    if not notif:
        return jsonify({'success': False, 'message': 'Notification not found'}), 404
    notif.is_read = True
    db.session.commit()
    return jsonify({'success': True})


@alerts_bp.route('/notifications/read-all', methods=['PUT'])
@login_required_api
def mark_all_read():
    """Mark all of the current user's notifications as read."""
    Notification.query.filter_by(user_id=current_user.id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'success': True})


@alerts_bp.route('/unusual-activity', methods=['GET'])
@admin_required
def unusual_activity():
    """Detect products with transaction quantities significantly above their 7-day average."""
    cutoff_7 = datetime.utcnow() - timedelta(days=7)
    cutoff_30 = datetime.utcnow() - timedelta(days=30)

    # Compute per-product averages over 30 days
    avg_q = (
        db.session.query(
            StockTransaction.product_id,
            func.avg(StockTransaction.quantity).label('avg_qty'),
        )
        .filter(StockTransaction.created_at >= cutoff_30)
        .group_by(StockTransaction.product_id)
        .subquery()
    )

    # Recent (7-day) max per product
    recent_q = (
        db.session.query(
            StockTransaction.product_id,
            func.max(StockTransaction.quantity).label('max_recent'),
            func.count(StockTransaction.id).label('txn_count'),
        )
        .filter(StockTransaction.created_at >= cutoff_7)
        .group_by(StockTransaction.product_id)
        .subquery()
    )

    rows = (
        db.session.query(Product, avg_q.c.avg_qty, recent_q.c.max_recent, recent_q.c.txn_count)
        .join(avg_q, Product.id == avg_q.c.product_id)
        .join(recent_q, Product.id == recent_q.c.product_id)
        .filter(recent_q.c.max_recent > avg_q.c.avg_qty * 3)
        .all()
    )

    alerts = [
        {
            **p.to_dict(),
            'avg_qty_30d': round(float(avg), 2),
            'max_recent_7d': int(mx),
            'recent_txn_count': int(cnt),
            'spike_ratio': round(float(mx) / float(avg), 2) if avg else None,
        }
        for p, avg, mx, cnt in rows
    ]

    return jsonify({'success': True, 'unusual_activity': alerts, 'count': len(alerts)})


# ─── Internal helper ────────────────────────────────────────────────────────────

def _auto_generate_notifications(user_id: int):
    """
    Generate missing notifications from current DB state (called on each poll).
    Avoids duplicates by checking if an unread notification for that product already exists.
    """
    low_stock_products = Product.query.filter(
        Product.current_stock <= Product.reorder_level
    ).all()

    for p in low_stock_products:
        exists = Notification.query.filter_by(
            user_id=user_id,
            type='low_stock',
            product_id=p.id,
            is_read=False,
        ).first()
        if not exists:
            severity = 'CRITICAL' if p.current_stock == 0 else 'LOW'
            notif = Notification(
                user_id=user_id,
                type='low_stock',
                title=f'{severity}: {p.name} stock alert',
                message=(
                    f'{p.name} (SKU: {p.sku}) has only {p.current_stock} units left '
                    f'(reorder level: {p.reorder_level}).'
                ),
                product_id=p.id,
            )
            db.session.add(notif)

    db.session.commit()
