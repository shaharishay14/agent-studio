"""
Credit management views.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiExample

from ..authentication.models import User
from ..credits.models import UsageLog
from ..credits.serializers import (
    CreditBalanceSerializer,
    UsageLogSerializer,
    AddCreditsRequestSerializer,
    AddCreditsResponseSerializer
)


@extend_schema(
    tags=['credits'],
    operation_id='credits_balance',
    summary='Get current credit balance',
    responses=CreditBalanceSerializer,
    description='Get the current user\'s credit balance and refresh status. Automatically checks and refreshes credits if a month has passed.'
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def credit_balance(request):
    """
    Get the current user's credit balance.
    Also checks and refreshes credits if a month has passed.
    """
    # Check and refresh credits if needed
    request.user.check_and_refresh_credits()
    # Refresh the user object to get updated values
    request.user.refresh_from_db()

    return Response({
        'total_credits': request.user.total_credits,
        'credits_used': request.user.credits_used,
        'credit_refresh_date': request.user.credit_refresh_date,
        'next_refresh_date': request.user.get_next_refresh_date()
    })


@extend_schema(
    tags=['credits'],
    operation_id='credits_usage_history',
    summary='Get credit usage history',
    responses=UsageLogSerializer(many=True),
    examples=[
        OpenApiExample(
            'Success Response',
            value=[
                {
                    'id': 1,
                    'action_type': 'message',
                    'action_type_display': 'Chat Message',
                    'credits_used': 1,
                    'credits_remaining': 99,
                    'description': 'Chat message to Email Assistant',
                    'metadata': {
                        'message_length': 45,
                        'agent_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                        'agent_name': 'Email Assistant'
                    },
                    'agent_name': 'Email Assistant',
                    'created_at': '2025-11-26T10:30:00Z'
                },
                {
                    'id': 2,
                    'action_type': 'admin_add',
                    'action_type_display': 'Admin Credit Addition',
                    'credits_used': -50,
                    'credits_remaining': 100,
                    'description': 'Welcome bonus',
                    'metadata': {'credits_added': 50},
                    'agent_name': None,
                    'created_at': '2025-11-26T10:00:00Z'
                }
            ],
            response_only=True,
            status_codes=['200']
        )
    ],
    description='Returns the user\'s credit usage history, showing all transactions including messages sent, credits added, etc. Ordered by most recent first. Returns last 50 transactions.\n\n**Note:** Negative `credits_used` values indicate credits were added (not deducted).'
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def credit_usage_history(request):
    """Get the user's credit usage history"""
    logs = UsageLog.objects.filter(user=request.user)[:50]  # Last 50 transactions
    serializer = UsageLogSerializer(logs, many=True)
    return Response(serializer.data)


@extend_schema(
    tags=['credits'],
    operation_id='credits_add',
    summary='Add credits to a user (Admin only)',
    request=AddCreditsRequestSerializer,
    responses=AddCreditsResponseSerializer,
    examples=[
        OpenApiExample(
            'Request Example',
            value={
                'user_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                'amount': 50,
                'description': 'Welcome bonus'
            },
            request_only=True
        ),
        OpenApiExample(
            'Success Response',
            value={
                'message': 'Successfully added 50 credits to user john',
                'user_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                'credits_added': 50,
                'new_balance': 150
            },
            response_only=True,
            status_codes=['200']
        )
    ],
    description='Add credits to a user account. This endpoint is restricted to admin users only (staff/superuser). Regular users cannot add credits to their own or other accounts.\n\n**Request Body:**\n- `user_id`: UUID of the user to credit\n- `amount`: Number of credits to add (minimum 1)\n- `description`: Optional reason for adding credits'
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_credits(request):
    """Add credits to a user (admin only)"""
    # Check if user is staff/admin
    if not request.user.is_staff:
        return Response(
            {'error': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = AddCreditsRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user_id = serializer.validated_data['user_id']
    amount = serializer.validated_data['amount']
    description = serializer.validated_data.get('description', 'Admin credit addition')

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Add credits
    from ..credits import add_credits as add_credits_util
    add_credits_util(user, amount, action_type='admin_add', description=description)

    return Response({
        'message': f'Successfully added {amount} credits to user {user.username}',
        'user_id': str(user.id),
        'credits_added': amount,
        'new_balance': user.total_credits
    })
