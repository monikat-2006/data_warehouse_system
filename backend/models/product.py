from models import db


class Product(db.Model):
    __tablename__ = 'products'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    sku = db.Column(db.String(100), unique=True, nullable=False)
    barcode = db.Column(db.String(200), unique=True, nullable=True, index=True)
    price = db.Column(db.Float, nullable=False, default=0.0)
    category = db.Column(db.String(100), nullable=False, default='General')
    current_stock = db.Column(db.Integer, nullable=False, default=0)
    reorder_level = db.Column(db.Integer, nullable=False, default=10)
    reorder_quantity = db.Column(db.Integer, nullable=False, default=50)
    lead_time_days = db.Column(db.Integer, nullable=False, default=7)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    transactions = db.relationship('StockTransaction', backref='product', lazy='dynamic')
    activities = db.relationship('ActivityLog', backref='product', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'sku': self.sku,
            'barcode': self.barcode,
            'price': self.price,
            'category': self.category,
            'current_stock': self.current_stock,
            'reorder_level': self.reorder_level,
            'reorder_quantity': self.reorder_quantity,
            'lead_time_days': self.lead_time_days,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
