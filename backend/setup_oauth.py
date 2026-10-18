#!/usr/bin/env python
"""
Helper script to configure OAuth social applications in Django Admin.
Run this after you've added your OAuth credentials to .env
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.sites.models import Site
from allauth.socialaccount.models import SocialApp

def setup_oauth():
    """Configure OAuth social applications"""
    
    print("🔧 Setting up OAuth for AI Agent Creator...\n")
    
    # 1. Update or create the Site
    print("1️⃣  Configuring Site...")
    site, created = Site.objects.get_or_create(
        pk=1,
        defaults={
            'domain': 'localhost:8000',
            'name': 'AI Agent Creator'
        }
    )
    if not created:
        site.domain = 'localhost:8000'
        site.name = 'AI Agent Creator'
        site.save()
    print(f"   ✅ Site configured: {site.domain}")
    
    # 2. Get OAuth credentials from environment
    google_client_id = os.getenv('GOOGLE_CLIENT_ID', '')
    google_client_secret = os.getenv('GOOGLE_CLIENT_SECRET', '')
    github_client_id = os.getenv('GITHUB_CLIENT_ID', '')
    github_client_secret = os.getenv('GITHUB_CLIENT_SECRET', '')
    
    # 3. Setup Google OAuth
    print("\n2️⃣  Setting up Google OAuth...")
    if google_client_id and google_client_secret and google_client_id != 'your-google-client-id-here':
        google_app, created = SocialApp.objects.get_or_create(
            provider='google',
            defaults={
                'name': 'Google OAuth',
                'client_id': google_client_id,
                'secret': google_client_secret,
            }
        )
        if not created:
            google_app.client_id = google_client_id
            google_app.secret = google_client_secret
            google_app.save()
        
        google_app.sites.add(site)
        print(f"   ✅ Google OAuth configured")
        print(f"      Client ID: {google_client_id[:20]}...")
    else:
        print("   ⚠️  Google credentials not found in .env")
        print("      Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET")
    
    # 4. Setup GitHub OAuth
    print("\n3️⃣  Setting up GitHub OAuth...")
    if github_client_id and github_client_secret and github_client_id != 'your-github-client-id-here':
        github_app, created = SocialApp.objects.get_or_create(
            provider='github',
            defaults={
                'name': 'GitHub OAuth',
                'client_id': github_client_id,
                'secret': github_client_secret,
            }
        )
        if not created:
            github_app.client_id = github_client_id
            github_app.secret = github_client_secret
            github_app.save()
        
        github_app.sites.add(site)
        print(f"   ✅ GitHub OAuth configured")
        print(f"      Client ID: {github_client_id[:20]}...")
    else:
        print("   ⚠️  GitHub credentials not found in .env")
        print("      Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET")
    
    print("\n" + "="*60)
    print("✨ OAuth setup complete!")
    print("="*60)
    print("\n📋 Next steps:")
    print("   1. Start your server: python manage.py runserver")
    print("   2. Visit Swagger UI: http://localhost:8000/api/docs/")
    print("   3. Test endpoints: /api/auth/google/ and /api/auth/github/")
    print("\n💡 Tip: Visit Django Admin to view/edit social apps:")
    print("   http://localhost:8000/admin/socialaccount/socialapp/")
    print()

if __name__ == '__main__':
    try:
        setup_oauth()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nMake sure you've:")
        print("  1. Created a .env file with OAuth credentials")
        print("  2. Run migrations: python manage.py migrate")
        print("  3. Activated your virtual environment")

