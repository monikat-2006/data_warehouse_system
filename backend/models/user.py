from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from models import db


class User(UserMixin, db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='staff')
    alert_low_stock = db.Column(db.Boolean, nullable=False, default=True)
    alert_unusual = db.Column(db.Boolean, nullable=False, default=True)
    alert_reorder = db.Column(db.Boolean, nullable=False, default=True)
    min_stock_threshold = db.Column(db.Integer, nullable=False, default=5)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    transactions = db.relationship('StockTransaction', backref='user', lazy='dynamic')
    activities = db.relationship('ActivityLog', backref='user', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'alert_low_stock': self.alert_low_stock,
            'alert_unusual': self.alert_unusual,
            'alert_reorder': self.alert_reorder,
            'min_stock_threshold': self.min_stock_threshold,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
