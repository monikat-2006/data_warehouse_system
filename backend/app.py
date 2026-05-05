from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# FIXED CORS - Allow frontend to connect
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

app.config['SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///warehouse.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ============ DATABASE MODELS ============

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='staff')
    employee_id = db.Column(db.String(50), unique=True, nullable=False)
    branch = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'employee_id': self.employee_id,
            'branch': self.branch,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    sku = db.Column(db.String(50), unique=True, nullable=False)
    quantity = db.Column(db.Integer, default=0)
    unit_price = db.Column(db.Float, default=0.0)
    location = db.Column(db.String(50))
    reorder_level = db.Column(db.Integer, default=10)
    branch = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'sku': self.sku,
            'quantity': self.quantity,
            'unit_price': self.unit_price,
            'location': self.location,
            'reorder_level': self.reorder_level,
            'branch': self.branch
        }

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    type = db.Column(db.String(20), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    remarks = db.Column(db.String(200))
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    product = db.relationship('Product')
    user = db.relationship('User')
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_id': self.product_id,
            'product_name': self.product.name if self.product else None,
            'type': self.type,
            'quantity': self.quantity,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'remarks': self.remarks,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user_name = db.Column(db.String(100), nullable=False)
    user_email = db.Column(db.String(120), nullable=False)
    user_role = db.Column(db.String(20), nullable=False)
    action_type = db.Column(db.String(50), nullable=False)
    action_details = db.Column(db.Text)
    ip_address = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    user = db.relationship('User')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user_name,
            'user_email': self.user_email,
            'user_role': self.user_role,
            'action_type': self.action_type,
            'action_details': self.action_details,
            'ip_address': self.ip_address,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

# ============ ACTIVITY LOGGING HELPER FUNCTION ============

def log_activity(user_id, user_name, user_email, user_role, action_type, action_details, ip_address=None):
    try:
        log = ActivityLog(
            user_id=user_id,
            user_name=user_name,
            user_email=user_email,
            user_role=user_role,
            action_type=action_type,
            action_details=action_details,
            ip_address=ip_address or request.remote_addr if hasattr(request, 'remote_addr') else '127.0.0.1'
        )
        db.session.add(log)
        db.session.commit()
        print(f"✅ Activity logged: {user_name} - {action_type}")
    except Exception as e:
        print(f"❌ Failed to log activity: {str(e)}")
        db.session.rollback()

# ============ AUTHENTICATION DECORATOR ============

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
        return f(current_user, *args, **kwargs)
    
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(current_user, *args, **kwargs)
    return decorated

# ============ AUTHENTICATION ROUTES ============

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        required_fields = ['name', 'email', 'password', 'role', 'employeeId', 'branch']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user:
            return jsonify({'error': 'Email already registered'}), 400
        
        existing_emp = User.query.filter_by(employee_id=data['employeeId']).first()
        if existing_emp:
            return jsonify({'error': 'Employee ID already exists'}), 400
        
        hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
        
        new_user = User(
            name=data['name'],
            email=data['email'],
            password_hash=hashed_password,
            role=data['role'],
            employee_id=data['employeeId'],
            branch=data['branch']
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        token = jwt.encode({
            'user_id': new_user.id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        # Log registration activity
        log_activity(
            user_id=new_user.id,
            user_name=new_user.name,
            user_email=new_user.email,
            user_role=new_user.role,
            action_type='register',
            action_details=f'New user registered. Branch: {new_user.branch}, Employee ID: {new_user.employee_id}'
        )
        
        return jsonify({
            'message': 'Registration successful',
            'token': token,
            'user': new_user.to_dict(),
            'role': new_user.role
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password') or not data.get('role'):
            return jsonify({'error': 'Email, password, and role are required'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not check_password_hash(user.password_hash, data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if user.role != data['role']:
            return jsonify({'error': f'Invalid role. You are registered as {user.role}'}), 401
        
        token = jwt.encode({
            'user_id': user.id,
            'role': user.role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        # Log login activity
        log_activity(
            user_id=user.id,
            user_name=user.name,
            user_email=user.email,
            user_role=user.role,
            action_type='login',
            action_details=f'User logged in successfully'
        )
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict(),
            'role': user.role
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ PRODUCT ROUTES ============

@app.route('/api/products', methods=['GET'])
@token_required
def get_products(current_user):
    if current_user.role == 'admin':
        products = Product.query.all()
    else:
        products = Product.query.filter_by(branch=current_user.branch).all()
    
    return jsonify([p.to_dict() for p in products]), 200

@app.route('/api/products', methods=['POST'])
@token_required
def add_product(current_user):
    try:
        data = request.get_json()
        print("Received product:", data)
        
        required_fields = ['name', 'sku', 'quantity', 'unit_price']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        branch = data.get('branch', current_user.branch)
        
        new_product = Product(
            name=data['name'],
            sku=data['sku'],
            quantity=int(data['quantity']),
            unit_price=float(data['unit_price']),
            location=data.get('location', ''),
            reorder_level=int(data.get('reorder_level', 10)),
            branch=branch
        )
        
        db.session.add(new_product)
        db.session.commit()
        
        # Log product addition
        log_activity(
            user_id=current_user.id,
            user_name=current_user.name,
            user_email=current_user.email,
            user_role=current_user.role,
            action_type='product_add',
            action_details=f'Added product: {data["name"]} (SKU: {data["sku"]}), Quantity: {data["quantity"]}, Branch: {branch}'
        )
        
        return jsonify(new_product.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        print("Error:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@token_required
def update_product(current_user, product_id):
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        if current_user.role != 'admin' and product.branch != current_user.branch:
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        old_name = product.name
        
        if 'name' in data:
            product.name = data['name']
        if 'sku' in data:
            product.sku = data['sku']
        if 'quantity' in data:
            product.quantity = int(data['quantity'])
        if 'unit_price' in data:
            product.unit_price = float(data['unit_price'])
        if 'location' in data:
            product.location = data['location']
        if 'reorder_level' in data:
            product.reorder_level = int(data['reorder_level'])
        if 'branch' in data and current_user.role == 'admin':
            product.branch = data['branch']
        
        db.session.commit()
        
        # Log product update
        log_activity(
            user_id=current_user.id,
            user_name=current_user.name,
            user_email=current_user.email,
            user_role=current_user.role,
            action_type='product_edit',
            action_details=f'Edited product: {old_name} -> {product.name} (SKU: {product.sku})'
        )
        
        return jsonify(product.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@token_required
def delete_product(current_user, product_id):
    try:
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        if current_user.role != 'admin' and product.branch != current_user.branch:
            return jsonify({'error': 'Access denied'}), 403
        
        product_name = product.name
        product_sku = product.sku
        db.session.delete(product)
        db.session.commit()
        
        # Log product deletion
        log_activity(
            user_id=current_user.id,
            user_name=current_user.name,
            user_email=current_user.email,
            user_role=current_user.role,
            action_type='product_delete',
            action_details=f'Deleted product: {product_name} (SKU: {product_sku})'
        )
        
        return jsonify({'message': 'Product deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ============ STOCK ROUTES ============

@app.route('/api/stock-in', methods=['POST'])
@token_required
def stock_in(current_user):
    try:
        data = request.get_json()
        product = Product.query.get(data['product_id'])
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        if current_user.role != 'admin' and product.branch != current_user.branch:
            return jsonify({'error': 'Access denied'}), 403
        
        quantity = int(data['quantity'])
        old_quantity = product.quantity
        product.quantity += quantity
        
        transaction = Transaction(
            product_id=product.id,
            type='stock-in',
            quantity=quantity,
            user_id=current_user.id,
            remarks=data.get('remarks', '')
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        # Log stock-in activity
        log_activity(
            user_id=current_user.id,
            user_name=current_user.name,
            user_email=current_user.email,
            user_role=current_user.role,
            action_type='stock_in',
            action_details=f'Stock In: {product.name}, Added: {quantity}, Old: {old_quantity}, New: {product.quantity}'
        )
        
        return jsonify({
            'message': f'Stock-in successful',
            'product': product.to_dict(),
            'transaction': transaction.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/stock-out', methods=['POST'])
@token_required
def stock_out(current_user):
    try:
        data = request.get_json()
        product = Product.query.get(data['product_id'])
        
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        if current_user.role != 'admin' and product.branch != current_user.branch:
            return jsonify({'error': 'Access denied'}), 403
        
        quantity = int(data['quantity'])
        
        if product.quantity < quantity:
            return jsonify({'error': 'Insufficient stock'}), 400
        
        old_quantity = product.quantity
        product.quantity -= quantity
        
        transaction = Transaction(
            product_id=product.id,
            type='stock-out',
            quantity=quantity,
            user_id=current_user.id,
            remarks=data.get('remarks', '')
        )
        
        db.session.add(transaction)
        db.session.commit()
        
        # Log stock-out activity
        log_activity(
            user_id=current_user.id,
            user_name=current_user.name,
            user_email=current_user.email,
            user_role=current_user.role,
            action_type='stock_out',
            action_details=f'Stock Out: {product.name}, Removed: {quantity}, Old: {old_quantity}, New: {product.quantity}'
        )
        
        return jsonify({
            'message': f'Stock-out successful',
            'product': product.to_dict(),
            'transaction': transaction.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ============ TRANSACTION ROUTES ============

@app.route('/api/transactions', methods=['GET'])
@token_required
def get_transactions(current_user):
    if current_user.role == 'admin':
        transactions = Transaction.query.order_by(Transaction.timestamp.desc()).limit(100).all()
    else:
        transactions = db.session.query(Transaction).join(Product).filter(
            Product.branch == current_user.branch
        ).order_by(Transaction.timestamp.desc()).limit(100).all()
    
    return jsonify([t.to_dict() for t in transactions]), 200

# ============ PROFILE ROUTES ============

@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    try:
        data = request.get_json()
        print("Updating profile for user:", current_user.id)
        print("Received data:", data)
        
        old_name = current_user.name
        old_branch = current_user.branch
        
        # Only allow updating name and branch for staff
        if 'name' in data and data['name']:
            current_user.name = data['name']
            print(f"Updated name to: {data['name']}")
        
        if 'branch' in data and data['branch']:
            current_user.branch = data['branch']
            print(f"Updated branch to: {data['branch']}")
        
        db.session.commit()
        
        # Log profile update
        log_activity(
            user_id=current_user.id,
            user_name=current_user.name,
            user_email=current_user.email,
            user_role=current_user.role,
            action_type='profile_update',
            action_details=f'Updated profile: Name ({old_name} -> {current_user.name}), Branch ({old_branch} -> {current_user.branch})'
        )
        
        return jsonify(current_user.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating profile: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ============ PASSWORD CHANGE ROUTE ============

@app.route('/api/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    try:
        data = request.get_json()
        
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        # Verify current password
        if not check_password_hash(current_user.password_hash, data['current_password']):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Check minimum length
        if len(data['new_password']) < 6:
            return jsonify({'error': 'New password must be at least 6 characters'}), 400
        
        # Hash new password
        hashed_password = generate_password_hash(data['new_password'], method='pbkdf2:sha256')
        current_user.password_hash = hashed_password
        
        db.session.commit()
        
        # Log password change
        log_activity(
            user_id=current_user.id,
            user_name=current_user.name,
            user_email=current_user.email,
            user_role=current_user.role,
            action_type='password_change',
            action_details=f'User changed password'
        )
        
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error changing password: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ============ ADMIN ROUTES ============

@app.route('/api/admin/users', methods=['GET'])
@token_required
@admin_required
def get_users(current_user):
    users = User.query.all()
    return jsonify([u.to_dict() for u in users]), 200

@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
@token_required
@admin_required
def update_user(current_user, user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        old_role = user.role
        old_branch = user.branch
        
        if 'role' in data:
            user.role = data['role']
        if 'branch' in data:
            user.branch = data['branch']
        if 'name' in data:
            user.name = data['name']
        
        db.session.commit()
        
        # Log user update
        log_activity(
            user_id=current_user.id,
            user_name=current_user.name,
            user_email=current_user.email,
            user_role=current_user.role,
            action_type='admin_user_update',
            action_details=f'Admin updated user {user.name}: Role ({old_role} -> {user.role}), Branch ({old_branch} -> {user.branch})'
        )
        
        return jsonify(user.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.id == current_user.id:
            return jsonify({'error': 'Cannot delete yourself'}), 400
        
        user_name = user.name
        db.session.delete(user)
        db.session.commit()
        
        # Log user deletion
        log_activity(
            user_id=current_user.id,
            user_name=current_user.name,
            user_email=current_user.email,
            user_role=current_user.role,
            action_type='admin_user_delete',
            action_details=f'Admin deleted user: {user_name}'
        )
        
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ============ ACTIVITY LOG ROUTES ============

@app.route('/api/admin/activities', methods=['GET'])
@token_required
@admin_required
def get_activities(current_user):
    try:
        limit = request.args.get('limit', 100, type=int)
        action_type = request.args.get('action_type', None)
        user_id = request.args.get('user_id', None)
        
        query = ActivityLog.query
        
        if action_type:
            query = query.filter_by(action_type=action_type)
        if user_id:
            query = query.filter_by(user_id=user_id)
        
        activities = query.order_by(ActivityLog.timestamp.desc()).limit(limit).all()
        
        return jsonify([a.to_dict() for a in activities]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/activity-stats', methods=['GET'])
@token_required
@admin_required
def get_activity_stats(current_user):
    try:
        total_logins = ActivityLog.query.filter_by(action_type='login').count()
        total_registrations = ActivityLog.query.filter_by(action_type='register').count()
        total_stock_ins = ActivityLog.query.filter_by(action_type='stock_in').count()
        total_stock_outs = ActivityLog.query.filter_by(action_type='stock_out').count()
        total_product_adds = ActivityLog.query.filter_by(action_type='product_add').count()
        total_product_edits = ActivityLog.query.filter_by(action_type='product_edit').count()
        total_product_deletes = ActivityLog.query.filter_by(action_type='product_delete').count()
        
        # Get activity by user
        user_activity = db.session.query(
            ActivityLog.user_name,
            db.func.count(ActivityLog.id).label('activity_count')
        ).group_by(ActivityLog.user_name).all()
        
        return jsonify({
            'total_logins': total_logins,
            'total_registrations': total_registrations,
            'total_stock_ins': total_stock_ins,
            'total_stock_outs': total_stock_outs,
            'total_product_adds': total_product_adds,
            'total_product_edits': total_product_edits,
            'total_product_deletes': total_product_deletes,
            'total_activities': total_logins + total_registrations + total_stock_ins + total_stock_outs + total_product_adds + total_product_edits + total_product_deletes,
            'user_activity': [{'user': u[0], 'count': u[1]} for u in user_activity]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============ DATABASE INITIALIZATION ============

def init_db():
    with app.app_context():
        db.create_all()
        
        admin = User.query.filter_by(email='admin@warehouse.com').first()
        if not admin:
            admin = User(
                name='System Admin',
                email='admin@warehouse.com',
                password_hash=generate_password_hash('admin123'),
                role='admin',
                employee_id='ADMIN001',
                branch='Headquarters'
            )
            db.session.add(admin)
            db.session.commit()
            print("✅ Default admin created: admin@warehouse.com / admin123")
        
        print("✅ Database initialized successfully!")

if __name__ == '__main__':
    init_db()
    print("🚀 Server starting on http://localhost:5000")
    app.run(debug=True, port=5000)