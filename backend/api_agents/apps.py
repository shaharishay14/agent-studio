from django.apps import AppConfig


class ApiAgentsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api_agents'
    
    def ready(self):
        # Import and register spectacular extensions after Django is fully initialized
        from . import spectacular_extensions  # noqa

