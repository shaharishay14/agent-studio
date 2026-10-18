"""
Messaging channel views for Telegram and WhatsApp integration.
"""
import traceback
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample

from ..agents.models import Agent, ChatMessage
from ..messaging.models import MessagingChannel, MessagingSession
from ..messaging.serializers import (
    MessagingChannelSerializer,
    ConnectTelegramBotSerializer,
    DisconnectMessagingChannelSerializer
)
from ..agents.services.agent_service import AgentService
from .. import serializers


@extend_schema(
    tags=['messaging'],
    operation_id='messaging_connect_telegram',
    summary='Connect Telegram bot to agent',
    request=ConnectTelegramBotSerializer,
    responses=MessagingChannelSerializer,
    description='Connect a Telegram bot to an agent by providing the bot token. The webhook will be automatically set up.'
)
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def connect_telegram_bot(request, agent_id):
    """Connect a Telegram bot to an agent"""
    from ..messaging.telegram_utils import verify_bot_token, set_webhook, TelegramAPIError

    try:
        # Get the agent
        agent = Agent.objects.get(id=agent_id, user=request.user)

        # Validate request data
        serializer = ConnectTelegramBotSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        bot_token = serializer.validated_data['bot_token']

        # Verify the bot token with Telegram API
        try:
            bot_info = verify_bot_token(bot_token)
        except TelegramAPIError as e:
            return Response(
                {'error': f'Invalid bot token: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if channel already exists
        channel, created = MessagingChannel.objects.get_or_create(
            agent=agent,
            platform='telegram',
            defaults={
                'bot_token': bot_token,
                'bot_username': bot_info.get('username', ''),
                'status': 'active'
            }
        )

        if not created:
            # Update existing channel
            channel.bot_token = bot_token
            channel.bot_username = bot_info.get('username', '')
            channel.status = 'active'
            channel.last_error = ''
            channel.save()

        # Set webhook URL (always use HTTPS for production)
        host = request.get_host()
        # Force HTTPS for webhook (Telegram requires HTTPS)
        webhook_url = f"https://{host}/api/messaging/telegram/webhook/{agent_id}/"

        try:
            set_webhook(bot_token, webhook_url)
            channel.webhook_url = webhook_url
            channel.save()
        except TelegramAPIError as e:
            channel.status = 'error'
            channel.last_error = str(e)
            channel.save()
            return Response(
                {'error': f'Failed to set webhook: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            MessagingChannelSerializer(channel).data,
            status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED
        )

    except Agent.DoesNotExist:
        return Response(
            {'error': 'Agent not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        traceback.print_exc()
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    tags=['messaging'],
    operation_id='messaging_disconnect',
    summary='Disconnect messaging channel from agent',
    request=serializers.DisconnectMessagingChannelSerializer,
    responses={200: OpenApiResponse(description='Channel disconnected successfully')},
    examples=[
        OpenApiExample(
            'Request Example',
            value={'platform': 'telegram'},
            request_only=True
        ),
        OpenApiExample(
            'Success Response',
            value={'message': 'Telegram channel disconnected successfully'},
            response_only=True,
            status_codes=['200']
        )
    ],
    description='Disconnect a messaging channel (Telegram or WhatsApp) from an agent. This will delete the webhook and remove the connection.'
)
@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disconnect_messaging_channel(request, agent_id):
    """Disconnect a messaging channel from an agent"""
    from ..messaging.telegram_utils import delete_webhook

    try:
        agent = Agent.objects.get(id=agent_id, user=request.user)

        serializer = DisconnectMessagingChannelSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        platform = serializer.validated_data['platform']

        try:
            channel = MessagingChannel.objects.get(agent=agent, platform=platform)

            # Delete webhook if Telegram
            if platform == 'telegram' and channel.bot_token:
                delete_webhook(channel.bot_token)

            # Delete the channel and all sessions
            channel.delete()

            return Response(
                {'message': f'{platform.capitalize()} channel disconnected successfully'},
                status=status.HTTP_200_OK
            )

        except MessagingChannel.DoesNotExist:
            return Response(
                {'error': f'No {platform} channel found for this agent'},
                status=status.HTTP_404_NOT_FOUND
            )

    except Agent.DoesNotExist:
        return Response(
            {'error': 'Agent not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        traceback.print_exc()
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    tags=['messaging'],
    operation_id='messaging_channels_list',
    summary='Get messaging channels for agent',
    responses=serializers.MessagingChannelSerializer(many=True),
    description='Get all connected messaging channels (Telegram, WhatsApp) for an agent'
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messaging_channels(request, agent_id):
    """Get all messaging channels for an agent"""
    try:
        agent = Agent.objects.get(id=agent_id, user=request.user)
        channels = MessagingChannel.objects.filter(agent=agent)
        return Response(
            MessagingChannelSerializer(channels, many=True).data,
            status=status.HTTP_200_OK
        )

    except Agent.DoesNotExist:
        return Response(
            {'error': 'Agent not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@csrf_exempt  # Telegram webhook can't provide CSRF token
@api_view(['POST'])
@permission_classes([AllowAny])  # Telegram webhook doesn't use auth
def telegram_webhook(request, agent_id):
    """
    Webhook endpoint for receiving Telegram messages.
    Called by Telegram when users send messages to the bot.
    """
    from ..messaging.telegram_utils import send_message, send_typing_action, TelegramAPIError
    from ..credits import deduct_credits_for_message

    try:
        # Get the channel
        try:
            channel = MessagingChannel.objects.select_related('agent', 'agent__user').get(
                agent_id=agent_id,
                platform='telegram',
                status='active'
            )
        except MessagingChannel.DoesNotExist:
            return Response({'error': 'Channel not found'}, status=status.HTTP_404_NOT_FOUND)

        agent = channel.agent
        bot_token = channel.bot_token

        # Parse Telegram update
        update = request.data

        # Extract message data
        message = update.get('message', {})
        if not message:
            # Not a message update, ignore
            return Response({'ok': True})

        chat_id = str(message.get('chat', {}).get('id'))
        user_id = str(message.get('from', {}).get('id'))
        username = message.get('from', {}).get('username', '')
        text = message.get('text', '')

        if not chat_id or not text:
            return Response({'ok': True})

        # Get or create session
        session, _ = MessagingSession.objects.get_or_create(
            channel=channel,
            external_user_id=user_id,
            defaults={
                'external_chat_id': chat_id,
                'external_username': username,
                'is_active': True
            }
        )

        # Update session
        session.external_chat_id = chat_id
        session.external_username = username
        session.message_count += 1
        session.save()

        # Save user message to chat history
        ChatMessage.objects.create(
            agent=agent,
            role='user',
            content=text
        )

        # Check if user has credits (deduct 1 credit per message)
        if not agent.user.has_credits(1):
            # Send error message to user
            try:
                send_message(
                    bot_token,
                    chat_id,
                    "⚠️ Agent owner has insufficient credits. Please contact them to add more credits."
                )
            except:
                pass
            return Response({'ok': True})

        # Show typing indicator
        send_typing_action(bot_token, chat_id)

        # Process message with agent
        agent_service = AgentService(agent.user)

        # Get chat history for context
        previous_messages = ChatMessage.objects.filter(agent=agent).order_by('-created_at')[:10]
        chat_history = [
            {"role": msg.role, "content": msg.content}
            for msg in reversed(list(previous_messages))
        ]

        # Generate response using async chat methods
        import asyncio

        async def generate_response():
            # Determine which tools are available
            has_composio_tools = bool(agent.app_connections)
            has_agent_tools = bool(agent.agent_tools)

            if has_composio_tools and has_agent_tools:
                # Get Composio tool slugs
                specific_tools_slugs = await agent_service.select_tools_for_prompt(text, agent.app_connections)
                return await agent_service._chat_with_mixed_tools(
                    agent_model=agent,
                    message=text,
                    composio_tool_slugs=specific_tools_slugs,
                    chat_history=chat_history
                )
            elif has_composio_tools:
                specific_tools_slugs = await agent_service.select_tools_for_prompt(text, agent.app_connections)
                return await agent_service._chat_with_composio(
                    agent_model=agent,
                    message=text,
                    specific_tools_slugs=specific_tools_slugs,
                    chat_history=chat_history
                )
            elif has_agent_tools:
                return await agent_service._chat_with_agent_tools(
                    agent_model=agent,
                    message=text,
                    chat_history=chat_history
                )
            else:
                return await agent_service._chat_without_tools(
                    agent_model=agent,
                    message=text,
                    chat_history=chat_history
                )

        response_content = asyncio.run(generate_response())

        # Save assistant response
        ChatMessage.objects.create(
            agent=agent,
            role='assistant',
            content=response_content
        )

        # Send response to Telegram
        try:
            send_message(bot_token, chat_id, response_content)

            # Deduct credits
            deduct_credits_for_message(
                user=agent.user,
                agent=agent,
                message_content=text
            )

            # Update channel stats
            channel.message_count += 1
            channel.last_message_at = timezone.now()
            channel.save()

        except TelegramAPIError as e:
            # Log error but don't fail the webhook
            channel.status = 'error'
            channel.last_error = str(e)
            channel.save()

        return Response({'ok': True})

    except Exception as e:
        traceback.print_exc()
        # Always return 200 to Telegram to avoid retries
        return Response({'ok': True})
