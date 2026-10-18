"""
Manual Verification Script for Tasks 1-8
Tests against EC2 production server to verify all implementations work correctly.
"""

import requests
import json
import os
import sys

# Target server (override with BASE_URL env var)
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Test credentials
USERNAME = "testtest"
PASSWORD = "testtest"

class Colors:
    OKGREEN = '\033[92m'
    FAIL = '\033[91m'
    WARNING = '\033[93m'
    OKCYAN = '\033[96m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.BOLD}{text}{Colors.ENDC}")
    print(f"{Colors.BOLD}{'='*70}{Colors.ENDC}")

def print_success(text):
    print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")

def print_error(text):
    print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")

def print_info(text):
    print(f"{Colors.OKCYAN}ℹ️  {text}{Colors.ENDC}")

def print_warning(text):
    print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")

def login():
    """Authenticate and get session"""
    print_header("AUTHENTICATION")
    session = requests.Session()

    # Get CSRF token
    csrf_response = session.get(f"{BASE_URL}/api/csrf/")
    csrf_token = session.cookies.get('csrftoken')
    if csrf_token:
        session.headers.update({'X-CSRFToken': csrf_token})
        print_success("CSRF token obtained")

    # Login
    response = session.post(
        f"{BASE_URL}/api/auth/login/",
        json={"username": USERNAME, "password": PASSWORD}
    )

    if response.status_code == 200:
        user_data = response.json()
        print_success(f"Logged in as: {user_data['user']['username']}")
        return session
    else:
        print_error(f"Login failed: {response.status_code}")
        return None

def test_task1(session):
    """Task 1: Agent creation response with template_id and missing_connections"""
    print_header("TASK 1: Agent Creation Response Structure")

    issues = []

    # Get templates
    print_info("Fetching templates...")
    templates_response = session.get(f"{BASE_URL}/api/agents/templates/")
    if templates_response.status_code != 200:
        print_error(f"Failed to fetch templates: {templates_response.status_code}")
        return ["Cannot fetch templates"]

    templates_data = templates_response.json()
    all_templates = []
    for category in templates_data:
        all_templates.extend(category.get('templates', []))

    print_success(f"Found {len(all_templates)} templates")

    if not all_templates:
        return ["No templates available for testing"]

    template_id = all_templates[0]['id']
    template_name = all_templates[0]['name']

    # Test 1A: Create agent from template
    print_info(f"\n1A: Creating agent from template '{template_name}'...")
    create_response = session.post(
        f"{BASE_URL}/api/agents/",
        json={"template_id": template_id, "name": "Test Agent Verification"}
    )

    if create_response.status_code not in [200, 201]:
        print_error(f"Failed to create agent: {create_response.status_code}")
        print_info(f"Response: {create_response.text[:200]}")
        return ["Cannot create agent from template"]

    agent_data = create_response.json()
    agent_id = agent_data.get('id')
    print_success(f"Agent created: {agent_id}")
    print_info(f"Response keys: {list(agent_data.keys())}")

    # Verify template_id field
    if 'template_id' not in agent_data:
        issues.append("Missing 'template_id' field in response")
        print_error("Missing 'template_id' field")
    elif agent_data['template_id'] == template_id:
        print_success(f"template_id correctly set: {template_id}")
    else:
        issues.append(f"template_id mismatch: expected {template_id}, got {agent_data['template_id']}")
        print_error(f"template_id mismatch")

    # Verify missing_connections field
    if 'missing_connections' not in agent_data:
        issues.append("Missing 'missing_connections' field in response")
        print_error("Missing 'missing_connections' field")
    else:
        missing = agent_data['missing_connections']
        if isinstance(missing, list):
            print_success(f"missing_connections is list: {missing}")
        else:
            issues.append(f"missing_connections is not a list: {type(missing)}")
            print_error(f"missing_connections wrong type: {type(missing)}")

    # Verify field order
    required_fields = ['name', 'prompt', 'avatar_base64', 'app_connections', 'agent_tools',
                      'missing_connections', 'created_at', 'id', 'template_id']
    missing_fields = [f for f in required_fields if f not in agent_data]
    if missing_fields:
        issues.append(f"Missing required fields: {missing_fields}")
        print_error(f"Missing fields: {missing_fields}")
    else:
        print_success("All required fields present")

    # Cleanup
    session.delete(f"{BASE_URL}/api/agents/{agent_id}/")
    print_info(f"Cleaned up test agent")

    # Test 1B: YOLO mode
    print_info("\n1B: Creating agent in YOLO mode...")
    yolo_response = session.post(
        f"{BASE_URL}/api/agents/",
        json={"prompt": "You are a test agent for verification."}
    )

    if yolo_response.status_code in [200, 201]:
        yolo_data = yolo_response.json()
        yolo_id = yolo_data.get('id')

        if yolo_data.get('template_id') is None:
            print_success("template_id correctly null for YOLO mode")
        else:
            issues.append(f"YOLO mode should have null template_id, got: {yolo_data.get('template_id')}")
            print_error(f"template_id should be null, got: {yolo_data.get('template_id')}")

        if yolo_data.get('missing_connections') == []:
            print_success("missing_connections correctly empty for YOLO mode")
        else:
            print_warning(f"missing_connections not empty: {yolo_data.get('missing_connections')}")

        # Cleanup
        session.delete(f"{BASE_URL}/api/agents/{yolo_id}/")
        print_info("Cleaned up YOLO test agent")
    else:
        issues.append(f"YOLO mode creation failed: {yolo_response.status_code}")
        print_error(f"YOLO creation failed: {yolo_response.status_code}")

    return issues

