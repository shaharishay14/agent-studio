# Generated manually to add missing agent field to Workflow
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api_agents', '0015_fileattachment_extracted_text_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='workflow',
            name='agent',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='workflows',
                to='api_agents.agent'
            ),
        ),
    ]
