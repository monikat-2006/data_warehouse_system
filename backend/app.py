import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_login import LoginManager
from config import Config
from models import db, User, Product
from routes.auth import auth_bp
from routes.products import products_bp
from routes.transactions import transactions_bp
from routes.activities import activities_bp
from routes.reports import reports_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(
        app,
        origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
        supports_credentials=True,
    )

    db.init_app(app)

    login_manager = LoginManager()
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({'success': False, 'message': 'Authentication required'}), 401

    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(activities_bp)
    app.register_blueprint(reports_bp)

    @app.route('/')
    def home():
        return jsonify({'message': 'Smart Inventory Management API'})

    @app.route('/api/users', methods=['GET'])
    def get_users():
        from flask_login import current_user
        if not current_user.is_authenticated or current_user.role != 'admin':
            return jsonify({'success': False, 'message': 'Admin access required'}), 403
        users = User.query.filter_by(role='staff').order_by(User.username).all()
        return jsonify({'success': True, 'users': [u.to_dict() for u in users]})

    return app


app = create_app()

with app.app_context():
    db.create_all()
    if not User.query.filter_by(username='admin').first():
        admin = User(username='admin', email='admin@warehouse.com', role='admin')
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print('Default admin created: admin / admin123')

    if Product.query.count() == 0:
        sample_products = [
            Product(name='Laptop Pro 15', sku='LP-001', price=1299.99, category='Electronics', current_stock=45, reorder_level=10),
            Product(name='Office Chair', sku='OC-002', price=249.99, category='Furniture', current_stock=120, reorder_level=15),
            Product(name='Wireless Mouse', sku='WM-003', price=29.99, category='Electronics', current_stock=8, reorder_level=20),
            Product(name='Desk Lamp', sku='DL-004', price=39.99, category='Furniture', current_stock=65, reorder_level=10),
            Product(name='USB-C Hub', sku='UH-005', price=49.99, category='Electronics', current_stock=5, reorder_level=15),
            Product(name='Notebook Pack', sku='NP-006', price=12.99, category='Stationery', current_stock=200, reorder_level=50),
        ]
        db.session.add_all(sample_products)
        db.session.commit()
        print('Sample products seeded')


if __name__ == '__main__':
    print('Server running on http://localhost:5000')
    app.run(debug=True, port=5000, host='0.0.0.0')
