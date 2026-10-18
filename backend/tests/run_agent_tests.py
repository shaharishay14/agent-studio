#!/usr/bin/env python3
"""
Test runner for agent service tests.
Run this script to test the agent service flow without live Composio connections.
"""

import os
import sys
import subprocess
import argparse


def run_tests(verbose=False, specific_test=None, coverage=False):
    """Run the agent service tests."""

    # Change to backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)

    # Build pytest command
    cmd = ["python", "-m", "pytest"]

    # Add test path
    if specific_test:
        cmd.append(f"api_agents/tests/test_agent_service.py::{specific_test}")
    else:
        cmd.append("api_agents/tests/test_agent_service.py")

    # Add verbosity
    if verbose:
        cmd.extend(["-v", "-s"])
    else:
        cmd.append("-q")

    # Add coverage if requested
    if coverage:
        cmd.extend([
            "--cov=api_agents.agents.services.agent_service",
            "--cov-report=term-missing",
            "--cov-report=html"
        ])

    # Add color output
    cmd.append("--color=yes")

    # Show test summary
    cmd.append("-ra")

    print(f"🧪 Running Agent Service Tests...")
    print(f"Command: {' '.join(cmd)}\n")

    # Run tests
    result = subprocess.run(cmd, capture_output=False, text=True)

    if result.returncode == 0:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Some tests failed. See output above for details.")

    return result.returncode


def list_tests():
    """List all available test classes and methods."""
    print("📋 Available Test Classes and Methods:\n")

    test_structure = {
        "TestMarkdownCleaning": [
            "test_clean_markdown_headers",
            "test_clean_markdown_bold",
            "test_clean_markdown_lists",
            "test_clean_markdown_code_blocks",
            "test_clean_markdown_complex"
        ],
        "TestHybridExecution": [
            "test_hybrid_execution_success",
            "test_multi_task_execution"
        ],
        "TestTaskQueueExecution": [
            "test_task_queue_with_markdown_cleaning",
            "test_task_queue_multiple_tasks"
        ],
        "TestValidationEdgeCases": [
            "test_validation_failure_handling",
            "test_empty_agent_tools_response",
            "test_markdown_cleaning_with_none",
            "test_markdown_cleaning_with_empty_string",
            "test_task_queue_with_exception"
        ],
        "TestTimeoutHandling": [
            "test_composio_timeout"
        ],
        "TestIntegrationScenarios": [
            "test_stock_analysis_email_flow"
        ]
    }

    for class_name, methods in test_structure.items():
        print(f"  {class_name}:")
        for method in methods:
            print(f"    - {method}")
        print()


def main():
    """Main function to handle command line arguments."""
    parser = argparse.ArgumentParser(
        description="Run agent service tests without live Composio connections"
    )

    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Show verbose output"
    )

    parser.add_argument(
        "-l", "--list",
        action="store_true",
        help="List all available tests"
    )

    parser.add_argument(
        "-t", "--test",
        type=str,
        help="Run a specific test class or method (e.g., TestMarkdownCleaning or TestMarkdownCleaning::test_clean_markdown_headers)"
    )

    parser.add_argument(
        "-c", "--coverage",
        action="store_true",
        help="Generate coverage report"
    )

    parser.add_argument(
        "--install-deps",
        action="store_true",
        help="Install required test dependencies"
    )

    args = parser.parse_args()

    if args.install_deps:
        print("📦 Installing test dependencies...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pytest", "pytest-asyncio", "pytest-cov", "pytest-mock"])
        print("✅ Dependencies installed!\n")
        return 0

    if args.list:
        list_tests()
        return 0

    return run_tests(
        verbose=args.verbose,
        specific_test=args.test,
        coverage=args.coverage
    )


if __name__ == "__main__":
    sys.exit(main())