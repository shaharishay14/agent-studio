from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile
from .models import Agent, ComposioConnection, ChatMessage, FileAttachment, Trigger, TriggerExecution


@admin.register(Agent)
class AgentAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'created_at', 'updated_at']
    list_filter = ['created_at', 'user']
    search_fields = ['name', 'prompt', 'user__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(ComposioConnection)
class ComposioConnectionAdmin(admin.ModelAdmin):
    list_display = ['user', 'tool_name', 'is_active', 'connected_at', 'last_used']
    list_filter = ['is_active', 'tool_name', 'connected_at']
    search_fields = ['user__username', 'tool_name']
    readonly_fields = ['connected_at', 'last_used']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['agent', 'role', 'content_preview', 'created_at']
    list_filter = ['role', 'created_at', 'agent']
    search_fields = ['content', 'agent__name']
    readonly_fields = ['created_at']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(FileAttachment)
class FileAttachmentAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'user', 'file_size', 'mime_type', 'uploaded_at']
    list_filter = ['uploaded_at', 'mime_type']
    search_fields = ['original_filename', 'user__username']
    readonly_fields = ['uploaded_at']


@admin.register(Trigger)
class TriggerAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'agent', 'trigger_type', 'status', 'trigger_count', 'last_triggered', 'created_at']
    list_filter = ['trigger_type', 'status', 'created_at']
    search_fields = ['name', 'description', 'user__username', 'agent__name']
    readonly_fields = ['created_at', 'updated_at', 'trigger_count', 'last_triggered']


@admin.register(TriggerExecution)
class TriggerExecutionAdmin(admin.ModelAdmin):
    list_display = ['trigger', 'triggered_at', 'success']
    list_filter = ['success', 'triggered_at']
    search_fields = ['trigger__name', 'agent_response']
    readonly_fields = ['triggered_at']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'is_verified', 'created_at', 'updated_at']
    list_filter = ['is_verified', 'created_at']
    search_fields = ['user__username', 'user__email']
    readonly_fields = ['created_at', 'updated_at']


# Add UserProfile inline to User admin
class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'


# Extend User admin to include UserProfile
# Only unregister if it's already registered (Django's default User)
try:
    from django.contrib.auth.models import User as DefaultUser
    if admin.site.is_registered(DefaultUser):
        admin.site.unregister(DefaultUser)
except:
    pass

# Register our custom User model
if not admin.site.is_registered(User):
    @admin.register(User)
    class UserAdmin(BaseUserAdmin):
        inlines = (UserProfileInline,)

