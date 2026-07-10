import os
from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from flask_login import LoginManager

from config import Config
from models import db, User, Product

from routes.auth import auth_bp
from routes.products import products_bp
from routes.transactions import transactions_bp
from routes.activities import activities_bp
from routes.reports import reports_bp
from routes.barcode import barcode_bp
from routes.alerts import alerts_bp
from routes.search import search_bp
def create_app():

    app = Flask(__name__)

    app.config.from_object(Config)

    # ==========================
    # CORS CONFIGURATION
    # ==========================
    CORS(
        app,
        origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ],
        supports_credentials=True
    )

    # ==========================
    # DATABASE
    # ==========================
    db.init_app(app)


    # ==========================
    # LOGIN MANAGER
    # ==========================
    login_manager = LoginManager()
    login_manager.init_app(app)


    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))


    @login_manager.unauthorized_handler
    def unauthorized():

        return jsonify({
            "success": False,
            "message": "Authentication required"
        }),401



    # ==========================
    # API BLUEPRINTS
    # ==========================
    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)
    app.register_blueprint(transactions_bp)
    app.register_blueprint(activities_bp)
    app.register_blueprint(reports_bp)
    app.register_blueprint(barcode_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(search_bp)



    # ==========================
    # SERVE REACT FRONTEND
    # ==========================

    frontend_path = (
        Path(__file__)
        .resolve()
        .parent
        / "frontend"
        / "dist"
    )


    @app.route("/")
    def serve_frontend():

        return send_from_directory(
            frontend_path,
            "index.html"
        )



    @app.route("/<path:path>")
    def serve_static(path):

        file_path = frontend_path / path


        if file_path.exists():

            return send_from_directory(
                frontend_path,
                path
            )


        # React router support

        return send_from_directory(
            frontend_path,
            "index.html"
        )



    # ==========================
    # ADMIN USERS API
    # ==========================

    @app.route("/api/users", methods=["GET"])
    def get_users():

        from flask_login import current_user


        if (
            not current_user.is_authenticated
            or current_user.role != "admin"
        ):

            return jsonify({
                "success":False,
                "message":"Admin access required"
            }),403



        users = (
            User.query
            .filter_by(role="staff")
            .order_by(User.username)
            .all()
        )


        return jsonify({

            "success":True,

            "users":[
                u.to_dict()
                for u in users
            ]

        })



    return app





app = create_app()



# ==========================
# DATABASE SETUP
# ==========================

with app.app_context():

    db.create_all()



    # CREATE DEFAULT ADMIN

    if not User.query.filter_by(
        email="admin@warehouse.com"
    ).first():


        admin = User(

            username="admin",

            email="admin@warehouse.com",

            role="admin"

        )


        admin.set_password(
            "admin123"
        )


        db.session.add(admin)

        db.session.commit()


        print(
            "Default admin created"
        )



    # ==========================
    # SAMPLE PRODUCTS
    # ==========================


    if Product.query.count() == 0:


        products = [

            Product(
                name="Laptop Pro 15",
                sku="LP-001",
                price=1299.99,
                category="Electronics",
                current_stock=45,
                reorder_level=10
            ),


            Product(
                name="Office Chair",
                sku="OC-002",
                price=249.99,
                category="Furniture",
                current_stock=120,
                reorder_level=15
            ),


            Product(
                name="Wireless Mouse",
                sku="WM-003",
                price=29.99,
                category="Electronics",
                current_stock=8,
                reorder_level=20
            ),


            Product(
                name="Desk Lamp",
                sku="DL-004",
                price=39.99,
                category="Furniture",
                current_stock=65,
                reorder_level=10
            ),


            Product(
                name="USB-C Hub",
                sku="UH-005",
                price=49.99,
                category="Electronics",
                current_stock=5,
                reorder_level=15
            ),


            Product(
                name="Notebook Pack",
                sku="NP-006",
                price=12.99,
                category="Stationery",
                current_stock=200,
                reorder_level=50
            )

        ]


        db.session.add_all(products)

        db.session.commit()


        print(
            "Sample products seeded"
        )





# ==========================
# RUN SERVER
# ==========================

if __name__ == "__main__":


    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )


    print(
        f"Server running on port {port}"
    )


    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )