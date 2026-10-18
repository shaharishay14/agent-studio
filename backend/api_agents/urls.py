"""
Main API URL Configuration - Routes to domain-specific URL modules
"""
from django.urls import path, include


urlpatterns = [
    # Authentication endpoints
    path('auth/', include('api_agents.authentication.urls')),

    # Agent management
    path('agents/', include('api_agents.agents.urls')),

    # Workflow management
    path('workflows/', include('api_agents.workflows.urls')),

    # File attachments
    path('files/', include('api_agents.files.urls')),

    # Credit management
    path('credits/', include('api_agents.credits.urls')),

    # Tool/Connection management
    path('connections/', include('api_agents.tools.urls')),

    # Messaging and bot integrations
    path('messaging/', include('api_agents.messaging.urls')),
]

