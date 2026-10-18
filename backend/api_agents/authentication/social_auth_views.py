import logging
import requests
import os
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialAccount, SocialApp
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample
from .models import UserProfile
from .serializers import (
    GoogleLoginRequestSerializer,
    GitHubLoginRequestSerializer,
    OAuthLoginResponseSerializer,
)

logger = logging.getLogger(__name__)


class GoogleLogin(APIView):
    """
    Google OAuth2 login endpoint for REST API
    
    POST /api/auth/google/
    Body: { "code": "authorization_code" }  # For auth-code flow (recommended)
    OR Body: { "access_token": "google_id_token_or_access_token" }
    OR Body: { "id_token": "google_id_token" }
    
    Returns JWT tokens for authenticated user
    
    We bypass dj-rest-auth's SocialLoginView to avoid OAuth2Client conflicts
    and handle the entire flow manually using django-allauth primitives.
    """
    permission_classes = []  # Allow any
    
    @extend_schema(
        tags=['auth'],
        operation_id='auth_google',
        summary='Login with Google OAuth2',
        description='''
        Authenticate a user using Google OAuth2. Supports three authentication flows:
        
        **1. Authorization Code Flow (Recommended)** - Most secure, uses PKCE
        - Frontend receives authorization code from Google
        - Backend exchanges code for tokens
        - Use this with `@react-oauth/google` with `flow: 'auth-code'`
        
        **2. ID Token Flow** - Direct ID token validation
        - Frontend receives ID token from Google
        - Backend validates token directly
        
        **3. Access Token Flow** - Legacy support
        - Frontend receives access token
        - Backend uses token to fetch user info
        
        **Response:**
        - Sets HTTP-only cookies: `access` (15 min) and `refresh` (7 days)
        - Returns user data and DRF token in response body
        - Automatically verifies user email (social auth users are verified)
        ''',
        request=GoogleLoginRequestSerializer,
        examples=[
            OpenApiExample(
                'Authorization Code Flow (Recommended)',
                value={
                    'code': '4/0AeanS...',
                    'code_verifier': 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'  # Optional, for PKCE
                },
                request_only=True,
                description='Use this when frontend sends authorization code from Google OAuth popup'
            ),
            OpenApiExample(
                'ID Token Flow',
                value={
                    'id_token': 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2Mz...'
                },
                request_only=True,
                description='Use this when frontend has Google ID token (JWT)'
            ),
            OpenApiExample(
                'Access Token Flow',
                value={
                    'access_token': 'ya29.a0AfH6SMBx...'
                },
                request_only=True,
                description='Legacy support - use access token directly'
            ),
        ],
        responses={
            200: OpenApiResponse(
                response=OAuthLoginResponseSerializer,
                description='Login successful. JWT tokens set in HTTP-only cookies.',
                examples=[
                    OpenApiExample(
                        'Success Response',
                        value={
                            'user': {
                                'pk': '550e8400-e29b-41d4-a716-446655440000',
                                'username': 'john.doe',
                                'email': 'john.doe@gmail.com',
                                'first_name': 'John',
                                'last_name': 'Doe'
                            },
                            'token': '9944b09199c62bcf9418ad846dd0e4bbdfc6ee4b'
                        }
                    )
                ]
            ),
            400: OpenApiResponse(
                description='Login failed - invalid code/token or Google API error',
                examples=[
                    OpenApiExample(
                        'Error Response',
                        value={
                            'error': 'Failed to exchange code for tokens',
                            'detail': 'invalid_grant: The provided authorization code is invalid or expired.'
                        }
                    )
                ]
            )
        }
    )
    def post(self, request, *args, **kwargs):
        logger.info("=" * 80)
        logger.info("🔵 Google OAuth Login Attempt")
        logger.info("=" * 80)
        logger.info(f"📥 Request data keys: {list(request.data.keys())}")
        logger.info(f"📍 Headers: {dict(request.headers)}")
        
        # Ensure SocialApp exists for Google OAuth
        # This auto-creates it if missing, preventing SocialApp.DoesNotExist errors
        try:
            google_client_id = os.getenv('GOOGLE_CLIENT_ID')
            google_client_secret = os.getenv('GOOGLE_CLIENT_SECRET')
            
            if google_client_id and google_client_secret:
                site, _ = Site.objects.get_or_create(pk=settings.SITE_ID)
                google_app, created = SocialApp.objects.get_or_create(
                    provider='google',
                    defaults={
                        'name': 'Google OAuth',
                        'client_id': google_client_id,
                        'secret': google_client_secret,
                    }
                )
                if not created:
                    # Update credentials if they changed
                    if google_app.client_id != google_client_id or google_app.secret != google_client_secret:
                        google_app.client_id = google_client_id
                        google_app.secret = google_client_secret
                        google_app.save()
                        logger.info("🔄 Updated Google OAuth credentials")
                
                # Ensure app is associated with current site
                if site not in google_app.sites.all():
                    google_app.sites.add(site)
                    logger.info(f"✅ Associated Google OAuth app with site: {site.domain}")
                
                if created:
                    logger.info("✅ Auto-created Google OAuth SocialApp")
            else:
                logger.warning("⚠️  GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not found in environment")
        except Exception as e:
            logger.warning(f"⚠️  Failed to auto-create SocialApp: {str(e)}")
            # Continue anyway - might already exist or will fail with better error
        
        # Initialize id_token variable
        id_token = None
        
        # Handle authorization code flow (from @react-oauth/google with flow: 'auth-code')
        if 'code' in request.data:
            code = request.data['code']
            code_verifier = request.data.get('code_verifier')
            logger.info(f"🔄 Authorization code received (first 20 chars): {code[:20]}...")
            if code_verifier:
                logger.info(f"📎 PKCE code_verifier provided")
            
            try:
                # Exchange authorization code for tokens using Google's OAuth2 token endpoint
                token_url = "https://oauth2.googleapis.com/token"
                token_data = {
                    'client_id': os.getenv('GOOGLE_CLIENT_ID'),
                    'client_secret': os.getenv('GOOGLE_CLIENT_SECRET'),
                    'code': code,
                    'grant_type': 'authorization_code',
                    'redirect_uri': 'postmessage',
                }
                
                if code_verifier:
                    token_data['code_verifier'] = code_verifier
                    logger.info("📎 Included PKCE code_verifier in token exchange")
                
                logger.info(f"🌐 Exchanging code for tokens at: {token_url}")
                logger.info(f"📤 Token request data (client_id): {token_data['client_id']}")
                
                token_response = requests.post(
                    token_url,
                    data=token_data,
                    headers={'Content-Type': 'application/x-www-form-urlencoded'}
                )
                
                logger.info(f"📥 Token response status: {token_response.status_code}")
                
                if token_response.status_code != 200:
                    error_text = token_response.text[:200]
                    logger.error(f"❌ Token exchange failed: {error_text}")
                    return Response(
                        {"error": "Failed to exchange code for tokens", "detail": error_text},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                token_json = token_response.json()
                logger.info(f"📥 Token response keys: {list(token_json.keys())}")
                
                # Extract id_token or access_token from the response
                received_id_token = token_json.get('id_token')
                received_access_token = token_json.get('access_token')
                
                if received_id_token:
                    logger.info(f"✅ Got ID token: {received_id_token[:30]}...")
                    id_token = received_id_token
                elif received_access_token:
                    logger.info(f"✅ Got access token: {received_access_token[:30]}...")
                    # Use access_token as id_token
                    id_token = received_access_token
                else:
                    logger.error(f"❌ No id_token or access_token in response: {token_json}")
                    return Response(
                        {"error": "Failed to get tokens from Google", "detail": token_json},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            except Exception as e:
                logger.error(f"❌ Code exchange failed: {str(e)}")
                logger.exception("Full exception:")
                return Response(
                    {"error": f"Token exchange failed: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Handle both 'access_token' and 'id_token' from @react-oauth/google (implicit flow)
        if not id_token:
            id_token = request.data.get('id_token')
        
        if not id_token and 'access_token' in request.data:
            # If only access_token is provided, it might be an ID token
            id_token = request.data['access_token']
            logger.info("🔄 Treating access_token as id_token (from @react-oauth/google implicit flow)")
        
        if not id_token:
            logger.error("❌ No id_token provided or obtained from Google")
            logger.error(f"📋 Request data keys: {list(request.data.keys())}")
            return Response(
                {"error": "Missing id_token or access_token"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Now use the id_token to get user info and create/login user
        try:
            logger.info("🔄 Fetching Google user info with id_token...")
            
            # Verify and decode ID token using Google's tokeninfo endpoint
            # This validates the token signature and returns user info
            tokeninfo_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
            tokeninfo_response = requests.get(tokeninfo_url)
            
            if tokeninfo_response.status_code != 200:
                # If tokeninfo fails, try using it as an access token
                logger.info("🔄 ID token validation failed, trying as access token...")
                userinfo_response = requests.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={'Authorization': f'Bearer {id_token}'}
                )
                
                if userinfo_response.status_code != 200:
                    logger.error(f"❌ Failed to get user info: {userinfo_response.text}")
                    return Response(
                        {"error": "Failed to fetch user info from Google", "detail": tokeninfo_response.text},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                google_user = userinfo_response.json()
            else:
                google_user = tokeninfo_response.json()
            
            logger.info(f"👤 Google user: {google_user.get('email')} (ID: {google_user.get('sub')})")
            
            # Get or create user
            User = get_user_model()
            email = google_user.get('email')
            
            if not email:
                return Response(
                    {"error": "Unable to get email from Google account"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Try to find existing user by email
            try:
                user = User.objects.get(email=email)
                logger.info(f"✅ Found existing user: {user.username}")
            except User.DoesNotExist:
                # Create new user
                username = email.split('@')[0]
                # Ensure username is unique
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                first_name = google_user.get('given_name', '')
                last_name = google_user.get('family_name', '')
                
                # If given_name/family_name not available, try 'name'
                if not first_name and google_user.get('name'):
                    name_parts = google_user.get('name', '').split()
                    first_name = name_parts[0] if name_parts else ''
                    last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                )
                logger.info(f"✅ Created new user: {user.username}")
            
            # Social auth users are automatically verified
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.is_verified = True
            profile.save()
            logger.info(f"✅ User {user.username} marked as verified (social auth)")
            
            # Create or update SocialAccount
            social_account, created = SocialAccount.objects.get_or_create(
                user=user,
                provider='google',
                defaults={
                    'uid': google_user.get('sub', google_user.get('id', email)),
                    'extra_data': google_user
                }
            )
            if not created:
                social_account.extra_data = google_user
                social_account.save()
                logger.info(f"✅ Updated existing social account")
            else:
                logger.info(f"✅ Created new social account")
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            # Get or create DRF token
            token, _ = Token.objects.get_or_create(user=user)
            
            response_data = {
                'user': {
                    'pk': user.pk,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                },
                'token': token.key
            }
            
            logger.info("🔐 Google login authorized user")
            logger.info(f"   User ID: {user.pk}")
            logger.info(f"   Username: {user.username}")
            logger.info(f"   Email: {user.email}")
            
            logger.info(f"✅ Google login successful for {user.username}")
            cookie_secure = False if settings.DEBUG else True
            resp = Response(response_data, status=status.HTTP_200_OK)
            resp.set_cookie('access', str(refresh.access_token), httponly=True, secure=cookie_secure, samesite='Lax', max_age=15 * 60)
            resp.set_cookie('refresh', str(refresh), httponly=True, secure=cookie_secure, samesite='Lax', max_age=7 * 24 * 60 * 60)
            return resp
            
        except Exception as e:
            logger.error(f"❌ Google login failed: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            logger.exception("Full exception:")
            return Response(
                {"error": str(e), "detail": "Google login failed"},
                status=status.HTTP_400_BAD_REQUEST
            )

class GitHubLogin(APIView):
    """
    GitHub OAuth2 login endpoint for REST API
    
    POST /api/auth/github/
    Body: { "code": "github_oauth_code" }
    
    Returns JWT tokens for authenticated user
    
    We bypass dj-rest-auth's SocialLoginView to avoid OAuth2Client conflicts
    and handle the entire flow manually using django-allauth primitives.
    """
    permission_classes = []  # Allow any
    
    @extend_schema(
        tags=['auth'],
        operation_id='auth_github',
        request=GitHubLoginRequestSerializer,
        responses={200: OpenApiResponse(response=OAuthLoginResponseSerializer, description='GitHub login success'),
                   400: OpenApiResponse(description='GitHub login failed')},
        description='Login with GitHub using OAuth code or access_token. Returns JWT access, refresh, DRF token, and user.'
    )
    def post(self, request, *args, **kwargs):
        logger.info("=" * 80)
        logger.info("🐙 GitHub OAuth Login Attempt")
        logger.info("=" * 80)
        logger.info(f"📥 Request data: {request.data}")
        logger.info(f"📥 Request data keys: {list(request.data.keys())}")
        
        access_token = request.data.get('access_token')
        
        # If we received a 'code', always exchange it for a fresh access_token
        if 'code' in request.data:
            code = request.data['code']
            logger.info(f"🔄 Exchanging authorization code for access token...")
            logger.info(f"Code (first 20 chars): {code[:20]}...")
            
            try:
                # Exchange code for access_token using GitHub's OAuth API
                import os
                token_url = "https://github.com/login/oauth/access_token"
                token_data = {
                    'client_id': os.getenv('GITHUB_CLIENT_ID'),
                    'client_secret': os.getenv('GITHUB_CLIENT_SECRET'),
                    'code': code,
                    'redirect_uri': f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/auth/callback/github",
                }

                code_verifier = request.data.get('code_verifier')
                if code_verifier:
                    token_data['code_verifier'] = code_verifier
                    logger.info("📎 Included PKCE code_verifier in token exchange")
                
                logger.info(f"🌐 Requesting token from: {token_url}")
                logger.info(f"📤 Token request data (client_id): {token_data['client_id']}")
                
                token_response = requests.post(
                    token_url,
                    data=token_data,
                    headers={'Accept': 'application/json'}
                )
                
                logger.info(f"📥 Token response status: {token_response.status_code}")
                token_json = token_response.json()
                logger.info(f"📥 Token response keys: {list(token_json.keys())}")
                
                if 'access_token' in token_json:
                    access_token = token_json['access_token']
                    logger.info(f"✅ Got access token: {access_token[:20]}...")
                    # Replace the code with the access_token
                    # We need to modify request.data, but it's immutable
                    # So we create a new dict and replace request._data
                    new_data = dict(request.data)
                    new_data['access_token'] = access_token
                    if 'code' in new_data:
                        del new_data['code']
                    if code_verifier and 'code_verifier' in new_data:
                        del new_data['code_verifier']
                    request._data = new_data
                else:
                    logger.error(f"❌ No access_token in response: {token_json}")
                    return Response(
                        {"error": "Failed to exchange code for access token", "detail": token_json},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
            except Exception as e:
                logger.error(f"❌ Token exchange failed: {str(e)}")
                logger.exception("Full exception:")
                return Response(
                    {"error": f"Token exchange failed: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        if not access_token:
            logger.error("❌ No access_token provided or obtained from GitHub")
            return Response(
                {"error": "Missing access token"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Now use the access_token to get user info and create/login user
        try:
            logger.info("🔄 Fetching GitHub user info with access_token...")
            
            # Get user info from GitHub
            user_info_response = requests.get(
                "https://api.github.com/user",
                headers={'Authorization': f'token {access_token}'}
            )
            
            if user_info_response.status_code != 200:
                logger.error(f"❌ Failed to get user info: {user_info_response.text}")
                return Response(
                    {"error": "Failed to fetch user info from GitHub"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            github_user = user_info_response.json()
            logger.info(f"👤 GitHub user: {github_user.get('login')} ({github_user.get('email')})")
            
            # Get or create user
            User = get_user_model()
            email = github_user.get('email')
            
            if not email:
                # If email is private, fetch it from emails endpoint
                emails_response = requests.get(
                    "https://api.github.com/user/emails",
                    headers={'Authorization': f'token {access_token}'}
                )
                if emails_response.status_code == 200:
                    emails = emails_response.json()
                    primary_email = next((e for e in emails if e.get('primary')), None)
                    if primary_email:
                        email = primary_email['email']
            
            if not email:
                return Response(
                    {"error": "Unable to get email from GitHub account"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Try to find existing user by email
            try:
                user = User.objects.get(email=email)
                logger.info(f"✅ Found existing user: {user.username}")
            except User.DoesNotExist:
                # Create new user
                username = github_user.get('login', email.split('@')[0])
                # Ensure username is unique
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    first_name=github_user.get('name', '').split()[0] if github_user.get('name') else '',
                    last_name=' '.join(github_user.get('name', '').split()[1:]) if github_user.get('name') and len(github_user.get('name', '').split()) > 1 else '',
                )
                logger.info(f"✅ Created new user: {user.username}")
            
            # Social auth users are automatically verified
            profile, _ = UserProfile.objects.get_or_create(user=user)
            profile.is_verified = True
            profile.save()
            logger.info(f"✅ User {user.username} marked as verified (social auth)")
            
            # Create or update SocialAccount
            social_account, created = SocialAccount.objects.get_or_create(
                user=user,
                provider='github',
                defaults={
                    'uid': str(github_user['id']),
                    'extra_data': github_user
                }
            )
            if not created:
                social_account.extra_data = github_user
                social_account.save()
                logger.info(f"✅ Updated existing social account")
            else:
                logger.info(f"✅ Created new social account")
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            response_data = {
                'user': {
                    'pk': user.pk,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            }
            
            logger.info("🔐 GitHub login authorized user")
            logger.info(f"   User ID: {user.pk}")
            logger.info(f"   Username: {user.username}")
            logger.info(f"   Email: {user.email}")
            # Cookies hold JWTs; response body no longer returns tokens
            
            logger.info(f"✅ GitHub login successful for {user.username}")
            cookie_secure = False if settings.DEBUG else True
            resp = Response(response_data, status=status.HTTP_200_OK)
            resp.set_cookie('access', str(refresh.access_token), httponly=True, secure=cookie_secure, samesite='Lax', max_age=15 * 60)
            resp.set_cookie('refresh', str(refresh), httponly=True, secure=cookie_secure, samesite='Lax', max_age=7 * 24 * 60 * 60)
            return resp
            
        except Exception as e:
            logger.error(f"❌ GitHub login failed: {str(e)}")
            logger.error(f"Exception type: {type(e).__name__}")
            logger.exception("Full exception:")
            return Response(
                {"error": str(e), "detail": "GitHub login failed"},
                status=status.HTTP_400_BAD_REQUEST
            )
