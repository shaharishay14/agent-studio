"""
Test Suite for Backend Refactoring Tasks 1-8 (Cookie-based Authentication)
Tests all new features using httpOnly cookie authentication.
"""

import requests
import json
import sys
import time
import os
from typing import Optional, Dict, Any

# Set the base URL for your running Django server
BASE_URL = "http://127.0.0.1:8000"

# Get credentials from environment
TEST_USERNAME = os.getenv('TEST_USERNAME', 'testtest')
TEST_PASSWORD = os.getenv('TEST_PASSWORD', 'testtest')

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
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{test_name}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")

def print_success(message: str):
    """Print success message"""
    print(f"{Colors.OKGREEN}✓ {message}{Colors.ENDC}")

def print_error(message: str):
    """Print error message"""
    print(f"{Colors.FAIL}✗ {message}{Colors.ENDC}")

def print_info(message: str):
    """Print info message"""
    print(f"{Colors.OKCYAN}ℹ {message}{Colors.ENDC}")

def print_warning(message: str):
    """Print warning message"""
    print(f"{Colors.WARNING}⚠ {message}{Colors.ENDC}")

def get_auth_session() -> Optional[requests.Session]:
    """Get authenticated session with cookies and CSRF token"""
    print_test_header("AUTHENTICATION")
    print_info(f"Using credentials: {TEST_USERNAME}")

    try:
        session = requests.Session()

        # Step 1: Get CSRF token
        print_info("Fetching CSRF token...")
        csrf_response = session.get(f"{BASE_URL}/api/csrf/")
        if csrf_response.status_code != 200:
            print_error(f"Failed to get CSRF token: {csrf_response.status_code}")
            return None

        csrf_token = session.cookies.get('csrftoken')
        if csrf_token:
            print_success(f"CSRF token obtained")
            # Set CSRF token in headers for all POST requests
            session.headers.update({'X-CSRFToken': csrf_token})
        else:
            print_warning("No CSRF token in cookies")

        # Step 2: Login
        print_info("Logging in...")
        login_url = f"{BASE_URL}/api/auth/login/"
        response = session.post(
            login_url,
            json={"username": TEST_USERNAME, "password": TEST_PASSWORD}
        )

        if response.status_code == 200:
            data = response.json()
            if 'access' in session.cookies and 'refresh' in session.cookies:
                print_success(f"Login successful! Auth cookies obtained.")
                print_info(f"User: {data['user']['username']}")
                return session
            else:
                print_error("Login successful but no auth cookies found")
                return None
        else:
            print_error(f"Login failed with status {response.status_code}")
            print_info(f"Response: {response.text}")
            return None

    except Exception as e:
        print_error(f"Login attempt failed: {e}")
        import traceback
        traceback.print_exc()
        return None


# ============================================================================
# TASK 1: Test Agent Creation Response Structure
# ============================================================================

def test_task1_agent_creation_response(session: requests.Session):
    """Test Task 1: Verify agent creation response structure"""
    print_test_header("TASK 1: Agent Creation Response Structure")

    # Get templates
    print_info("Fetching available templates...")
    response = session.get(f"{BASE_URL}/api/agents/templates/")

    if response.status_code != 200:
        print_error(f"Failed to fetch templates: {response.status_code}")
        print_info(f"Response: {response.text}")
        print_info(f"Cookies: {session.cookies}")
        return False

    try:
        templates_data = response.json()
        print_success(f"Got {len(templates_data)} categories")

        # Templates are grouped by category, extract all templates
        all_templates = []
        for category in templates_data:
            if 'templates' in category:
                all_templates.extend(category['templates'])

        print_success(f"Found {len(all_templates)} total templates")

    except Exception as e:
        print_error(f"Failed to parse JSON: {e}")
        print_info(f"Response text: {response.text[:200]}")
        return False

    template_id = all_templates[0]['id'] if all_templates else None

    # Test 1A: Create agent from template
    if template_id:
        print_info("\nTest 1A: Creating agent from template...")
        response = session.post(
            f"{BASE_URL}/api/agents/",
            json={"template_id": template_id, "name": "Test Agent from Template"}
        )

        if response.status_code in [200, 201]:
            data = response.json()
            print_success("Agent created from template")

            required_fields = ['id', 'name', 'prompt', 'template_id', 'missing_connections']
            missing_fields = [f for f in required_fields if f not in data]

            if missing_fields:
                print_error(f"Missing fields: {missing_fields}")
                return False

            print_success(f"All required fields present")
            print_success(f"template_id: {data.get('template_id')}")
            print_success(f"missing_connections: {data.get('missing_connections')}")

            # Cleanup
            agent_id = data['id']
            session.delete(f"{BASE_URL}/api/agents/{agent_id}/")
        else:
            print_error(f"Failed: {response.status_code}")
            return False

    # Test 1B: YOLO mode
    print_info("\nTest 1B: Creating agent in YOLO mode...")
    response = session.post(
        f"{BASE_URL}/api/agents/",
        json={"prompt": "You are a helpful test assistant."}
    )

    if response.status_code in [200, 201]:
        data = response.json()
        print_success("YOLO agent created")

        if data.get('template_id') is None:
            print_success("template_id correctly null for YOLO mode")
        else:
            print_warning(f"template_id should be null, got: {data.get('template_id')}")

        # Cleanup
        agent_id = data['id']
        session.delete(f"{BASE_URL}/api/agents/{agent_id}/")
    else:
        print_error(f"Failed: {response.status_code}")
        return False

    print_success("\n✅ TASK 1: All tests passed!")
    return True


