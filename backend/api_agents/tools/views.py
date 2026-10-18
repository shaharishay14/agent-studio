from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from django.utils import timezone
import traceback

from ..tools.models import ComposioConnection
from ..agents.models import Agent, ChatMessage
from ..agents.services.agent_service import AgentService
from .composio_config import APP_SLUGS, APP_METADATA, TOP_SLUGS_BY_APP
from ..agents.tools_config import AGENT_TOOLS, get_all_tool_names, is_valid_tool
from ..tools.serializers import ComposioConnectionSerializer
from ..serializers import (
    ConnectionCreateRequestSerializer, ConnectionAuthResponseSerializer,
    DisconnectResponseSerializer, AvailableToolsResponseSerializer,
    AppConnectionDisplaySerializer
)


@extend_schema_view(
    list=extend_schema(
        tags=['connections'],
        description='Composio connections API. Security & scoping: All endpoints require authentication (IsAuthenticated). The request is authenticated via your configured auth (e.g., JWT in HttpOnly cookies). DRF authenticators verify the token, load the user, and set request.user. Every query is scoped with get_queryset() to request.user, so users can only list/retrieve/delete their own connections.',
    ),
    retrieve=extend_schema(
        tags=['connections'],
        description='Composio connections API. Security & scoping: All endpoints require authentication (IsAuthenticated). The request is authenticated via your configured auth (e.g., JWT in HttpOnly cookies). DRF authenticators verify the token, load the user, and set request.user. Every query is scoped with get_queryset() to request.user, so users can only list/retrieve/delete their own connections. The {id} path param refers to the local primary key of the ComposioConnection row (not the external Composio connection id).',
        parameters=[
            OpenApiParameter(name='id', type=OpenApiTypes.INT, location='path', description='Connection ID (integer)')
        ]
    ),
    destroy=extend_schema(
        tags=['connections'],
        description='Composio connections API. Security & scoping: All endpoints require authentication (IsAuthenticated). The request is authenticated via your configured auth (e.g., JWT in HttpOnly cookies). DRF authenticators verify the token, load the user, and set request.user. Every query is scoped with get_queryset() to request.user, so users can only list/retrieve/delete their own connections. The {id} path param refers to the local primary key of the ComposioConnection row (not the external Composio connection id).',
        parameters=[
            OpenApiParameter(name='id', type=OpenApiTypes.INT, location='path', description='Connection ID (integer)')
        ]
    ),
)
class ComposioConnectionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing Composio tool connections.
    """
    serializer_class = ComposioConnectionSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        """
        Ensures users can only see their own active connections.
        Excludes pending_auth (OAuth not completed) and soft-deleted connections.
        """
        return ComposioConnection.objects.filter(
            user=self.request.user,
            is_active=True,
            deleted_at__isnull=True
        )

    def perform_create(self, serializer):
        """
        Associates the connection with the current user.
        """
        serializer.save(user=self.request.user)

    @extend_schema(
        operation_id='connections_create',
        request=ConnectionCreateRequestSerializer,
        responses={
            201: OpenApiResponse(response=ConnectionAuthResponseSerializer, description='Created and initialized auth flow'),
            200: OpenApiResponse(response=ConnectionAuthResponseSerializer, description='Updated existing pending connection and returned auth URL'),
            400: OpenApiResponse(description='Validation or Composio error'),
            401: OpenApiResponse(description='Authentication credentials were not provided or are invalid'),
            500: OpenApiResponse(description='Unexpected server error'),
        },
        description='Starts Composio auth and upserts a local connection. **Authentication required.** Flow: (1) Authenticates user (returns 401 if not authenticated). (2) Reads tool_name and optional redirect_url from body (WhatsApp may include waba_id, phone_number_id). (3) Calls AgentService.authenticate_tool(tool_name, ...), which contacts Composio and returns auth_url and auth_config_id. The redirect_url (if provided) specifies where the user will be redirected after completing OAuth - this allows seamless return to the originating page. (4) Upserts a local ComposioConnection for request.user with is_active=False and metadata.status="pending_auth". (5) Returns { success, auth_url, connection }. Security: Authentication enforced via IsAuthenticated permission. User context is always derived from the verified token, never from request body. Status codes: 201 if a new local record was created, 200 if an existing record was updated.'
    )
    def create(self, request, *args, **kwargs):
        """
        Starts the Composio auth flow and upserts a local connection record.
        Returns the auth_url and the local connection.

        Optional: If agent_id is provided, automatically adds the tool to that agent's app_connections.
        """
        tool_name = request.data.get('tool_name')
        redirect_url = request.data.get('redirect_url')  # Optional: where to redirect after OAuth
        agent_id = request.data.get('agent_id')  # Optional: agent to auto-connect tool

        print(f"🔌 Connection request received")
        print(f"   Tool name (raw): {tool_name}")
        print(f"   Redirect URL: {redirect_url}")
        print(f"   Agent ID: {agent_id}")
        print(f"   Request data: {request.data}")

        if not tool_name:
            return Response(
                {'error': 'tool_name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Normalize tool name: remove spaces and convert to uppercase
        # "Google Calendar" -> "GOOGLECALENDAR"
        # "Gmail" -> "GMAIL"
        tool_name = str(tool_name).replace(' ', '').upper()
        print(f"   Tool name (normalized): {tool_name}")

        try:
            additional_fields = {}

            # Special handling for WhatsApp optional fields
            if str(tool_name).upper() == 'WHATSAPP':
                waba_id = request.data.get('waba_id')
                phone_number_id = request.data.get('phone_number_id')

                if waba_id: additional_fields['waba_id'] = waba_id
                if phone_number_id: additional_fields['phone_number_id'] = phone_number_id

            agent_service = AgentService(request.user)
            result = agent_service.authenticate_tool(
                tool_name,
                additional_fields if additional_fields else None,
                redirect_url=redirect_url
            )

            # Note: Ghost connection auto-cleanup has been disabled
            # If you get "Multiple connected accounts" error, manually delete the old connection from Composio dashboard

            if result.get('success'):
                metadata = {}
                if additional_fields:
                    metadata['additional_fields'] = additional_fields

                # Save or update the local connection as pending until OAuth completes
                connection, created = ComposioConnection.objects.update_or_create(
                    user=request.user,
                    tool_name=str(tool_name).upper(),
                    defaults={
                        'is_active': False,
                        'auth_config_id': result.get('auth_config_id', ''),
                        'deleted_at': None,  # Clear soft-delete flag on reconnection
                        'metadata': {
                            **metadata,
                            'status': 'pending_auth'
                        }
                    }
                )

                # Optional: Auto-connect tool to specified agent
                agent_updated = False
                if agent_id:
                    try:
                        from api_agents.agents.models import Agent
                        agent = Agent.objects.filter(
                            user=request.user,
                            id=agent_id
                        ).first()

                        if agent:
                            normalized_tool = str(tool_name).upper()
                            # Add tool to agent's app_connections if not already present
                            if normalized_tool not in agent.app_connections:
                                agent.app_connections.append(normalized_tool)
                                agent.save(update_fields=['app_connections'])
                                agent_updated = True
                                print(f"✅ Auto-connected {normalized_tool} to agent {agent.name} (ID: {agent_id})")
                            else:
                                print(f"ℹ️  {normalized_tool} already connected to agent {agent.name}")
                        else:
                            print(f"⚠️  Agent with ID {agent_id} not found for user {request.user.username}")
                    except Exception as e:
                        print(f"⚠️  Failed to auto-connect tool to agent: {str(e)}")
                        # Don't fail the entire request if agent update fails
                        traceback.print_exc()

                resp_data = {
                    'success': True,
                    'auth_url': result.get('auth_url'),
                    'connection': ComposioConnectionSerializer(connection).data,
                    'agent_updated': agent_updated  # Indicate if agent was updated
                }
                return Response(resp_data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            else:
                # Log the full error for debugging
                print(f"❌ Connection failed for {tool_name}")
                print(f"   Error details: {result}")
                return Response(result, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        operation_id='connections_destroy',
        parameters=[
            OpenApiParameter(
                name='id',
                type=int,
                location=OpenApiParameter.PATH,
                description='The database ID of the connection to delete. **Important:** You can only delete connections that belong to your authenticated account. The system automatically filters by user - attempting to delete another user\'s connection will return 404 (not found) even if that ID exists.',
                required=True
            )
        ],
        responses={
            200: OpenApiResponse(response=DisconnectResponseSerializer, description='Disconnected from Composio and deleted local record'),
            401: OpenApiResponse(description='Authentication credentials were not provided or are invalid'),
            404: OpenApiResponse(description='Connection not found or not owned by user'),
            500: OpenApiResponse(description='Unexpected server error'),
        },
        description='Disconnects a tool connection. **Authentication required.** Flow: (1) Authenticates user (returns 401 if not authenticated). (2) Looks up the connection by {id} - only returns connections owned by authenticated user (returns 404 if not found or not owned). (3) Disconnects from Composio using AgentService.disconnect_tool(). (4) Deletes the entire local database record (all fields). Security: Authentication is enforced via IsAuthenticated permission class. User scope filtering is enforced via get_queryset() - users can only delete their own connections. The {id} parameter must be from your own connections list (GET /api/connections/).'
    )
    def destroy(self, request, *args, **kwargs):
        """
        Disconnects from Composio and soft-deletes the local connection record.
        Authentication is required and users can only delete their own connections.

        Uses soft delete (sets deleted_at timestamp) to prevent immediate recreation
        by the available_tools sync endpoint if Composio API has a delay.
        """
        # get_object() automatically filters by user via get_queryset() and returns 404 if not found/not owned
        instance = self.get_object()
        tool_name = instance.tool_name
        connection_id = instance.id

        try:
            # Attempt to disconnect from Composio
            agent_service = AgentService(request.user)
            composio_result = agent_service.disconnect_tool(tool_name)

            # Soft delete: mark as deleted and inactive instead of hard deleting
            # This prevents available_tools from immediately recreating it if Composio sync has a delay
            instance.deleted_at = timezone.now()
            instance.is_active = False
            instance.save()

            # Cascade: Remove tool from all agents that have it connected
            from api_agents.agents.models import Agent
            affected_agents = Agent.objects.filter(
                user=request.user,
                app_connections__contains=[tool_name]
            )

            affected_count = 0
            for agent in affected_agents:
                # Remove tool from app_connections
                if tool_name in agent.app_connections:
                    agent.app_connections.remove(tool_name)

                    # Remove related action slugs from tools array
                    # Filter out any tool slugs that start with this tool name
                    agent.tools = [
                        tool for tool in agent.tools
                        if not tool.upper().startswith(f"{tool_name}_")
                    ]

                    agent.save(update_fields=['app_connections', 'tools'])
                    affected_count += 1
                    print(f"🔗 Removed {tool_name} from agent {agent.name} (ID: {agent.id})")

            return Response({
                'success': True,
                'message': f"Connection {connection_id} for {tool_name} has been disconnected",
                'composio_disconnect': composio_result,
                'affected_agents_count': affected_count
            }, status=status.HTTP_200_OK)

        except Exception as e:
            traceback.print_exc()
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        tags=['connections'],
        operation_id='connections_available_tools',
        summary='Get available tools with connection status',
        description=(
            'Returns all available tools that can be connected with their metadata and connection status. '
            '**Authentication required.** This endpoint automatically syncs connections from Composio API '
            '(ground truth) and returns the current connection status for each tool. '
            '\n\n'
            '**Behavior:**\n'
            '1. Fetches active connections from Composio API\n'
            '2. Updates local database with ground truth\n'
            '3. Preserves auth_config_id from initial OAuth flow\n'
            '4. Marks connections no longer in Composio as inactive\n'
            '5. Returns all available tools with is_active status and connection_id\n'
            '\n'
            '**Response fields:**\n'
            '- `is_active`: Boolean indicating if the tool is currently connected\n'
            '- `connection_id`: Database ID of the connection (null if not connected). Use this ID to delete the connection via DELETE /api/connections/{id}/\n'
            '\n'
            '**Side effects:** Writes to database (updates connection status)\n'
            '\n'
            '**Use case:** Call this endpoint when user visits the integrations page to display '
            'all available tools with real-time connection status. This replaces the need to call '
            'check_connections separately.'
        ),
        parameters=[],
        responses={
            200: OpenApiResponse(
                response=AvailableToolsResponseSerializer,
                description='List of all available tools with metadata and connection status',
                examples=[
                    OpenApiExample(
                        'Available Tools with Connection Status',
                        value={
                            'tools': [
                                {
                                    'tool_name': 'GMAIL',
                                    'name': 'Gmail',
                                    'description': 'Send, receive, and manage emails with Gmail integration',
                                    'category': 'communication',
                                    'is_active': True,
                                    'connection_id': 42
                                },
                                {
                                    'tool_name': 'GOOGLEDRIVE',
                                    'name': 'Google Drive',
                                    'description': 'Upload, download, and manage files in Google Drive',
                                    'category': 'productivity',
                                    'is_active': False,
                                    'connection_id': None
                                },
                                {
                                    'tool_name': 'SLACK',
                                    'name': 'Slack',
                                    'description': 'Send messages and manage Slack workspace communications',
                                    'category': 'messaging',
                                    'is_active': True,
                                    'connection_id': 87
                                },
                                {
                                    'tool_name': 'TWITTER',
                                    'name': 'Twitter',
                                    'description': 'Post tweets, manage followers, and interact on Twitter',
                                    'category': 'social',
                                    'is_active': False,
                                    'connection_id': None
                                }
                            ],
                            'count': 18
                        },
                        response_only=True,
                        status_codes=['200']
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication credentials not provided or invalid'),
            500: OpenApiResponse(description='Unexpected server error')
        }
    )
    @action(detail=False, methods=['get'])
    def available_tools(self, request):
        """
        Returns the list of available tools with metadata from composio_config.py.
        Each tool object contains name, description, category, and connection status.

        Automatically syncs connections from Composio and returns is_active status.
        Authentication required.
        """
        try:
            # Sync connections from Composio (check_connections logic)
            user_connections = {}
            try:
                # Call check_connections logic internally
                agent_service = AgentService(request.user)
                connection_details = agent_service.get_connection_details()

                # Update database with ground truth from Composio
                entity_id = f"user_{request.user.id}"

                for conn_detail in connection_details:
                    # Get existing connection to preserve auth_config_id
                    existing_conn = ComposioConnection.objects.filter(
                        user=request.user,
                        tool_name=conn_detail['tool_name'].upper()
                    ).first()

                    # Skip if this connection was soft-deleted by user
                    # Don't recreate connections the user explicitly disconnected
                    if existing_conn and existing_conn.deleted_at:
                        print(f"⏭️  Skipping soft-deleted connection: {conn_detail['tool_name']}")
                        continue

                    defaults = {
                        'is_active': True,
                        'composio_connection_id': conn_detail.get('connection_id', ''),
                        'composio_entity_id': conn_detail.get('entity_id', entity_id),
                        'deleted_at': None,
                    }

                    # Preserve auth_config_id and clear pending_auth status
                    if existing_conn and existing_conn.auth_config_id:
                        defaults['auth_config_id'] = existing_conn.auth_config_id

                    # Update metadata to mark as connected
                    if existing_conn and existing_conn.metadata:
                        metadata = existing_conn.metadata.copy()
                        metadata['status'] = 'connected'
                        defaults['metadata'] = metadata
                    else:
                        defaults['metadata'] = {'status': 'connected'}

                    ComposioConnection.objects.update_or_create(
                        user=request.user,
                        tool_name=conn_detail['tool_name'].upper(),
                        defaults=defaults
                    )

                connected_tool_names = [c['tool_name'].upper() for c in connection_details]

                # Mark tools no longer in Composio as inactive
                ComposioConnection.objects.filter(
                    user=request.user
                ).exclude(
                    tool_name__in=connected_tool_names
                ).update(is_active=False)

                # Log connections in Composio that aren't in database (for debugging)
                # DO NOT delete - ghost cleanup in create() handles cleanup when needed
                print(f"🔍 Checking Composio connections sync status...")
                # Get active connections from database (our source of truth)
                db_active_connections = set(
                    ComposioConnection.objects.filter(
                        user=request.user,
                        is_active=True,
                        deleted_at__isnull=True
                    ).values_list('tool_name', flat=True)
                )
                print(f"📊 Active connections in database: {db_active_connections}")

                # Get ALL connections from Composio for this user (for sync logging)
                try:
                    all_composio_connections = agent_service.composio_client.connected_accounts.list()
                    if hasattr(all_composio_connections, 'items'):
                        all_composio_connections = all_composio_connections.items
                    elif hasattr(all_composio_connections, 'data'):
                        all_composio_connections = all_composio_connections.data
                    elif hasattr(all_composio_connections, '__iter__'):
                        all_composio_connections = list(all_composio_connections)

                    unsynced_count = 0
                    for conn in all_composio_connections:
                        # Check if this connection belongs to current user
                        conn_entity = None
                        if hasattr(conn, 'entityId'): conn_entity = conn.entityId
                        elif hasattr(conn, 'entity_id'): conn_entity = conn.entity_id
                        elif hasattr(conn, 'userId'): conn_entity = conn.userId
                        elif hasattr(conn, 'user_id'): conn_entity = conn.user_id

                        if conn_entity != entity_id:
                            continue  # Not this user's connection

                        # Get tool name
                        tool_name = "Unknown"
                        if hasattr(conn, 'toolkit') and conn.toolkit:
                            tool_name = getattr(conn.toolkit, 'slug', 'Unknown').upper()

                        # Get connection ID
                        conn_id = None
                        if hasattr(conn, 'id'): conn_id = conn.id
                        elif hasattr(conn, 'connectionId'): conn_id = conn.connectionId

                        # Log connections not in our database
                        # These will be synced if ACTIVE/ENABLED, or handled by ghost cleanup if causing issues
                        if tool_name != "Unknown" and tool_name not in db_active_connections:
                            # Check connection status for logging
                            conn_status = None
                            if hasattr(conn, 'status'): conn_status = conn.status
                            elif hasattr(conn, 'connectionStatus'): conn_status = conn.connectionStatus
                            elif hasattr(conn, 'connection_status'): conn_status = conn.connection_status

                            status_str = str(conn_status).upper() if conn_status else "UNKNOWN"

                            # Just log - don't delete
                            # Ghost connections are handled by auto-cleanup in create() when user gets "Multiple connected accounts" error
                            # INITIATED connections are harmless and deleting them causes race conditions during OAuth
                            print(f"ℹ️  Found {tool_name} connection (status: {status_str}) in Composio but not in DB - will sync if ACTIVE/ENABLED")
                            unsynced_count += 1

                    if unsynced_count == 0:
                        print(f"✅ Composio and database are in sync")
                    else:
                        print(f"ℹ️  Found {unsynced_count} connection(s) in Composio not yet in DB (may sync next)")

                except Exception as e:
                    print(f"⚠️  Could not check Composio sync status: {e}")

                # Build a map of tool_name -> connection info (is_active, connection_id)
                # Exclude soft-deleted connections from the active list
                connections = ComposioConnection.objects.filter(
                    user=request.user,
                    is_active=True,
                    deleted_at__isnull=True
                )
                user_connections = {conn.tool_name: {'is_active': True, 'connection_id': conn.id} for conn in connections}

            except Exception as e:
                # If connection sync fails, log it but continue with tool list
                traceback.print_exc()
                print(f"Failed to sync connections: {str(e)}")

            # Build tools list with connection status
            tools_list = []
            for app_key in sorted(APP_SLUGS.keys()):
                connection_info = user_connections.get(app_key, {'is_active': False, 'connection_id': None})
                tool_info = {
                    "tool_name": app_key,
                    "is_active": connection_info['is_active'],
                    "connection_id": connection_info['connection_id']
                }

                if app_key in APP_METADATA:
                    tool_info.update({
                        "name": APP_METADATA[app_key]["name"],
                        "description": APP_METADATA[app_key]["description"],
                        "category": APP_METADATA[app_key]["category"]
                    })
                else:
                    # Fallback for apps not in metadata
                    tool_info.update({
                        "name": app_key,
                        "description": f"Integration with {app_key}",
                        "category": "other"
                    })

                tools_list.append(tool_info)

            return Response({
                'tools': tools_list,
                'count': len(tools_list)
            })
        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        tags=['connections'],
        operation_id='connections_tool_slugs',
        summary='Get tool slugs for a specific tool',
        description=(
            'Returns the list of action slugs available for a specific tool. '
            '**Authentication required.** '
            '\n\n'
            'This endpoint retrieves the predefined list of tool slugs (actions) that are available '
            'for a given tool from the composio_config.py configuration. '
            '\n\n'
            '**Parameters:**\n'
            '- `tool_name` (query parameter): The name of the tool (e.g., "GMAIL", "GOOGLEDRIVE")\n'
            '\n'
            '**Returns:**\n'
            '- List of action slugs for the specified tool\n'
            '- Tool name that was queried\n'
            '- Count of slugs returned'
        ),
        parameters=[
            OpenApiParameter(
                name='tool_name',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='The name of the tool to get slugs for (e.g., GMAIL, GOOGLEDRIVE)',
                required=True
            )
        ],
        responses={
            200: OpenApiResponse(
                description='List of tool slugs',
                examples=[
                    OpenApiExample(
                        'Gmail Tool Slugs',
                        value={
                            'tool_name': 'GMAIL',
                            'slugs': [
                                'GMAIL_FETCH_EMAILS',
                                'GMAIL_GET_MESSAGE_BY_MESSAGE_ID',
                                'GMAIL_CREATE_EMAIL_DRAFT',
                                'GMAIL_SEND_EMAIL'
                            ],
                            'count': 4
                        },
                        response_only=True,
                        status_codes=['200']
                    )
                ]
            ),
            400: OpenApiResponse(description='Tool name not provided or tool not found'),
            401: OpenApiResponse(description='Authentication credentials not provided or invalid'),
            500: OpenApiResponse(description='Unexpected server error')
        }
    )
    @action(detail=False, methods=['get'])
    def tool_slugs(self, request):
        """
        Returns the list of action slugs for a specific tool.
        Authentication required.
        """
        try:
            tool_name = request.query_params.get('tool_name')

            if not tool_name:
                return Response(
                    {'error': 'tool_name query parameter is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Normalize tool name to uppercase
            tool_name = tool_name.upper()

            # Check if tool exists in our configuration
            if tool_name not in TOP_SLUGS_BY_APP:
                return Response(
                    {'error': f'Tool "{tool_name}" not found. Available tools: {", ".join(sorted(TOP_SLUGS_BY_APP.keys()))}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get the slugs for this tool
            slugs = TOP_SLUGS_BY_APP[tool_name]

            return Response({
                'tool_name': tool_name,
                'slugs': slugs,
                'count': len(slugs)
            })

        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        tags=['connections'],
        operation_id='connections_for_display',
        summary='Get all available tools for display',
        description=(
            'Returns a list of all available tools (agent tools + Composio apps) with their metadata '
            'and connection status. **Authentication required.** '
            '\n\n'
            'This endpoint combines two types of tools:\n'
            '1. **Agent Tools**: Built-in tools like Weather, Calculator, Yahoo Finance (always available)\n'
            '2. **Composio Apps**: External integrations like Gmail, Slack, GitHub (require OAuth connection)\n'
            '\n\n'
            'Use the `is_composio_app` flag to distinguish between the two types.'
            '\n\n'
            '**Returns:**\n'
            '- List of all available tools with:\n'
            '  - `app_slug`: Tool identifier (e.g., "weather", "GMAIL", "calculator")\n'
            '  - `name`: Display name (e.g., "Weather", "Gmail")\n'
            '  - `description`: What the tool does\n'
            '  - `category`: Category (e.g., "email", "productivity", "information")\n'
            '  - `icon`: Emoji icon (only for agent tools, null for Composio apps)\n'
            '  - `is_connected`: Connection status (always true for agent tools)\n'
            '  - `is_composio_app`: Boolean flag (false = agent tool, true = Composio app)\n'
            '  - `requires_api_key`: Whether the agent tool needs an API key (only relevant for agent tools)'
        ),
        responses={
            200: AppConnectionDisplaySerializer(many=True),
            401: OpenApiResponse(description='Authentication credentials not provided or invalid'),
            500: OpenApiResponse(description='Unexpected server error')
        },
        examples=[
            OpenApiExample(
                'Success Response',
                value=[
                    {
                        'app_slug': 'weather',
                        'name': 'Weather',
                        'description': 'Get current weather and forecasts for any location worldwide',
                        'category': 'information',
                        'icon': '🌤️',
                        'is_connected': True,
                        'is_composio_app': False,
                        'requires_api_key': False
                    },
                    {
                        'app_slug': 'calculator',
                        'name': 'Calculator',
                        'description': 'Perform mathematical calculations and evaluate expressions',
                        'category': 'utility',
                        'icon': '🧮',
                        'is_connected': True,
                        'is_composio_app': False,
                        'requires_api_key': False
                    },
                    {
                        'app_slug': 'GMAIL',
                        'name': 'Gmail',
                        'description': 'Gmail integration',
                        'category': 'email',
                        'icon': None,
                        'is_connected': True,
                        'is_composio_app': True,
                        'requires_api_key': False
                    },
                    {
                        'app_slug': 'SLACK',
                        'name': 'Slack',
                        'description': 'Slack integration',
                        'category': 'communication',
                        'icon': None,
                        'is_connected': False,
                        'is_composio_app': True,
                        'requires_api_key': False
                    }
                ],
                response_only=True,
                status_codes=['200']
            )
        ]
    )
    @action(detail=False, methods=['get'])
    def connections_for_display(self, request):
        """
        Returns all available tools (Composio apps + agent tools) for display.
        Used for displaying available connections in Manual Mode agent creation.
        """
        try:
            # Get user's active connections from Composio
            agent_service = AgentService(request.user)
            user_connections = agent_service.get_connection_details()

            # Create a set of connected app names for quick lookup
            connected_apps = {conn['tool_name'] for conn in user_connections}

            result = []

            # 1. Add agent tools first (they're always available, no connection needed)
            for tool_slug, tool_config in AGENT_TOOLS.items():
                result.append({
                    'app_slug': tool_slug,
                    'name': tool_config['name'],
                    'description': tool_config['description'],
                    'category': tool_config.get('category', 'utility'),
                    'icon': tool_config.get('icon', '🛠️'),
                    'is_connected': True,  # Agent tools are always "connected"
                    'is_composio_app': False,
                    'requires_api_key': tool_config.get('requires_api_key', False)
                })

            # 2. Add Composio apps
            for app_slug in sorted(APP_SLUGS.keys()):
                # Get metadata from APP_METADATA, or use defaults
                metadata = APP_METADATA.get(app_slug, {
                    'name': app_slug.title(),
                    'description': f'{app_slug} integration',
                    'category': 'other'
                })

                result.append({
                    'app_slug': app_slug,
                    'name': metadata['name'],
                    'description': metadata['description'],
                    'category': metadata['category'],
                    'icon': None,  # Composio apps don't have icons in metadata
                    'is_connected': app_slug in connected_apps,
                    'is_composio_app': True,
                    'requires_api_key': False  # Composio handles auth via OAuth
                })

            return Response(result)

        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(exclude=True)  # Hide from Swagger UI - internal use only
    @action(detail=False, methods=['get'])
    def check_connections(self, request):
        """
        Syncs connection status from Composio to the local database.
        Also cleans up any duplicate connections found in Composio.
        """
        try:
            agent_service = AgentService(request.user)

            # Get the ground truth from Composio
            connection_details = agent_service.get_connection_details()

            # Update our database to reflect the ground truth
            entity_id = f"user_{request.user.id}"

            # PHASE 1: Clean up duplicate connections in Composio
            # Group connections by tool name to detect duplicates
            tools_to_check = set(c['tool_name'].upper() for c in connection_details)

            for tool_name in tools_to_check:
                # Count how many connections exist for this tool
                tool_connections = [c for c in connection_details if c['tool_name'].upper() == tool_name]
                if len(tool_connections) > 1:
                    print(f"⚠️  Found {len(tool_connections)} connections for {tool_name} in Composio")
                    print(f"🧹 Triggering duplicate cleanup...")
                    cleanup_result = agent_service._cleanup_duplicate_connections(entity_id, tool_name)

                    if cleanup_result.get('cleaned'):
                        print(f"✅ Cleaned up {tool_name}: kept {cleanup_result['kept_connection_id']}, deleted {cleanup_result['deleted_count']}")

                        # Re-fetch connection details after cleanup
                        connection_details = agent_service.get_connection_details()
                        break  # Re-start the loop with fresh data
                    else:
                        print(f"ℹ️  Cleanup skipped for {tool_name}: {cleanup_result.get('reason', 'unknown')}")

            # PHASE 2: Sync to local database
            for conn_detail in connection_details:
                # Get existing connection to preserve auth_config_id if it exists
                existing_conn = ComposioConnection.objects.filter(
                    user=request.user,
                    tool_name=conn_detail['tool_name'].upper()
                ).first()

                # Skip if this connection was soft-deleted by user
                # Don't recreate connections the user explicitly disconnected
                if existing_conn and existing_conn.deleted_at:
                    print(f"⏭️  Skipping soft-deleted connection: {conn_detail['tool_name']}")
                    continue

                defaults = {
                    'is_active': True,
                    'composio_connection_id': conn_detail.get('connection_id', ''),
                    'composio_entity_id': conn_detail.get('entity_id', entity_id),
                    'deleted_at': None,
                }

                # Preserve auth_config_id and clear pending_auth status
                if existing_conn and existing_conn.auth_config_id:
                    defaults['auth_config_id'] = existing_conn.auth_config_id

                # Update metadata to mark as connected (remove pending_auth status)
                if existing_conn and existing_conn.metadata:
                    metadata = existing_conn.metadata.copy()
                    metadata['status'] = 'connected'
                    defaults['metadata'] = metadata
                else:
                    defaults['metadata'] = {'status': 'connected'}

                ComposioConnection.objects.update_or_create(
                    user=request.user,
                    tool_name=conn_detail['tool_name'].upper(),
                    defaults=defaults
                )

            connected_tool_names = [c['tool_name'].upper() for c in connection_details]

            # Mark any tools no longer in Composio as inactive
            ComposioConnection.objects.filter(
                user=request.user
            ).exclude(
                tool_name__in=connected_tool_names
            ).update(is_active=False)

            connections = ComposioConnection.objects.filter(user=request.user, is_active=True)
            serializer = ComposioConnectionSerializer(connections, many=True)
            return Response(serializer.data)

        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
