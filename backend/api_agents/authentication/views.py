from rest_framework import viewsets, status, serializers as drf_serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from django.utils import timezone
from ..models import UserProfile, User
from ..serializers import (
    UserSerializer, UserRegistrationSerializer,
    RegistrationResponseSerializer, LoginRequestSerializer, LoginResponseSerializer,
    LogoutResponseSerializer,
    EmailVerificationResendResponseSerializer, EmailVerificationConfirmResponseSerializer,
    TokenRefreshCookieResponseSerializer, PasswordResetRequestSerializer,
    PasswordResetRequestResponseSerializer, PasswordResetConfirmRequestSerializer,
    PasswordResetConfirmResponseSerializer
)
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils.encoding import force_str, force_bytes
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.auth.tokens import default_token_generator
from django.urls import reverse
from django.core.mail import send_mail
from allauth.account.models import EmailAddress
import requests
import os
import uuid
import traceback


@extend_schema(
    tags=['auth'],
    operation_id='auth_register',
    request=UserRegistrationSerializer,
    responses={
        201: OpenApiResponse(response=RegistrationResponseSerializer, description='User created'),
        400: OpenApiResponse(description='Validation error')
    },
    description='Register a new user with username, email, password and password_confirm. On success, JWT tokens are set as HttpOnly cookies; the response contains the user only.'
)
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    Handles new user registration without auto-login.
    """

    print(f"📝 Registration attempt with data: {request.data}")
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        # Generate custom verification token and set user as unverified
        verification_token = str(uuid.uuid4())
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.is_verified = False
        profile.verification_token = verification_token
        profile.verification_token_created_at = timezone.now()
        profile.save()

        # Ensure EmailAddress record exists and send verification
        EmailAddress.objects.update_or_create(
            user=user, email=user.email,
            defaults={'verified': False, 'primary': True}
        )
        _send_email_verification_with_token(request, user, verification_token)

        print(f"✅ User created: {user.username} (verification email sent with custom token, is_verified=False, NO auto-login)")

        # Return user data WITHOUT setting JWT cookies (no auto-login)
        response = Response({
            'user': UserSerializer(user).data,
            'detail': 'Registration successful. Please check your email to verify your account.'
        }, status=status.HTTP_201_CREATED)
        return response
    print(f"❌ Registration validation errors: {serializer.errors}")
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['auth'],
    operation_id='auth_login',
    summary='Authenticate user and set JWT cookies',
    description='Authenticates a user with username (or email alias) and password, verifies email ownership, then issues new HttpOnly JWT cookies. The response includes the serialized user profile with UUID identifiers.',
    request=LoginRequestSerializer,
    responses={
        200: OpenApiResponse(
            response=LoginResponseSerializer,
            description='Login succeeded. HttpOnly access/refresh cookies were issued.',
            examples=[
                OpenApiExample(
                    'Login success',
                    value={
                        'user': {
                            'id': '8d8d8a34-8a0c-4a0b-92bb-6de93882e298',
                            'username': 'founder1',
                            'email': 'founder1@example.com',
                            'agent_count': 2
                        }
                    },
                    response_only=True,
                    status_codes=['200']
                )
            ]
        ),
        400: OpenApiResponse(description='Missing username/email or password.'),
        401: OpenApiResponse(description='Credentials are invalid.'),
        403: OpenApiResponse(description='Email verification required.')
    },
    examples=[
        OpenApiExample(
            'Login with username',
            value={'username': 'founder1', 'password': 'StrongPass123!'},
            request_only=True
        ),
        OpenApiExample(
            'Login with email',
            value={'username': 'founder1@example.com', 'password': 'StrongPass123!'},
            summary='When frontend sends email via username field',
            request_only=True
        )
    ]
)
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    Handles user login with username and password.
    """
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response(
            {'error': 'Please provide both username and password'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(username=username, password=password)

    if not user:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Check if user is verified (using UserProfile)
    profile, _ = UserProfile.objects.get_or_create(user=user)
    if not profile.is_verified:
        # Send verification email if not verified
        email_rec, _ = EmailAddress.objects.get_or_create(
            user=user, email=user.email, defaults={'verified': False, 'primary': True}
        )
        _send_email_verification(request, user)
        return Response(
            {'detail': 'Email verification required. Verification email sent.'},
            status=status.HTTP_403_FORBIDDEN
        )

    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    response = Response({
        'user': UserSerializer(user).data
    })
    cookie_secure = False if settings.DEBUG else True
    response.set_cookie('access', access_token, httponly=True, secure=cookie_secure, samesite='Lax', max_age=24 * 60 * 60)
    response.set_cookie('refresh', refresh_token, httponly=True, secure=cookie_secure, samesite='Lax', max_age=7 * 24 * 60 * 60)
    return response


@extend_schema(
    tags=['auth'],
    operation_id='auth_logout',
    summary='Logout current user and clear JWT cookies',
    description='Removes the HttpOnly `access` and `refresh` cookies for the authenticated user and deletes any DRF token if present. No request body is required—authentication comes from the cookies.',
    responses={
        200: OpenApiResponse(
            response=LogoutResponseSerializer,
            description='Logout success. Cookies cleared.',
            examples=[
                OpenApiExample(
                    'Logout success',
                    value={'message': 'Successfully logged out'},
                    response_only=True,
                    status_codes=['200']
                )
            ]
        ),
        401: OpenApiResponse(description='Authentication required.')
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Handles user logout by deleting their auth token.
    """
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    response = Response({'message': 'Successfully logged out'}, status=status.HTTP_200_OK)
    response.delete_cookie('access')
    response.delete_cookie('refresh')
    return response


@extend_schema(
    tags=['auth'],
    operation_id='auth_me',
    summary='Retrieve authenticated user profile',
    description='Returns the authenticated user profile (UUID id, username, email, agent_count). Authentication relies on the JWT access token stored in the HttpOnly cookie. This is the single source of truth for "current user".',
    responses={
        200: OpenApiResponse(
            response=UserSerializer,
            description='Current user profile.',
            examples=[
                OpenApiExample(
                    'Current user',
                    value={
                        'id': '8d8d8a34-8a0c-4a0b-92bb-6de93882e298',
                        'username': 'founder1',
                        'email': 'founder1@example.com',
                        'agent_count': 2
                    },
                    response_only=True,
                    status_codes=['200']
                )
            ]
        ),
        401: OpenApiResponse(description='Authentication required.')
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user(request):
    """
    Returns information about the currently authenticated user.
    Authentication is handled via JWT token stored in HttpOnly 'access' cookie.
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
@ensure_csrf_cookie
@extend_schema(
    tags=['auth'],
    operation_id='auth_csrf_token',
    responses={
        200: OpenApiResponse(
            response=drf_serializers.Serializer,
            description='CSRF cookie set successfully',
            examples=[
                OpenApiExample(
                    'Success',
                    value={'detail': 'CSRF cookie set'},
                    response_only=True
                )
            ]
        )
    },
    description='Sets a CSRF token cookie for the client. This endpoint is used by SPAs (Single Page Applications) to obtain a CSRF token for making authenticated requests. The CSRF token is automatically included in subsequent requests via the cookie.'
)
def csrf_token(request):
    """
    Sets a CSRF token cookie for the client.
    This is needed for SPAs using cookie-based authentication to prevent CSRF attacks.
    """
    return Response({'detail': 'CSRF cookie set'})


@api_view(['POST'])
@permission_classes([AllowAny])
@extend_schema(
    tags=['auth'],
    operation_id='auth_token_refresh_cookie',
    responses={
        200: OpenApiResponse(response=TokenRefreshCookieResponseSerializer, description='New access cookie issued'),
        401: OpenApiResponse(description='Invalid or missing refresh cookie')
    },
    description='Refreshes the JWT access token for cookie-based authentication. Reads the refresh token from the HttpOnly "refresh" cookie, validates it, and issues a new access token stored in the HttpOnly "access" cookie. No request body required. This endpoint is essential for maintaining authenticated sessions when the access token expires (after 24 hours).'
)
def refresh_access_cookie(request):
    """
    Refreshes the JWT access token using the refresh token from cookies.

    Flow:
    1. Reads the 'refresh' HttpOnly cookie
    2. Validates the refresh token
    3. Generates a new access token
    4. Sets the new access token in the 'access' HttpOnly cookie (24 hours expiry)
    5. Returns success message

    This is needed because access tokens expire after 24 hours, and the frontend
    needs to refresh them periodically to maintain authentication.
    """
    refresh_cookie = request.COOKIES.get('refresh')
    if not refresh_cookie:
        raise AuthenticationFailed('Missing refresh cookie')
    try:
        refresh = RefreshToken(refresh_cookie)
        new_access = str(refresh.access_token)
    except Exception:
        raise AuthenticationFailed('Invalid refresh token')
    cookie_secure = False if settings.DEBUG else True
    resp = Response({'detail': 'Access token refreshed'})
    resp.set_cookie('access', new_access, httponly=True, secure=cookie_secure, samesite='Lax', max_age=24 * 60 * 60)
    return resp

@extend_schema(
    tags=['auth'],
    operation_id='auth_password_reset_request',
    summary='Send password reset email',
    description='Initiates the password reset flow for the provided email. Always returns success to avoid leaking which accounts exist. Generates a uid/token pair and emails a reset link that expires using Django\'s default token generator.',
    request=PasswordResetRequestSerializer,
    responses={
        200: PasswordResetRequestResponseSerializer
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request(request):
    print(f"🔐 Password reset request received")
    serializer = PasswordResetRequestSerializer(data=request.data)
    if not serializer.is_valid():
        print(f"❌ Password reset request validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    email = serializer.validated_data['email']
    print(f"📧 Password reset requested for email: {email}")
    try:
        user = User.objects.get(email__iexact=email)
        print(f"✅ User found: {user.username} (ID: {user.id})")
        _send_password_reset_email(request, user)
    except User.DoesNotExist:
        print(f"⚠️ Password reset requested for non-existent email: {email} (returning generic success to avoid email enumeration)")
        # Return generic response to avoid leaking which emails exist

    return Response(
        {'detail': 'If an account exists for that email, a reset link has been sent.'},
        status=status.HTTP_200_OK
    )


@extend_schema(
    tags=['auth'],
    operation_id='auth_password_reset_confirm',
    summary='Reset password using uid/token',
    description='Completes the password reset flow using the uid/token pair from the email link. Validates password strength and sets the new password for the matching user.',
    request=PasswordResetConfirmRequestSerializer,
    responses={
        200: PasswordResetConfirmResponseSerializer,
        400: OpenApiResponse(description='Invalid uid/token or password validation error')
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm(request):
    print(f"🔐 Password reset confirm request received")
    serializer = PasswordResetConfirmRequestSerializer(data=request.data)
    if not serializer.is_valid():
        print(f"❌ Password reset confirm validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    uid = serializer.validated_data['uid']
    token = serializer.validated_data['token']
    password = serializer.validated_data['password']

    print(f"🔍 Attempting to decode uid and validate token...")
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_id)
        print(f"✅ User found: {user.username} (ID: {user.id}, Email: {user.email})")
    except (User.DoesNotExist, ValueError, TypeError) as e:
        print(f"❌ Invalid uid or user not found: {e}")
        return Response({'detail': 'Invalid or expired link.'}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        print(f"❌ Invalid or expired token for user: {user.username} (ID: {user.id})")
        return Response({'detail': 'Invalid or expired link.'}, status=status.HTTP_400_BAD_REQUEST)

    print(f"✅ Token validated successfully for user: {user.username}")

    try:
        validate_password(password, user=user)
        print(f"✅ Password strength validation passed")
    except ValidationError as e:
        print(f"❌ Password validation failed: {e.messages}")
        return Response({'password': e.messages}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(password)
    user.save()
    print(f"✅ Password reset successful for user: {user.username} (ID: {user.id})")

    return Response({'detail': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)


def _send_email_verification(request, user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    verify_url = request.build_absolute_uri(
        reverse('auth_email_verify_confirm')
    ) + f'?uid={uid}&token={token}'

    # EmailJS configuration
    # NOTE: To use EmailJS from server-side, you must enable "Allow server-side API calls"
    # in your EmailJS dashboard: https://dashboard.emailjs.com/admin/integration
    emailjs_service_id = os.getenv('EMAILJS_SERVICE_ID')
    emailjs_template_id = os.getenv('EMAILJS_TEMPLATE_ID')
    emailjs_public_key = os.getenv('EMAILJS_PUBLIC_KEY')
    emailjs_private_key = os.getenv('EMAILJS_PRIVATE_KEY')

    # If EmailJS is configured, use it; otherwise fall back to Django's send_mail
    if emailjs_service_id and emailjs_template_id and emailjs_public_key and emailjs_private_key:
        try:
            # EmailJS API endpoint
            emailjs_url = 'https://api.emailjs.com/api/v1.0/email/send'

            # Prepare EmailJS payload
            # Note: The HTML template should be created in EmailJS platform using verification_email.html
            # Template variables {{username}} and {{verify_url}} will be replaced by EmailJS
            payload = {
                'service_id': emailjs_service_id,
                'template_id': emailjs_template_id,
                'user_id': emailjs_public_key,
                'template_params': {
                    'to_email': user.email,
                    'email': user.email,  # Some templates use 'email' instead of 'to_email'
                    'username': user.username,
                    'verify_url': verify_url,
                    'subject': 'Verify your email',
                }
            }

            # Send email via EmailJS
            # EmailJS v1.0 API: accessToken can be in request body or as query param
            # Try both methods for compatibility
            try:
                # Method 1: accessToken in request body
                payload_with_token = payload.copy()
                payload_with_token['accessToken'] = emailjs_private_key
                response = requests.post(
                    emailjs_url,
                    json=payload_with_token,
                    timeout=10
                )
                response.raise_for_status()
            except Exception as e1:
                # Method 2: accessToken as query parameter (fallback)
                print(f"⚠️ EmailJS method 1 failed, trying query param: {e1}")
                response = requests.post(
                    emailjs_url,
                    json=payload,
                    params={'accessToken': emailjs_private_key},
                    timeout=10
                )
                response.raise_for_status()
            print(f"✅ Verification email sent via EmailJS to {user.email}")
        except Exception as e:
            error_details = 'No response'
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_details = e.response.text[:200]  # First 200 chars
                except:
                    error_details = str(e.response.status_code)
            print(f"❌ EmailJS error: {e}. Response: {error_details}. Falling back to Django send_mail.")
            # Fallback to Django's send_mail
            subject = 'Verify your email'
            message = f'Hi {user.username},\n\nPlease verify your email by clicking this link:\n{verify_url}\n\nIf you did not sign up, you can ignore this email.'
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
    else:
        # Use Django's send_mail if EmailJS is not configured
        subject = 'Verify your email'
        message = f'Hi {user.username},\n\nPlease verify your email by clicking this link:\n{verify_url}\n\nIf you did not sign up, you can ignore this email.'
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)


def _send_email_verification_with_token(request, user, verification_token):
    """Send email verification with custom token using EmailJS, linking to frontend verification page"""
    from django.utils.http import urlsafe_base64_encode
    from django.utils.encoding import force_bytes

    # Encode user ID for URL
    uid = urlsafe_base64_encode(force_bytes(user.pk))

    # Build verification URL pointing to FRONTEND (not backend API)
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    verify_url = f"{frontend_url}/auth/verify?userId={uid}&token={verification_token}"

    # EmailJS configuration
    emailjs_service_id = os.getenv('EMAILJS_SERVICE_ID')
    emailjs_template_id = os.getenv('EMAILJS_TEMPLATE_ID')
    emailjs_public_key = os.getenv('EMAILJS_PUBLIC_KEY')
    emailjs_private_key = os.getenv('EMAILJS_PRIVATE_KEY')

    # If EmailJS is configured, use it; otherwise fall back to Django's send_mail
    if emailjs_service_id and emailjs_template_id and emailjs_public_key and emailjs_private_key:
        try:
            # EmailJS API endpoint
            emailjs_url = 'https://api.emailjs.com/api/v1.0/email/send'

            # Prepare EmailJS payload with custom token
            payload = {
                'service_id': emailjs_service_id,
                'template_id': emailjs_template_id,
                'user_id': emailjs_public_key,
                'template_params': {
                    'to_email': user.email,
                    'email': user.email,
                    'username': user.username,
                    'verify_url': verify_url,  # Frontend URL with custom token
                    'subject': 'Verify your email',
                }
            }

            # Send email via EmailJS
            try:
                # Method 1: accessToken in request body
                payload_with_token = payload.copy()
                payload_with_token['accessToken'] = emailjs_private_key
                response = requests.post(
                    emailjs_url,
                    json=payload_with_token,
                    timeout=10
                )
                response.raise_for_status()
            except Exception as e1:
                # Method 2: accessToken as query parameter (fallback)
                print(f"⚠️ EmailJS method 1 failed, trying query param: {e1}")
                response = requests.post(
                    emailjs_url,
                    json=payload,
                    params={'accessToken': emailjs_private_key},
                    timeout=10
                )
                response.raise_for_status()
            print(f"✅ Custom verification email sent via EmailJS to {user.email} with token: {verification_token[:8]}...")
        except Exception as e:
            error_details = 'No response'
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_details = e.response.text[:200]
                except:
                    error_details = str(e.response.status_code)
            print(f"❌ EmailJS error: {e}. Response: {error_details}. Falling back to Django send_mail.")
            # Fallback to Django's send_mail
            subject = 'Verify your email'
            message = f'Hi {user.username},\n\nPlease verify your email by clicking this link:\n{verify_url}\n\nIf you did not sign up, you can ignore this email.'
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
    else:
        # Use Django's send_mail if EmailJS is not configured
        subject = 'Verify your email'
        message = f'Hi {user.username},\n\nPlease verify your email by clicking this link:\n{verify_url}\n\nIf you did not sign up, you can ignore this email.'
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
        print(f"✅ Verification email sent via Django to {user.email}")


def _send_password_reset_email(request, user):
    print(f"📧 Preparing password reset email for user: {user.username} (Email: {user.email})")
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
    reset_path = os.getenv('PASSWORD_RESET_PATH', '/reset-password')
    if not reset_path.startswith('/'):
        reset_path = f'/{reset_path}'
    reset_link = f"{frontend_url}{reset_path}?uid={uid}&token={token}"
    print(f"🔗 Generated reset link: {reset_link[:50]}... (uid: {uid[:20]}..., token: {token[:10]}...)")

    emailjs_service_id = os.getenv('EMAILJS_SERVICE_ID')
    password_reset_template_id = os.getenv('EMAILJS_PASSWORD_RESET_TEMPLATE_ID')
    emailjs_public_key = os.getenv('EMAILJS_PUBLIC_KEY')
    emailjs_private_key = os.getenv('EMAILJS_PRIVATE_KEY')

    if emailjs_service_id and password_reset_template_id and emailjs_public_key and emailjs_private_key:
        print(f"📤 Using EmailJS to send password reset email (Service: {emailjs_service_id}, Template: {password_reset_template_id})")
        payload = {
            'service_id': emailjs_service_id,
            'template_id': password_reset_template_id,
            'user_id': emailjs_public_key,
            'template_params': {
                'to_email': user.email,
                'email': user.email,
                'username': user.username,
                'link': reset_link,
                'expires_in': '1 hour'
            }
        }
        try:
            # Method 1: accessToken in request body
            payload_with_token = payload.copy()
            payload_with_token['accessToken'] = emailjs_private_key
            response = requests.post('https://api.emailjs.com/api/v1.0/email/send', json=payload_with_token, timeout=10)
            response.raise_for_status()
            print(f"✅ Password reset email sent via EmailJS (method 1) to {user.email}")
            print(f"📊 EmailJS Response Status: {response.status_code}")
            try:
                response_data = response.json() if response.text else {}
                print(f"📊 EmailJS Response Body: {response_data}")
            except:
                print(f"📊 EmailJS Response Text: {response.text[:200]}")
        except Exception as e1:
            print(f"⚠️ Password reset email (method 1 - body token) failed: {e1}")
            error_details = 'No response'
            if hasattr(e1, 'response') and e1.response is not None:
                try:
                    error_details = e1.response.text[:200]  # First 200 chars
                except:
                    error_details = str(e1.response.status_code)
            print(f"📊 EmailJS Error Response: {error_details}")

            # Method 2: accessToken as query parameter (fallback)
            try:
                print(f"🔄 Trying EmailJS method 2 (query param token)...")
                response = requests.post(
                    'https://api.emailjs.com/api/v1.0/email/send',
                    json=payload,
                    params={'accessToken': emailjs_private_key},
                    timeout=10
                )
                response.raise_for_status()
                print(f"✅ Password reset email sent via EmailJS (method 2) to {user.email}")
                print(f"📊 EmailJS Response Status: {response.status_code}")
                try:
                    response_data = response.json() if response.text else {}
                    print(f"📊 EmailJS Response Body: {response_data}")
                except:
                    print(f"📊 EmailJS Response Text: {response.text[:200]}")
            except Exception as e2:
                error_details = 'No response'
                if hasattr(e2, 'response') and e2.response is not None:
                    try:
                        error_details = e2.response.text[:200]  # First 200 chars
                    except:
                        error_details = str(e2.response.status_code)
                print(f"❌ EmailJS error (both methods failed): {e2}. Response: {error_details}. Falling back to Django send_mail.")
                # Fallback to Django's send_mail
                subject = 'Reset your password'
                message = (
                    f'Hi {user.username},\n\n'
                    f'We received a request to reset your password. Click the link below to set a new one:\n'
                    f'{reset_link}\n\n'
                    f'If you did not request this, you can safely ignore this email.\n\n'
                    f'Thanks,\nThe AgentCreator Team'
                )
                send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
                print(f"✅ Password reset email sent via Django send_mail fallback to {user.email}")
        return

    # Fallback to Django send_mail if EmailJS is not configured
    print(f"⚠️ EmailJS not configured, using Django send_mail fallback")
    subject = 'Reset your password'
    message = (
        f'Hi {user.username},\n\n'
        f'We received a request to reset your password. Click the link below to set a new one:\n'
        f'{reset_link}\n\n'
        f'If you did not request this, you can safely ignore this email.\n\n'
        f'Thanks,\nThe AgentCreator Team'
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)
    print(f"✅ Password reset email sent via Django send_mail to {user.email}")


@extend_schema(
    tags=['auth'],
    operation_id='auth_email_verify_resend',
    summary='Resend email verification',
    description='Resends the email verification link to the authenticated user\'s email address. The email address is automatically retrieved from the authenticated user account (request.user.email), so no email parameter or request body is required. This endpoint uses the user from the authentication token (JWT in HttpOnly cookie). A new verification token is generated and sent to the user\'s email address via EmailJS (if configured) or Django send_mail. The verification link expires after a set period and can only be used once.',
    responses={
        200: OpenApiResponse(
            response=EmailVerificationResendResponseSerializer,
            description='Verification email sent successfully to the authenticated user\'s email address',
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'detail': 'Verification email sent.'
                    },
                    response_only=True,
                    status_codes=['200']
                )
            ]
        ),
        401: OpenApiResponse(description='Authentication required. User must be logged in with valid JWT token. The email address is taken from the authenticated user account.')
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def resend_email_verification(request):
    _send_email_verification(request, request.user)
    return Response({'detail': 'Verification email sent.'})

# Public endpoint for resending email verification (no auth required)
@extend_schema(
    tags=['auth'],
    operation_id='auth_email_verify_resend_public',
    summary='Resend email verification (public)',
    description='Public endpoint to resend email verification link. Does not require authentication. Accepts an email address in the request body.',
    request={'application/json': {'type': 'object', 'properties': {'email': {'type': 'string', 'format': 'email'}}, 'required': ['email']}},
    responses={
        200: OpenApiResponse(
            response=EmailVerificationResendResponseSerializer,
            description='Verification email sent if the email exists in the system',
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={
                        'detail': 'If this email is registered, a verification link has been sent.'
                    },
                    response_only=True,
                    status_codes=['200']
                )
            ]
        ),
        400: OpenApiResponse(description='Invalid email format')
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
def resend_email_verification_public(request):
    from django.contrib.auth import get_user_model

    User = get_user_model()

    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=400)

    # Always return success to prevent email enumeration
    # But only send email if user exists
    try:
        user = User.objects.get(email=email)
        # Generate new verification token
        new_token = str(uuid.uuid4())
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.verification_token = new_token
        profile.verification_token_created_at = timezone.now()
        profile.save()
        # Send email with new token
        _send_email_verification_with_token(request, user, new_token)
        print(f"✅ New verification email sent to {user.email} with token: {new_token[:8]}...")
    except User.DoesNotExist:
        # Don't reveal if email exists or not
        pass

    return Response({'detail': 'If this email is registered, a verification link has been sent.'})


@extend_schema(
    tags=['auth'],
    operation_id='auth_email_verify_confirm',
    responses={200: EmailVerificationConfirmResponseSerializer},
    description='Confirms email verification using uid and token from the verification link.',
    parameters=[
        OpenApiParameter(name='uid', type=OpenApiTypes.STR, location='query', required=True, description='Base64 user id'),
        OpenApiParameter(name='token', type=OpenApiTypes.STR, location='query', required=True, description='Verification token'),
    ]
)
@api_view(['GET'])
@permission_classes([AllowAny])
def email_verify_confirm(request):
    uidb64 = request.GET.get('uid')
    token = request.GET.get('token')

    # Frontend URL for redirect
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    verify_page_url = f"{frontend_url}/verify-email"

    if not uidb64 or not token:
        # Redirect to frontend with error
        from django.http import HttpResponseRedirect
        return HttpResponseRedirect(f"{verify_page_url}?status=error&message=Invalid verification link")

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (User.DoesNotExist, ValueError, TypeError):
        from django.http import HttpResponseRedirect
        return HttpResponseRedirect(f"{verify_page_url}?status=error&message=Invalid verification link")

    if not default_token_generator.check_token(user, token):
        from django.http import HttpResponseRedirect
        return HttpResponseRedirect(f"{verify_page_url}?status=error&message=Invalid or expired token")

    # Verify the email - update both EmailAddress and UserProfile
    EmailAddress.objects.update_or_create(
        user=user, email=user.email,
        defaults={'verified': True, 'primary': True}
    )

    # Mark user as verified in UserProfile
    profile, _ = UserProfile.objects.get_or_create(user=user)
    profile.is_verified = True
    profile.save()

    # Redirect to frontend with success
    from django.http import HttpResponseRedirect
    return HttpResponseRedirect(f"{verify_page_url}?status=success")


@extend_schema(
    tags=['auth'],
    operation_id='auth_verify_custom_token',
    summary='Verify email with custom token',
    description='Verifies user email using custom verification token stored in UserProfile. Accepts userId and token in request body.',
    request={'application/json': {
        'type': 'object',
        'properties': {
            'userId': {'type': 'string', 'description': 'Base64 encoded user ID'},
            'token': {'type': 'string', 'description': 'Verification token (UUID)'}
        },
        'required': ['userId', 'token']
    }},
    responses={
        200: OpenApiResponse(
            description='Email verified successfully',
            examples=[
                OpenApiExample(
                    'Success Response',
                    value={'detail': 'Email verified successfully', 'user': {'id': 'uuid', 'username': 'user', 'email': 'user@example.com', 'is_verified': True}},
                    response_only=True
                )
            ]
        ),
        400: OpenApiResponse(description='Invalid or expired token'),
        404: OpenApiResponse(description='User not found')
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
def verify_email_with_token(request):
    """Verify email using custom token from UserProfile"""
    from django.utils.http import urlsafe_base64_decode
    from django.utils.encoding import force_str
    from datetime import timedelta
    from django.utils import timezone

    userId = request.data.get('userId')
    token = request.data.get('token')

    if not userId or not token:
        return Response({'error': 'Missing userId or token'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Decode user ID
        uid = force_str(urlsafe_base64_decode(userId))
        User = get_user_model()
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({'error': 'Invalid user ID'}, status=status.HTTP_404_NOT_FOUND)

    # Get user profile and check token
    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        return Response({'error': 'User profile not found'}, status=status.HTTP_404_NOT_FOUND)

    # Check if token matches
    if profile.verification_token != token:
        return Response({'error': 'Invalid verification token'}, status=status.HTTP_400_BAD_REQUEST)

    # Check if token has expired (optional: 24 hours expiry)
    if profile.verification_token_created_at:
        token_age = timezone.now() - profile.verification_token_created_at
        if token_age > timedelta(hours=24):
            return Response({'error': 'Verification token has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

    # Mark user as verified
    profile.is_verified = True
    profile.verification_token = None  # Clear the token after use
    profile.verification_token_created_at = None
    profile.save()

    # Also update EmailAddress if using django-allauth
    EmailAddress.objects.filter(user=user, email=user.email).update(verified=True)

    print(f"✅ Email verified for user: {user.username}")

    # Return success with user data
    return Response({
        'detail': 'Email verified successfully',
        'user': {
            'id': str(user.id),
            'username': user.username,
            'email': user.email,
            'is_verified': True
        }
    }, status=status.HTTP_200_OK)
