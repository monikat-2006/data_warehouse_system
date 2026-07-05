from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

from models.user import User
from models.product import Product
from models.transaction import StockTransaction
from models.activity import ActivityLog

__all__ = ['db', 'User', 'Product', 'StockTransaction', 'ActivityLog']
