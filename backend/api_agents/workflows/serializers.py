from rest_framework import serializers
from ..workflows import models as workflow_models
from ..agents import models as agent_models
from ..agents.serializers import AgentSerializer


class TriggerSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    agent_name = serializers.ReadOnlyField(source='agent.name')

    class Meta:
        model = workflow_models.Trigger
        fields = [
            'id', 'user', 'agent', 'agent_name', 'name', 'description',
            'trigger_type', 'status', 'composio_trigger_id', 'trigger_slug',
            'trigger_config', 'action_prompt', 'trigger_count', 'last_triggered',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'trigger_count', 'last_triggered', 'composio_trigger_id']


class TriggerExecutionSerializer(serializers.ModelSerializer):
    trigger_name = serializers.ReadOnlyField(source='trigger.name')

    class Meta:
        model = workflow_models.TriggerExecution
        fields = [
            'id', 'trigger', 'trigger_name', 'triggered_at', 'event_data',
            'agent_response', 'success', 'error_message'
        ]
        read_only_fields = ['triggered_at']


class WorkflowSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    agents = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=agent_models.Agent.objects.all(),  # Will be filtered in validate
        required=False,
        allow_empty=True,
        help_text="List of agent IDs associated with this workflow"
    )
    execution_count = serializers.ReadOnlyField()
    nodes = serializers.IntegerField(read_only=True, help_text="Number of agents in the workflow (updated automatically)")

    class Meta:
        model = workflow_models.Workflow
        fields = [
            'id', 'user', 'agents', 'name', 'description', 'status',
            'nodes', 'execution_count', 'last_executed',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'execution_count', 'last_executed', 'nodes']

    def validate(self, attrs):
        """Remove edges, viewport, and nodes if they are sent in the request"""
        # Remove edges, viewport, and nodes from validated data if they exist
        # (nodes is updated automatically after saving agents)
        attrs.pop('edges', None)
        attrs.pop('viewport', None)
        attrs.pop('nodes', None)
        return attrs

    def validate_agents(self, value):
        """Validate that all agents belong to the current user and no duplicates exist"""
        if self.context.get('request'):
            user = self.context['request'].user
            agent_ids = []
            for agent in value:
                # Check if agent belongs to the current user
                if agent.user != user:
                    raise serializers.ValidationError(
                        f"Agent {agent.id} does not belong to the current user."
                    )
                # Check for duplicates
                if agent.id in agent_ids:
                    raise serializers.ValidationError(
                        {
                            "error": "duplicate_agent",
                            "message": "Cannot add the same agent twice to the workflow."
                        }
                    )
                agent_ids.append(agent.id)
        return value

    def create(self, validated_data):
        """Create workflow and update nodes count, preserving agent order"""
        agents = validated_data.pop('agents', [])
        workflow = super().create(validated_data)
        # Add agents one by one to preserve order (through model will track created_at)
        for agent in agents:
            workflow.agents.add(agent)
        workflow.update_nodes_count()
        return workflow

    def update(self, instance, validated_data):
        """Update workflow and update nodes count, preserving agent order"""
        agents = validated_data.pop('agents', None)
        workflow = super().update(instance, validated_data)
        if agents is not None:
            # Clear existing agents and add new ones in order
            workflow.agents.clear()
            # Add agents one by one to preserve order (through model will track created_at)
            for agent in agents:
                workflow.agents.add(agent)
        workflow.update_nodes_count()
        return workflow

    def to_representation(self, instance):
        """Custom representation to return full agent objects instead of just IDs, preserving order"""
        representation = super().to_representation(instance)
        # Override agents field to return full agent objects instead of just IDs
        # Get full agent objects from the many-to-many relationship, preserving order via through model
        # Use through model to get agents in the order they were added
        workflow_agents = instance.workflowagent_set.select_related('agent').order_by('created_at')
        if workflow_agents.exists():
            # Extract agents in order and serialize them
            agents = [wa.agent for wa in workflow_agents]
            agent_serializer = AgentSerializer(agents, many=True, context=self.context)
            representation['agents'] = agent_serializer.data
        else:
            representation['agents'] = []
        return representation


class WorkflowExecutionSerializer(serializers.ModelSerializer):
    workflow_name = serializers.ReadOnlyField(source='workflow.name')

    class Meta:
        model = workflow_models.WorkflowExecution
        fields = [
            'id', 'workflow', 'workflow_name', 'executed_at', 'input_data',
            'output_data', 'execution_trace', 'success', 'error_message',
            'execution_time_ms'
        ]
        read_only_fields = ['executed_at']
