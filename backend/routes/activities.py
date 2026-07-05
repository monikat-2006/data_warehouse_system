from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_login import current_user
from models import ActivityLog, StockTransaction
from routes import admin_required, login_required_api

activities_bp = Blueprint('activities', __name__, url_prefix='/api/activity')


@activities_bp.route('/log', methods=['GET'])
@admin_required
def get_activity_log():
    query = ActivityLog.query

    user_id = request.args.get('user_id', type=int)
    action = request.args.get('action')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')

    if user_id:
        query = query.filter_by(user_id=user_id)
    if action:
        query = query.filter(ActivityLog.action.ilike(f'%{action}%'))
    if date_from:
        query = query.filter(ActivityLog.timestamp >= datetime.fromisoformat(date_from))
    if date_to:
        query = query.filter(ActivityLog.timestamp <= datetime.fromisoformat(date_to + 'T23:59:59'))

    activities = query.order_by(ActivityLog.timestamp.desc()).all()
    return jsonify({'success': True, 'activities': [a.to_dict() for a in activities]})


@activities_bp.route('/my-activities', methods=['GET'])
@login_required_api
def get_my_activities():
    activities = (
        ActivityLog.query
        .filter_by(user_id=current_user.id)
        .order_by(ActivityLog.timestamp.desc())
        .all()
    )

    transactions = (
        StockTransaction.query
        .filter_by(user_id=current_user.id)
        .order_by(StockTransaction.created_at.desc())
        .all()
    )

    return jsonify({
        'success': True,
        'activities': [a.to_dict() for a in activities],
        'transactions': [t.to_dict() for t in transactions],
    })
