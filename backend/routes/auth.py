from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from models import db, User, ActivityLog

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def log_activity(user_id, action, product_id=None, description=''):
    activity = ActivityLog(
        user_id=user_id,
        action=action,
        product_id=product_id,
        description=description,
    )
    db.session.add(activity)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = (data.get('username') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'staff')

    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'Username, email, and password are required'}), 400

    if 'confirm_password' in data and password != data.get('confirm_password'):
        return jsonify({'success': False, 'message': 'Passwords do not match'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'Username already taken'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'success': False, 'message': 'Email already registered'}), 400

    if role not in ('admin', 'staff'):
        role = 'staff'

    user = User(username=username, email=email, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    log_activity(user.id, 'register', description=f'User {username} registered as {role}')
    db.session.commit()

    return jsonify({'success': True, 'message': 'Registration successful'}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password', '')

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'success': False, 'message': 'Invalid email or password'}), 401

    login_user(user, remember=True)
    log_activity(user.id, 'login', description=f'User {user.username} logged in')
    db.session.commit()

    return jsonify({
        'success': True,
        'user_id': user.id,
        'username': user.username,
        'role': user.role,
    })


@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    log_activity(current_user.id, 'logout', description=f'User {current_user.username} logged out')
    db.session.commit()
    logout_user()
    return jsonify({'success': True})


@auth_bp.route('/verify', methods=['GET'])
def verify():
    if current_user.is_authenticated:
        return jsonify({
            'is_authenticated': True,
            'user_id': current_user.id,
            'username': current_user.username,
            'role': current_user.role,
        })
    return jsonify({'is_authenticated': False})
