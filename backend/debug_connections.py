#!/usr/bin/env python
"""
Debug script to diagnose why connections aren't being detected.
Run this from the backend directory: python debug_connections.py <user_email>
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api_agents.authentication.models import User
from api_agents.agents.services.agent_service import AgentService

def debug_connections(user_email):
    """Debug connection detection for a specific user"""
    try:
        user = User.objects.get(email=user_email)
        print(f"\n{'='*80}")
        print(f"🔍 DEBUGGING CONNECTIONS FOR: {user.email}")
        print(f"{'='*80}\n")

        print(f"📋 User Details:")
        print(f"   - User ID: {user.id}")
        print(f"   - User ID Type: {type(user.id)}")
        print(f"   - Username: {user.username}")

        expected_entity_id = f"user_{user.id}"
        print(f"\n🎯 Expected Entity ID: {expected_entity_id}")
        print(f"   Length: {len(expected_entity_id)} characters")

        print(f"\n{'='*80}")
        print(f"🔗 FETCHING ALL CONNECTIONS FROM COMPOSIO (RAW)")
        print(f"{'='*80}\n")

        agent_service = AgentService(user)

        if not agent_service.composio_client:
            print("❌ No Composio client configured!")
            return

        # Get raw connection list
        response = agent_service.composio_client.connected_accounts.list()

        connections = None
        if hasattr(response, 'items'):
            connections = response.items
            print(f"📦 Response type: .items (found {len(connections)} items)")
        elif hasattr(response, 'data'):
            connections = response.data
            print(f"📦 Response type: .data (found {len(connections)} items)")
        elif hasattr(response, '__iter__'):
            connections = list(response)
            print(f"📦 Response type: iterable (found {len(connections)} items)")
        else:
            print(f"❌ Unknown response type: {type(response)}")
            return

        if not connections:
            print("⚠️  No connections found in Composio!")
            return

        print(f"\n{'='*80}")
        print(f"📊 ANALYZING EACH CONNECTION")
        print(f"{'='*80}\n")

        matching_connections = []
        non_matching_connections = []

        for i, conn in enumerate(connections, 1):
            print(f"\n--- Connection #{i} ---")

            # Extract entity ID
            conn_entity = None
            if hasattr(conn, 'entityId'):
                conn_entity = conn.entityId
                print(f"   Entity ID (entityId): {conn_entity}")
            elif hasattr(conn, 'entity_id'):
                conn_entity = conn.entity_id
                print(f"   Entity ID (entity_id): {conn_entity}")
            elif hasattr(conn, 'userId'):
                conn_entity = conn.userId
                print(f"   Entity ID (userId): {conn_entity}")
            elif hasattr(conn, 'user_id'):
                conn_entity = conn.user_id
                print(f"   Entity ID (user_id): {conn_entity}")
            else:
                print(f"   ⚠️  No entity ID found!")

            # Extract tool name
            tool_name = "Unknown"
            if hasattr(conn, 'toolkit') and conn.toolkit:
                tool_name = getattr(conn.toolkit, 'slug', 'Unknown')
            print(f"   Tool: {tool_name}")

            # Extract status
            status = "Unknown"
            if hasattr(conn, 'status'):
                status = conn.status
            elif hasattr(conn, 'connectionStatus'):
                status = conn.connectionStatus
            elif hasattr(conn, 'connection_status'):
                status = conn.connection_status
            print(f"   Status: {status}")

            # Extract connection ID
            conn_id = "Unknown"
            if hasattr(conn, 'id'):
                conn_id = conn.id
            elif hasattr(conn, 'connectionId'):
                conn_id = conn.connectionId
            print(f"   Connection ID: {conn_id}")

            # Check if it matches
            if conn_entity:
                if conn_entity == expected_entity_id:
                    print(f"   ✅ MATCH! This connection belongs to {user.email}")
                    matching_connections.append({
                        'tool': tool_name,
                        'status': status,
                        'entity': conn_entity,
                        'conn_id': conn_id
                    })
                else:
                    print(f"   ❌ NO MATCH")
                    print(f"      Expected: {expected_entity_id}")
                    print(f"      Got:      {conn_entity}")
                    print(f"      Match:    {conn_entity == expected_entity_id}")

                    # Check for subtle differences
                    if len(conn_entity) != len(expected_entity_id):
                        print(f"      ⚠️  Length mismatch! Expected {len(expected_entity_id)}, got {len(conn_entity)}")

                    non_matching_connections.append({
                        'tool': tool_name,
                        'status': status,
                        'entity': conn_entity,
                        'conn_id': conn_id
                    })

        print(f"\n{'='*80}")
        print(f"📊 SUMMARY")
        print(f"{'='*80}\n")

        print(f"Total connections found: {len(connections)}")
        print(f"Matching connections (for {user.email}): {len(matching_connections)}")
        print(f"Non-matching connections (other users): {len(non_matching_connections)}")

        if matching_connections:
            print(f"\n✅ Matching Connections:")
            for conn in matching_connections:
                print(f"   - {conn['tool']} ({conn['status']}) - ID: {conn['conn_id']}")

        if non_matching_connections:
            print(f"\n❌ Non-Matching Connections (probably test users or other accounts):")
            for conn in non_matching_connections[:5]:  # Show first 5
                print(f"   - {conn['tool']} ({conn['status']}) - Entity: {conn['entity'][:50]}...")

        print(f"\n{'='*80}")
        print(f"🔍 TESTING get_connection_details() METHOD")
        print(f"{'='*80}\n")

        connection_details = agent_service.get_connection_details()
        print(f"Connections returned by get_connection_details(): {len(connection_details)}")

        if connection_details:
            print(f"\n✅ Detected Connections:")
            for conn in connection_details:
                print(f"   - {conn['tool_name']} (ID: {conn['connection_id']})")
        else:
            print(f"\n❌ No connections detected by get_connection_details()!")
            print(f"   This is the bug! The filtering logic is not working.")

        print(f"\n{'='*80}")
        print(f"✅ DEBUG COMPLETE")
        print(f"{'='*80}\n")

    except User.DoesNotExist:
        print(f"❌ User with email '{user_email}' not found!")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python debug_connections.py <user_email>")
        sys.exit(1)

    user_email = sys.argv[1]
    debug_connections(user_email)
