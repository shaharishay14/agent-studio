"""
URL configuration for AI Agent Creator project.
"""
import os
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.views.generic import RedirectView, TemplateView
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from api_agents.social_auth_views import GoogleLogin, GitHubLogin
from api_agents import views as api_views
import sys
import io
from contextlib import redirect_stderr, redirect_stdout

# Admin URL - use environment variable for security, default to a random path
ADMIN_URL = os.getenv('ADMIN_URL', 'admin-secure-2024/')

def health_check(request):
    """Health check endpoint for Docker containers"""
    return JsonResponse({'status': 'healthy', 'message': 'OK'})

def api_root(request):
    """API root endpoint with helpful information"""
    return JsonResponse({
        'message': 'AI Agent Creator API',
        'version': '1.0',
        'frontend': 'http://localhost:3000',
        'documentation': {
            'swagger': '/api/docs/',
            'redoc': '/api/docs/redoc/',
            'schema': '/api/schema/',
        },
        'endpoints': {
            'auth': {
                'register': '/api/auth/register/',
                'login': '/api/auth/login/',
                'logout': '/api/auth/logout/',
                'me': '/api/auth/me/',
                'password_forgot': '/api/auth/password/forgot/',
                'password_reset': '/api/auth/password/reset/',
                'google_oauth': '/api/auth/google/',
                'github_oauth': '/api/auth/github/',
            },
            'agents': '/api/agents/',
            'connections': '/api/connections/',
            'files': '/api/files/',
            'workflows': '/api/workflows/',
            'admin': f'/{ADMIN_URL}',
        },
    })

urlpatterns = [
    path('api/health/', health_check, name='health-check'),  # Health check endpoint
    path('', api_root, name='api-root'),  # Root shows API info
]

# Only add admin URLs if admin is enabled (admin is password-protected by default)
if os.getenv('ADMIN_ENABLED', 'True') == 'True':
    urlpatterns.append(path(ADMIN_URL, admin.site.urls))

# Custom schema view that suppresses warnings
class SuppressedSpectacularAPIView(SpectacularAPIView):
    """SpectacularAPIView that suppresses false-positive warnings"""
    def get(self, request, *args, **kwargs):
        # Suppress warnings during schema generation
        import warnings
        with warnings.catch_warnings():
            warnings.filterwarnings('ignore')
            # Redirect both stdout and stderr to suppress all prints
            filtered_output = io.StringIO()
            with redirect_stderr(filtered_output), redirect_stdout(filtered_output):
                return super().get(request, *args, **kwargs)

class SuppressedSpectacularSwaggerView(SpectacularSwaggerView):
    """SpectacularSwaggerView that suppresses false-positive warnings"""
    def get(self, request, *args, **kwargs):
        # Suppress warnings during schema generation
        import warnings
        with warnings.catch_warnings():
            warnings.filterwarnings('ignore')
            filtered_output = io.StringIO()
            with redirect_stderr(filtered_output), redirect_stdout(filtered_output):
                return super().get(request, *args, **kwargs)

class SuppressedSpectacularRedocView(SpectacularRedocView):
    """SpectacularRedocView that suppresses false-positive warnings"""
    def get(self, request, *args, **kwargs):
        # Suppress warnings during schema generation
        import warnings
        with warnings.catch_warnings():
            warnings.filterwarnings('ignore')
            filtered_output = io.StringIO()
            with redirect_stderr(filtered_output), redirect_stdout(filtered_output):
                return super().get(request, *args, **kwargs)

urlpatterns += [
    # API Documentation (Swagger/OpenAPI)
    path('api/schema/', SuppressedSpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SuppressedSpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/docs/redoc/', SuppressedSpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    # Authentication endpoints
    path('api/auth/register/', api_views.register, name='register'),
    path('api/auth/login/', api_views.login, name='auth_login'),
    path('api/auth/logout/', api_views.logout, name='auth_logout'),
    path('api/auth/me/', api_views.current_user, name='auth_me'),
    path('api/auth/password/forgot/', api_views.password_reset_request, name='auth_password_reset_request'),
    path('api/auth/password/reset/', api_views.password_reset_confirm, name='auth_password_reset_confirm'),
    path('api/auth/email/verify/resend/', api_views.resend_email_verification, name='auth_email_verify_resend'),
    path('api/auth/email/verify/resend/public/', api_views.resend_email_verification_public, name='auth_email_verify_resend_public'),
    path('api/auth/email/verify/confirm/', api_views.email_verify_confirm, name='auth_email_verify_confirm'),
    path('api/auth/verify/', api_views.verify_email_with_token, name='auth_verify_custom_token'),
    # Removed dj-rest-auth URLs include - we handle all auth endpoints ourselves
    # This prevents duplicate /api/auth/user/ endpoint (we use /api/auth/me/ instead)
    path('api/csrf/', api_views.csrf_token, name='csrf-token'),
    path('api/auth/token/refresh-cookie/', api_views.refresh_access_cookie, name='refresh-access-cookie'),
    # Removed dj-rest-auth registration routes to avoid duplicate registration endpoint in Swagger
    
    # Social OAuth REST API endpoints
    path('api/auth/google/', GoogleLogin.as_view(), name='google_login'),
    path('api/auth/github/', GitHubLogin.as_view(), name='github_login'),

    # Credit management endpoints
    path('api/credits/balance/', api_views.credit_balance, name='credit_balance'),
    path('api/credits/history/', api_views.credit_usage_history, name='credit_history'),
    path('api/credits/add/', api_views.add_credits, name='add_credits'),

    # API Endpoints
    path('api/', include('api_agents.urls')),
    path('accounts/', include('allauth.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Serve static files from frontend/dist/assets in development
    urlpatterns += static('/assets/', document_root=settings.BASE_DIR.parent / 'frontend' / 'dist' / 'assets')

# Catch-all route to serve React app (must be last!)
# This allows React Router to handle client-side routing
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html'), name='frontend'),
]

