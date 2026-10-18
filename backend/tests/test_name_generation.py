#!/usr/bin/env python3
"""
Test script for debugging agent name generation
"""
import os
import sys
import django
import asyncio
from pathlib import Path

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
os.environ.setdefault('DJANGO_SECRET_KEY', 'test-key-for-debugging')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Load .env file if it exists
from dotenv import load_dotenv
env_path = BASE_DIR / '.env'
if env_path.exists():
    load_dotenv(env_path)

django.setup()

from openai import AsyncOpenAI
from django.conf import settings

async def test_async_openai():
    """Test async OpenAI client directly"""
    print("=" * 60)
    print("Testing Async OpenAI Client")
    print("=" * 60)

    api_key = settings.OPENAI_API_KEY

    if not api_key:
        print("❌ ERROR: OPENAI_API_KEY is not set in environment")
        return False

    print(f"✅ OpenAI API Key found: {api_key[:10]}...{api_key[-4:]}")

    try:
        client = AsyncOpenAI(api_key=api_key)
        print("✅ AsyncOpenAI client created successfully")

        # Test the actual call
        print("\n📞 Making test API call...")
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a naming assistant. Generate a 2-3 word name."},
                {"role": "user", "content": "Generate a name for an email assistant agent"}
            ],
            temperature=0.7,
            max_completion_tokens=30
        )

        generated_name = response.choices[0].message.content.strip()
        print(f"✅ OpenAI Response: '{generated_name}'")
        print(f"✅ Response type: {type(response)}")
        print(f"✅ Has choices: {hasattr(response, 'choices')}")

        return True

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_sync_with_asyncio_run():
    """Test calling async OpenAI with asyncio.run()"""
    print("\n" + "=" * 60)
    print("Testing with asyncio.run()")
    print("=" * 60)

    api_key = settings.OPENAI_API_KEY

    if not api_key:
        print("❌ ERROR: OPENAI_API_KEY is not set")
        return False

    try:
        async def call_openai():
            client = AsyncOpenAI(api_key=api_key)
            return await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a naming assistant. Generate a 2-3 word name."},
                    {"role": "user", "content": "Generate a name for a calendar assistant"}
                ],
                temperature=0.7,
                max_completion_tokens=30
            )

        print("📞 Calling with asyncio.run()...")
        response = asyncio.run(call_openai())

        generated_name = response.choices[0].message.content.strip()
        print(f"✅ Generated name: '{generated_name}'")

        return True

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_with_async_to_sync():
    """Test calling async OpenAI with async_to_sync"""
    print("\n" + "=" * 60)
    print("Testing with async_to_sync")
    print("=" * 60)

    from asgiref.sync import async_to_sync

    api_key = settings.OPENAI_API_KEY

    if not api_key:
        print("❌ ERROR: OPENAI_API_KEY is not set")
        return False

    try:
        async def call_openai():
            client = AsyncOpenAI(api_key=api_key)
            return await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a naming assistant. Generate a 2-3 word name."},
                    {"role": "user", "content": "Generate a name for a task management agent"}
                ],
                temperature=0.7,
                max_completion_tokens=30
            )

        print("📞 Calling with async_to_sync()...")
        response = async_to_sync(call_openai)()

        generated_name = response.choices[0].message.content.strip()
        print(f"✅ Generated name: '{generated_name}'")

        return True

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("\n🔧 Agent Name Generation Debug Test")
    print("=" * 60)

    # Run async test
    print("\n1️⃣ Testing async OpenAI directly...")
    asyncio.run(test_async_openai())

    # Run sync tests
    print("\n2️⃣ Testing with asyncio.run()...")
    test_sync_with_asyncio_run()

    print("\n3️⃣ Testing with async_to_sync()...")
    test_with_async_to_sync()

    print("\n" + "=" * 60)
    print("✅ Test completed!")
    print("=" * 60)
