from rest_framework import viewsets, status, serializers as drf_serializers
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from django.utils import timezone
from asgiref.sync import sync_to_async
from ..models import Agent, ComposioConnection, ChatMessage, FileAttachment, Trigger, TriggerExecution, Workflow, WorkflowExecution, UserProfile, User, AgentTemplate, UsageLog, MessagingChannel, MessagingSession
from .. import serializers
from ..serializers import (
    UserSerializer, UserRegistrationSerializer, AgentSerializer,
    ComposioConnectionSerializer, ChatMessageSerializer, ChatRequestSerializer,
    FileAttachmentSerializer, TriggerSerializer, TriggerExecutionSerializer,
    WorkflowSerializer, WorkflowExecutionSerializer,
    ConnectionCreateRequestSerializer, ConnectionAuthResponseSerializer,
    DisconnectResponseSerializer, AgentChatRequestSerializer, AgentChatResponseSerializer,
    RegistrationResponseSerializer, LoginRequestSerializer, LoginResponseSerializer,
    LogoutResponseSerializer,
    EmailVerificationResendResponseSerializer, EmailVerificationConfirmResponseSerializer,
    TokenRefreshCookieResponseSerializer, PasswordResetRequestSerializer,
    PasswordResetRequestResponseSerializer, PasswordResetConfirmRequestSerializer,
    PasswordResetConfirmResponseSerializer, AvailableToolsResponseSerializer,
    AgentAvailableToolsResponseSerializer, SuggestedPromptsRequestSerializer,
    SuggestedPromptsResponseSerializer, AgentToolsResponseSerializer,
    AddAgentToolRequestSerializer, AddAgentToolResponseSerializer,
    ConnectToolToAgentRequestSerializer, ConnectToolToAgentResponseSerializer,
    AgentTemplateSerializer, CreditBalanceSerializer,
    UsageLogSerializer, AddCreditsRequestSerializer, AddCreditsResponseSerializer,
    MessagingChannelSerializer, ConnectTelegramBotSerializer, DisconnectMessagingChannelSerializer,
    AppConnectionDisplaySerializer, UnifiedAgentCreateSerializer
)
from .services.agent_service import AgentService
from ..tools.composio_config import APP_SLUGS, APP_METADATA, TOP_SLUGS_BY_APP
from ..agents.tools_config import AGENT_TOOLS, get_all_tool_names, is_valid_tool
import traceback
import asyncio
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse, OpenApiParameter, OpenApiExample
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
from pathlib import Path
from openai import OpenAI
import qrcode
from io import BytesIO
import base64
from PIL import Image
from django.http import StreamingHttpResponse
from ..shared.streaming_utils import (
    format_sse_event, send_status_event, send_tool_call_start_event,
    send_tool_call_result_event, send_content_delta_event,
    send_message_complete_event, send_done_event, send_error_event
)
from ..shared.utils import convert_image_to_base64
from ..credits import deduct_credits_for_message


