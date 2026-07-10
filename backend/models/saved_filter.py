from models import db


class SavedFilter(db.Model):
    __tablename__ = 'saved_filters'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    filter_type = db.Column(db.String(20), nullable=False, default='product')  # product | transaction
    filters_json = db.Column(db.Text, nullable=False, default='{}')
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.name,
            'filter_type': self.filter_type,
            'filters': json.loads(self.filters_json or '{}'),
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
