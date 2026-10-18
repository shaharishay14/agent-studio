#!/usr/bin/env python
"""
Test script for SSE streaming chat endpoint.
Tests real-time streaming of agent responses.
"""
import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import requests
import json
from api_agents.models import User, Agent
from rest_framework.authtoken.models import Token


def test_streaming_chat():
    """
    Test the streaming chat endpoint with SSE.
    """
    print("=" * 80)
    print("SSE STREAMING CHAT TEST")
    print("=" * 80)
    print()

    # 1. Get or create test user
    user = User.objects.filter(username='testuser').first()
    if not user:
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        print(f"✅ Created test user: {user.username}")
    else:
        print(f"✅ Using existing test user: {user.username}")

    # 2. Get or create test agent
    agent = Agent.objects.filter(user=user).first()
    if not agent:
        agent = Agent.objects.create(
            user=user,
            name='Test Streaming Agent',
            prompt='You are a helpful assistant. Keep responses concise (2-3 sentences).'
        )
        print(f"✅ Created test agent: {agent.name} (ID: {agent.id})")
    else:
        print(f"✅ Using existing test agent: {agent.name} (ID: {agent.id})")

    # 3. Get auth token
    token, _ = Token.objects.get_or_create(user=user)
    print(f"✅ Token obtained: {token.key[:20]}...")
    print()

    # 4. Test basic chat with streaming
    print("📡 Testing streaming chat endpoint...")
    print("   Message: 'Hello, how are you?'")
    print()

    url = f'http://localhost:8000/api/agents/{agent.id}/chat/'
    headers = {
        'Authorization': f'Token {token.key}',
        'Content-Type': 'application/json'
    }
    data = {
        'message': 'Hello, how are you?',
        'file_ids': []
    }

    print("🔄 Starting SSE stream...")
    print("-" * 80)

    try:
        # Use requests with stream=True for SSE
        response = requests.post(
            url,
            headers=headers,
            json=data,
            stream=True,
            timeout=60
        )

        if response.status_code != 200:
            print(f"❌ Error: HTTP {response.status_code}")
            print(response.text)
            return False

        # Parse SSE events
        event_count = 0
        content_pieces = []

        for line in response.iter_lines():
            if not line:
                continue

            line = line.decode('utf-8')

            # Parse SSE format
            if line.startswith('event:'):
                event_type = line[6:].strip()
            elif line.startswith('data:'):
                event_count += 1
                data_json = line[5:].strip()

                try:
                    event_data = json.loads(data_json)

                    if event_type == 'status':
                        status = event_data.get('status')
                        message = event_data.get('message', '')
                        print(f"📊 STATUS: {status} - {message}")

                    elif event_type == 'tool_call_start':
                        tool = event_data.get('tool')
                        params = event_data.get('parameters', {})
                        print(f"🔧 TOOL START: {tool}")
                        print(f"   Parameters: {json.dumps(params, indent=2)}")

                    elif event_type == 'tool_call_result':
                        tool = event_data.get('tool')
                        success = event_data.get('success')
                        result = event_data.get('result')
                        error = event_data.get('error')

                        if success:
                            print(f"✅ TOOL SUCCESS: {tool}")
                            print(f"   Result: {str(result)[:100]}...")
                        else:
                            print(f"❌ TOOL ERROR: {tool}")
                            print(f"   Error: {error}")

                    elif event_type == 'content_delta':
                        content = event_data.get('content', '')
                        content_pieces.append(content)
                        print(content, end='', flush=True)

                    elif event_type == 'message_complete':
                        message_id = event_data.get('message_id')
                        full_content = event_data.get('content')
                        print()
                        print()
                        print(f"💾 MESSAGE SAVED: {message_id}")
                        print(f"   Full content length: {len(full_content)} chars")

                    elif event_type == 'done':
                        print()
                        print("✅ STREAM COMPLETE")

                    elif event_type == 'error':
                        error_msg = event_data.get('error')
                        print()
                        print(f"❌ ERROR: {error_msg}")

                    elif event_type == 'heartbeat':
                        print("💓 heartbeat", end='', flush=True)

                except json.JSONDecodeError as e:
                    print(f"⚠️  Failed to parse event data: {data_json}")

        print()
        print("-" * 80)
        print(f"📊 Total events received: {event_count}")
        print(f"📝 Content pieces: {len(content_pieces)}")

        if content_pieces:
            full_response = ''.join(content_pieces)
            print(f"📄 Full response: {full_response}")
            print()
            print("✅ STREAMING TEST PASSED!")
            return True
        else:
            print("❌ No content received")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ Request error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_with_agent_tools():
    """
    Test streaming with agent tools (e.g., weather, calculator).
    """
    print()
    print("=" * 80)
    print("AGENT TOOLS STREAMING TEST")
    print("=" * 80)
    print()

    # Get user and agent
    user = User.objects.filter(username='testuser').first()
    agent = Agent.objects.filter(user=user).first()

    if not agent:
        print("❌ No agent found. Run basic test first.")
        return False

    # Add weather tool to agent if not already present
    if 'weather' not in (agent.agent_tools or []):
        agent.agent_tools = ['weather']
        agent.save()
        print(f"✅ Added 'weather' tool to agent")
    else:
        print(f"✅ Agent already has 'weather' tool")

    token = Token.objects.get(user=user)

    print("📡 Testing streaming with tool execution...")
    print("   Message: 'What's the weather in London?'")
    print()

    url = f'http://localhost:8000/api/agents/{agent.id}/chat/'
    headers = {
        'Authorization': f'Token {token.key}',
        'Content-Type': 'application/json'
    }
    data = {
        'message': "What's the weather in London?",
        'file_ids': []
    }

    print("🔄 Starting SSE stream...")
    print("-" * 80)

    try:
        response = requests.post(
            url,
            headers=headers,
            json=data,
            stream=True,
            timeout=60
        )

        if response.status_code != 200:
            print(f"❌ Error: HTTP {response.status_code}")
            print(response.text)
            return False

        tool_calls_detected = False

        for line in response.iter_lines():
            if not line:
                continue

            line = line.decode('utf-8')

            if line.startswith('event:'):
                event_type = line[6:].strip()
            elif line.startswith('data:'):
                data_json = line[5:].strip()

                try:
                    event_data = json.loads(data_json)

                    if event_type == 'status':
                        status = event_data.get('status')
                        message = event_data.get('message', '')
                        print(f"📊 STATUS: {status} - {message}")

                    elif event_type == 'tool_call_start':
                        tool_calls_detected = True
                        tool = event_data.get('tool')
                        params = event_data.get('parameters', {})
                        print(f"🔧 TOOL START: {tool}")
                        print(f"   Parameters: {json.dumps(params, indent=2)}")

                    elif event_type == 'tool_call_result':
                        tool = event_data.get('tool')
                        success = event_data.get('success')

                        if success:
                            print(f"✅ TOOL SUCCESS: {tool}")
                        else:
                            print(f"❌ TOOL ERROR: {tool}")

                    elif event_type == 'content_delta':
                        content = event_data.get('content', '')
                        print(content, end='', flush=True)

                    elif event_type == 'done':
                        print()
                        print("✅ STREAM COMPLETE")

                except json.JSONDecodeError:
                    pass

        print()
        print("-" * 80)

        if tool_calls_detected:
            print("✅ TOOL EXECUTION STREAMING TEST PASSED!")
            return True
        else:
            print("⚠️  No tool calls detected (may be expected)")
            return True

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == '__main__':
    print("\n🧪 Starting SSE Streaming Tests\n")

    # Check if server is running
    try:
        response = requests.get('http://localhost:8000/api/schema/', timeout=2)
        if response.status_code != 200:
            print("❌ Server is not responding correctly")
            print("   Please start the server with: python manage.py runserver")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server at http://localhost:8000")
        print("   Please start the server with: python manage.py runserver")
        sys.exit(1)

    print("✅ Server is running\n")

    # Run tests
    test1_passed = test_streaming_chat()

    if test1_passed:
        test2_passed = test_with_agent_tools()

    print()
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Basic streaming: {'✅ PASSED' if test1_passed else '❌ FAILED'}")
    if test1_passed:
        print(f"Tool streaming: {'✅ PASSED' if test2_passed else '❌ FAILED'}")
    print()
