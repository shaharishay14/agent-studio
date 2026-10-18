from rest_framework_simplejwt.authentication import JWTAuthentication
from typing import Optional, Tuple


class CookieJWTAuthentication(JWTAuthentication):
    """
    JWT authentication that also looks for the access token in the 'access' cookie.
    Falls back to Authorization header if present.
    """
    def authenticate(self, request) -> Optional[Tuple[object, object]]:
        header = self.get_header(request)
        raw_token = None
        if header is not None:
            raw_token = self.get_raw_token(header)
        if raw_token is None:
            raw_token = request.COOKIES.get('access')
        if raw_token is None:
            return None
        
        # Try to validate the token, but return None if it's invalid/expired
        # This allows AllowAny permissions to work properly
        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except Exception:
            # Token is invalid/expired, return None to allow AllowAny to work
            return None


