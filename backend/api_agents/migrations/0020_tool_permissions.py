import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_agents', '0019_workflowagent_alter_workflow_agents'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='agent',
            name='unattended_write_tools',
            field=models.JSONField(blank=True, default=list, help_text="Write tool slugs allowed without live approval, e.g. ['GMAIL_SEND_EMAIL']"),
        ),
        migrations.CreateModel(
            name='ToolApproval',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('tool_name', models.CharField(max_length=200)),
                ('arguments', models.JSONField(default=dict, help_text='Exact arguments the agent wants to run the tool with')),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('denied', 'Denied'), ('expired', 'Expired'), ('preapproved', 'Pre-approved')], default='pending', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('decided_at', models.DateTimeField(blank=True, null=True)),
                ('agent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tool_approvals', to='api_agents.agent')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='tool_approvals', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
