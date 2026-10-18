"""
Authentication URL Configuration
"""
from django.urls import path
from .views import (
    register,
    login,
    logout,
    current_user,
    csrf_token,
    refresh_access_cookie,
    password_reset_request,
    password_reset_confirm,
    resend_email_verification,
    resend_email_verification_public,
    email_verify_confirm,
    verify_email_with_token,
)
from .social_auth_views import GoogleLogin, GitHubLogin


urlpatterns = [
    # Core authentication
    path('register/', register, name='register'),
    path('login/', login, name='auth_login'),
    path('logout/', logout, name='auth_logout'),
    path('me/', current_user, name='auth_me'),

    # CSRF token
    path('csrf/', csrf_token, name='csrf-token'),

    # Token refresh
    path('token/refresh-cookie/', refresh_access_cookie, name='refresh-access-cookie'),

    # Password reset
    path('password/forgot/', password_reset_request, name='auth_password_reset_request'),
    path('password/reset/', password_reset_confirm, name='auth_password_reset_confirm'),

    # Email verification
    path('email/verify/resend/', resend_email_verification, name='auth_email_verify_resend'),
    path('email/verify/resend/public/', resend_email_verification_public, name='auth_email_verify_resend_public'),
    path('email/verify/confirm/', email_verify_confirm, name='auth_email_verify_confirm'),
    path('verify/', verify_email_with_token, name='auth_verify_custom_token'),

    # Social OAuth
    path('google/', GoogleLogin.as_view(), name='google_login'),
    path('github/', GitHubLogin.as_view(), name='github_login'),
]
