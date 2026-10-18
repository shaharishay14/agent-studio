"""
Credit System Utilities
------------------------
Provides decorators and helper functions for managing user credits.
"""
from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from ..credits.models import UsageLog


# Credit costs for different actions
CREDIT_COSTS = {
    'message': 1,  # Cost per chat message
    'tool_call': 0,  # Tool calls are free for now
}


def log_credit_usage(user, credits_used, action_type='message', agent=None, description='', metadata=None):
    """
    Log credit usage to the database.

    Args:
        user: User instance
        credits_used: Number of credits used (positive) or added (negative)
        action_type: Type of action ('message', 'tool_call', 'admin_add', 'purchase')
        agent: Optional Agent instance
        description: Optional description
        metadata: Optional dict of additional data
    """
    UsageLog.objects.create(
        user=user,
        agent=agent,
        action_type=action_type,
        credits_used=credits_used,
        credits_remaining=user.total_credits,
        description=description,
        metadata=metadata or {}
    )


def check_credits(required_credits=1):
    """
    Decorator to check if user has sufficient credits before executing a view.
    Returns 402 Payment Required if insufficient credits.

    Usage:
        @check_credits(required_credits=1)
        def my_view(request):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user = request.user

            # Check if user is authenticated
            if not user.is_authenticated:
                return Response(
                    {'error': 'Authentication required'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

            # Check if user has enough credits
            if not user.has_credits(required_credits):
                return Response(
                    {
                        'error': 'Insufficient credits',
                        'detail': f'This action requires {required_credits} credit(s). You have {user.total_credits} credit(s) remaining.',
                        'credits_required': required_credits,
                        'credits_remaining': user.total_credits
                    },
                    status=status.HTTP_402_PAYMENT_REQUIRED
                )

            # Execute the view
            return view_func(request, *args, **kwargs)

        return wrapper
    return decorator


def deduct_credits_for_message(user, agent=None, message_content=''):
    """
    Deduct credits for a chat message and log it.

    Args:
        user: User instance
        agent: Optional Agent instance
        message_content: Optional message content for metadata

    Returns:
        bool: True if successful, False if insufficient credits
    """
    credits_to_deduct = CREDIT_COSTS['message']

    try:
        user.deduct_credits(credits_to_deduct)

        # Log the usage
        log_credit_usage(
            user=user,
            credits_used=credits_to_deduct,
            action_type='message',
            agent=agent,
            description=f'Chat message to {agent.name if agent else "agent"}',
            metadata={
                'message_length': len(message_content),
                'agent_id': str(agent.id) if agent else None,
                'agent_name': agent.name if agent else None
            }
        )

        return True
    except ValueError:
        return False


def add_credits(user, amount, action_type='admin_add', description=''):
    """
    Add credits to a user's account and log it.

    Args:
        user: User instance
        amount: Number of credits to add
        action_type: Type of credit addition ('admin_add', 'purchase')
        description: Description of why credits were added
    """
    user.add_credits(amount)

    # Log with negative credits_used to indicate addition
    log_credit_usage(
        user=user,
        credits_used=-amount,
        action_type=action_type,
        description=description,
        metadata={'credits_added': amount}
    )


def get_user_credit_summary(user):
    """
    Get a summary of user's credit usage.

    Returns:
        dict: Summary with total_credits, credits_used, recent_usage
    """
    recent_logs = UsageLog.objects.filter(user=user)[:10]

    return {
        'total_credits': user.total_credits,
        'credits_used': user.credits_used,
        'recent_usage': [
            {
                'action_type': log.action_type,
                'credits': log.credits_used,
                'description': log.description,
                'created_at': log.created_at.isoformat(),
                'agent_name': log.agent.name if log.agent else None
            }
            for log in recent_logs
        ]
    }