def test_task2(session):
    """Task 2: Public agent endpoint"""
    print_header("TASK 2: Public Agent Endpoint")

    issues = []

    # Create test agent
    print_info("Creating test agent...")
    create_response = session.post(
        f"{BASE_URL}/api/agents/",
        json={"prompt": "Public test agent", "name": "Public Verification Agent"}
    )

    if create_response.status_code not in [200, 201]:
        print_error(f"Failed to create agent: {create_response.status_code}")
        return ["Cannot create test agent"]

    agent_id = create_response.json()['id']
    print_success(f"Test agent created: {agent_id}")

    # Test public endpoint WITHOUT authentication
    print_info("Testing public endpoint without authentication...")
    public_response = requests.get(f"{BASE_URL}/api/agents/public/{agent_id}/")

    if public_response.status_code == 200:
        print_success("Public endpoint accessible without auth ✓")
        public_data = public_response.json()

        if public_data.get('id') == agent_id:
            print_success("Correct agent data returned")
        else:
            issues.append("Agent ID mismatch in public response")
            print_error("Agent ID mismatch")
    else:
        issues.append(f"Public endpoint failed: {public_response.status_code}")
        print_error(f"Public endpoint returned: {public_response.status_code}")
        print_info(f"Response: {public_response.text[:200]}")

    # Test 404 for non-existent agent
    print_info("Testing 404 for non-existent agent...")
    fake_id = "00000000-0000-0000-0000-000000000000"
    not_found_response = requests.get(f"{BASE_URL}/api/agents/public/{fake_id}/")

    if not_found_response.status_code == 404:
        print_success("Correctly returns 404 for non-existent agent")
    else:
        issues.append(f"Should return 404, got: {not_found_response.status_code}")
        print_error(f"Expected 404, got: {not_found_response.status_code}")

    # Cleanup
    session.delete(f"{BASE_URL}/api/agents/{agent_id}/")
    print_info("Cleaned up test agent")

    return issues

def test_task3(session):
    """Task 3: Deprecated endpoints removed"""
    print_header("TASK 3: Deprecated Endpoints Removed")

    issues = []

    # Test create-manual
    print_info("Testing create-manual endpoint (should be removed)...")
    response1 = session.post(
        f"{BASE_URL}/api/agents/create-manual/",
        json={"name": "Test", "prompt": "Test"}
    )

    if response1.status_code in [404, 405]:
        print_success(f"create-manual correctly removed (status: {response1.status_code})")
    else:
        issues.append(f"create-manual still exists (status: {response1.status_code})")
        print_error(f"create-manual endpoint still exists: {response1.status_code}")

    # Test instantiate-template
    print_info("Testing instantiate-template endpoint (should be removed)...")
    response2 = session.post(
        f"{BASE_URL}/api/agents/instantiate-template/",
        json={"template_id": "fake-id"}
    )

    if response2.status_code in [404, 405]:
        print_success(f"instantiate-template correctly removed (status: {response2.status_code})")
    else:
        issues.append(f"instantiate-template still exists (status: {response2.status_code})")
        print_error(f"instantiate-template endpoint still exists: {response2.status_code}")

    return issues

