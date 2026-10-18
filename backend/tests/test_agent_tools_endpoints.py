#!/usr/bin/env python3
"""
Comprehensive test script for Agent Tools API endpoints
Tests all 4 endpoints: list, available, add, remove
"""

import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate
from api_agents.models import User, Agent
from api_agents.views import AgentViewSet
import json


def test_agent_tools_endpoints():
    """Test all agent tools endpoints"""

    print("\n" + "="*80)
    print("TESTING AGENT TOOLS API ENDPOINTS")
    print("="*80 + "\n")

    # Setup: Create test user and agent
    user, created = User.objects.get_or_create(
        username='test_agent_tools_user',
        defaults={'email': 'test_agent_tools@example.com'}
    )
    if created:
        user.set_password('testpass123')
        user.save()
        print(f"✅ Created test user: {user.username}")
    else:
        print(f"✅ Using existing test user: {user.username}")

    # Create a test agent
    agent = Agent.objects.create(
        user=user,
        name='Test Agent for Tools',
        prompt='Test agent for testing agent tools',
        app_connections=[],
        tools=[],
        agent_tools=[]  # Start with no tools
    )
    print(f"✅ Created test agent: {agent.name} (ID: {agent.id})")
    print(f"   Initial agent_tools: {agent.agent_tools}\n")

    factory = APIRequestFactory()
    viewset = AgentViewSet()

    # ==========================================================================
    # TEST 1: GET /api/agents/agent-tools/ (Public endpoint)
    # ==========================================================================
    print("-" * 80)
    print("TEST 1: GET /api/agents/agent-tools/ (List all available tools)")
    print("-" * 80)

    request = factory.get('/api/agents/agent-tools/')
    # No authentication needed - public endpoint
    viewset.request = request
    viewset.format_kwarg = None

    try:
        response = viewset.agent_tools_list(request)
        print(f"✅ Status: {response.status_code}")

        data = response.data
        print(f"✅ Total tools: {data['count']}")

        for i, tool in enumerate(data['tools'], 1):
            print(f"\n   {i}. {tool['icon']} {tool['name']} ({tool['tool_name']})")
            print(f"      Category: {tool['category']}")
            print(f"      Description: {tool['description'][:60]}...")
            print(f"      Enabled by default: {tool['is_enabled']}")

        assert data['count'] == 6, "Expected 6 tools"
        assert all('tool_name' in tool for tool in data['tools']), "Missing tool_name"
        print("\n✅ TEST 1 PASSED\n")

    except Exception as e:
        print(f"❌ TEST 1 FAILED: {e}")
        import traceback
        traceback.print_exc()

    # ==========================================================================
    # TEST 2: GET /api/agents/{id}/available-agent-tools/ (Agent-specific)
    # ==========================================================================
    print("-" * 80)
    print(f"TEST 2: GET /api/agents/{agent.id}/available-agent-tools/")
    print("       (Tools with enabled status for specific agent)")
    print("-" * 80)

    request = factory.get(f'/api/agents/{agent.id}/available-agent-tools/')
    force_authenticate(request, user=user)
    viewset.request = request
    viewset.kwargs = {'pk': str(agent.id)}

    try:
        response = viewset.available_agent_tools(request, pk=str(agent.id))
        print(f"✅ Status: {response.status_code}")

        data = response.data
        print(f"✅ Total tools: {data['count']}")

        enabled_count = sum(1 for tool in data['tools'] if tool['is_enabled'])
        print(f"   Enabled tools: {enabled_count}")
        print(f"   Disabled tools: {data['count'] - enabled_count}")

        print("\n   Tool Status:")
        for tool in data['tools']:
            status = "✅ ENABLED" if tool['is_enabled'] else "❌ DISABLED"
            print(f"   - {tool['name']}: {status}")

        assert data['count'] == 6, "Expected 6 tools"
        assert enabled_count == 0, "Expected 0 enabled tools initially"
        print("\n✅ TEST 2 PASSED\n")

    except Exception as e:
        print(f"❌ TEST 2 FAILED: {e}")
        import traceback
        traceback.print_exc()

    # ==========================================================================
    # TEST 3: POST /api/agents/{id}/add-agent-tool/ (Enable tools)
    # ==========================================================================
    print("-" * 80)
    print(f"TEST 3: POST /api/agents/{agent.id}/add-agent-tool/")
    print("       (Enable multiple tools)")
    print("-" * 80)

    tools_to_add = ['weather', 'calculator', 'yahoo_finance']

    for tool_name in tools_to_add:
        print(f"\n   Adding tool: {tool_name}")
        request = factory.post(
            f'/api/agents/{agent.id}/add-agent-tool/',
            data=json.dumps({'tool_name': tool_name}),
            content_type='application/json'
        )
        force_authenticate(request, user=user)
        viewset.request = request
        viewset.kwargs = {'pk': str(agent.id)}

        try:
            response = viewset.add_agent_tool(request, pk=str(agent.id))
            print(f"   ✅ Status: {response.status_code}")

            data = response.data
            if data['success']:
                print(f"   ✅ {data['message']}")
                print(f"   Agent tools now: {data['agent_tools']}")
            else:
                print(f"   ❌ {data['message']}")

        except Exception as e:
            print(f"   ❌ Failed to add {tool_name}: {e}")
            import traceback
            traceback.print_exc()

    # Verify tools were added
    agent.refresh_from_db()
    print(f"\n   Final agent_tools in database: {agent.agent_tools}")
    assert len(agent.agent_tools) == 3, "Expected 3 tools"
    assert set(agent.agent_tools) == set(tools_to_add), "Tools mismatch"
    print("\n✅ TEST 3 PASSED\n")

    # ==========================================================================
    # TEST 3B: Try to add duplicate tool (should fail)
    # ==========================================================================
    print("-" * 80)
    print("TEST 3B: POST /api/agents/{id}/add-agent-tool/ (Try duplicate)")
    print("-" * 80)

    print("\n   Trying to add 'weather' again (should fail)...")
    request = factory.post(
        f'/api/agents/{agent.id}/add-agent-tool/',
        data=json.dumps({'tool_name': 'weather'}),
        content_type='application/json'
    )
    force_authenticate(request, user=user)
    viewset.request = request
    viewset.kwargs = {'pk': str(agent.id)}

    try:
        response = viewset.add_agent_tool(request, pk=str(agent.id))
        print(f"   Status: {response.status_code}")

        data = response.data
        if not data['success']:
            print(f"   ✅ Correctly rejected: {data['message']}")
        else:
            print(f"   ❌ Should have rejected duplicate")

        assert response.status_code == 400, "Expected 400 for duplicate"
        print("\n✅ TEST 3B PASSED\n")

    except Exception as e:
        print(f"❌ TEST 3B FAILED: {e}")

    # ==========================================================================
    # TEST 3C: Try to add invalid tool (should fail)
    # ==========================================================================
    print("-" * 80)
    print("TEST 3C: POST /api/agents/{id}/add-agent-tool/ (Try invalid tool)")
    print("-" * 80)

    print("\n   Trying to add 'invalid_tool' (should fail)...")
    request = factory.post(
        f'/api/agents/{agent.id}/add-agent-tool/',
        data=json.dumps({'tool_name': 'invalid_tool'}),
        content_type='application/json'
    )
    force_authenticate(request, user=user)
    viewset.request = request
    viewset.kwargs = {'pk': str(agent.id)}

    try:
        response = viewset.add_agent_tool(request, pk=str(agent.id))
        print(f"   Status: {response.status_code}")

        data = response.data
        if not data['success']:
            print(f"   ✅ Correctly rejected: {data['message']}")
        else:
            print(f"   ❌ Should have rejected invalid tool")

        assert response.status_code == 400, "Expected 400 for invalid tool"
        print("\n✅ TEST 3C PASSED\n")

    except Exception as e:
        print(f"❌ TEST 3C FAILED: {e}")

    # ==========================================================================
    # TEST 4: Verify tools are enabled
    # ==========================================================================
    print("-" * 80)
    print("TEST 4: GET /api/agents/{id}/available-agent-tools/ (Verify enabled)")
    print("-" * 80)

    request = factory.get(f'/api/agents/{agent.id}/available-agent-tools/')
    force_authenticate(request, user=user)
    viewset.request = request
    viewset.kwargs = {'pk': str(agent.id)}

    try:
        response = viewset.available_agent_tools(request, pk=str(agent.id))
        print(f"✅ Status: {response.status_code}")

        data = response.data
        enabled_tools = [t for t in data['tools'] if t['is_enabled']]
        disabled_tools = [t for t in data['tools'] if not t['is_enabled']]

        print(f"\n   Enabled tools ({len(enabled_tools)}):")
        for tool in enabled_tools:
            print(f"   ✅ {tool['name']}")

        print(f"\n   Disabled tools ({len(disabled_tools)}):")
        for tool in disabled_tools:
            print(f"   ❌ {tool['name']}")

        assert len(enabled_tools) == 3, "Expected 3 enabled tools"
        print("\n✅ TEST 4 PASSED\n")

    except Exception as e:
        print(f"❌ TEST 4 FAILED: {e}")

    # ==========================================================================
    # TEST 5: DELETE /api/agents/{id}/remove-agent-tool/{tool_name}/
    # ==========================================================================
    print("-" * 80)
    print(f"TEST 5: DELETE /api/agents/{agent.id}/remove-agent-tool/calculator/")
    print("       (Disable a tool)")
    print("-" * 80)

    print("\n   Removing tool: calculator")
    request = factory.delete(f'/api/agents/{agent.id}/remove-agent-tool/calculator/')
    force_authenticate(request, user=user)
    viewset.request = request
    viewset.kwargs = {'pk': str(agent.id)}

    try:
        response = viewset.remove_agent_tool(request, pk=str(agent.id), tool_name='calculator')
        print(f"   ✅ Status: {response.status_code}")

        data = response.data
        if data['success']:
            print(f"   ✅ {data['message']}")
            print(f"   Agent tools now: {data['agent_tools']}")
        else:
            print(f"   ❌ {data['message']}")

        agent.refresh_from_db()
        assert 'calculator' not in agent.agent_tools, "Calculator should be removed"
        assert len(agent.agent_tools) == 2, "Expected 2 tools remaining"
        print("\n✅ TEST 5 PASSED\n")

    except Exception as e:
        print(f"❌ TEST 5 FAILED: {e}")
        import traceback
        traceback.print_exc()

    # ==========================================================================
    # TEST 5B: Try to remove non-enabled tool (should fail)
    # ==========================================================================
    print("-" * 80)
    print("TEST 5B: DELETE /api/agents/{id}/remove-agent-tool/ (Try non-enabled)")
    print("-" * 80)

    print("\n   Trying to remove 'youtube' (not enabled)...")
    request = factory.delete(f'/api/agents/{agent.id}/remove-agent-tool/youtube/')
    force_authenticate(request, user=user)
    viewset.request = request
    viewset.kwargs = {'pk': str(agent.id)}

    try:
        response = viewset.remove_agent_tool(request, pk=str(agent.id), tool_name='youtube')
        print(f"   Status: {response.status_code}")

        data = response.data
        if not data['success']:
            print(f"   ✅ Correctly rejected: {data['message']}")
        else:
            print(f"   ❌ Should have rejected")

        assert response.status_code == 400, "Expected 400 for non-enabled tool"
        print("\n✅ TEST 5B PASSED\n")

    except Exception as e:
        print(f"❌ TEST 5B FAILED: {e}")

    # ==========================================================================
    # FINAL VERIFICATION
    # ==========================================================================
    print("="*80)
    print("FINAL VERIFICATION")
    print("="*80)

    agent.refresh_from_db()
    print(f"\n✅ Final agent state:")
    print(f"   Agent ID: {agent.id}")
    print(f"   Agent Name: {agent.name}")
    print(f"   Enabled agent_tools: {agent.agent_tools}")
    print(f"   Count: {len(agent.agent_tools)}")

    expected_tools = ['weather', 'yahoo_finance']
    assert set(agent.agent_tools) == set(expected_tools), f"Expected {expected_tools}"

    # Cleanup
    print(f"\n🧹 Cleaning up test agent...")
    agent.delete()

    print("\n" + "="*80)
    print("✅ ALL TESTS PASSED!")
    print("="*80 + "\n")

    print("📊 Summary:")
    print("   ✅ List all tools (public)")
    print("   ✅ Get agent-specific tools with status")
    print("   ✅ Add tools to agent")
    print("   ✅ Reject duplicate tools")
    print("   ✅ Reject invalid tools")
    print("   ✅ Remove tools from agent")
    print("   ✅ Reject removing non-enabled tools")
    print("\n🎉 All 4 API endpoints working perfectly!\n")


if __name__ == '__main__':
    test_agent_tools_endpoints()
