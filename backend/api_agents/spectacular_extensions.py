"""
Extensions for drf-spectacular to properly document custom authentication.
"""
from drf_spectacular.extensions import OpenApiAuthenticationExtension
from drf_spectacular.plumbing import build_bearer_security_scheme_object
from api_agents.authentication.auth import CookieJWTAuthentication


class CookieJWTAuthenticationScheme(OpenApiAuthenticationExtension):
    """
    OpenAPI schema extension for CookieJWTAuthentication.
    Documents that authentication uses HttpOnly cookies.
    """
    target_class = CookieJWTAuthentication
    name = 'CookieJWTAuth'
    
    def get_security_definition(self, auto_schema):
        return {
            'type': 'apiKey',
            'in': 'cookie',
            'name': 'access',
            'description': 'JWT access token stored in HttpOnly cookie. Token expires after 24 hours.'
        }

