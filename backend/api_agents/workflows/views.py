import traceback
import asyncio
import time

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiResponse, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from ..workflows.models import Trigger, TriggerExecution, Workflow, WorkflowExecution
from ..agents.models import Agent, ChatMessage
from ..agents.services.agent_service import AgentService
from ..serializers import UnifiedAgentCreateSerializer, AgentSerializer
from . import serializers
from .serializers import (
    TriggerSerializer, TriggerExecutionSerializer,
    WorkflowSerializer, WorkflowExecutionSerializer
)


@extend_schema_view(
    list=extend_schema(
        tags=['triggers'],
        operation_id='triggers_list',
        summary='List all triggers',
        description='Returns list of all triggers owned by the authenticated user. Automation triggers API. All endpoints require authentication.',
        responses={
            200: OpenApiResponse(response=TriggerSerializer(many=True), description='List of triggers'),
            401: OpenApiResponse(description='Authentication required')
        }
    ),
    create=extend_schema(
        tags=['triggers'],
        operation_id='triggers_create',
        summary='Create a new trigger',
        description='Creates a new automation trigger. All endpoints require authentication.',
        request=TriggerSerializer,
        responses={
            201: OpenApiResponse(response=TriggerSerializer, description='Trigger created'),
            400: OpenApiResponse(description='Validation error'),
            401: OpenApiResponse(description='Authentication required')
        }
    ),
    retrieve=extend_schema(
        tags=['triggers'],
        operation_id='triggers_retrieve',
        summary='Get trigger details',
        description='Returns details of a specific trigger by ID. All endpoints require authentication.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Trigger ID (integer)',
                required=True
            )
        ],
        responses={
            200: OpenApiResponse(response=TriggerSerializer, description='Trigger details'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Trigger not found')
        }
    ),
    update=extend_schema(
        tags=['triggers'],
        operation_id='triggers_update',
        summary='Update trigger (full)',
        description='Fully updates a trigger. All fields are required. All endpoints require authentication.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Trigger ID (integer)',
                required=True
            )
        ],
        request=TriggerSerializer,
        responses={
            200: OpenApiResponse(response=TriggerSerializer, description='Trigger updated'),
            400: OpenApiResponse(description='Validation error'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Trigger not found')
        }
    ),
    partial_update=extend_schema(
        tags=['triggers'],
        operation_id='triggers_partial_update',
        summary='Update trigger (partial)',
        description='Partially updates a trigger. Only provided fields will be updated. All endpoints require authentication.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Trigger ID (integer)',
                required=True
            )
        ],
        request=TriggerSerializer,
        responses={
            200: OpenApiResponse(response=TriggerSerializer, description='Trigger updated'),
            400: OpenApiResponse(description='Validation error'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Trigger not found')
        }
    ),
    destroy=extend_schema(
        tags=['triggers'],
        operation_id='triggers_destroy',
        summary='Delete trigger',
        description='Deletes a trigger by ID. All endpoints require authentication.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Trigger ID (integer)',
                required=True
            )
        ],
        responses={
            204: OpenApiResponse(description='Trigger deleted successfully'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Trigger not found')
        }
    )
)
class TriggerViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing Triggers (e.g., "on new email...").
    """
    serializer_class = TriggerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Ensures users can only see their own triggers.
        """
        return Trigger.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def available(self, request):
        """
        Returns the hardcoded list of available trigger types for the UI.
        """
        agent_service = AgentService(request.user)
        triggers = agent_service.get_available_triggers()
        return Response(triggers)

    def perform_create(self, serializer):
        """
        Called when a new trigger is created.
        """
        trigger = serializer.save(user=self.request.user)

        # If it's an event-based trigger, register it with Composio
        if trigger.trigger_type == 'event':
            try:
                agent_service = AgentService(self.request.user)
                result = agent_service.create_trigger(trigger)

                if result.get('success'):
                    trigger.composio_trigger_id = result.get('trigger_id', '')
                    trigger.save()
                    print(f"✅ Trigger created in Composio: {trigger.composio_trigger_id}")
                else:
                    print(f"⚠️ Failed to create trigger in Composio: {result.get('error')}")

            except Exception as e:
                print(f"❌ Error creating trigger in Composio: {e}")
                traceback.print_exc()

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Sets a trigger's status to 'active'.
        """
        trigger = self.get_object()
        trigger.status = 'active'
        trigger.save()
        return Response({'status': 'Trigger activated'})

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """
        Sets a trigger's status to 'paused'.
        """
        trigger = self.get_object()
        trigger.status = 'paused'
        trigger.save()
        return Response({'status': 'Trigger paused'})

    @action(detail=True, methods=['post'])
    def stop(self, request, pk=None):
        """
        Sets a trigger's status to 'stopped'.
        """
        trigger = self.get_object()
        trigger.status = 'stopped'
        trigger.save()
        return Response({'status': 'Trigger stopped'})

    @action(detail=True, methods=['get'])
    def executions(self, request, pk=None):
        """
        Gets the 50 most recent execution logs for a trigger.
        """
        trigger = self.get_object()
        executions = TriggerExecution.objects.filter(trigger=trigger)[:50]
        serializer = TriggerExecutionSerializer(executions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def test(self, request, pk=None):
        """
        Manually runs a trigger's action prompt.
        """
        trigger = self.get_object()

        try:
            agent_service = AgentService(request.user)
            print("--- [TEST TRIGGER] ---")

            # 1. Get history (to provide context)
            chat_history_qs = ChatMessage.objects.filter(agent=trigger.agent).order_by('-created_at')[:6]
            chat_history = list(chat_history_qs)
            chat_history.reverse()
            chat_history_formatted = [{"role": msg.role, "content": msg.content} for msg in chat_history]

            # 2. Get test prompt
            test_prompt = f"[TEST TRIGGER] {trigger.action_prompt}"
            chat_history_formatted.append({"role": "user", "content": test_prompt})

            # 3. Select tools for this prompt
            specific_tools_slugs = agent_service.select_tools_for_prompt(
                user_prompt=test_prompt,
                app_names=trigger.agent.app_connections,
                chat_history=chat_history_formatted
            )

            # 4. Execute
            if not specific_tools_slugs:
                response = asyncio.run(agent_service._chat_without_tools(
                    agent_model=trigger.agent,
                    message=test_prompt,
                    chat_history=chat_history_formatted
                ))
            else:
                response = asyncio.run(agent_service._chat_with_composio(
                    agent_model=trigger.agent,
                    message=test_prompt,
                    specific_tools_slugs=specific_tools_slugs,
                    chat_history=chat_history_formatted
                ))

            # 5. Log the execution
            execution = TriggerExecution.objects.create(
                trigger=trigger,
                event_data={'test': True, 'manual_trigger': True},
                agent_response=response,
                success=True
            )

            trigger.trigger_count += 1
            trigger.save()

            return Response({
                'success': True,
                'response': response,
                'execution_id': execution.id
            })

        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@extend_schema_view(
    list=extend_schema(
        tags=['workflows'],
        operation_id='workflows_list',
        summary='List all workflows',
        description='Returns list of all workflows owned by the authenticated user. Visual workflow management API. All endpoints require authentication.',
        responses={
            200: OpenApiResponse(response=WorkflowSerializer(many=True), description='List of workflows'),
            401: OpenApiResponse(description='Authentication required')
        }
    ),
    create=extend_schema(
        tags=['workflows'],
        operation_id='workflows_create',
        summary='Create a new workflow',
        description='Creates a new visual workflow. All endpoints require authentication.',
        request=WorkflowSerializer,
        responses={
            201: OpenApiResponse(response=WorkflowSerializer, description='Workflow created'),
            400: OpenApiResponse(description='Validation error'),
            401: OpenApiResponse(description='Authentication required')
        }
    ),
    retrieve=extend_schema(
        tags=['workflows'],
        operation_id='workflows_retrieve',
        summary='Get workflow details',
        description='Returns details of a specific workflow by ID. All endpoints require authentication.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Workflow ID (integer)',
                required=True
            )
        ],
        responses={
            200: OpenApiResponse(response=WorkflowSerializer, description='Workflow details'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Workflow not found')
        }
    ),
    update=extend_schema(
        tags=['workflows'],
        operation_id='workflows_update',
        summary='Update workflow (full)',
        description='Fully updates a workflow. All fields are required. All endpoints require authentication.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Workflow ID (integer)',
                required=True
            )
        ],
        request=WorkflowSerializer,
        responses={
            200: OpenApiResponse(response=WorkflowSerializer, description='Workflow updated'),
            400: OpenApiResponse(description='Validation error'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Workflow not found')
        }
    ),
    partial_update=extend_schema(
        tags=['workflows'],
        operation_id='workflows_partial_update',
        summary='Update workflow (partial)',
        description='Partially updates a workflow. Only provided fields will be updated. All endpoints require authentication.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Workflow ID (integer)',
                required=True
            )
        ],
        request=WorkflowSerializer,
        responses={
            200: OpenApiResponse(response=WorkflowSerializer, description='Workflow updated'),
            400: OpenApiResponse(description='Validation error'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Workflow not found')
        }
    ),
    destroy=extend_schema(
        tags=['workflows'],
        operation_id='workflows_destroy',
        summary='Delete workflow',
        description='Deletes a workflow by ID. All endpoints require authentication.',
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Workflow ID (integer)',
                required=True
            )
        ],
        responses={
            204: OpenApiResponse(description='Workflow deleted successfully'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Workflow not found')
        }
    )
)
class WorkflowViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing visual Workflows (e.g., React Flow).
    """
    serializer_class = WorkflowSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Ensures users can only see their own workflows.
        """
        return Workflow.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        Associates the workflow with the current user.
        """
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['get'])
    def executions(self, request, pk=None):
        """
        Gets the 50 most recent execution logs for a workflow.
        """
        workflow = self.get_object()
        executions = WorkflowExecution.objects.filter(workflow=workflow)[:50]
        serializer = WorkflowExecutionSerializer(executions, many=True)
        return Response(serializer.data)

    @extend_schema(
        tags=['workflows'],
        operation_id='workflows_execute',
        summary='Execute workflow with agent',
        description='Executes a workflow by sending a prompt to a specific agent. Returns the agent response along with agent details.',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'prompt': {
                        'type': 'string',
                        'description': 'Message/prompt to send to the agent (required)'
                    },
                    'agent_id': {
                        'type': 'string',
                        'format': 'uuid',
                        'description': 'UUID of the agent to execute (required)'
                    }
                },
                'required': ['prompt', 'agent_id']
            }
        },
        responses={
            200: OpenApiResponse(
                description='Workflow executed successfully. Returns agent details, chat response message, and execution details.',
                examples=[
                    OpenApiExample(
                        'Execute Success',
                        value={
                            'success': True,
                            'agent': {
                                'id': '3fa85f64-5717-4562-b3fc-2c963f66afa6',
                                'name': 'Email Assistant',
                                'prompt': 'You are an email assistant...',
                                'app_connections': ['GMAIL'],
                                'agent_tools': [],
                                'user': 'username',
                                'created_at': '2024-01-01T00:00:00Z',
                                'updated_at': '2024-01-01T00:00:00Z'
                            },
                            'message': 'The agent response text from OpenAI chat...',
                            'execution': {
                                'id': 1,
                                'executed_at': '2024-01-01T00:00:00Z',
                                'execution_time_ms': 1234,
                                'success': True
                            }
                        },
                        response_only=True,
                        status_codes=['200']
                    )
                ]
            ),
            400: OpenApiResponse(description='Validation error - prompt or agent_id missing, or agent not in workflow'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Workflow or agent not found')
        }
    )
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """
        Executes a workflow by sending a prompt to a specific agent.
        Returns the agent response along with agent details.
        """
        workflow = self.get_object()

        try:
            start_time = time.time()

            # Validate request data
            prompt = request.data.get('prompt', '').strip()
            agent_id = request.data.get('agent_id')

            if not prompt:
                return Response(
                    {'error': 'prompt is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not agent_id:
                return Response(
                    {'error': 'agent_id is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get the agent and verify it belongs to the workflow
            try:
                agent = Agent.objects.get(id=agent_id, user=request.user)
            except Agent.DoesNotExist:
                return Response(
                    {'error': 'Agent not found or does not belong to you'},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Verify agent is in the workflow
            if not workflow.agents.filter(id=agent.id).exists():
                return Response(
                    {'error': 'Agent is not part of this workflow'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Initialize agent service
            agent_service = AgentService(request.user)

            # Build chat history (last 10 messages for context)
            chat_history_formatted = []
            chat_history_qs = ChatMessage.objects.filter(agent=agent).order_by('-created_at')[:10]
            chat_history = list(chat_history_qs)
            chat_history.reverse()  # Put in chronological order (oldest first)

            for msg in chat_history:
                chat_history_formatted.append({
                    "role": msg.role,
                    "content": msg.content
                })

            # Select tools for the prompt
            specific_tools_slugs = asyncio.run(
                agent_service.select_tools_for_prompt(
                    user_prompt=prompt,
                    app_names=agent.app_connections,
                    chat_history=chat_history_formatted,
                    has_file_attachments=False
                )
            )

            # Determine which chat method to use
            has_composio_tools = bool(specific_tools_slugs and agent_service.composio_client)
            has_agent_tools = bool(agent.agent_tools)

            # Execute chat (non-streaming, synchronous)
            async def run_chat():
                if has_composio_tools and has_agent_tools:
                    # Agent has both Composio and agent tools
                    response = await agent_service._chat_with_mixed_tools(
                        agent_model=agent,
                        message=prompt,
                        composio_tool_slugs=specific_tools_slugs,
                        chat_history=chat_history_formatted,
                        callback=None  # No streaming for execute
                    )
                elif has_composio_tools:
                    # Only Composio tools
                    response = await agent_service._chat_with_composio(
                        agent_model=agent,
                        message=prompt,
                        specific_tools_slugs=specific_tools_slugs,
                        chat_history=chat_history_formatted,
                        callback=None,
                        file_attachments=None
                    )
                elif has_agent_tools:
                    # Only agent tools
                    response = await agent_service._chat_with_agent_tools(
                        agent_model=agent,
                        message=prompt,
                        chat_history=chat_history_formatted,
                        callback=None,
                        file_attachments=None
                    )
                else:
                    # No tools - basic chat
                    response = await agent_service._chat_without_tools(
                        agent_model=agent,
                        message=prompt,
                        chat_history=chat_history_formatted,
                        callback=None
                    )
                return response

            # Run the chat
            agent_response = asyncio.run(run_chat())

            # Save execution log
            execution_time_ms = int((time.time() - start_time) * 1000)
            execution = WorkflowExecution.objects.create(
                workflow=workflow,
                input_data={'prompt': prompt, 'agent_id': str(agent_id)},
                output_data={'response': agent_response},
                execution_trace=[
                    {'step': 1, 'agent': agent.name, 'status': 'completed', 'response_length': len(agent_response)}
                ],
                success=True,
                execution_time_ms=execution_time_ms
            )

            # Update workflow statistics
            workflow.execution_count += 1
            workflow.last_executed = execution.executed_at
            workflow.save()

            # Serialize agent details
            agent_serializer = AgentSerializer(agent, context={'request': request})

            return Response({
                'success': True,
                'agent': agent_serializer.data,
                'message': agent_response,  # Response from OpenAI chat
                'execution': WorkflowExecutionSerializer(execution).data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """
        Sets a workflow's status to 'active'.
        """
        workflow = self.get_object()
        workflow.status = 'active'
        workflow.save()
        return Response(WorkflowSerializer(workflow).data)

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """
        Sets a workflow's status to 'paused'.
        """
        workflow = self.get_object()
        workflow.status = 'paused'
        workflow.save()
        return Response(WorkflowSerializer(workflow).data)

    @action(detail=False, methods=['post'])
    def duplicate(self, request):
        """
        Creates a copy of an existing workflow.
        """
        try:
            workflow_id = request.data.get('workflow_id')
            original = Workflow.objects.get(id=workflow_id, user=request.user)

            # Create a copy
            workflow = Workflow.objects.create(
                user=request.user,
                name=f"{original.name} (Copy)",
                description=original.description,
                status='draft'
            )
            # Copy agents from original workflow, preserving order
            # Get agents in order from through model
            original_agents = original.workflowagent_set.select_related('agent').order_by('created_at')
            for workflow_agent in original_agents:
                workflow.agents.add(workflow_agent.agent)
            # Update nodes count
            workflow.update_nodes_count()

            return Response(WorkflowSerializer(workflow).data, status=status.HTTP_201_CREATED)

        except Workflow.DoesNotExist:
            return Response(
                {'error': 'Workflow not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @extend_schema(
        tags=['workflows'],
        operation_id='workflows_create_agent',
        summary='Create agent from workflow (YOLO mode)',
        description='Creates a new agent in YOLO mode (prompt only) and automatically adds it to the workflow. The agent name will be auto-generated from the prompt.',
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'prompt': {
                        'type': 'string',
                        'description': 'System prompt for the agent (required)'
                    }
                },
                'required': ['prompt']
            }
        },
        responses={
            201: OpenApiResponse(
                response=AgentSerializer,
                description='Agent created and added to workflow successfully'
            ),
            400: OpenApiResponse(description='Validation error - prompt is required'),
            401: OpenApiResponse(description='Authentication required'),
            404: OpenApiResponse(description='Workflow not found')
        }
    )
    @action(detail=True, methods=['post'], url_path='create-agent')
    def create_agent(self, request, pk=None):
        """
        Creates a new agent in YOLO mode (prompt only) and automatically adds it to the workflow.
        Based on the agent creation logic from AgentViewSet._create_manual_or_yolo.
        """
        workflow = self.get_object()
        
        # Validate request data
        prompt = request.data.get('prompt', '').strip()
        if not prompt:
            return Response(
                {'error': 'prompt is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Generate agent name (YOLO mode - auto-generate from prompt)
            name = self._generate_agent_name(prompt, [], [])
            
            # Get random default avatar
            avatar_data, avatar_filename, avatar_mime = self._get_random_default_avatar()
            
            # Create the agent (YOLO mode - no tools by default)
            agent = Agent.objects.create(
                user=request.user,
                name=name,
                prompt=prompt,
                avatar_image=avatar_data,
                avatar_filename=avatar_filename,
                avatar_mime_type=avatar_mime,
                app_connections=[],  # No Composio apps by default
                agent_tools=[],  # No agent tools by default
                tools=[]
            )
            
            # Add agent to workflow (preserving order via through model)
            workflow.agents.add(agent)
            
            # Update nodes count
            workflow.update_nodes_count()
            
            print(f"✅ Created agent '{agent.name}' (ID: {agent.id}) and added to workflow '{workflow.name}' (ID: {workflow.id})")
            
            # Serialize and return the agent
            agent_serializer = AgentSerializer(agent, context={'request': request})
            return Response(agent_serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _generate_agent_name(self, prompt: str, app_connections: list = None, agent_tools: list = None) -> str:
        """
        Generates an agent name from the prompt and tools using OpenAI.
        Returns a short, descriptive name (2-3 words max).
        Based on AgentViewSet._generate_agent_name.
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

    def _get_random_default_avatar(self):
        """
        Randomly selects a default avatar image from static/default_avatars_clouds/ folder.
        Returns tuple: (binary_data, filename, mime_type) or (None, None, None) if no images found.
        Based on AgentViewSet._get_random_default_avatar.
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
