from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api_agents', '0020_tool_permissions'),
    ]

    operations = [
        migrations.AddField(
            model_name='messagingchannel',
            name='webhook_secret',
            field=models.CharField(blank=True, help_text='Secret Telegram sends in X-Telegram-Bot-Api-Secret-Token', max_length=64),
        ),
        migrations.AddField(
            model_name='messagingchannel',
            name='owner_external_user_id',
            field=models.CharField(blank=True, help_text='Platform user ID of the agent owner', max_length=200),
        ),
        migrations.AddField(
            model_name='messagingchannel',
            name='owner_link_code',
            field=models.CharField(blank=True, help_text='One-time code the owner sends as /link <code>', max_length=16),
        ),
        migrations.AddField(
            model_name='messagingsession',
            name='recent_messages',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
