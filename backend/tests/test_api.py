import requests
import json
import getpass
import sys
from typing import Optional, Dict, Any

# Set the base URL for your running Django server
BASE_URL = "http://127.0.0.1:8000"

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_test_header(test_name: str):
    """Print a formatted test header"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{test_name}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")

def print_success(message: str):
    """Print success message"""
    print(f"{Colors.OKGREEN}✓ {message}{Colors.ENDC}")

def print_error(message: str):
    """Print error message"""
    print(f"{Colors.FAIL}✗ {message}{Colors.ENDC}")

def print_info(message: str):
    """Print info message"""
    print(f"{Colors.OKCYAN}ℹ {message}{Colors.ENDC}")

def get_auth_token() -> Optional[str]:
    """
    Attempt to get authentication token via login.
    Falls back to manual token input if login fails.
    """
    print_test_header("AUTHENTICATION")

    # Try login first
    print_info("Attempting to authenticate via login...")
    username = input("Username/Email: ").strip()

    if not username:
        print_error("Username cannot be empty")
        return None

    password = getpass.getpass("Password: ")

    if not password:
        print_error("Password cannot be empty")
        return None

    try:
        login_url = f"{BASE_URL}/api/auth/login/"
        response = requests.post(
            login_url,
            json={"username": username, "password": password}
        )

        if response.status_code == 200:
            data = response.json()
            # Try different possible token field names
            token = data.get('key') or data.get('token') or data.get('auth_token')

            if token:
                print_success(f"Login successful! Token obtained.")
                return token
            else:
                print_error("Login response received but no token found")
                print_info(f"Response: {json.dumps(data, indent=2)}")
        else:
            print_error(f"Login failed with status {response.status_code}")
            print_info(f"Response: {response.text}")

    except Exception as e:
        print_error(f"Login attempt failed: {e}")

    # Fallback to manual token input
    print_info("\nFalling back to manual token entry...")
    token = input("Please enter your authentication token: ").strip()

    if token:
        print_success("Token provided manually")
        return token
    else:
        print_error("No token provided")
        return None

def make_request(
    method: str,
    endpoint: str,
    headers: Dict[str, str],
    data: Optional[Dict[str, Any]] = None,
    params: Optional[Dict[str, Any]] = None
) -> tuple[bool, Optional[Dict], Optional[str]]:
    """
    Make an HTTP request and return success status, response data, and error message
    """
    url = f"{BASE_URL}{endpoint}"

    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers, params=params)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json=data)
        elif method.upper() == "PUT":
            response = requests.put(url, headers=headers, json=data)
        elif method.upper() == "PATCH":
            response = requests.patch(url, headers=headers, json=data)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            return False, None, f"Unsupported HTTP method: {method}"

        if response.status_code in [200, 201, 204]:
            try:
                return True, response.json() if response.content else {}, None
            except:
                return True, {}, None
        else:
            return False, None, f"Status {response.status_code}: {response.text}"

    except Exception as e:
        return False, None, str(e)

def test_auth_endpoints(headers: Dict[str, str]):
    """Test authentication-related endpoints"""
    print_test_header("AUTHENTICATION ENDPOINTS")

    # Test current user
    print_info("\nTesting GET /api/auth/me/")
    success, data, error = make_request("GET", "/api/auth/me/", headers)
    if success:
        print_success(f"Current user retrieved: {data.get('username', 'N/A')}")
    else:
        print_error(f"Failed to get current user: {error}")

    # Test CSRF token
    print_info("\nTesting GET /api/csrf/")
    success, data, error = make_request("GET", "/api/csrf/", headers)
    if success:
        print_success("CSRF token retrieved successfully")
    else:
        print_error(f"Failed to get CSRF token: {error}")

def test_agents_endpoints(headers: Dict[str, str]) -> Optional[int]:
    """Test agent-related endpoints and return created agent ID"""
    print_test_header("AGENT ENDPOINTS")

    # List agents
    print_info("\nTesting GET /api/agents/")
    success, data, error = make_request("GET", "/api/agents/", headers)
    if success:
        count = len(data.get('results', [])) if 'results' in data else len(data) if isinstance(data, list) else 0
        print_success(f"Listed agents: {count} found")
    else:
        print_error(f"Failed to list agents: {error}")

    # Get available tools
    print_info("\nTesting GET /api/agents/available_tools/")
    success, data, error = make_request("GET", "/api/agents/available_tools/", headers)
    if success:
        print_success("Retrieved available tools")
    else:
        print_error(f"Failed to get available tools: {error}")

    # Create a new agent
    print_info("\nTesting POST /api/agents/")
    agent_data = {
        "name": "Test Agent",
        "prompt": "You are a helpful test agent that assists with testing.",
        "app_connections": [],
        "model": "claude-3-5-sonnet-20241022"
    }
    success, data, error = make_request("POST", "/api/agents/", headers, data=agent_data)
    agent_id = None
    if success:
        agent_id = data.get('id')
        print_success(f"Created agent with ID: {agent_id}")
    else:
        print_error(f"Failed to create agent: {error}")
        return None

    # Get specific agent
    if agent_id:
        print_info(f"\nTesting GET /api/agents/{agent_id}/")
        success, data, error = make_request("GET", f"/api/agents/{agent_id}/", headers)
        if success:
            print_success(f"Retrieved agent: {data.get('name', 'N/A')}")
        else:
            print_error(f"Failed to get agent: {error}")

        # Update agent
        print_info(f"\nTesting PATCH /api/agents/{agent_id}/")
        update_data = {"name": "Updated Test Agent"}
        success, data, error = make_request("PATCH", f"/api/agents/{agent_id}/", headers, data=update_data)
        if success:
            print_success(f"Updated agent name to: {data.get('name', 'N/A')}")
        else:
            print_error(f"Failed to update agent: {error}")

        # Chat with agent
        print_info(f"\nTesting POST /api/agents/{agent_id}/chat/")
        chat_data = {"message": "Hello, this is a test message."}
        success, data, error = make_request("POST", f"/api/agents/{agent_id}/chat/", headers, data=chat_data)
        if success:
            print_success("Chat message sent successfully")
            assistant_msg = data.get('assistant_message', {}).get('content', 'N/A')[:100]
            print_info(f"Response preview: {assistant_msg}...")
        else:
            print_error(f"Failed to chat with agent: {error}")

        # Get chat history
        print_info(f"\nTesting GET /api/agents/{agent_id}/history/")
        success, data, error = make_request("GET", f"/api/agents/{agent_id}/history/", headers)
        if success:
            msg_count = len(data) if isinstance(data, list) else 0
            print_success(f"Retrieved chat history: {msg_count} messages")
        else:
            print_error(f"Failed to get chat history: {error}")

    return agent_id

def test_connections_endpoints(headers: Dict[str, str]):
    """Test connection-related endpoints"""
    print_test_header("CONNECTION ENDPOINTS")

    # List connections
    print_info("\nTesting GET /api/connections/")
    success, data, error = make_request("GET", "/api/connections/", headers)
    if success:
        count = len(data.get('results', [])) if 'results' in data else len(data) if isinstance(data, list) else 0
        print_success(f"Listed connections: {count} found")
    else:
        print_error(f"Failed to list connections: {error}")

    # Get available apps
    print_info("\nTesting GET /api/connections/available_apps/")
    success, data, error = make_request("GET", "/api/connections/available_apps/", headers)
    if success:
        print_success("Retrieved available apps")
    else:
        print_error(f"Failed to get available apps: {error}")

def test_files_endpoints(headers: Dict[str, str], agent_id: Optional[int]):
    """Test file-related endpoints"""
    print_test_header("FILE ENDPOINTS")

    # List files
    print_info("\nTesting GET /api/files/")
    success, data, error = make_request("GET", "/api/files/", headers)
    if success:
        count = len(data.get('results', [])) if 'results' in data else len(data) if isinstance(data, list) else 0
        print_success(f"Listed files: {count} found")
    else:
        print_error(f"Failed to list files: {error}")

def test_triggers_endpoints(headers: Dict[str, str]):
    """Test trigger-related endpoints"""
    print_test_header("TRIGGER ENDPOINTS")

    # List triggers
    print_info("\nTesting GET /api/triggers/")
    success, data, error = make_request("GET", "/api/triggers/", headers)
    if success:
        count = len(data.get('results', [])) if 'results' in data else len(data) if isinstance(data, list) else 0
        print_success(f"Listed triggers: {count} found")
    else:
        print_error(f"Failed to list triggers: {error}")

def test_workflows_endpoints(headers: Dict[str, str]):
    """Test workflow-related endpoints"""
    print_test_header("WORKFLOW ENDPOINTS")

    # List workflows
    print_info("\nTesting GET /api/workflows/")
    success, data, error = make_request("GET", "/api/workflows/", headers)
    if success:
        count = len(data.get('results', [])) if 'results' in data else len(data) if isinstance(data, list) else 0
        print_success(f"Listed workflows: {count} found")
    else:
        print_error(f"Failed to list workflows: {error}")

def cleanup_test_agent(headers: Dict[str, str], agent_id: Optional[int]):
    """Clean up test agent"""
    if not agent_id:
        return

    print_test_header("CLEANUP")
    print_info(f"\nDeleting test agent {agent_id}...")
    success, data, error = make_request("DELETE", f"/api/agents/{agent_id}/", headers)
    if success:
        print_success(f"Test agent {agent_id} deleted successfully")
    else:
        print_error(f"Failed to delete test agent: {error}")

def run_comprehensive_tests():
    """Run all API tests"""
    print(f"\n{Colors.BOLD}{Colors.HEADER}")
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║          AI AGENT CREATOR - API TEST SUITE              ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    print(Colors.ENDC)

    # Get authentication token
    token = get_auth_token()
    if not token:
        print_error("Cannot proceed without authentication token")
        sys.exit(1)

    headers = {
        "Authorization": f"Token {token}",
        "Content-Type": "application/json",
    }

    # Run all tests
    agent_id = None
    try:
        test_auth_endpoints(headers)
        agent_id = test_agents_endpoints(headers)
        test_connections_endpoints(headers)
        test_files_endpoints(headers, agent_id)
        test_triggers_endpoints(headers)
        test_workflows_endpoints(headers)
    finally:
        # Always try to cleanup
        cleanup_test_agent(headers, agent_id)

    # Final summary
    print(f"\n{Colors.BOLD}{Colors.OKGREEN}")
    print("╔═══════════════════════════════════════════════════════════╗")
    print("║               API TEST SUITE COMPLETED                   ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    print(Colors.ENDC)

if __name__ == "__main__":
    try:
        run_comprehensive_tests()
    except KeyboardInterrupt:
        print(f"\n{Colors.WARNING}Test suite interrupted by user{Colors.ENDC}")
        sys.exit(1)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