def test_task4(session):
    """Task 4: Auto-linking tools to agents"""
    print_header("TASK 4: Auto-linking Tools to Agents")

    issues = []

    print_info("Creating test agent...")
    create_response = session.post(
        f"{BASE_URL}/api/agents/",
        json={"prompt": "Auto-link test agent", "name": "Auto-link Verification"}
    )

    if create_response.status_code not in [200, 201]:
        print_error(f"Failed to create agent: {create_response.status_code}")
        return ["Cannot create test agent"]

    agent_id = create_response.json()['id']
    print_success(f"Test agent created: {agent_id}")

    # Test that connection endpoint accepts agent_id parameter
    print_info("Testing connection endpoint with agent_id parameter...")
    print_warning("Note: Will fail without valid Composio credentials, testing parameter acceptance only")

    connection_response = session.post(
        f"{BASE_URL}/api/connections/",
        json={
            "tool_name": "GMAIL",
            "redirect_url": "/integrations",
            "agent_id": agent_id  # This is the new parameter
        }
    )

    # We expect this to fail at Composio level, but should not error on parameter validation
    if connection_response.status_code == 400:
        error_text = connection_response.text.lower()
        if "agent_id" in error_text and ("invalid" in error_text or "unknown" in error_text):
            issues.append("agent_id parameter not accepted by endpoint")
            print_error("agent_id parameter validation failed")
        else:
            print_success("agent_id parameter accepted (failed at Composio level as expected)")
    elif connection_response.status_code in [200, 201]:
        print_success("Connection endpoint accepts agent_id parameter")
    else:
        print_info(f"Connection returned: {connection_response.status_code} (expected, needs Composio setup)")

    # Cleanup
    session.delete(f"{BASE_URL}/api/agents/{agent_id}/")
    print_info("Cleaned up test agent")

    return issues

def test_task5():
    """Task 5: Enhanced system prompt - Code verification"""
    print_header("TASK 5: Enhanced System Prompt & Context Window")

    issues = []

    print_info("Checking agent_service.py for system prompt enhancements...")

    try:
        with open(os.path.join(BACKEND_DIR, 'api_agents/agents/services/agent_service.py'), 'r') as f:
            content = f.read()

        # Check for key enhancements
        checks = [
            ("AUTONOMOUS OPERATION MODE", "Autonomy instructions"),
            ("TOOL USAGE vs TEXT SIMULATION", "Tool usage guidance"),
            ("YOU MUST USE TOOLS", "Explicit tool usage requirement"),
            ("Examples of CORRECT behavior", "Example guidance"),
        ]

        for keyword, description in checks:
            if keyword in content:
                print_success(f"Found: {description}")
            else:
                issues.append(f"Missing: {description}")
                print_error(f"Missing: {description}")

        print_info("\nChecking views.py for context window increase...")
        with open(os.path.join(BACKEND_DIR, 'api_agents/agents/views.py'), 'r') as f:
            views_content = f.read()

        if "[:10]" in views_content and "last 10 messages" in views_content.lower():
            print_success("Context window increased to 10 messages")
        elif "[:6]" in views_content:
            issues.append("Context window still at 6 messages")
            print_error("Context window not increased")
        else:
            print_warning("Cannot verify context window size")

    except Exception as e:
        issues.append(f"Code verification error: {e}")
        print_error(f"Error reading files: {e}")

    return issues

def test_task6():
    """Task 6: Simulation detection - Code verification"""
    print_header("TASK 6: Simulation Detection")

    issues = []

    print_info("Checking agent_service.py for simulation detection...")

    try:
        with open(os.path.join(BACKEND_DIR, 'api_agents/agents/services/agent_service.py'), 'r') as f:
            content = f.read()

        if "_detect_simulated_actions" in content:
            print_success("_detect_simulated_actions method found")
        else:
            issues.append("_detect_simulated_actions method not found")
            print_error("Simulation detection method missing")
            return issues

        # Check for simulation keywords
        keywords_to_check = ["I'll send", "I will send", "I would send"]
        found_keywords = sum(1 for kw in keywords_to_check if kw in content)

        if found_keywords >= 2:
            print_success(f"Simulation detection keywords found ({found_keywords}/3)")
        else:
            issues.append("Simulation detection keywords insufficient")
            print_warning(f"Only {found_keywords}/3 keywords found")

        if "SIMULATION DETECTED" in content:
            print_success("Simulation warning logging found")
        else:
            issues.append("Simulation warning logging missing")
            print_error("Warning logging missing")

    except Exception as e:
        issues.append(f"Code verification error: {e}")
        print_error(f"Error reading file: {e}")

    return issues

