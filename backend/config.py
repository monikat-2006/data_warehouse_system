import os
from datetime import timedelta
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'warehouse-secret-key-change-in-production')
    
    # Read individual database configuration variables from .env
    db_user = os.environ.get('DB_USER')
    db_password = os.environ.get('DB_PASSWORD')
    db_host = os.environ.get('DB_HOST')
    db_port = os.environ.get('DB_PORT')
    db_name = os.environ.get('DB_NAME')
    
    if db_user and db_password and db_host and db_name:
        db_port_str = f":{db_port}" if db_port else ""
        SQLALCHEMY_DATABASE_URI = f"postgresql://{db_user}:{db_password}@{db_host}{db_port_str}/{db_name}"
    else:
        _default_db = os.path.join(basedir, 'instance', 'inventory.db')
        SQLALCHEMY_DATABASE_URI = os.environ.get(
            'DATABASE_URL',
            f'sqlite:///{_default_db}'
        )
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_HTTPONLY = True

