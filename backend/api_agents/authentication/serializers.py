from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    agent_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'agent_count', 'total_credits', 'credits_used']
        read_only_fields = ['total_credits', 'credits_used']

    def get_agent_count(self, obj) -> int:
        return obj.agents.count() if hasattr(obj, 'agents') else 0


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError("Passwords do not match")
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class RegistrationResponseSerializer(serializers.Serializer):
    user = UserSerializer()


class LoginRequestSerializer(serializers.Serializer):
    username = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    password = serializers.CharField()

    def validate(self, attrs):
        # Require either username or email
        if not attrs.get('username') and not attrs.get('email'):
            raise serializers.ValidationError("Provide either username or email.")
        return attrs


class LoginResponseSerializer(serializers.Serializer):
    user = UserSerializer()


class LogoutResponseSerializer(serializers.Serializer):
    message = serializers.CharField()


class GoogleLoginRequestSerializer(serializers.Serializer):
    access_token = serializers.CharField(required=False, help_text="Google access token or ID token")
    id_token = serializers.CharField(required=False, help_text="Google ID token (JWT)")
    code = serializers.CharField(required=False, help_text="Authorization code from Google OAuth (for auth-code flow)")
    code_verifier = serializers.CharField(required=False, help_text="PKCE code verifier (if using PKCE)")


class OAuthLoginResponseSerializer(serializers.Serializer):
    user = UserSerializer()


class GitHubLoginRequestSerializer(serializers.Serializer):
    code = serializers.CharField(required=False)
    access_token = serializers.CharField(required=False)


class EmailVerificationResendResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()


class EmailVerificationConfirmResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()


class TokenRefreshCookieResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetRequestResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()


class PasswordResetConfirmRequestSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords do not match")
        return attrs


class PasswordResetConfirmResponseSerializer(serializers.Serializer):
    detail = serializers.CharField()
