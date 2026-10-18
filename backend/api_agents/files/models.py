from django.db import models
from django.conf import settings


class FileAttachment(models.Model):
    """File attachments for messages - stored in database as binary data"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attachments')
    agent = models.ForeignKey('api_agents.Agent', on_delete=models.CASCADE, related_name='files', null=True, blank=True, help_text="Agent this file belongs to")
    file_content = models.BinaryField(help_text="Binary file content stored in database", null=True, blank=True)
    original_filename = models.CharField(max_length=255)
    file_size = models.IntegerField(help_text="Size in bytes", default=0)
    mime_type = models.CharField(max_length=100, default='application/octet-stream')
    is_temporary = models.BooleanField(default=False, help_text="If True, file will be auto-deleted after being used in a message")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    # Content extraction fields
    extracted_text = models.TextField(blank=True, null=True, help_text="Extracted text content for searchable files (PDFs, DOCX, TXT, code)")
    extraction_status = models.CharField(
        max_length=20,
        default='pending',
        choices=[
            ('pending', 'Pending'),
            ('success', 'Success'),
            ('failed', 'Failed'),
            ('not_applicable', 'Not Applicable')
        ],
        help_text="Status of text extraction process"
    )

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        agent_name = self.agent.name if self.agent else 'No Agent'
        return f"{self.original_filename} ({self.user.username} - {agent_name})"

    def get_file_content(self):
        """Returns the file content as bytes"""
        if not self.file_content:
            return None
        # BinaryField can return bytes or memoryview depending on database backend
        if isinstance(self.file_content, bytes):
            return self.file_content
        elif isinstance(self.file_content, memoryview):
            return self.file_content.tobytes()
        else:
            return bytes(self.file_content)
