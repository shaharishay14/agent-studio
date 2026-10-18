"""
Django settings for AI Agent Creator project.
"""

import os
import warnings
from pathlib import Path
from dotenv import load_dotenv

# Suppress deprecation warnings from dj-rest-auth (third-party library)
# These warnings are from the library itself, not our code, and will be fixed when the library updates
warnings.filterwarnings(
    'ignore',
    message='.*USERNAME_REQUIRED is deprecated.*',
    category=UserWarning
)
warnings.filterwarnings(
    'ignore',
    message='.*EMAIL_REQUIRED is deprecated.*',
    category=UserWarning
)

# Suppress drf-spectacular false-positive warnings for function-based views
# These views already have proper @extend_schema decorators with response serializers
warnings.filterwarnings(
    'ignore',
    message='.*unable to guess serializer.*',
    category=UserWarning
)
warnings.filterwarnings(
    'ignore',
    message='.*allauth.headless.tokens.base.AbstractTokenStrategy is deprecated.*',
    category=UserWarning
)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / '.env')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-change-this-in-production-very-secret-key-12345')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites', 
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'drf_spectacular',  # Swagger/OpenAPI documentation
    'api_agents',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.github',
    'dj_rest_auth',
    'dj_rest_auth.registration',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR.parent / 'frontend' / 'dist'],  # Add frontend dist directory
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
# Use PostgreSQL from Supabase via DATABASE_URL environment variable
import dj_database_url

DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL:
    # Production: Use PostgreSQL from Supabase
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    # Development fallback: SQLite
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Additional locations for static files (for frontend assets)
# Only add STATICFILES_DIRS if not in Docker (to avoid conflicts with collected static)
import os
if not os.environ.get('DOCKER_CONTAINER'):
    STATICFILES_DIRS = [
        BASE_DIR.parent / 'frontend' / 'dist' / 'assets',  # Frontend built assets
    ]

# Media files (User uploads)
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api_agents.auth.CookieJWTAuthentication',  # Read JWT from HttpOnly access cookie
        'rest_framework.authentication.TokenAuthentication',  # Legacy token
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# Spectacular (Swagger/OpenAPI) Settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'Agent Studio API',
    'DESCRIPTION': 'AI Agent Creator Platform - API Documentation for Frontend Integration',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api/',
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': True,
    },
    'TAGS': [
        {'name': 'Authentication', 'description': 'User authentication and registration'},
        {'name': 'Agents', 'description': 'AI Agent management'},
        {'name': 'Connections', 'description': 'Tool integrations (Gmail, Slack, etc.)'},
        {'name': 'files', 'description': 'File uploads and management'},
        {'name': 'Workflows', 'description': 'Workflow automation'},
    ],
    # Suppress specific warnings for function-based views that have proper @extend_schema decorators
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'CookieJWTAuth': {
                'type': 'apiKey',
                'in': 'cookie',
                'name': 'access',
                'description': 'JWT access token stored in HttpOnly cookie'
            }
        }
    },
}

# Email settings (development-safe defaults)
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'no-reply@example.com')
EMAIL_HOST = os.getenv('EMAIL_HOST', '')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', '587'))
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'False') == 'True'

# CORS settings
# Set CORS_ALLOWED_ORIGINS / CSRF_TRUSTED_ORIGINS in .env as comma-separated lists
# (e.g. https://yourdomain.com,http://YOUR_SERVER_IP) to add production origins.
_DEFAULT_LOCAL_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]


def _env_list(name, default):
    value = os.getenv(name)
    if not value:
        return default
    return [item.strip() for item in value.split(',') if item.strip()]


CORS_ALLOWED_ORIGINS = _env_list('CORS_ALLOWED_ORIGINS', _DEFAULT_LOCAL_ORIGINS)

CORS_ALLOW_CREDENTIALS = True

# CSRF settings for SPA using cookies
CSRF_TRUSTED_ORIGINS = _env_list('CSRF_TRUSTED_ORIGINS', _DEFAULT_LOCAL_ORIGINS)
CSRF_COOKIE_NAME = "csrftoken"
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = False if DEBUG else True

# SimpleJWT defaults (tweak as needed)
from datetime import timedelta
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=24),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
}

# API Keys
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
COMPOSIO_API_KEY = os.getenv('COMPOSIO_API_KEY', '')

# Agent Tools API Keys
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', '')
SERPAPI_KEY = os.getenv('SERPAPI_KEY', '')

# Custom User Model (with UUID primary key)
AUTH_USER_MODEL = 'api_agents.User'

# Django Sites Framework (required for allauth)
SITE_ID = 1

# Authentication backends
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

# Allauth settings (updated to use new format)
ACCOUNT_LOGIN_METHODS = {'username', 'email'}  # Replaces ACCOUNT_AUTHENTICATION_METHOD
ACCOUNT_SIGNUP_FIELDS = ['email*', 'username*', 'password1*', 'password2*']  # Replaces ACCOUNT_EMAIL_REQUIRED and ACCOUNT_USERNAME_REQUIRED
ACCOUNT_EMAIL_VERIFICATION = 'none'
ACCOUNT_UNIQUE_EMAIL = True
# Social account auto-signup (for REST API)
SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_EMAIL_AUTHENTICATION = False
SOCIALACCOUNT_EMAIL_AUTHENTICATION_AUTO_CONNECT = True
SOCIALACCOUNT_STORE_TOKENS = True 

# Social account settings
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': ['profile', 'email'],
        'AUTH_PARAMS': {'access_type': 'online'},
    },
    'github': {
        'SCOPE': ['user', 'email'],
    }
}
# Note: OAuth app credentials are configured via Django Admin (SocialApp model)
# This prevents conflicts from having apps defined in both settings and database

# REST Auth settings
REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_HTTPONLY': False,
    'JWT_AUTH_COOKIE': 'auth-token',
    'JWT_AUTH_REFRESH_COOKIE': 'refresh-token',
    'SESSION_LOGIN': False,
}

# Admin security settings
# Admin is password-protected by default (requires superuser login)
# These settings ensure additional security
ADMIN_ENABLED = os.getenv('ADMIN_ENABLED', 'True') == 'True'
# Session timeout for admin (in seconds) - 2 hours
SESSION_COOKIE_AGE = 7200
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_SAVE_EVERY_REQUEST = True

# Logging configuration to suppress drf-spectacular warnings
# Note: drf-spectacular prints warnings directly to stderr, so we suppress at logger level
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'loggers': {
        'drf_spectacular': {
            'level': 'ERROR',  # Only show errors, suppress warnings
            'propagate': False,
        },
        'api_agents.views': {
            'level': 'ERROR',  # Only show errors, suppress warnings
            'propagate': False,
        },
    },
}