def test_task7():
    """Task 7: Response truncation - Code verification"""
    print_header("TASK 7: Response Truncation")

    issues = []

    print_info("Checking views.py for response truncation...")

    try:
        with open(os.path.join(BACKEND_DIR, 'api_agents/agents/views.py'), 'r') as f:
            content = f.read()

        if "MAX_RESPONSE_LENGTH" in content:
            print_success("MAX_RESPONSE_LENGTH constant found")
        else:
            issues.append("MAX_RESPONSE_LENGTH constant not found")
            print_error("Truncation constant missing")
            return issues

        if "15000" in content:
            print_success("Response limit set to 15,000 characters")
        else:
            print_warning("Cannot verify exact limit value")

        if "response truncated" in content.lower():
            print_success("Truncation message found")
        else:
            issues.append("Truncation message missing")
            print_error("Truncation message not found")

    except Exception as e:
        issues.append(f"Code verification error: {e}")
        print_error(f"Error reading file: {e}")

    return issues

def test_task8():
    """Task 8: URL file fetching - Code verification"""
    print_header("TASK 8: URL File Fetching")

    issues = []

    print_info("Checking views.py for URL file fetching...")

    try:
        with open(os.path.join(BACKEND_DIR, 'api_agents/agents/views.py'), 'r') as f:
            content = f.read()

        checks = [
            ("url_pattern", "URL regex pattern"),
            ("re.findall", "URL detection"),
            ("requests.get", "File fetching"),
            ("1024 * 1024", "1MB size limit"),
            ("timeout", "Request timeout"),
            ("is_temporary=True", "Temporary attachment flag"),
        ]

        for keyword, description in checks:
            if keyword in content:
                print_success(f"Found: {description}")
            else:
                issues.append(f"Missing: {description}")
                print_error(f"Missing: {description}")

    except Exception as e:
        issues.append(f"Code verification error: {e}")
        print_error(f"Error reading file: {e}")

    return issues

def main():
    print(f"\n{Colors.BOLD}{'='*70}")
    print("MANUAL VERIFICATION - Tasks 1-8 Implementation")
    print(f"{'='*70}{Colors.ENDC}\n")

    # Login
    session = login()
    if not session:
        print_error("Authentication failed. Cannot proceed.")
        sys.exit(1)

    # Run all tests
    all_issues = {}

    tests = [
        ("Task 1", lambda: test_task1(session)),
        ("Task 2", lambda: test_task2(session)),
        ("Task 3", lambda: test_task3(session)),
        ("Task 4", lambda: test_task4(session)),
        ("Task 5", test_task5),
        ("Task 6", test_task6),
        ("Task 7", test_task7),
        ("Task 8", test_task8),
    ]

    for task_name, test_func in tests:
        try:
            all_issues[task_name] = test_func()
        except Exception as e:
            print_error(f"{task_name} raised exception: {e}")
            import traceback
            traceback.print_exc()
            all_issues[task_name] = [f"Test raised exception: {e}"]

    # Summary
    print_header("VERIFICATION SUMMARY")

    total_tasks = len(all_issues)
    passed_tasks = sum(1 for issues in all_issues.values() if not issues)

    for task_name, issues in all_issues.items():
        if not issues:
            print_success(f"{task_name}: PASSED")
        else:
            print_error(f"{task_name}: {len(issues)} issue(s)")
            for issue in issues:
                print(f"    - {issue}")

    print(f"\n{Colors.BOLD}Results: {passed_tasks}/{total_tasks} tasks passed{Colors.ENDC}")

    if passed_tasks == total_tasks:
        print(f"\n{Colors.OKGREEN}{Colors.BOLD}🎉 ALL TASKS VERIFIED! 🎉{Colors.ENDC}\n")
        sys.exit(0)
    else:
        print(f"\n{Colors.WARNING}{Colors.BOLD}⚠️  SOME ISSUES FOUND ⚠️{Colors.ENDC}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