# ============================================================================
# TASK 2: Test Public Agent Endpoint
# ============================================================================

def test_task2_public_agent_endpoint(session: requests.Session):
    """Test Task 2: Public agent endpoint"""
    print_test_header("TASK 2: Public Agent Endpoint")

    # Create agent
    print_info("Creating test agent...")
    response = session.post(
        f"{BASE_URL}/api/agents/",
        json={"prompt": "Public test agent", "name": "Public Test Agent"}
    )

    if response.status_code not in [200, 201]:
        print_error(f"Failed to create agent: {response.status_code}")
        return False

    agent_id = response.json()['id']
    print_success(f"Agent created: {agent_id}")

    # Test public endpoint WITHOUT cookies
    print_info("\nTest 2A: Accessing public endpoint without auth...")
    public_response = requests.get(f"{BASE_URL}/api/agents/public/{agent_id}/")

    if public_response.status_code == 200:
        data = public_response.json()
        print_success("Public endpoint accessible without auth ✓")
        if data.get('id') == agent_id:
            print_success("Correct agent data returned")
        else:
            print_error("Agent ID mismatch")
            session.delete(f"{BASE_URL}/api/agents/{agent_id}/")
            return False
    else:
        print_error(f"Public endpoint failed: {public_response.status_code}")
        session.delete(f"{BASE_URL}/api/agents/{agent_id}/")
        return False

    # Test 404
    print_info("\nTest 2B: Testing 404 for non-existent agent...")
    fake_id = "00000000-0000-0000-0000-000000000000"
    response_404 = requests.get(f"{BASE_URL}/api/agents/public/{fake_id}/")

    if response_404.status_code == 404:
        print_success("Correctly returns 404")
    else:
        print_error(f"Expected 404, got {response_404.status_code}")
        session.delete(f"{BASE_URL}/api/agents/{agent_id}/")
        return False

    # Cleanup
    session.delete(f"{BASE_URL}/api/agents/{agent_id}/")

    print_success("\n✅ TASK 2: All tests passed!")
    return True


# ============================================================================
# TASK 3: Test Deprecated Endpoints
# ============================================================================

def test_task3_deprecated_endpoints(session: requests.Session):
    """Test Task 3: Deprecated endpoints removed"""
    print_test_header("TASK 3: Deprecated Endpoints Removed")

    # Test create-manual
    print_info("Test 3A: Verifying create-manual removed...")
    response = session.post(
        f"{BASE_URL}/api/agents/create-manual/",
        json={"name": "Test", "prompt": "Test"}
    )

    if response.status_code in [404, 405]:
        print_success(f"create-manual removed (status: {response.status_code})")
    else:
        print_error(f"Endpoint still exists: {response.status_code}")
        return False

    # Test instantiate-template
    print_info("\nTest 3B: Verifying instantiate-template removed...")
    response = session.post(
        f"{BASE_URL}/api/agents/instantiate-template/",
        json={"template_id": "test"}
    )

    if response.status_code in [404, 405]:
        print_success(f"instantiate-template removed (status: {response.status_code})")
    else:
        print_error(f"Endpoint still exists: {response.status_code}")
        return False

    print_success("\n✅ TASK 3: All tests passed!")
    return True


# ============================================================================
# Main Test Runner
# ============================================================================

def main():
    """Main test runner"""
    print(f"\n{Colors.BOLD}{Colors.HEADER}")
    print("="*70)
    print("  BACKEND REFACTORING TEST SUITE - Tasks 1-8")
    print("  Cookie-Based Authentication")
    print("="*70)
    print(f"{Colors.ENDC}\n")

    # Get authenticated session
    session = get_auth_session()

    if not session:
        print_error("Authentication failed. Cannot proceed.")
        sys.exit(1)

    # Track results
    results = {}

    # Run tests (limited set for now)
    tests = [
        ("Task 1: Agent Creation Response", test_task1_agent_creation_response),
        ("Task 2: Public Agent Endpoint", test_task2_public_agent_endpoint),
        ("Task 3: Deprecated Endpoints", test_task3_deprecated_endpoints),
    ]

    for test_name, test_func in tests:
        try:
            results[test_name] = test_func(session)
        except Exception as e:
            print_error(f"Test {test_name} raised exception: {e}")
            import traceback
            traceback.print_exc()
            results[test_name] = False

        time.sleep(1)

    # Print summary
    print_test_header("TEST SUMMARY")

    passed = sum(1 for result in results.values() if result)
    total = len(results)

    for test_name, result in results.items():
        if result:
            print_success(f"{test_name}: PASSED")
        else:
            print_error(f"{test_name}: FAILED")

    print(f"\n{Colors.BOLD}Results: {passed}/{total} tests passed{Colors.ENDC}")

    if passed == total:
        print(f"\n{Colors.OKGREEN}{Colors.BOLD}🎉 ALL TESTS PASSED! 🎉{Colors.ENDC}\n")
        sys.exit(0)
    else:
        print(f"\n{Colors.FAIL}{Colors.BOLD}❌ SOME TESTS FAILED ❌{Colors.ENDC}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