@extend_schema_view(
    list=extend_schema(
        tags=['agents'],
        operation_id='agents_list',
        summary='List all agents',
        description='Returns list of all agents owned by the authenticated user. Agents are ordered by creation date (newest first).',
        responses={
            200: OpenApiResponse(
                response=AgentSerializer(many=True),
                description='List of agents',
                examples=[
                    OpenApiExample(
                        'Agents List Response',
                        value=[
                            {
                                'id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                                'user': 'username',
                                'name': 'Email Manager',
                                'prompt': 'Help me manage my emails',
                                'tools': ['GMAIL_SEND_EMAIL', 'GMAIL_FETCH_EMAILS'],
                                'app_connections': ['GMAIL'],
                                'message_count': 5,
                                'created_at': '2024-01-01T00:00:00Z',
                                'updated_at': '2024-01-01T00:00:00Z'
                            }
                        ],
                        response_only=True,
                        status_codes=['200']
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication required')
        }
    ),
    create=extend_schema(
        tags=['agents'],
        operation_id='agents_create',
        summary='Create a new agent (Unified Endpoint)',
        description='''
        **Unified Agent Creation Endpoint** - Supports 3 creation modes through a single endpoint:

        ## Mode 1: YOLO Mode (Quick Creation)
        Provide only a `prompt` and let the system auto-generate everything:
        - ✅ Name auto-generated from prompt + tools
        - ✅ Random avatar assigned
        - ✅ Tools auto-determined from prompt context

        **Required:** `prompt` only

        ## Mode 2: Manual Mode (Full Control)
        Provide `name` + `prompt` for complete control over agent creation:
        - ✅ You choose the name
        - ✅ You select tools (app_connections, agent_tools)
        - ✅ You can upload custom avatar
        - ✅ You can attach files for persistent context

        **Required:** `name` + `prompt`

        ## Mode 3: Template Mode (Pre-configured)
        Provide `template_id` to instantiate from a pre-built template:
        - ✅ Uses template's default name, prompt, and tools
        - ✅ Optionally override any field (name, prompt, tools, avatar)
        - ✅ Increments template usage count

        **Required:** `template_id` only (prompt optional)

        ---

        ## All Available Fields:
        - **`template_id`** (UUID, optional): Template to instantiate from
        - **`name`** (string, optional): Agent name (required for Manual, auto-generated for YOLO, optional override for Template)
        - **`prompt`** (string, optional): System prompt (required for YOLO/Manual, optional override for Template)
        - **`avatar`** (file, optional): JPG/PNG image, max 5MB
        - **`app_connections`** (array, optional): List of Composio app slugs (e.g., ["GMAIL", "SLACK"])
        - **`agent_tools`** (array, optional): List of agent tool names (e.g., ["weather", "calculator"])
        - **`files`** (array, optional): List of files to attach for persistent context (max 10MB each)

        **Content-Type:** `multipart/form-data` (for file uploads) or `application/json`
        ''',
        request=UnifiedAgentCreateSerializer,
        responses={
            201: OpenApiResponse(
                response=AgentSerializer,
                description='Agent created successfully',
                examples=[
                    OpenApiExample(
                        'YOLO Mode Response',
                        value={
                            'id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                            'user': 'username',
                            'name': 'Email Manager',  # Auto-generated
                            'prompt': 'Help me manage my emails and calendar',
                            'tools': ['GMAIL_SEND_EMAIL', 'GMAIL_FETCH_EMAILS'],
                            'app_connections': ['GMAIL'],
                            'agent_tools': [],
                            'message_count': 0,
                            'created_at': '2024-01-01T00:00:00Z',
                            'updated_at': '2024-01-01T00:00:00Z'
                        },
                        response_only=True,
                        status_codes=['201']
                    ),
                    OpenApiExample(
                        'Manual Mode Response',
                        value={
                            'id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                            'user': 'username',
                            'name': 'My Custom Agent',  # User-provided
                            'prompt': 'You are a weather assistant',
                            'tools': [],
                            'app_connections': [],
                            'agent_tools': ['weather', 'calculator'],
                            'message_count': 0,
                            'created_at': '2024-01-01T00:00:00Z',
                            'updated_at': '2024-01-01T00:00:00Z'
                        },
                        response_only=True,
                        status_codes=['201']
                    ),
                    OpenApiExample(
                        'Template Mode Response',
                        value={
                            'id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                            'user': 'username',
                            'name': 'Email Assistant',  # From template
                            'prompt': 'You are an email management assistant...',  # From template
                            'tools': ['GMAIL_SEND_EMAIL', 'GMAIL_FETCH_EMAILS'],
                            'app_connections': ['GMAIL'],
                            'agent_tools': [],
                            'message_count': 0,
                            'created_at': '2024-01-01T00:00:00Z',
                            'updated_at': '2024-01-01T00:00:00Z'
                        },
                        response_only=True,
                        status_codes=['201']
                    )
                ]
            ),
            400: OpenApiResponse(description='Validation error - missing required fields or invalid template_id'),
            401: OpenApiResponse(description='Authentication required')
        },
        examples=[
            OpenApiExample(
                'YOLO Mode: Prompt Only',
                value={
                    'prompt': 'Help me manage my emails and schedule meetings'
                },
                request_only=True,
                description='Simplest mode - just provide a prompt and let AI handle the rest.'
            ),
            OpenApiExample(
                'Manual Mode: Full Control',
                value={
                    'name': 'My Email Agent',
                    'prompt': 'You are an email management assistant',
                    'app_connections': ['GMAIL', 'SLACK'],
                    'agent_tools': ['weather']
                },
                request_only=True,
                description='Full control mode - specify name, prompt, and all tools.'
            ),
            OpenApiExample(
                'Template Mode: From Template',
                value={
                    'template_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6'
                },
                request_only=True,
                description='Use a pre-configured template. All fields are optional overrides.'
            ),
            OpenApiExample(
                'Template Mode: With Overrides',
                value={
                    'template_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                    'name': 'Custom Name Override',
                    'app_connections': ['GMAIL', 'GOOGLECALENDAR']
                },
                request_only=True,
                description='Use template but override specific fields like name or tools.'
            )
        ]
    ),
    retrieve=extend_schema(
        tags=['agents'],
        operation_id='agents_retrieve',
        summary='Get agent details',
        description='Returns details of a specific agent by ID. Users can only retrieve their own agents.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Agent UUID',
                required=True
            )
        ],
        responses={
            200: OpenApiResponse(response=AgentSerializer, description='Agent details'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Agent not found')
        }
    ),
    update=extend_schema(
        tags=['agents'],
        operation_id='agents_update',
        summary='Update agent (full)',
        description='Fully updates an agent. All fields are required. The tools list is automatically regenerated from app_connections.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Agent UUID',
                required=True
            )
        ],
        request=AgentSerializer,
        responses={
            200: OpenApiResponse(response=AgentSerializer, description='Agent updated'),
            400: OpenApiResponse(description='Validation error'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Agent not found')
        }
    ),
    partial_update=extend_schema(
        tags=['agents'],
        operation_id='agents_partial_update',
        summary='Update agent (partial)',
        description='Partially updates an agent. Only provided fields will be updated. If app_connections is updated, the tools list is automatically regenerated.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Agent UUID',
                required=True
            )
        ],
        request=AgentSerializer,
        responses={
            200: OpenApiResponse(response=AgentSerializer, description='Agent updated'),
            400: OpenApiResponse(description='Validation error'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Agent not found')
        },
        examples=[
            OpenApiExample(
                'Add Tools to Agent',
                value={
                    'app_connections': ['GMAIL', 'SLACK']
                },
                request_only=True,
                description='Add tools to an existing agent by updating app_connections'
            )
        ]
    ),
    destroy=extend_schema(
        tags=['agents'],
        operation_id='agents_destroy',
        summary='Delete agent',
        description='Deletes an agent by ID. Users can only delete their own agents.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Agent UUID',
                required=True
            )
        ],
        responses={
            204: OpenApiResponse(description='Agent deleted successfully'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Agent not found')
        }
    )
)
class AgentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing AI Agents (CRUD operations).

    Features:
    - Unified creation endpoint supporting 3 modes: YOLO, Manual, Template
    - Tools are automatically generated from app_connections
    - All operations are scoped to the authenticated user
    - Supports avatar upload via multipart/form-data in create and update endpoints
    """
    serializer_class = AgentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        """Return different serializer for create vs other actions"""
        if self.action == 'create':
            return UnifiedAgentCreateSerializer
        return AgentSerializer

    def get_queryset(self):
        """
        Ensures users can only see their own agents.
        """
        return Agent.objects.filter(user=self.request.user)

    def _generate_agent_name(self, prompt: str, app_connections: list = None, agent_tools: list = None) -> str:
        """
        Generates an agent name from the prompt and tools using OpenAI.
        Returns a short, descriptive name (2-3 words max).
        """
        import asyncio
        from asgiref.sync import async_to_sync

        try:
            agent_service = AgentService(self.request.user)
            if not agent_service.openai_client:
                # Fallback if OpenAI is not configured
                print("OpenAI client not configured, using default name")
                return "My Agent"

            # Build context about tools
            tools_context = ""
            if app_connections or agent_tools:
                all_tools = []
                if app_connections:
                    all_tools.extend(app_connections)
                if agent_tools:
                    all_tools.extend(agent_tools)
                tools_context = f"\nConnected Tools: {', '.join(all_tools)}"

            system_prompt = (
                "You are a naming assistant. Generate a SHORT, catchy name for an AI agent "
                "based on its purpose and connected tools. The name should be:\n"
                "1. EXACTLY 2-3 words (this is critical!)\n"
                "2. Descriptive of the agent's main function or connected tools\n"
                "3. Professional and memorable\n"
                "4. No quotes or special characters\n"
                "5. Capitalize each word (Title Case)\n\n"
                "Examples: 'Email Assistant', 'Research Helper', 'Gmail Manager'\n\n"
                "Return ONLY the name, nothing else."
            )

            user_content = f"Generate a name for an agent with this prompt:\n\n{prompt}{tools_context}"

            # Call async OpenAI client synchronously using asyncio.run
            async def call_openai():
                return await agent_service.openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    temperature=0.7,
                    max_completion_tokens=30
                )

            # Use asyncio.run to properly execute the async function
            try:
                response = asyncio.run(call_openai())
            except RuntimeError:
                # If already in an event loop, use async_to_sync
                response = async_to_sync(call_openai)()

            generated_name = response.choices[0].message.content.strip()

            # Clean up the name (remove quotes, extra whitespace)
            generated_name = generated_name.strip('"\'')
            generated_name = ' '.join(generated_name.split())  # Normalize whitespace

            # Ensure it's 2-3 words - if longer, truncate to first 3 words
            words = generated_name.split()
            if len(words) > 3:
                generated_name = ' '.join(words[:3])

            # Fallback if empty
            if not generated_name or len(generated_name.strip()) == 0:
                print("Generated name is empty, using default name")
                return "My Agent"

            print(f"✅ Generated agent name: {generated_name}")
            return generated_name

        except Exception as e:
            print(f"❌ Error generating agent name: {e}")
            import traceback
            traceback.print_exc()
            # Always fallback to "My Agent" on error
            return "My Agent"

    def _generate_tools_for_agent(self, serializer, user):
        """
        Called on agent create/update.
        Populates the agent's 'tools' list with the "starter pack" of slugs
        from the hardcoded config file based on selected 'app_connections'.

        Validates that the user has connected each tool at the account level first.
        """
        app_connections = serializer.validated_data.get('app_connections', [])

        # If no app_connections provided, create agent with empty tools
        if not app_connections:
            serializer.save(
                user=user,
                tools=[],
                app_connections=[]
            )
            return

        # Auto-sync connections from Composio before validation
        # This ensures we have the latest connection status from Composio (ground truth)
        print(f"🔄 Auto-syncing connections from Composio before validation...")
        try:
            agent_service = AgentService(user)
            connection_details = agent_service.get_connection_details()

            # Update local database with fresh connection statuses
            entity_id = f"user_{user.id}"

            for conn_detail in connection_details:
                # Get existing connection to preserve auth_config_id
                existing_conn = ComposioConnection.objects.filter(
                    user=user,
                    tool_name=conn_detail['tool_name'].upper()
                ).first()

                # Skip if this connection was soft-deleted by user
                if existing_conn and existing_conn.deleted_at:
                    print(f"⏭️  Skipping soft-deleted connection: {conn_detail['tool_name']}")
                    continue

                defaults = {
                    'is_active': True,
                    'composio_connection_id': conn_detail.get('id', ''),
                    'composio_entity_id': entity_id,
                    'metadata': {'status': 'connected', 'synced_at': str(timezone.now())},
                    'deleted_at': None,
                }

                # Preserve auth_config_id from initial OAuth flow
                if existing_conn and existing_conn.auth_config_id:
                    defaults['auth_config_id'] = existing_conn.auth_config_id

                ComposioConnection.objects.update_or_create(
                    user=user,
                    tool_name=conn_detail['tool_name'].upper(),
                    defaults=defaults
                )

            print(f"✅ Synced {len(connection_details)} connections from Composio")

        except Exception as e:
            print(f"⚠️  Warning: Failed to sync connections from Composio: {e}")
            print(f"   Falling back to local database for validation")
            # Continue with validation using local DB data

        # Validate that each tool is connected at the account level
        # Get active connections (not soft-deleted)
        user_active_connections = ComposioConnection.objects.filter(
            user=user,
            is_active=True,
            deleted_at__isnull=True
        ).values_list('tool_name', flat=True)

        user_connected_tools = set(conn.upper() for conn in user_active_connections)

        # Check each requested app_connection
        not_connected = []
        for app_name in app_connections:
            app_name_upper = app_name.upper()
            if app_name_upper not in user_connected_tools:
                not_connected.append(app_name_upper)

        # If any tools are not connected at account level, raise validation error
        if not_connected:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'app_connections': f"You must connect these tools in the integrations page first: {', '.join(not_connected)}. "
                                   f"Visit /integrations to connect them."
            })

        # All tools are connected, proceed with generating slugs
        agent_service = AgentService(user)
        hardcoded_tools = agent_service.TOP_SLUGS_BY_APP

        initial_tools = set()
        for app_name in app_connections:
            app_name_upper = app_name.upper()
            if app_name_upper in hardcoded_tools:
                for slug in hardcoded_tools[app_name_upper]:
                    initial_tools.add(slug)

        print(f"Generated {len(initial_tools)} hardcoded tools for agent with validated connections.")

        # Save the agent with this initial list of tools
        serializer.save(
            user=user,
            tools=list(initial_tools),
            app_connections=[app.upper() for app in app_connections]  # Normalize to uppercase
        )

    def _get_random_default_avatar(self):
        """
        Randomly selects a default avatar image from static/default_avatars_clouds/ folder.
        Returns tuple: (binary_data, filename, mime_type) or (None, None, None) if no images found.
        """
        import os
        import random
        import mimetypes
        from django.conf import settings

        # Path to default avatars folder
        default_avatars_path = os.path.join(settings.BASE_DIR, 'static', 'default_avatars_clouds')

        try:
            # Check if directory exists
            if not os.path.exists(default_avatars_path):
                print(f"⚠️  Default avatars directory not found: {default_avatars_path}")
                return None, None, None

            # List all image files in the directory (exclude Mac metadata files starting with ._)
            image_extensions = ['.jpg', '.jpeg', '.png']
            available_images = [
                f for f in os.listdir(default_avatars_path)
                if os.path.isfile(os.path.join(default_avatars_path, f))
                and os.path.splitext(f.lower())[1] in image_extensions
                and not f.startswith('._')  # Exclude Mac metadata files
            ]

            if not available_images:
                print(f"⚠️  No default avatar images found in {default_avatars_path}")
                return None, None, None

            # Randomly select an image
            selected_image = random.choice(available_images)
            image_path = os.path.join(default_avatars_path, selected_image)

            # Read the image file
            with open(image_path, 'rb') as f:
                image_data = f.read()

            # Detect MIME type
            mime_type, _ = mimetypes.guess_type(image_path)
            if not mime_type:
                mime_type = 'image/jpeg'  # Default fallback

            print(f"✅ Selected default avatar: {selected_image} ({mime_type})")
            return image_data, selected_image, mime_type

        except Exception as e:
            print(f"❌ Error loading default avatar: {e}")
            import traceback
            traceback.print_exc()
            return None, None, None

    def create(self, request, *args, **kwargs):
        """
        Override create to ensure proper response serialization.
        Uses UnifiedAgentCreateSerializer for write operations (validation),
        then serializes response with AgentSerializer to include all fields.
        """
        # Validate input with write serializer
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create the agent (perform_create sets serializer.instance)
        self.perform_create(serializer)

        # Serialize the created instance with read serializer to get all fields
        response_serializer = AgentSerializer(serializer.instance, context={'request': request})

        headers = self.get_success_headers(response_serializer.data)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        """
        Unified agent creation handler supporting 3 modes:
        1. Template Mode: template_id provided
        2. Manual Mode: name provided (no template)
        3. YOLO Mode: neither template_id nor name provided
        """
        template_id = serializer.validated_data.get('template_id')

        # ===================================================================
        # MODE 1: Template Mode
        # ===================================================================
        if template_id:
            return self._create_from_template(serializer, template_id)

        # ===================================================================
        # MODE 2 & 3: Manual or YOLO Mode
        # ===================================================================
        return self._create_manual_or_yolo(serializer)

    def _create_from_template(self, serializer, template_id):
        """Handle Template Mode creation"""
        try:
            # Load the template
            template = AgentTemplate.objects.get(id=template_id)
        except AgentTemplate.DoesNotExist:
            raise serializers.ValidationError({'template_id': 'Template not found'})

        # Start with template defaults
        prompt = serializer.validated_data.get('prompt') or template.system_prompt
        name = serializer.validated_data.get('name') or template.name

        # Get intersection of template defaults and user's active connections
        # Only auto-connect tools that are BOTH in template AND already connected by user
        from api_agents.tools.models import ComposioConnection
        user_connections = set(
            ComposioConnection.objects.filter(
                user=self.request.user,
                is_active=True,
                deleted_at__isnull=True
            ).values_list('tool_name', flat=True)
        )
        template_defaults = set(tool.upper() for tool in (template.default_tools or []))

        # Intersection: only tools that are both in template AND connected by user
        app_connections = list(template_defaults & user_connections)

        print(f"📋 Template defaults: {template_defaults}")
        print(f"🔌 User connections: {user_connections}")
        print(f"✅ Auto-connecting (intersection): {app_connections}")

        agent_tools = serializer.validated_data.get('agent_tools') or template.default_agent_tools or []

        # Process avatar (user provided or template default or random)
        avatar_file = serializer.validated_data.get('avatar')
        avatar_data, avatar_filename, avatar_mime = None, None, 'image/jpeg'

        if avatar_file:
            avatar_data = self._process_avatar_image(avatar_file)
            avatar_filename = avatar_file.name
        else:
            # Use random default avatar
            avatar_data, avatar_filename, avatar_mime = self._get_random_default_avatar()

        # Handle files
        files = serializer.validated_data.get('files', [])

        # Create the agent
        agent = Agent.objects.create(
            user=self.request.user,
            template=template,  # Link to template for missing_connections calculation
            name=name,
            prompt=prompt,
            avatar_image=avatar_data,
            avatar_filename=avatar_filename,
            avatar_mime_type=avatar_mime,
            app_connections=app_connections,
            agent_tools=agent_tools,
            tools=[]  # Will be populated by _sync_agent_tools
        )

        # Sync tools from app_connections
        self._sync_agent_tools(agent, app_connections)

        # Handle file attachments
        self._attach_files_to_agent(agent, files)

        # Increment template usage count
        template.usage_count += 1
        template.save()

        print(f"✅ Created agent from template: {template.name} → {agent.name}")

        # Set the created agent as the serializer instance so it can be serialized and returned
        serializer.instance = agent

    def _create_manual_or_yolo(self, serializer):
        """Handle Manual Mode or YOLO Mode creation"""
        prompt = serializer.validated_data.get('prompt', '')
        name = serializer.validated_data.get('name', '').strip()

        # Only use app_connections if explicitly provided in request
        # By default, agents start with no tools connected
        # Check the raw request data to avoid using serializer defaults
        app_connections = []
        agent_tools = []

        if 'app_connections' in self.request.data:
            app_connections = serializer.validated_data.get('app_connections', [])
            print(f"📦 app_connections provided in request: {app_connections}")
        else:
            print(f"⚪ app_connections NOT provided in request, using empty list")

        if 'agent_tools' in self.request.data:
            agent_tools = serializer.validated_data.get('agent_tools', [])
            print(f"🔧 agent_tools provided in request: {agent_tools}")
        else:
            print(f"⚪ agent_tools NOT provided in request, using empty list")

        # Determine mode: Manual (name provided) or YOLO (no name)
        is_yolo_mode = not name

        # YOLO Mode: Auto-generate name
        if is_yolo_mode:
            name = self._generate_agent_name(prompt, app_connections, agent_tools)
            print(f"🎲 YOLO Mode: Generated name '{name}'")
        else:
            print(f"✋ Manual Mode: Using provided name '{name}'")

        # Process avatar if provided, otherwise assign random default avatar
        avatar_file = serializer.validated_data.get('avatar')
        avatar_data, avatar_filename, avatar_mime = None, None, 'image/jpeg'

        if avatar_file:
            avatar_data = self._process_avatar_image(avatar_file)
            avatar_filename = avatar_file.name
        else:
            avatar_data, avatar_filename, avatar_mime = self._get_random_default_avatar()

        # Handle files
        files = serializer.validated_data.get('files', [])

        # Create the agent
        agent = Agent.objects.create(
            user=self.request.user,
            name=name,
            prompt=prompt,
            avatar_image=avatar_data,
            avatar_filename=avatar_filename,
            avatar_mime_type=avatar_mime,
            app_connections=app_connections, # Composio Apps
            agent_tools=agent_tools, # Weather, Calculator, etc.
            tools=[]
        )

        # Sync tools from app_connections
        self._sync_agent_tools(agent, app_connections)

        # Handle file attachments
        self._attach_files_to_agent(agent, files)

        print(f"✅ Created agent: {agent.name}")

        # Set the created agent as the serializer instance so it can be serialized and returned
        serializer.instance = agent

    def perform_update(self, serializer):
        """
        Called when an agent is updated (PUT/PATCH).
        Handles avatar image processing if provided.
        """
        # Process avatar if provided
        avatar_file = serializer.validated_data.get('avatar')
        if avatar_file:
            processed_image_data = self._process_avatar_image(avatar_file)
            if processed_image_data:
                serializer.validated_data['avatar_image'] = processed_image_data
                serializer.validated_data['avatar_filename'] = avatar_file.name
                serializer.validated_data['avatar_mime_type'] = 'image/jpeg'
            # Remove the avatar field (it's write-only)
            serializer.validated_data.pop('avatar', None)

        self._generate_tools_for_agent(serializer, self.request.user)

    def _process_avatar_image(self, avatar_file) -> bytes:
        """
        Process and optimize avatar image.
        Converts to JPEG, resizes if needed, and returns binary data.
        """
        try:
            # Open and verify image
            image = Image.open(avatar_file)
            image.verify()

            # Re-open after verify (verify closes the file)
            avatar_file.seek(0)
            image = Image.open(avatar_file)

            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
                image = background
            elif image.mode != 'RGB':
                image = image.convert('RGB')

            # Resize if too large (max 800x800)
            max_dimension = 800
            if image.width > max_dimension or image.height > max_dimension:
                image.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)

            # Save to BytesIO
            output = BytesIO()
            image.save(output, format='JPEG', quality=85, optimize=True)
            return output.getvalue()

        except Exception as e:
            print(f"Error processing avatar image: {e}")
            return None

    @extend_schema(
        tags=['agents'],
        operation_id='agents_messages_retrieve',
        summary='Get agent chat messages',
        responses={
            200: OpenApiResponse(
                response=ChatMessageSerializer(many=True),
                description='List of chat messages for the agent. Messages are returned in chronological order (oldest first).'
            ),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Agent not found')
        },
        description='Retrieves all chat messages for a specific agent. Messages are returned in chronological order (oldest first). Each message includes the role (user/assistant), content, attachments, and timestamp.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Agent UUID',
                required=True
            )
        ]
    )
    @extend_schema(
        tags=['agents'],
        operation_id='agents_public_retrieve',
        summary='Get public agent details (No authentication required)',
        description=(
            'Retrieves public agent information without authentication. '
            'This endpoint is for publicly shared agents that can be viewed by anyone. '
            '\n\n'
            'Chat with this agent via the regular chat endpoint using is_ephemeral=True flag. '
            'Public agents have limited functionality: no external tools, no chat history persistence.'
        ),
        responses={
            200: AgentSerializer,
            404: OpenApiResponse(description='Agent not found')
        }
    )
    @action(detail=True, methods=['get'], url_path='public', permission_classes=[AllowAny])
    def public(self, request, pk=None):
        """
        Get public agent details without authentication.
        Anyone can view this agent, but interactions are limited.
        """
        try:
            agent = Agent.objects.get(pk=pk)
            serializer = AgentSerializer(agent, context={'request': request})
            return Response(serializer.data)
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """
        Gets all chat messages for a specific agent.
        Returns messages in chronological order with all metadata including attachments.

        If this is the first time loading the chat (no messages exist), automatically
        generates and saves a greeting message from the agent.
        """
        agent = self.get_object()
        messages = ChatMessage.objects.filter(agent=agent)

        # If no messages exist, create a greeting message
        if messages.count() == 0:
            try:
                print(f"📝 No messages found for agent {agent.name} (ID={agent.id}). Generating greeting...")
                agent_service = AgentService(request.user)
                # ✅ generate_greeting_message is now async
                greeting_content = asyncio.run(agent_service.generate_greeting_message(agent))

                # Create the greeting message
                ChatMessage.objects.create(
                    agent=agent,
                    role='assistant',
                    content=greeting_content,
                    attachments=[]
                )
                print(f"✅ Greeting message created for agent {agent.name}")

                # Refresh query to include the new greeting
                messages = ChatMessage.objects.filter(agent=agent)

            except Exception as e:
                print(f"❌ Error generating greeting for agent {agent.name}: {e}")
                import traceback
                traceback.print_exc()
                # Fall through - return empty messages if greeting fails

        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    @extend_schema(
        tags=['messaging'],
        operation_id='agents_messaging_channels',
        summary='Get messaging channels for agent',
        responses=MessagingChannelSerializer(many=True),
        description='Get all connected messaging channels (Telegram, WhatsApp) for an agent'
    )
    @action(detail=True, methods=['get'], url_path='messaging/channels')
    def messaging_channels(self, request, pk=None):
        """Get all messaging channels for an agent"""
        agent = self.get_object()
        channels = MessagingChannel.objects.filter(agent=agent)
        return Response(
            MessagingChannelSerializer(channels, many=True).data,
            status=status.HTTP_200_OK
        )

    @extend_schema(
        tags=['messaging'],
        operation_id='agents_telegram_connect',
        summary='Connect Telegram bot to agent',
        request=ConnectTelegramBotSerializer,
        responses=MessagingChannelSerializer,
        description='Connect a Telegram bot to an agent by providing the bot token. The webhook will be automatically set up.'
    )
    @action(detail=True, methods=['post'], url_path='telegram/connect')
    def telegram_connect(self, request, pk=None):
        """Connect a Telegram bot to an agent"""
        from ..messaging.telegram_utils import verify_bot_token, set_webhook, TelegramAPIError

        try:
            agent = self.get_object()

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
            webhook_url = f"https://{host}/api/messaging/telegram/webhook/{pk}/"

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

        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        tags=['messaging'],
        operation_id='agents_messaging_disconnect',
        summary='Disconnect messaging channel from agent',
        request=DisconnectMessagingChannelSerializer,
        responses={200: OpenApiResponse(description='Channel disconnected successfully')},
        description='Disconnect a messaging channel (Telegram or WhatsApp) from an agent. This will delete the webhook and remove the connection.'
    )
    @action(detail=True, methods=['post'], url_path='messaging/disconnect')
    def messaging_disconnect(self, request, pk=None):
        """Disconnect a messaging channel from an agent"""
        from ..messaging.telegram_utils import delete_webhook

        try:
            agent = self.get_object()

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

        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        tags=['agents'],
        operation_id='agents_chat_create',
        summary='Chat with agent',
        request=AgentChatRequestSerializer,
        responses={
            200: OpenApiResponse(
                response=AgentChatResponseSerializer,
                description='Chat response with user and assistant messages'
            ),
            400: OpenApiResponse(description='Validation error (e.g., message is required)'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Agent not found'),
            500: OpenApiResponse(description='Server error during chat execution')
        },
        description='Sends a message to the agent and receives a response. This is the core chat functionality. The agent dynamically selects tools based on the message content and chat history, then executes the appropriate actions. Supports file attachments via file_ids. The response includes both the user message and the assistant response, both saved to the database.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Agent UUID',
                required=True
            )
        ]
    )
    @action(detail=True, methods=['post'])
    def chat(self, request, pk=None):
        """
        Handles sending a message to the agent and getting a streaming response via SSE.
        This is the core "chat" logic with real-time updates.

        Flow:
        1. Validates message is provided
        2. Processes file attachments (if any)
        3. Saves user message to database
        4. Builds chat history (last 10 messages for better context & tool memory)
        5. Dynamically selects tools based on prompt and history
        6. Executes chat with streaming callbacks
        7. Saves assistant response
        8. Returns SSE stream with real-time updates

        SSE Events:
        - status: Agent state updates (thinking, tool_calling, responding, complete)
        - tool_call_start: Tool execution started
        - tool_call_result: Tool execution completed
        - content_delta: Partial response text chunks
        - message_complete: Final saved message
        - done: Stream finished
        - error: Error occurred
        """
        agent = self.get_object()

        # Use serializer for proper validation
        serializer = AgentChatRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        message = serializer.validated_data['message']
        inline_files = serializer.validated_data.get('files', [])
        is_ephemeral = serializer.validated_data.get('is_ephemeral', False)

        # ===== TASK 8: URL FILE DETECTION & FETCHING =====
        # Detect URLs in message and fetch content with safety checks
        import re
        url_pattern = r'https?://(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*)'
        urls = re.findall(url_pattern, message)

        url_fetched_file_ids = []  # Track URL-fetched file IDs separately

        if urls:
            print(f"🔗 Detected {len(urls)} URL(s) in message")
            import requests
            for url in urls[:3]:  # Limit to 3 URLs per message
                try:
                    print(f"📥 Fetching content from: {url}")
                    response = requests.get(url, timeout=10, headers={'User-Agent': 'AgentStudio-Bot'})

                    # Safety check: limit size to 1MB
                    if len(response.content) > 1024 * 1024:
                        print(f"⚠️  File too large ({len(response.content)} bytes), skipping")
                        message += f"\n\n[Note: File at {url} is too large to process]"
                        continue

                    # Extract filename from URL or Content-Disposition header
                    filename = url.split('/')[-1] or 'downloaded_file'
                    if 'content-disposition' in response.headers:
                        import re
                        cd = response.headers['content-disposition']
                        fname_match = re.findall('filename="(.+)"', cd)
                        if fname_match:
                            filename = fname_match[0]

                    # Create temporary file attachment
                    content_type = response.headers.get('content-type', 'application/octet-stream')
                    attachment = FileAttachment.objects.create(
                        user=request.user,
                        agent=agent,
                        file_content=response.content,
                        original_filename=filename,
                        file_size=len(response.content),
                        mime_type=content_type,
                        is_temporary=True
                    )

                    # Extract text content from fetched file
                    from api_agents.files.content_extractor import get_content_extractor
                    extractor = get_content_extractor()
                    extracted_text, extraction_status = extractor.extract(
                        file_content=response.content,
                        filename=filename,
                        mime_type=content_type
                    )
                    attachment.extracted_text = extracted_text
                    attachment.extraction_status = extraction_status
                    attachment.save()

                    # Add to URL-fetched files list (already a FileAttachment model, not an uploaded file object)
                    url_fetched_file_ids.append(attachment.id)
                    print(f"✅ Fetched and attached: {filename} ({len(response.content)} bytes, Extraction: {extraction_status})")
                    message += f"\n\n[Auto-fetched file from URL: {filename}]"

                except Exception as e:
                    print(f"❌ Failed to fetch {url}: {e}")
                    message += f"\n\n[Note: Could not fetch file from {url}]"
        # ==================================================

        # ===== AUTO-LOAD PERSISTENT FILES =====
        # Load all persistent files for this agent from database
        persistent_file_ids = list(
            FileAttachment.objects.filter(
                agent=agent,
                user=request.user,
                is_temporary=False
            ).values_list('id', flat=True)[:10]  # Limit to 10 files
        )
        print(f"📚 Auto-loaded {len(persistent_file_ids)} persistent file(s) from agent database")
        # ======================================

        # ===== PROCESS INLINE FILE UPLOADS =====
        # Handle inline file uploads - save as temporary files
        temp_file_ids = []

        if inline_files:
            print(f"\n{'='*60}")
            print(f"📤 INLINE FILE UPLOAD - Processing {len(inline_files)} file(s)")
            print(f"{'='*60}")

        for idx, file_obj in enumerate(inline_files, 1):
            try:
                print(f"\n📁 File #{idx}: {file_obj.name}")
                print(f"   ├─ MIME Type: {file_obj.content_type or 'application/octet-stream'}")
                print(f"   ├─ Size: {file_obj.size:,} bytes")
                print(f"   └─ Status: Reading file content...")

                # Read and save inline file with is_temporary=True
                file_content = file_obj.read()
                print(f"   ✅ File content read ({len(file_content):,} bytes)")

                print(f"   📝 Creating FileAttachment in database...")
                attachment = FileAttachment.objects.create(
                    user=request.user,
                    agent=agent,
                    file_content=file_content,
                    original_filename=file_obj.name,
                    file_size=file_obj.size,
                    mime_type=file_obj.content_type or 'application/octet-stream',
                    is_temporary=True  # 👈 Automatically mark as temporary
                )
                print(f"   ✅ FileAttachment created (ID: {attachment.id})")

                # Extract text content from file
                print(f"   🔍 Extracting text content...")
                from api_agents.files.content_extractor import get_content_extractor
                extractor = get_content_extractor()
                extracted_text, extraction_status = extractor.extract(
                    file_content=file_content,
                    filename=file_obj.name,
                    mime_type=file_obj.content_type or 'application/octet-stream'
                )
                attachment.extracted_text = extracted_text
                attachment.extraction_status = extraction_status
                attachment.save()
                print(f"   ✅ Text extraction complete: {extraction_status}")
                if extracted_text:
                    print(f"   📄 Extracted {len(extracted_text):,} characters")

                temp_file_ids.append(attachment.id)
                print(f"   ✅ File successfully uploaded (ID: {attachment.id})")
            except Exception as e:
                print(f"   ❌ ERROR uploading file {file_obj.name}: {e}")
                import traceback
                print(f"   Traceback: {traceback.format_exc()}")
                # Continue with other files

        if inline_files:
            print(f"\n{'='*60}")
            print(f"✅ INLINE UPLOAD COMPLETE - {len(temp_file_ids)}/{len(inline_files)} files uploaded")
            print(f"{'='*60}\n")

        # Combine all file IDs: persistent files (from DB) + inline uploads + URL-fetched files
        file_ids = persistent_file_ids + temp_file_ids + url_fetched_file_ids
        # =======================================

        # ===== CREDIT CHECK =====
        # Check if user has sufficient credits before processing (skip for ephemeral mode)
        user = request.user
        if not is_ephemeral and not user.has_credits(1):
            return Response(
                {
                    'error': 'Insufficient credits',
                    'detail': f'You need at least 1 credit to send a message. You have {user.total_credits} credit(s) remaining.',
                    'credits_required': 1,
                    'credits_remaining': user.total_credits
                },
                status=status.HTTP_402_PAYMENT_REQUIRED
            )
        # ========================

        # Define the streaming generator
        async def event_stream():
            try:
                # Emit initial status
                yield send_status_event('thinking', 'Analyzing your request...')

                # 1. Get full file info for *newly* attached files
                attachments = []
                if file_ids:
                    files = await sync_to_async(list)(FileAttachment.objects.filter(
                        id__in=file_ids,
                        user=request.user
                    ))
                    attachments = [{
                        'id': str(f.id),
                        'filename': f.original_filename,
                        'download_url': request.build_absolute_uri(f'/api/files/{f.id}/download/'),
                        'mime_type': f.mime_type,
                        'size': f.file_size
                    } for f in files]

                # 2. Save the new user message to the database (only if not ephemeral)
                user_msg = None
                if not is_ephemeral:
                    user_msg = await sync_to_async(ChatMessage.objects.create)(
                        agent=agent,
                        role='user',
                        content=message,
                        attachments=attachments  # Save the rich attachment data
                    )


                # 3. Build the rich chat history (for agent memory)
                # For ephemeral mode: use empty history (stateless)
                # For persistent mode: use last 10 messages from database (increased for better tool memory)
                chat_history_formatted = []

                if not is_ephemeral:
                    print("Building rich chat history from database...")
                    chat_history_qs = ChatMessage.objects.filter(agent=agent).order_by('-created_at')[:10]
                    chat_history = await sync_to_async(list)(chat_history_qs)
                    chat_history.reverse()  # Put in chronological order (oldest first)

                    for msg in chat_history:
                        msg_content = msg.content

                        # Re-build the file context for *all* messages in history
                        # Support vision for images, text metadata for non-images
                        if msg.attachments and isinstance(msg.attachments, list):
                            content_parts = [{"type": "input_text", "text": msg_content}]
                            non_image_files = []

                            for att in msg.attachments:
                                mime_type = att.get('mime_type', '')

                                # Handle images with vision
                                if mime_type.startswith('image/'):
                                    try:
                                        # Get FileAttachment from database
                                        file_id = att.get('id')
                                        if file_id:
                                            file_obj = await sync_to_async(FileAttachment.objects.get)(id=file_id)
                                            image_url = convert_image_to_base64(file_obj)

                                            if image_url:
                                                # Use Composio hybrid format
                                                # Type: 'input_image' (Composio requirement)
                                                # Content: 'image_url' as direct string (not wrapped in {"url": ...})
                                                content_parts.append({
                                                    "type": "input_image",
                                                    "image_url": image_url
                                                })
                                                print(f"📷 Added image to vision: {att.get('filename', 'image')}")
                                            else:
                                                non_image_files.append(att)
                                        else:
                                            non_image_files.append(att)
                                    except Exception as e:
                                        print(f"❌ Error loading image {att.get('filename')}: {e}")
                                        non_image_files.append(att)
                                else:
                                    # Non-image files
                                    non_image_files.append(att)

                            # Add non-image files as text context
                            if non_image_files:
                                file_context = "\n\nAttached files:\n"
                                for att in non_image_files:
                                    file_context += f"- {att.get('filename', 'file.unknown')}\n"
                                    if att.get('download_url'):
                                        file_context += f"  Download URL: {att.get('download_url')}\n"
                                    elif att.get('file_path'):
                                        file_context += f"  File path: {att.get('file_path')}\n"
                                content_parts[0]["text"] += file_context

                            chat_history_formatted.append({
                                "role": msg.role,
                                "content": content_parts if len(content_parts) > 1 else msg_content
                            })
                        else:
                            chat_history_formatted.append({
                                "role": msg.role,
                                "content": msg_content
                            })
                else:
                    print("Ephemeral mode: Using empty history (stateless session)")

                # 4. Initialize the agent service
                agent_service = AgentService(request.user)

                # 5. Dynamically select tools (with history and file attachment info)
                # 🚀 PHASE 2.5 HYBRID OPTIMIZATION: Load TOP 10 tools per app (no separate tool selection)
                # ✅ ENABLED: Phase 2.5 loads curated TOP 10 tools per app
                # - Saves 2-3 seconds (no separate AI call for tool selection)
                # - Reduces token usage by 80-90% (100-150 tools vs 800+)
                # - Prevents token explosion (Phase 2 loaded 500+ GitHub tools!)
                # - Better LLM performance with focused tool set
                use_phase2 = True  # Toggle this to enable/disable Phase 2.5 optimization

                if use_phase2:
                    print(f"🚀 PHASE 2.5: Skipping separate tool selection (will load TOP 10 tools per app)")
                    specific_tools_slugs = None  # Not needed - Phase 2.5 loads TOP 10 tools internally
                else:
                    print(f"Dynamically selecting tools for prompt: '{message[:50]}...'")
                    # ✅ select_tools_for_prompt is now async, no need for sync_to_async wrapper
                    specific_tools_slugs = await agent_service.select_tools_for_prompt(
                        user_prompt=message,
                        app_names=agent.app_connections,
                        chat_history=chat_history_formatted,  # Pass rich history
                        has_file_attachments=bool(file_ids)  # Indicate if files are attached
                    )


                # 6. Execute the chat with streaming callbacks
                # Determine which tools are available and route to appropriate handler
                # 🚀 PHASE 2.5: If using Phase 2.5, check for connected apps instead of specific_tools_slugs
                if use_phase2:
                    has_composio_tools = bool(agent.app_connections and agent_service.composio_client)
                else:
                    has_composio_tools = bool(specific_tools_slugs and agent_service.composio_client)
                has_agent_tools = bool(agent.agent_tools)

                # Create async queue for real-time event streaming
                event_queue = asyncio.Queue()
                response_container = {'response': ''}

                # Define callback for streaming events - yields immediately
                async def stream_callback(event_type, data):
                    event_str = None
                    if event_type == 'status':
                        event_str = send_status_event(data['status'], data.get('message', ''))
                    elif event_type == 'tool_call_start':
                        event_str = send_tool_call_start_event(data['tool'], data['parameters'])
                    elif event_type == 'tool_call_result':
                        event_str = send_tool_call_result_event(
                            data['tool'],
                            data['success'],
                            data.get('result'),
                            data.get('error')
                        )
                    elif event_type == 'content_delta':
                        event_str = send_content_delta_event(data['content'], data.get('index', 0))
                    elif event_type == 'heartbeat':
                        event_str = format_sse_event('heartbeat', data)
                    elif event_type == 'error':
                        event_str = send_error_event(data.get('error', 'Unknown error'))

                    if event_str:
                        await event_queue.put(event_str)

                # === WRITE FILES TO DISK FOR COMPOSIO ===
                # If there are file attachments, write them to a temporary directory for Composio to access
                import tempfile
                import os
                temp_file_paths = []  # Track disk file paths for cleanup
                file_attachments_for_composio = []

                if file_ids:
                    temp_dir = tempfile.mkdtemp(prefix='composio_files_')
                    print(f"📁 Writing {len(file_ids)} file(s) to temporary directory: {temp_dir}")

                    for file_id in file_ids:
                        try:
                            # Get file from database
                            file_obj = await sync_to_async(FileAttachment.objects.get)(
                                id=file_id,
                                user=request.user
                            )

                            # Write file content to disk
                            file_path = os.path.join(temp_dir, file_obj.original_filename)
                            file_content = file_obj.get_file_content()

                            if file_content:
                                await sync_to_async(lambda: open(file_path, 'wb').write(file_content))()
                                temp_file_paths.append(file_path)

                                # Add to file_attachments list for Composio
                                file_attachments_for_composio.append({
                                    'id': str(file_obj.id),  # ✅ Include file ID for structured content processing
                                    'filename': file_obj.original_filename,
                                    'file_path': file_path,
                                    'size': file_obj.file_size,
                                    'mime_type': file_obj.mime_type,
                                    'extracted_text': file_obj.extracted_text,
                                    'extraction_status': file_obj.extraction_status
                                })
                                print(f"📄 Wrote file to disk: {file_path} (ID: {file_obj.id})")
                        except Exception as e:
                            print(f"❌ Error writing file {file_id} to disk: {e}")
                # ==========================================

                # Execute chat in background task
                async def run_chat():
                    try:
                        print("🚀 Starting chat execution in background task...")
                        if has_composio_tools and has_agent_tools:
                            # Agent has both Composio and agent tools
                            if use_phase2:
                                print(f"🚀 PHASE 2.5: Executing chat with TOP 10 Composio tools per app + {len(agent.agent_tools)} agent tools")
                            else:
                                print(f"Executing chat with mixed tools: {len(specific_tools_slugs)} Composio + {len(agent.agent_tools)} agent tools")

                            # Note: _chat_with_mixed_tools doesn't support Phase 2.5 yet
                            # For now, if Phase 2.5 is enabled with mixed tools, we use _chat_with_composio
                            if use_phase2:
                                # Phase 2.5 with mixed tools: Use composio with TOP 10 tools
                                response = await agent_service._chat_with_composio(
                                    agent_model=agent,
                                    message=message,
                                    specific_tools_slugs=specific_tools_slugs,
                                    chat_history=chat_history_formatted,
                                    callback=stream_callback,
                                    file_attachments=file_attachments_for_composio if file_attachments_for_composio else None,
                                    use_phase2_optimization=use_phase2
                                )
                            else:
                                response = await agent_service._chat_with_mixed_tools(
                                    agent_model=agent,
                                    message=message,
                                    composio_tool_slugs=specific_tools_slugs,
                                    chat_history=chat_history_formatted,
                                    callback=stream_callback
                                )
                        elif has_composio_tools:
                            # Only Composio tools
                            if use_phase2:
                                print(f"🚀 PHASE 2.5: Executing chat with TOP 10 tools per app for connected apps")
                            else:
                                print(f"Executing chat with {len(specific_tools_slugs)} Composio tools")
                            response = await agent_service._chat_with_composio(
                                agent_model=agent,
                                message=message,
                                specific_tools_slugs=specific_tools_slugs,
                                chat_history=chat_history_formatted,
                                callback=stream_callback,
                                file_attachments=file_attachments_for_composio if file_attachments_for_composio else None,
                                use_phase2_optimization=use_phase2  # 🚀 Pass Phase 2.5 flag
                            )
                        elif has_agent_tools:
                            # Only agent tools
                            print(f"Executing chat with {len(agent.agent_tools)} agent tools")
                            response = await agent_service._chat_with_agent_tools(
                                agent_model=agent,
                                message=message,
                                chat_history=chat_history_formatted,
                                callback=stream_callback,
                                file_attachments=file_attachments_for_composio if file_attachments_for_composio else None
                            )
                        else:
                            # No tools needed. Fallback to basic chat.
                            print("No tools available. Falling back to basic chat.")
                            response = await agent_service._chat_without_tools(
                                agent_model=agent,
                                message=message,
                                chat_history=chat_history_formatted,
                                callback=stream_callback
                            )

                        print(f"✅ Chat execution completed. Response length: {len(response)}")
                        response_container['response'] = response
                    except Exception as e:
                        print(f"❌ Error in run_chat: {e}")
                        import traceback
                        traceback.print_exc()
                        # Send error event
                        error_event = send_error_event(str(e))
                        await event_queue.put(error_event)
                    finally:
                        # Signal completion by putting None
                        print("🏁 Signaling chat completion")
                        await event_queue.put(None)

                # Start chat execution in background
                chat_task = asyncio.create_task(run_chat())

                # Yield events as they arrive in real-time
                while True:
                    event = await event_queue.get()
                    if event is None:
                        # Chat completed
                        break
                    yield event

                # Wait for chat task to complete
                await chat_task
                response = response_container['response']

                # Task 7: Context overflow protection - truncate if response is too long
                MAX_RESPONSE_LENGTH = 15000  # ~4000 tokens, safe limit
                if len(response) > MAX_RESPONSE_LENGTH:
                    print(f"⚠️  Response too long ({len(response)} chars), truncating to {MAX_RESPONSE_LENGTH}")
                    response = response[:MAX_RESPONSE_LENGTH] + "\n\n... (response truncated for length)"

                # 7. Save assistant message (only if not ephemeral)
                assistant_msg = None
                if not is_ephemeral:
                    assistant_msg = await sync_to_async(ChatMessage.objects.create)(
                        agent=agent,
                        role='assistant',
                        content=response
                    )

                # ===== DEDUCT CREDITS =====
                # Deduct credits for the message and log usage (only if not ephemeral)
                if not is_ephemeral:
                    await sync_to_async(deduct_credits_for_message)(
                        user=request.user,
                        agent=agent,
                        message_content=message
                    )
                # ==========================

                # Emit message complete event
                if assistant_msg:
                    yield send_message_complete_event(
                        str(assistant_msg.id),
                        response,
                        assistant_msg.created_at.isoformat()
                    )
                else:
                    # For ephemeral mode, send message complete without ID/timestamp
                    yield send_message_complete_event(
                        None,
                        response,
                        None
                    )

                # ===== CLEANUP TEMPORARY DISK FILES FOR COMPOSIO =====
                # IMPORTANT: Temp files are NOT deleted immediately after execution
                # Composio may need these files for asynchronous operations (e.g., media uploads)
                # The temp directory cleanup is disabled to allow Composio tools to complete
                # Temp files will be cleaned up by the system's temp file cleaner
                #
                # if temp_file_paths:
                #     import shutil
                #     for file_path in temp_file_paths:
                #         try:
                #             if os.path.exists(file_path):
                #                 os.remove(file_path)
                #         except Exception as e:
                #             print(f"⚠️ Failed to delete temp file {file_path}: {e}")
                #
                #     # Clean up the temp directory
                #     try:
                #         if file_attachments_for_composio:
                #             temp_dir = os.path.dirname(temp_file_paths[0])
                #             if os.path.exists(temp_dir):
                #                 shutil.rmtree(temp_dir)
                #                 print(f"🗑️ Cleaned up temporary disk directory: {temp_dir}")
                #     except Exception as e:
                #         print(f"⚠️ Failed to delete temp directory: {e}")
                print(f"📁 Temp files preserved for Composio async operations (will be cleaned by system)")
                # =====================================================

                # ===== CLEANUP TEMPORARY DATABASE FILES =====
                # Delete any temporary files from database (inline uploads)
                if file_ids:
                    deleted_count = await sync_to_async(
                        lambda: FileAttachment.objects.filter(
                            id__in=file_ids,
                            user=request.user,
                            is_temporary=True
                        ).delete()[0]
                    )()
                    if deleted_count > 0:
                        print(f"🗑️ Cleaned up {deleted_count} temporary database file(s) after message completion")
                # ============================================

                # Emit done event
                yield send_done_event()

            except Exception as e:
                traceback.print_exc()

                # Cleanup temporary disk files even on error
                # DISABLED: See note above about preserving temp files for Composio
                # if temp_file_paths:
                #     import shutil
                #     for file_path in temp_file_paths:
                #         try:
                #             if os.path.exists(file_path):
                #                 os.remove(file_path)
                #         except Exception as cleanup_error:
                #             print(f"⚠️ Failed to delete temp file {file_path}: {cleanup_error}")
                #
                #     # Clean up the temp directory
                #     try:
                #         if file_attachments_for_composio:
                #             temp_dir = os.path.dirname(temp_file_paths[0])
                #             if os.path.exists(temp_dir):
                #                 shutil.rmtree(temp_dir)
                #     except Exception as cleanup_error:
                #         print(f"⚠️ Failed to delete temp directory: {cleanup_error}")
                print(f"📁 Temp files preserved even on error (will be cleaned by system)")

                # Cleanup temporary database files even on error
                if file_ids:
                    try:
                        deleted_count = await sync_to_async(
                            lambda: FileAttachment.objects.filter(
                                id__in=file_ids,
                                user=request.user,
                                is_temporary=True
                            ).delete()[0]
                        )()
                        if deleted_count > 0:
                            print(f"🗑️ Cleaned up {deleted_count} temporary database file(s) after error")
                    except Exception as cleanup_error:
                        print(f"⚠️ Failed to cleanup temporary database files: {cleanup_error}")

                yield send_error_event(str(e))
                yield send_done_event()

        # Convert async generator to sync for Django
        def sync_event_stream():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                async_gen = event_stream()
                while True:
                    try:
                        event = loop.run_until_complete(async_gen.__anext__())
                        yield event
                    except StopAsyncIteration:
                        break
            finally:
                loop.close()

        # Return SSE streaming response
        response = StreamingHttpResponse(
            sync_event_stream(),
            content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response

    @extend_schema(
        tags=['agents'],
        operation_id='agents_reset_chat',
        summary='Reset agent chat history',
        request=None,  # No request body needed
        description=(
            'Resets the chat history for a specific agent. This endpoint performs a complete reset:\n\n'
            '**Effects:**\n'
            '1. Deletes all conversation history (ChatMessage records)\n'
            '2. Clears all stored memories and context\n'
            '3. Removes all previous message context\n'
            '4. Starts fresh with no conversation history\n\n'
            '**Use case:** Call this when the user wants to start a new conversation from scratch, '
            'clearing all previous interactions and context. This is useful for privacy, testing, '
            'or when the conversation becomes too long or off-track.\n\n'
            '**Note:** This action is irreversible. All chat messages for this agent will be permanently deleted.'
        ),
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Agent UUID',
                required=True
            )
        ],
        responses={
            200: OpenApiResponse(
                description='Chat history reset successfully',
                examples=[
                    OpenApiExample(
                        'Reset Success',
                        value={
                            'success': True,
                            'message': 'Chat history has been reset. All messages deleted.',
                            'deleted_count': 42
                        },
                        response_only=True,
                        status_codes=['200']
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Agent not found or not owned by user')
        }
    )
    @action(detail=True, methods=['post'], url_path='reset-chat')
    def reset_chat(self, request, pk=None):
        """
        Resets the chat history for the agent.
        Deletes all ChatMessage records associated with this agent.
        """
        try:
            agent = self.get_object()

            # Delete all chat messages for this agent
            deleted_count, _ = ChatMessage.objects.filter(agent=agent).delete()

            print(f"✅ Chat history reset for agent {agent.name} (ID={agent.id}). Deleted {deleted_count} messages.")

            return Response({
                'success': True,
                'message': 'Chat history has been reset. All messages deleted.',
                'deleted_count': deleted_count
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"❌ Error resetting chat history: {e}")
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        tags=['agents'],
        operation_id='agents_suggested_prompts',
        summary='Generate suggested prompts for agent',
        description=(
            'Generates 3 ready-to-use example prompts based on the agent\'s purpose and available tools. '
            '**No authentication required for this endpoint.** '
            '\n\n'
            'This endpoint is useful when creating a new agent - it provides the frontend with '
            'suggested example prompts that users can click to quickly interact with their agent.'
            '\n\n'
            'For example, if creating an email assistant with Gmail, it might suggest:\n'
            '- "Check my latest emails"\n'
            '- "Send an email to..."\n'
            '- "Delete specific emails"'
        ),
        request=SuggestedPromptsRequestSerializer,
        responses={
            200: OpenApiResponse(
                response=SuggestedPromptsResponseSerializer,
                description='Successfully generated suggested prompts'
            ),
            400: OpenApiResponse(description='Invalid request data'),
            500: OpenApiResponse(description='Internal server error')
        }
    )
    @action(detail=False, methods=['post'], url_path='suggested-prompts', permission_classes=[AllowAny])
    def suggested_prompts(self, request):
        """
        Generates suggested prompts based on agent purpose and tools.
        This endpoint doesn't require authentication and can be called during agent creation.
        """
        serializer = SuggestedPromptsRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        prompt = serializer.validated_data['prompt']
        app_connections = serializer.validated_data.get('app_connections', [])

        try:
            # Use OpenAI to generate contextual suggested prompts
            openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)

            # Build tools context
            tools_context = ""
            if app_connections:
                tools_list = ", ".join(app_connections)
                tools_context = f"\n\nThe agent has access to these tools: {tools_list}"

            system_prompt = (
                "You are an expert at generating example prompts for AI agents. "
                "Based on the agent's purpose and available tools, generate exactly 3 short, "
                "actionable example prompts that a user could send to this agent."
                "\n\n"
                "Requirements:\n"
                "1. Each prompt should be 3-8 words\n"
                "2. Prompts should be realistic use cases\n"
                "3. Prompts should leverage the available tools if specified\n"
                "4. Make them conversational and natural\n"
                "5. Return ONLY a JSON object with a 'prompts' array containing 3 strings\n"
                "6. Do not add numbering or bullet points - just the prompt text"
            )

            user_prompt = (
                f"Agent purpose: {prompt}"
                f"{tools_context}"
                "\n\n"
                "Generate 3 example prompts."
            )

            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",  # Using gpt-4o-mini as fallback - gpt-4o-mini may not be available yet
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_completion_tokens=200,
                response_format={"type": "json_object"}
            )

            response_content = response.choices[0].message.content
            print(f"Generated suggested prompts: {response_content}")
            print(f"Response object: {response}")

            # Check if response is empty
            if not response_content or not response_content.strip():
                print("⚠️ Empty response from GPT-5 nano, using fallback prompts")
                suggested_prompts = []
            else:
                # Parse the JSON response
                import json
                try:
                    data = json.loads(response_content)
                    suggested_prompts = data.get('prompts', [])
                except json.JSONDecodeError as e:
                    print(f"⚠️ JSON decode error: {e}, using fallback prompts")
                    suggested_prompts = []

            # Ensure we have exactly 3 prompts
            if len(suggested_prompts) < 3:
                # Fallback prompts based on agent purpose
                fallback_prompts = [
                    "Help me get started",
                    "What can you do?",
                    "Show me an example"
                ]
                suggested_prompts.extend(fallback_prompts[:(3 - len(suggested_prompts))])
            elif len(suggested_prompts) > 3:
                suggested_prompts = suggested_prompts[:3]

            return Response({
                'suggested_prompts': suggested_prompts
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Error generating suggested prompts: {e}")
            traceback.print_exc()

            # Return generic fallback prompts
            fallback_prompts = [
                "Help me get started",
                "What can you do?",
                "Show me an example"
            ]

            return Response({
                'suggested_prompts': fallback_prompts
            }, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['agents'],
        operation_id='agents_agent_tools_list',
        summary='Get all available agent-specific tools',
        description=(
            'Returns list of all agent-specific tools (weather, calculator, etc.) '
            'that can be added to agents. **No authentication required.** '
            '\n\n'
            'These are different from Composio connection tools. Agent tools:\n'
            '- Don\'t require external OAuth connections\n'
            '- Are managed entirely by the backend\n'
            '- Users can simply enable/disable them for each agent\n'
            '\n\n'
            'Available tools: weather (Open-Meteo), calculator, yahoo_finance, youtube, web_search, website_reader'
        ),
        responses={
            200: OpenApiResponse(
                response=AgentToolsResponseSerializer,
                description='List of agent tools with metadata'
            )
        }
    )
    @action(detail=False, methods=['get'], url_path='agent-tools', permission_classes=[AllowAny])
    def agent_tools_list(self, request):
        """
        Get list of all available agent-specific tools.
        No authentication required - this is public information.
        """
        tools = []
        for tool_name, tool_config in AGENT_TOOLS.items():
            tools.append({
                'tool_name': tool_name,
                'name': tool_config['name'],
                'description': tool_config['description'],
                'icon': tool_config['icon'],
                'category': tool_config['category'],
                'is_enabled': False  # Default, will be set per-agent in other endpoint
            })

        return Response({
            'tools': tools,
            'count': len(tools)
        }, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['agents'],
        operation_id='agents_available_agent_tools',
        summary='Get agent tools with enabled status for specific agent',
        description=(
            'Returns all agent-specific tools with their enabled/disabled status for this agent. '
            '**Authentication required.** '
            '\n\n'
            'Shows which tools are currently enabled in agent.agent_tools list.'
        ),
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Agent UUID',
                required=True
            )
        ],
        responses={
            200: OpenApiResponse(
                response=AgentToolsResponseSerializer,
                description='Agent tools with enabled status'
            ),
            404: OpenApiResponse(description='Agent not found or not owned by user')
        }
    )
    @action(detail=True, methods=['get'], url_path='available-agent-tools')
    def available_agent_tools(self, request, pk=None):
        """
        Get agent tools with enabled status for a specific agent.
        """
        agent = self.get_object()
        enabled_tools = set(agent.agent_tools or [])

        tools = []
        for tool_name, tool_config in AGENT_TOOLS.items():
            tools.append({
                'tool_name': tool_name,
                'name': tool_config['name'],
                'description': tool_config['description'],
                'icon': tool_config['icon'],
                'category': tool_config['category'],
                'is_enabled': tool_name in enabled_tools
            })

        return Response({
            'tools': tools,
            'count': len(tools)
        }, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['agents'],
        operation_id='agents_add_agent_tool',
        summary='Add/enable an agent tool for this agent',
        description=(
            'Enables a specific agent tool for this agent. '
            '**Authentication required.** '
            '\n\n'
            'Adds the tool name to agent.agent_tools list if not already present.'
        ),
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Agent UUID',
                required=True
            )
        ],
        request=AddAgentToolRequestSerializer,
        responses={
            200: OpenApiResponse(
                response=AddAgentToolResponseSerializer,
                description='Tool added successfully'
            ),
            400: OpenApiResponse(description='Invalid tool name or tool already enabled'),
            404: OpenApiResponse(description='Agent not found or not owned by user')
        }
    )
    @action(detail=True, methods=['post'], url_path='add-agent-tool')
    def add_agent_tool(self, request, pk=None):
        """
        Add/enable an agent tool for this agent.
        """
        serializer = AddAgentToolRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        tool_name = serializer.validated_data['tool_name']

        # Validate tool exists
        if not is_valid_tool(tool_name):
            return Response({
                'success': False,
                'message': f'Invalid tool name: {tool_name}. Available tools: {", ".join(get_all_tool_names())}'
            }, status=status.HTTP_400_BAD_REQUEST)

        agent = self.get_object()

        # Check if already enabled
        if tool_name in (agent.agent_tools or []):
            return Response({
                'success': False,
                'message': f'Tool "{tool_name}" is already enabled for this agent',
                'agent_tools': agent.agent_tools
            }, status=status.HTTP_400_BAD_REQUEST)

        # Add tool to list
        if not agent.agent_tools:
            agent.agent_tools = []
        agent.agent_tools.append(tool_name)
        agent.save()

        print(f"✅ Added agent tool '{tool_name}' to agent {agent.name} (ID: {agent.id})")

        return Response({
            'success': True,
            'message': f'Tool "{tool_name}" enabled successfully',
            'agent_tools': agent.agent_tools
        }, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['agents'],
        operation_id='agents_remove_agent_tool',
        summary='Remove/disable an agent tool from this agent',
        description=(
            'Disables a specific agent tool for this agent. '
            '**Authentication required.** '
            '\n\n'
            'Removes the tool name from agent.agent_tools list.'
        ),
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Agent UUID',
                required=True
            ),
            OpenApiParameter(
                name='tool_name',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
                description='Tool name to remove (e.g., "weather", "calculator")',
                required=True
            )
        ],
        responses={
            200: OpenApiResponse(
                response=AddAgentToolResponseSerializer,
                description='Tool removed successfully'
            ),
            400: OpenApiResponse(description='Tool not enabled or invalid tool name'),
            404: OpenApiResponse(description='Agent not found or not owned by user')
        }
    )
    @action(detail=True, methods=['delete'], url_path='remove-agent-tool/(?P<tool_name>[^/.]+)')
    def remove_agent_tool(self, request, pk=None, tool_name=None):
        """
        Remove/disable an agent tool from this agent.
        """
        if not tool_name:
            return Response({
                'success': False,
                'message': 'Tool name is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate tool exists
        if not is_valid_tool(tool_name):
            return Response({
                'success': False,
                'message': f'Invalid tool name: {tool_name}'
            }, status=status.HTTP_400_BAD_REQUEST)

        agent = self.get_object()

        # Check if tool is enabled
        if not agent.agent_tools or tool_name not in agent.agent_tools:
            return Response({
                'success': False,
                'message': f'Tool "{tool_name}" is not enabled for this agent',
                'agent_tools': agent.agent_tools or []
            }, status=status.HTTP_400_BAD_REQUEST)

        # Remove tool from list
        agent.agent_tools.remove(tool_name)
        agent.save()

        print(f"✅ Removed agent tool '{tool_name}' from agent {agent.name} (ID: {agent.id})")

        return Response({
            'success': True,
            'message': f'Tool "{tool_name}" disabled successfully',
            'agent_tools': agent.agent_tools
        }, status=status.HTTP_200_OK)

    @extend_schema(
        tags=['agents'],
        operation_id='agents_connect_tool',
        summary='Connect a Composio tool to this agent',
        description=(
            'Connects a Composio tool (like GMAIL, SLACK) to this specific agent. '
            '**Authentication required.** '
            '\n\n'
            'This endpoint handles two scenarios:\n'
            '1. **Tool already connected at account level**: Immediately adds tool to agent\'s app_connections\n'
            '2. **Tool not connected at account level**: Initiates OAuth flow, then adds to agent after auth completes\n'
            '\n\n'
            '**Flow:**\n'
            '- Checks if user has an active ComposioConnection for this tool\n'
            '- If not connected: Returns auth_url for OAuth popup, marks requires_auth=true\n'
            '- If connected: Adds tool to agent\'s app_connections and tools fields, returns success\n'
        ),
        request=ConnectToolToAgentRequestSerializer,
        responses={
            200: OpenApiResponse(
                response=ConnectToolToAgentResponseSerializer,
                description='Tool connected successfully or OAuth required'
            ),
            400: OpenApiResponse(description='Invalid request or tool name'),
            404: OpenApiResponse(description='Agent not found or not owned by user')
        }
    )
    @action(detail=True, methods=['post'], url_path='connect-tool')
    def connect_tool(self, request, pk=None):
        """
        Connect a Composio tool to this agent (and to account if needed).
        """
        serializer = ConnectToolToAgentRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        tool_name = serializer.validated_data['tool_name']
        redirect_url = serializer.validated_data.get('redirect_url')

        # Normalize tool name
        tool_name = str(tool_name).replace(' ', '').upper()

        agent = self.get_object()

        # Check if tool is already connected to this agent
        if tool_name in (agent.app_connections or []):
            return Response({
                'success': False,
                'message': f'Tool "{tool_name}" is already connected to this agent',
                'requires_auth': False,
                'app_connections': agent.app_connections
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if tool is connected at account level
        try:
            connection = ComposioConnection.objects.get(
                user=request.user,
                tool_name=tool_name,
                is_active=True,
                deleted_at__isnull=True
            )

            # Tool is connected at account level - add to agent immediately
            if not agent.app_connections:
                agent.app_connections = []
            agent.app_connections.append(tool_name)

            # Add action slugs to tools field
            agent_service = AgentService(request.user)
            hardcoded_tools = agent_service.TOP_SLUGS_BY_APP

            if tool_name in hardcoded_tools:
                if not agent.tools:
                    agent.tools = []
                for slug in hardcoded_tools[tool_name]:
                    if slug not in agent.tools:
                        agent.tools.append(slug)

            agent.save(update_fields=['app_connections', 'tools'])
            print(f"✅ Connected {tool_name} to agent {agent.name} (ID: {agent.id})")

            return Response({
                'success': True,
                'message': f'Tool "{tool_name}" connected successfully',
                'requires_auth': False,
                'auth_url': None,
                'app_connections': agent.app_connections
            }, status=status.HTTP_200_OK)

        except ComposioConnection.DoesNotExist:
            # Tool not connected at account level - initiate OAuth flow
            try:
                agent_service = AgentService(request.user)
                result = agent_service.authenticate_tool(
                    tool_name,
                    redirect_url=redirect_url
                )

                if result.get('success'):
                    # Create pending connection
                    connection, created = ComposioConnection.objects.update_or_create(
                        user=request.user,
                        tool_name=tool_name,
                        defaults={
                            'is_active': False,
                            'auth_config_id': result.get('auth_config_id', ''),
                            'deleted_at': None,
                            'metadata': {
                                'status': 'pending_auth',
                                'pending_agent_id': str(agent.id)  # Store agent ID for post-OAuth linking
                            }
                        }
                    )

                    print(f"🔐 OAuth required for {tool_name} - agent {agent.id} will be linked after auth")

                    return Response({
                        'success': True,
                        'message': f'Please complete OAuth to connect {tool_name}',
                        'requires_auth': True,
                        'auth_url': result.get('auth_url'),
                        'app_connections': agent.app_connections or []
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'success': False,
                        'message': f'Failed to initiate OAuth: {result.get("error", "Unknown error")}',
                        'requires_auth': False,
                        'app_connections': agent.app_connections or []
                    }, status=status.HTTP_400_BAD_REQUEST)

            except Exception as e:
                traceback.print_exc()
                return Response({
                    'success': False,
                    'message': f'Error connecting tool: {str(e)}',
                    'requires_auth': False,
                    'app_connections': agent.app_connections or []
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _sync_agent_tools(self, agent, app_connections):
        """
        Syncs agent tools from app_connections.
        Updates the agent's 'tools' field with action slugs from composio_config.
        """
        if not app_connections:
            agent.tools = []
            agent.save()
            return

        # Auto-sync connections from Composio
        agent_service = AgentService(agent.user)
        connection_details = agent_service.get_connection_details()
        connected_apps = {conn['tool_name'] for conn in connection_details}

        # Validate connections
        missing_connections = [app for app in app_connections if app not in connected_apps]
        if missing_connections:
            print(f"⚠️  Warning: Missing connections: {missing_connections}")

        # Get action slugs from config
        all_slugs = []
        for app in app_connections:
            if app in TOP_SLUGS_BY_APP:
                all_slugs.extend(TOP_SLUGS_BY_APP[app])

        agent.tools = all_slugs
        agent.save()
        print(f"✅ Synced {len(all_slugs)} tool slugs for agent {agent.name}")


    def _attach_files_to_agent(self, agent, files):
        """Attach files to an agent for persistent context"""
        if not files:
            return
        files_count = 0
        for file in files:
            file_content = file.read()
            FileAttachment.objects.create(
                user=agent.user,
                agent=agent,
                file_content=file_content,
                original_filename=file.name,
                file_size=file.size,
                mime_type=file.content_type or 'application/octet-stream',
                is_temporary=False
            )
            files_count += 1
            print(f"📎 Attached file: {file.name} ({file.size} bytes) to agent {agent.name}")
        print(f"✅ Attached {files_count} file(s) to agent {agent.name}")

    @extend_schema(
        tags=['agents'],
        operation_id='agents_available_tools',
        summary='Get available tools for agent with connection status',
        description=(
            'Returns all available tools with their connection status for a specific agent. '
            '**Authentication required.** '
            '\n\n'
            'This endpoint shows which tools are:\n'
            '1. Connected at the **account level** (via /api/connections/)\n'
            '2. Enabled for **this specific agent** (in agent.app_connections)\n'
            '\n\n'
            '**Use case:** Call this when user visits agent configuration page to show which tools '
            'can be enabled/disabled for this agent. Only tools connected at account level can be '
            'enabled for agents.'
        ),
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='Agent UUID',
                required=True
            )
        ],
        responses={
            200: OpenApiResponse(
                response=AgentAvailableToolsResponseSerializer,
                description='List of all available tools with connection status',
                examples=[
                    OpenApiExample(
                        'Agent Available Tools',
                        value={
                            'tools': [
                                {
                                    'tool_name': 'GMAIL',
                                    'name': 'Gmail',
                                    'description': 'Send, receive, and manage emails',
                                    'category': 'communication',
                                    'is_connected_to_account': True,
                                    'is_connected_to_agent': True,
                                    'connection_id': 42
                                },
                                {
                                    'tool_name': 'SLACK',
                                    'name': 'Slack',
                                    'description': 'Send messages and manage workspace',
                                    'category': 'messaging',
                                    'is_connected_to_account': True,
                                    'is_connected_to_agent': False,
                                    'connection_id': 87
                                },
                                {
                                    'tool_name': 'NOTION',
                                    'name': 'Notion',
                                    'description': 'Create pages and databases',
                                    'category': 'productivity',
                                    'is_connected_to_account': False,
                                    'is_connected_to_agent': False,
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
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Agent not found'),
            500: OpenApiResponse(description='Server error')
        }
    )
    @action(detail=True, methods=['get'])
    def available_tools(self, request, pk=None):
        """
        Returns list of all available tools with connection status for this agent.
        Shows which tools are connected at account level and enabled for this agent.
        """
        try:
            agent = self.get_object()

            # Get account-level connections (active and not soft-deleted)
            user_connections = ComposioConnection.objects.filter(
                user=request.user,
                is_active=True,
                deleted_at__isnull=True
            )
            # Map: tool_name -> connection_id
            account_connections_map = {conn.tool_name: conn.id for conn in user_connections}

            # Get agent's connected tools
            agent_tools = set(tool.upper() for tool in (agent.app_connections or []))

            # Build tools list
            tools_list = []
            for app_key in sorted(APP_SLUGS.keys()):
                tool_info = {
                    "tool_name": app_key,
                    "is_connected_to_account": app_key in account_connections_map,
                    "is_connected_to_agent": app_key in agent_tools,
                    "connection_id": account_connections_map.get(app_key, None)
                }

                # Add metadata if available
                if app_key in APP_METADATA:
                    tool_info.update({
                        "name": APP_METADATA[app_key]["name"],
                        "description": APP_METADATA[app_key]["description"],
                        "category": APP_METADATA[app_key]["category"]
                    })
                else:
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



@extend_schema_view(
    list=extend_schema(
        tags=['files'],
        operation_id='files_list',
        summary='List all files',
        description='Returns list of all file attachments owned by the authenticated user. Files are stored in the database as binary data. Files are ordered by upload date (newest first). Users can only see their own files. Each file includes a download_url to retrieve the binary content and agent_name showing which agent it belongs to. Can be filtered by agent_id query parameter to get files for a specific agent.',
        parameters=[
            OpenApiParameter(
                name='agent_id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
                description='Filter files by agent (optional)',
                required=False
            )
        ],
        responses={
            200: OpenApiResponse(
                response=FileAttachmentSerializer(many=True),
                description='List of file attachments',
                examples=[
                    OpenApiExample(
                        'Files List Response',
                        value=[
                            {
                                'id': '550e8400-e29b-41d4-a716-446655440000',
                                'agent_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                                'agent_name': 'Email Assistant',
                                'original_filename': 'document.pdf',
                                'file_size': 1024,
                                'mime_type': 'application/pdf',
                                'uploaded_at': '2024-01-01T00:00:00Z',
                                'download_url': 'http://localhost:8000/api/files/550e8400-e29b-41d4-a716-446655440000/download/'
                            },
                            {
                                'id': '550e8400-e29b-41d4-a716-446655440001',
                                'agent_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                                'agent_name': 'Email Assistant',
                                'original_filename': 'image.jpg',
                                'file_size': 2048,
                                'mime_type': 'image/jpeg',
                                'uploaded_at': '2024-01-01T01:00:00Z',
                                'download_url': 'http://localhost:8000/api/files/550e8400-e29b-41d4-a716-446655440001/download/'
                            }
                        ],
                        response_only=True,
                        status_codes=['200']
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication required')
        }
    ),
    create=extend_schema(
        tags=['files'],
        operation_id='files_create',
        summary='Upload a file',
        description='Uploads a new file attachment using `multipart/form-data`. **Important:** `agent_id` (UUID) is required - files must be associated with a specific agent. The file content is stored in the database as binary data (not on the filesystem). Original filename, file size, and MIME type are automatically detected. The user is automatically set from the authentication token. Files can be attached to agent chat messages using the returned file ID. Use the `download_url` to retrieve the file content. **Request format:** `multipart/form-data` with a `file` field (binary file data) and `agent_id` field (UUID string).',
        responses={
            201: OpenApiResponse(
                response=FileAttachmentSerializer,
                description='File uploaded successfully',
                examples=[
                    OpenApiExample(
                        'File Upload Success',
                        value={
                            'id': '550e8400-e29b-41d4-a716-446655440000',
                            'agent_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                            'agent_name': 'Email Assistant',
                            'original_filename': 'document.pdf',
                            'file_size': 1024,
                            'mime_type': 'application/pdf',
                            'uploaded_at': '2024-01-01T00:00:00Z',
                            'download_url': 'http://localhost:8000/api/files/550e8400-e29b-41d4-a716-446655440000/download/'
                        },
                        response_only=True,
                        status_codes=['201']
                    )
                ]
            ),
            400: OpenApiResponse(
                description='No file provided, no agent_id provided, agent not found, or validation error',
                examples=[
                    OpenApiExample(
                        'No File Error',
                        value={'error': 'No file provided'},
                        response_only=True,
                        status_codes=['400']
                    ),
                    OpenApiExample(
                        'No Agent ID Error',
                        value={'error': 'agent_id is required'},
                        response_only=True,
                        status_codes=['400']
                    ),
                    OpenApiExample(
                        'Agent Not Found Error',
                        value={'error': 'Agent not found or does not belong to you'},
                        response_only=True,
                        status_codes=['400']
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication required'),
            500: OpenApiResponse(
                description='Server error during upload',
                examples=[
                    OpenApiExample(
                        'Server Error',
                        value={'error': 'Internal server error'},
                        response_only=True,
                        status_codes=['500']
                    )
                ]
            )
        }
    ),
    retrieve=extend_schema(
        tags=['files'],
        operation_id='files_retrieve',
        summary='Get file details',
        description='Returns detailed information about a specific file attachment stored in the database. Users can only retrieve their own files. The response includes metadata and a download_url to retrieve the binary file content.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='File attachment UUID',
                required=True
            )
        ],
        responses={
            200: OpenApiResponse(
                response=FileAttachmentSerializer,
                description='File details',
                examples=[
                    OpenApiExample(
                        'File Details',
                        value={
                            'id': '550e8400-e29b-41d4-a716-446655440000',
                            'agent_id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                            'agent_name': 'Email Assistant',
                            'original_filename': 'document.pdf',
                            'file_size': 1024,
                            'mime_type': 'application/pdf',
                            'uploaded_at': '2024-01-01T00:00:00Z',
                            'download_url': 'http://localhost:8000/api/files/550e8400-e29b-41d4-a716-446655440000/download/'
                        },
                        response_only=True,
                        status_codes=['200']
                    )
                ]
            ),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(
                description='File not found or not owned by user',
                examples=[
                    OpenApiExample(
                        'Not Found',
                        value={'detail': 'Not found.'},
                        response_only=True,
                        status_codes=['404']
                    )
                ]
            )
        }
    ),
    update=extend_schema(
        tags=['files'],
        operation_id='files_update',
        summary='Update file (full)',
        description='Fully updates a file attachment. Note: This endpoint is typically not used as file metadata is usually immutable after upload.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='File attachment UUID',
                required=True
            )
        ],
        responses={
            200: OpenApiResponse(response=FileAttachmentSerializer, description='File updated'),
            400: OpenApiResponse(description='Validation error'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='File not found')
        }
    ),
    partial_update=extend_schema(
        tags=['files'],
        operation_id='files_partial_update',
        summary='Update file (partial)',
        description='Partially updates a file attachment. Note: This endpoint is typically not used as file metadata is usually immutable after upload.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='File attachment UUID',
                required=True
            )
        ],
        responses={
            200: OpenApiResponse(response=FileAttachmentSerializer, description='File updated'),
            400: OpenApiResponse(description='Validation error'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='File not found')
        }
    ),
    destroy=extend_schema(
        tags=['files'],
        operation_id='files_destroy',
        summary='Delete file',
        description='Deletes a file attachment from the database. Users can only delete their own files. The file record and binary content are permanently removed from the database. No filesystem cleanup is needed since files are stored in the database.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.PATH,
                description='File attachment UUID',
                required=True
            )
        ],
        responses={
            204: OpenApiResponse(description='File deleted successfully (no content)'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(
                description='File not found or not owned by user',
                examples=[
                    OpenApiExample(
                        'Not Found',
                        value={'detail': 'Not found.'},
                        response_only=True,
                        status_codes=['404']
                    )
                ]
            )
        }
    )
)


class AgentTemplateViewSet(viewsets.GenericViewSet,
                               viewsets.mixins.ListModelMixin,
                               viewsets.mixins.RetrieveModelMixin):
    """
    API endpoint for browsing agent templates.

    Features:
    - Lists all active templates
    - Read-only (no create/update/delete for users)
    - Public access (no authentication required)
    - Templates can be instantiated via /api/agents/instantiate-template/
    """
    serializer_class = AgentTemplateSerializer
    permission_classes = [AllowAny]  # Public endpoint
    queryset = AgentTemplate.objects.filter(is_active=True)

    @extend_schema(
        tags=['agent-templates'],
        operation_id='agent_templates_list',
        summary='List all active agent templates grouped by category',
        description=(
            'Returns all active agent templates grouped by category. '
            'Authentication not required - this is a public endpoint.'
            '\n\n'
            'Response structure:\n'
            '```json\n'
            '[\n'
            '  {\n'
            '    "category_display_name": "Business & Productivity",\n'
            '    "category_icon": "💼",\n'
            '    "templates": [\n'
            '      { "id": "uuid", "name": "Research Assistant", ... },\n'
            '      { "id": "uuid", "name": "Data Analyst", ... }\n'
            '    ]\n'
            '  },\n'
            '  {\n'
            '    "category_display_name": "Communication & Marketing",\n'
            '    "category_icon": "📧",\n'
            '    "templates": [ ... ]\n'
            '  }\n'
            ']\n'
            '```'
        ),
        responses={
            200: OpenApiResponse(
                description='Templates grouped by category'
            )
        }
    )
    def list(self, request, *args, **kwargs):
        """List all active agent templates grouped by category"""
        queryset = self.get_queryset()

        # Group templates by category with category metadata
        grouped_data = {}
        for template in queryset:
            category = template.category
            if category not in grouped_data:
                grouped_data[category] = {
                    'category_display_name': template.category_display_name,
                    'category_icon': template.category_icon,
                    'templates': []
                }

            serializer = self.get_serializer(template)
            template_data = serializer.data
            
            # Remove category fields from template data
            template_data.pop('category_display_name', None)
            template_data.pop('category_icon', None)
            
            grouped_data[category]['templates'].append(template_data)

        # Convert to array format
        result = [
            {
                'category_display_name': data['category_display_name'],
                'category_icon': data['category_icon'],
                'templates': data['templates']
            }
            for data in grouped_data.values()
        ]

        return Response(result)

    @extend_schema(
        tags=['agent-templates'],
        operation_id='agent_templates_retrieve',
        summary='Get a specific agent template',
        description='Returns detailed information about a specific agent template. Authentication not required.',
        responses={
            200: OpenApiResponse(
                response=AgentTemplateSerializer,
                description='Agent template details'
            ),
            404: OpenApiResponse(description='Template not found')
        }
    )
    def retrieve(self, request, *args, **kwargs):
        """Get a specific agent template"""
        return super().retrieve(request, *args, **kwargs)
