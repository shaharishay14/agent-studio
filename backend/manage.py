#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
import warnings

# Suppress deprecation warnings from dj-rest-auth (third-party library)
# These warnings are from the library itself, not our code
# Must be set before Django imports to catch warnings during import
warnings.filterwarnings('ignore', message='.*USERNAME_REQUIRED is deprecated.*')
warnings.filterwarnings('ignore', message='.*EMAIL_REQUIRED is deprecated.*')
warnings.filterwarnings('ignore', category=UserWarning, module='dj_rest_auth')

def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()

