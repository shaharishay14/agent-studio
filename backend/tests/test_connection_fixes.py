"""
Test script to verify connection endpoint fixes:
1. OAuth completion properly preserves auth_config_id and updates status
2. DELETE endpoint properly deletes entire connection record

Run this after the Django server is running and you have an authenticated user.
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def print_test(name):
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print('='*60)

def print_result(success, message):
    symbol = "✓" if success else "✗"
    print(f"{symbol} {message}")

def test_connection_fixes(token):
    """Test both connection fixes"""
    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json",
    }

    # Test 1: Check connections syncs properly after OAuth
    print_test("check_connections preserves auth_config_id and updates metadata")

    # First, list current connections
    response = requests.get(f"{BASE_URL}/api/connections/", headers=headers)
    if response.status_code == 200:
        connections_before = response.json()
        if isinstance(connections_before, dict) and 'results' in connections_before:
            connections_before = connections_before['results']
        print(f"Current connections: {len(connections_before)}")
        for conn in connections_before:
            print(f"  - {conn.get('tool_name')}: is_active={conn.get('is_active')}, "
                  f"auth_config_id={'present' if conn.get('auth_config_id') else 'missing'}, "
                  f"metadata={conn.get('metadata')}")

    # Call check_connections to sync
    print("\nCalling check_connections...")
    response = requests.get(f"{BASE_URL}/api/connections/check_connections/", headers=headers)

    if response.status_code == 200:
        synced_connections = response.json()
        print_result(True, f"check_connections succeeded: {len(synced_connections)} active connections")

        # Verify auth_config_id is preserved and metadata is updated
        all_have_auth_config = True
        all_have_connected_status = True

        for conn in synced_connections:
            has_auth = bool(conn.get('auth_config_id'))
            has_connected = conn.get('metadata', {}).get('status') == 'connected'

            print(f"\n  Connection: {conn.get('tool_name')}")
            print(f"    - is_active: {conn.get('is_active')}")
            print(f"    - auth_config_id: {'✓ present' if has_auth else '✗ missing'}")
            print(f"    - composio_connection_id: {conn.get('composio_connection_id')}")
            print(f"    - metadata.status: {conn.get('metadata', {}).get('status')}")

            if not has_auth:
                all_have_auth_config = False
            if not has_connected:
                all_have_connected_status = False

        print_result(all_have_auth_config,
                    "All connections have auth_config_id preserved" if all_have_auth_config
                    else "Some connections missing auth_config_id")
        print_result(all_have_connected_status,
                    "All connections have status='connected'" if all_have_connected_status
                    else "Some connections have incorrect status")
    else:
        print_result(False, f"check_connections failed: {response.status_code} - {response.text}")

    # Test 2: DELETE endpoint authentication and complete deletion
    print_test("DELETE endpoint requires auth and deletes entire record")

    # Get a connection to delete (if any exist)
    response = requests.get(f"{BASE_URL}/api/connections/", headers=headers)
    if response.status_code == 200:
        connections = response.json()
        if isinstance(connections, dict) and 'results' in connections:
            connections = connections['results']

        if connections:
            test_conn = connections[0]
            conn_id = test_conn.get('id')
            tool_name = test_conn.get('tool_name')

            print(f"\nAttempting to delete connection {conn_id} ({tool_name})")
            print(f"Before deletion - Connection details:")
            print(f"  - id: {test_conn.get('id')}")
            print(f"  - tool_name: {test_conn.get('tool_name')}")
            print(f"  - auth_config_id: {test_conn.get('auth_config_id')}")
            print(f"  - is_active: {test_conn.get('is_active')}")
            print(f"  - metadata: {test_conn.get('metadata')}")

            # Try to delete with authentication
            response = requests.delete(f"{BASE_URL}/api/connections/{conn_id}/", headers=headers)

            if response.status_code == 200:
                result = response.json()
                print_result(True, f"DELETE succeeded: {result.get('message')}")

                # Verify the record is completely gone
                verify_response = requests.get(f"{BASE_URL}/api/connections/", headers=headers)
                if verify_response.status_code == 200:
                    remaining_connections = verify_response.json()
                    if isinstance(remaining_connections, dict) and 'results' in remaining_connections:
                        remaining_connections = remaining_connections['results']

                    still_exists = any(c.get('id') == conn_id for c in remaining_connections)
                    print_result(not still_exists,
                                "Connection completely deleted from database" if not still_exists
                                else "ERROR: Connection still exists in database!")

                    if still_exists:
                        leftover = next(c for c in remaining_connections if c.get('id') == conn_id)
                        print(f"  Leftover record: {leftover}")
            else:
                print_result(False, f"DELETE failed: {response.status_code} - {response.text}")

            # Test unauthorized access (try to delete without proper auth)
            print("\nTesting unauthorized access (should fail)...")
            bad_headers = {"Content-Type": "application/json"}
            response = requests.delete(f"{BASE_URL}/api/connections/{conn_id}/", headers=bad_headers)

            is_unauthorized = response.status_code in [401, 403]
            print_result(is_unauthorized,
                        "Unauthorized request properly blocked" if is_unauthorized
                        else f"ERROR: Unauthorized request not blocked (status: {response.status_code})")
        else:
            print("No connections available to test deletion")
    else:
        print_result(False, f"Could not list connections: {response.status_code}")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("CONNECTION ENDPOINT FIXES TEST SUITE")
    print("="*60)

    token = input("\nEnter your authentication token: ").strip()

    if token:
        test_connection_fixes(token)
        print("\n" + "="*60)
        print("TEST SUITE COMPLETED")
        print("="*60 + "\n")
    else:
        print("No token provided. Exiting.")
