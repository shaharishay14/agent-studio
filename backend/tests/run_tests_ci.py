"""
Non-interactive test runner for CI/CD or automated testing.
Uses environment variables or default test credentials.
"""

import os
import sys

# Set test credentials via environment variables
TEST_USERNAME = os.getenv('TEST_USERNAME', 'test@example.com')
TEST_PASSWORD = os.getenv('TEST_PASSWORD', '')

if not TEST_PASSWORD:
    print("❌ TEST_PASSWORD environment variable not set")
    print("Usage: TEST_USERNAME='user' TEST_PASSWORD='pass' python tests/run_tests_ci.py")
    sys.exit(1)

# Monkey-patch the authentication function
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

import test_refactoring_tasks as test_module

original_get_auth_token = test_module.get_auth_token

def non_interactive_get_auth_token():
    """
    Non-interactive authentication using environment variables.
    Returns a requests.Session object with cookies instead of a token.
    """
    test_module.print_test_header("AUTHENTICATION (CI MODE)")
    test_module.print_info(f"Using username: {TEST_USERNAME}")

    try:
        import requests
        session = requests.Session()
        login_url = f"{test_module.BASE_URL}/api/auth/login/"
        response = session.post(
            login_url,
            json={"username": TEST_USERNAME, "password": TEST_PASSWORD}
        )

        if response.status_code == 200:
            data = response.json()
            # Check if cookies were set
            if 'access' in session.cookies and 'refresh' in session.cookies:
                test_module.print_success(f"Login successful! Cookies obtained.")
                test_module.print_info(f"User: {data['user']['username']} (ID: {data['user']['id']})")
                # Return the session object which contains the cookies
                return session
            else:
                test_module.print_error("Login successful but no cookies found")
                return None
        else:
            test_module.print_error(f"Login failed with status {response.status_code}")
            test_module.print_info(f"Response: {response.text}")
            return None

    except Exception as e:
        test_module.print_error(f"Login attempt failed: {e}")
        return None

# Replace the authentication function
test_module.get_auth_token = non_interactive_get_auth_token

# Run the main test suite
if __name__ == "__main__":
    test_module.main()
