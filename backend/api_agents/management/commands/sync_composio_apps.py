"""
Django management command to sync Composio apps and their action slugs dynamically.

This command fetches all available apps (toolkits) and their action slugs from the Composio API
and generates/updates the composio_config.py file automatically.

Usage:
    python manage.py sync_composio_apps
"""

from django.core.management.base import BaseCommand
from django.conf import settings
from composio import Composio
from composio_openai_agents import OpenAIAgentsProvider
import os
import json
from pathlib import Path


class Command(BaseCommand):
    help = 'Sync all Composio apps and their action slugs from Composio API'

    def _get_app_category(self, app_slug: str) -> str:
        """
        Map app slugs to appropriate categories based on their primary function.
        Categories: Email, Storage, Communication, Productivity, Social, Developer, Collaboration
        """
        category_map = {
            # Email
            'gmail': 'email',
            'outlook': 'email',

            # Storage
            'googledrive': 'storage',
            'dropbox': 'storage',

            # Communication
            'slack': 'communication',
            'zoom': 'communication',
            'googlemeet': 'communication',
            'whatsapp': 'communication',

            # Productivity
            'googlecalendar': 'productivity',
            'googledocs': 'productivity',
            'googlesheets': 'productivity',
            'googleslides': 'productivity',
            'notion': 'productivity',
            'airtable': 'productivity',
            'asana': 'productivity',
            'clickup': 'productivity',
            'monday': 'productivity',
            'todoist': 'productivity',
            'linear': 'productivity',
            'stripe': 'productivity',
            'shopify': 'productivity',

            # Social
            'twitter': 'social',
            'facebook': 'social',
            'instagram': 'social',
            'linkedin': 'social',
            'reddit': 'social',

            # Developer
            'github': 'developer',

            # Collaboration
            'figma': 'collaboration',
            'canva': 'collaboration',
        }

        return category_map.get(app_slug.lower(), 'productivity')

    def add_arguments(self, parser):
        parser.add_argument(
            '--limit',
            type=int,
            default=500,
            help='Maximum number of actions to fetch per app (default: 500)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Preview changes without writing to file'
        )
        parser.add_argument(
            '--apps',
            type=str,
            help='Comma-separated list of app slugs to sync (e.g., "gmail,slack,notion"). If not specified, reads from auth_configs.json.'
        )

    def handle(self, *args, **options):
        limit = options['limit']
        dry_run = options['dry_run']
        apps_filter = options.get('apps')

        # Determine which apps to sync
        filter_app_slugs = None
        if apps_filter:
            # User provided --apps parameter
            filter_app_slugs = [slug.strip().lower() for slug in apps_filter.split(',')]
            self.stdout.write(self.style.SUCCESS(f'Starting Composio apps sync for: {", ".join(filter_app_slugs)}'))
        else:
            # Read from auth_configs.json
            auth_configs_path = Path(settings.BASE_DIR) / 'auth_configs.json'
            if auth_configs_path.exists():
                try:
                    with open(auth_configs_path, 'r') as f:
                        auth_configs = json.load(f)

                    # Extract app names and convert to lowercase slugs
                    filter_app_slugs = [app_name.lower() for app_name in auth_configs.keys()]
                    self.stdout.write(self.style.SUCCESS(f'Found {len(filter_app_slugs)} apps in auth_configs.json'))
                    self.stdout.write(self.style.SUCCESS(f'Syncing: {", ".join(sorted(filter_app_slugs))}'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'Error reading auth_configs.json: {e}'))
                    return
            else:
                self.stdout.write(self.style.ERROR(f'auth_configs.json not found at {auth_configs_path}'))
                self.stdout.write(self.style.WARNING('Please provide --apps parameter or create auth_configs.json'))
                return

        # Initialize Composio client
        composio_api_key = settings.COMPOSIO_API_KEY
        if not composio_api_key:
            self.stdout.write(self.style.ERROR('COMPOSIO_API_KEY not found in settings'))
            return

        try:
            composio_client = Composio(
                api_key=composio_api_key,
                provider=OpenAIAgentsProvider()
            )
            self.stdout.write(self.style.SUCCESS('✓ Connected to Composio API'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to initialize Composio client: {e}'))
            return

        # Fetch all toolkits (apps)
        self.stdout.write('Fetching available toolkits...')
        try:
            toolkits_response = composio_client.toolkits.list(
                sort_by="alphabetically",
                managed_by="all"
            )
            # Handle different response types
            if hasattr(toolkits_response, 'items'):
                all_toolkits = toolkits_response.items
            elif hasattr(toolkits_response, 'data'):
                all_toolkits = toolkits_response.data
            else:
                all_toolkits = list(toolkits_response)

            # Filter toolkits if --apps specified
            if filter_app_slugs:
                toolkits = [t for t in all_toolkits if t.slug.lower() in filter_app_slugs]
                self.stdout.write(self.style.SUCCESS(f'✓ Found {len(toolkits)} matching toolkits'))
            else:
                toolkits = all_toolkits
                self.stdout.write(self.style.SUCCESS(f'✓ Found {len(toolkits)} toolkits'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to fetch toolkits: {e}'))
            return

        # Build the data structures
        app_slugs = {}
        top_slugs_by_app = {}
        app_metadata = {}

        self.stdout.write('\nFetching actions for each app:')

        for toolkit in toolkits:
            toolkit_slug = toolkit.slug
            toolkit_name = toolkit.name.upper().replace(' ', '').replace('-', '_')

            # Clean up toolkit name for use as Python dictionary key
            # Remove special characters and ensure it's a valid identifier
            toolkit_name = ''.join(c if c.isalnum() or c == '_' else '_' for c in toolkit_name)

            self.stdout.write(f'  • {toolkit_name} ({toolkit_slug})...', ending='')

            try:
                # Fetch all actions for this toolkit
                tools_response = composio_client.tools.get_raw_composio_tools(
                    toolkits=[toolkit_slug],
                    limit=limit
                )

                # Extract action slugs
                action_slugs = [tool.slug for tool in tools_response]

                if action_slugs:
                    # Add to APP_SLUGS
                    app_slugs[toolkit_name] = toolkit_slug

                    # Add to TOP_SLUGS_BY_APP
                    top_slugs_by_app[toolkit_name] = action_slugs

                    # Add to APP_METADATA with proper category
                    app_metadata[toolkit_name] = {
                        "name": toolkit.name,
                        "description": getattr(toolkit, 'description', f"{toolkit.name} integration"),
                        "category": self._get_app_category(toolkit_slug)
                    }

                    self.stdout.write(self.style.SUCCESS(f' {len(action_slugs)} actions'))
                else:
                    self.stdout.write(self.style.WARNING(' no actions found, skipping'))

            except Exception as e:
                self.stdout.write(self.style.WARNING(f' error: {e}'))
                continue

        # Generate the Python file content
        file_content = self._generate_config_file(app_slugs, top_slugs_by_app, app_metadata)

        if dry_run:
            self.stdout.write(self.style.WARNING('\n--- DRY RUN MODE: Preview of composio_config.py ---'))
            self.stdout.write(file_content[:2000] + '\n... (truncated for preview)\n')
            self.stdout.write(self.style.SUCCESS(f'\nWould sync {len(app_slugs)} apps'))
        else:
            # Write to composio_config.py
            config_file_path = Path(settings.BASE_DIR) / 'api_agents' / 'composio_config.py'

            try:
                with open(config_file_path, 'w') as f:
                    f.write(file_content)

                self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully updated {config_file_path}'))
                self.stdout.write(self.style.SUCCESS(f'✓ Synced {len(app_slugs)} apps with {sum(len(v) for v in top_slugs_by_app.values())} total actions'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to write config file: {e}'))
                return

    def _generate_config_file(self, app_slugs, top_slugs_by_app, app_metadata):
        """Generate the Python code for composio_config.py"""

        lines = [
            '"""',
            'Composio App Configuration',
            '',
            'This file is AUTO-GENERATED by the sync_composio_apps management command.',
            'Do not edit manually. Run `python manage.py sync_composio_apps` to update.',
            '"""',
            '',
            '# App name to slug mapping',
            'APP_SLUGS = {'
        ]

        # Generate APP_SLUGS
        for app_name, slug in sorted(app_slugs.items()):
            lines.append(f'    "{app_name}": "{slug}",')
        lines.append('}')
        lines.append('')

        # Generate TOP_SLUGS_BY_APP
        lines.append('# Top action slugs by app')
        lines.append('TOP_SLUGS_BY_APP = {')

        for app_name in sorted(top_slugs_by_app.keys()):
            action_slugs = top_slugs_by_app[app_name]
            lines.append(f'    "{app_name}": [')
            for slug in action_slugs:
                lines.append(f'        "{slug}",')
            lines.append('    ],')
        lines.append('}')
        lines.append('')

        # Generate APP_METADATA
        lines.append('# App metadata for display purposes')
        lines.append('APP_METADATA = {')

        for app_name in sorted(app_metadata.keys()):
            metadata = app_metadata[app_name]
            lines.append(f'    "{app_name}": {{')
            lines.append(f'        "name": "{metadata["name"]}",')
            lines.append(f'        "description": "{metadata["description"]}",')
            lines.append(f'        "category": "{metadata["category"]}"')
            lines.append('    },')
        lines.append('}')
        lines.append('')

        return '\n'.join(lines)
