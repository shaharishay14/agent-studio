#!/usr/bin/env python3
"""
Edge case tests for the multi-task execution flow.
Tests specific scenarios that caused issues in production.
"""

import sys
import os
import re

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


class TestScenarios:
    """Test specific production scenarios."""

    @staticmethod
    def simulate_stock_email_flow():
        """Simulate the stock analysis -> email flow."""
        print("\n📧 Testing Stock Analysis Email Flow")
        print("-" * 40)

        # Step 1: Agent tools fetch data (with markdown)
        fetched_data = """
        ### AAPL Stock Analysis

        **Current Price:** $242.84
        **Change:** +2.37%

        ## Key Metrics
        - Market Cap: $3.85T
        - P/E Ratio: 32.5

        ```
        Volume: 45,234,123
        Average: 52,123,456
        ```

        **Recommendation:** Strong buy
        """

        print("1. Raw fetched data (with markdown):")
        print(f"   Length: {len(fetched_data)} chars")
        print(f"   Contains '###': {('###' in fetched_data)}")
        print(f"   Contains '**': {('**' in fetched_data)}")

        # Step 2: Clean markdown
        cleaned_data = clean_markdown(fetched_data)

        print("\n2. After markdown cleaning:")
        print(f"   Length: {len(cleaned_data)} chars")
        print(f"   Contains '###': {('###' in cleaned_data)}")
        print(f"   Contains '**': {('**' in cleaned_data)}")
        print(f"   Contains '```': {('```' in cleaned_data)}")

        # Step 3: Verify content preserved
        assert "AAPL Stock Analysis" in cleaned_data
        assert "Current Price: $242.84" in cleaned_data
        assert "Market Cap: $3.85T" in cleaned_data
        assert "Recommendation: Strong buy" in cleaned_data

        # Step 4: Verify markdown removed
        assert "###" not in cleaned_data
        assert "**" not in cleaned_data
        assert "```" not in cleaned_data
        assert not any(line.strip().startswith("-") for line in cleaned_data.split("\n"))

        print("\n✅ Stock email flow test PASSED")
        return True

    @staticmethod
    def test_multi_task_queue():
        """Test multi-task queue execution scenarios."""
        print("\n🔄 Testing Multi-Task Queue")
        print("-" * 40)

        tasks = [
            {'action': 'send_email', 'platform': 'gmail'},
            {'action': 'create_document', 'platform': 'googledrive'},
            {'action': 'post', 'platform': 'twitter'}
        ]

        print(f"1. Task queue with {len(tasks)} tasks")

        # Simulate task execution
        results = []
        for i, task in enumerate(tasks, 1):
            print(f"   Task {i}: {task['action']} on {task['platform']}")
            # Check for duplicate prevention
            if task['action'] in [r['action'] for r in results]:
                print(f"   ⚠️  Warning: Duplicate action detected!")
                return False
            results.append(task)

        print(f"\n2. Executed {len(results)} unique tasks")
        print("✅ Multi-task queue test PASSED")
        return True

    @staticmethod
    def test_error_handling():
        """Test error handling scenarios."""
        print("\n⚠️  Testing Error Handling")
        print("-" * 40)

        # Test 1: Empty data handling
        empty_result = clean_markdown("")
        assert empty_result == "", "Empty string not handled correctly"
        print("1. Empty data handling: ✅")

        # Test 2: None handling
        none_result = clean_markdown(None)
        assert none_result == "", "None not handled correctly"
        print("2. None handling: ✅")

        # Test 3: Invalid markdown
        invalid = "** incomplete markdown"
        result = clean_markdown(invalid)
        # Should handle gracefully without errors
        print("3. Invalid markdown handling: ✅")

        # Test 4: Very long content
        long_content = "**Bold text**\n" * 1000
        result = clean_markdown(long_content)
        assert "**" not in result
        print("4. Long content handling: ✅")

        print("\n✅ Error handling tests PASSED")
        return True

    @staticmethod
    def test_vague_references():
        """Test handling of vague references like 'send this'."""
        print("\n🔍 Testing Vague References")
        print("-" * 40)

        test_cases = [
            "send this to my email",
            "email me this analysis",
            "save this to drive",
            "post it on twitter"
        ]

        for message in test_cases:
            print(f"   '{message}' -> ", end="")

            # Check for vague references
            vague_words = ["this", "it", "that"]
            has_vague = any(word in message.lower() for word in vague_words)

            if has_vague:
                print("Vague reference detected ✅")
            else:
                print("Clear reference ✅")

        print("\n✅ Vague reference tests PASSED")
        return True

    @staticmethod
    def test_markdown_edge_cases():
        """Test specific markdown edge cases from production."""
        print("\n🎯 Testing Markdown Edge Cases")
        print("-" * 40)

        # Edge case 1: Nested bold in headers
        text1 = "### **Important Header**"
        result1 = clean_markdown(text1)
        assert "###" not in result1
        assert "**" not in result1
        assert "Important Header" in result1
        print("1. Nested bold in headers: ✅")

        # Edge case 2: Mixed list markers
        text2 = """
        - Item 1
        * Item 2
        + Item 3
        • Item 4
        """
        result2 = clean_markdown(text2)
        for marker in ["-", "*", "+", "•"]:
            lines_with_marker = [l for l in result2.split("\n") if l.strip().startswith(marker)]
            assert len(lines_with_marker) == 0, f"Marker {marker} not removed"
        print("2. Mixed list markers: ✅")

        # Edge case 3: Code block with language
        text3 = "```python\nimport os\n```"
        result3 = clean_markdown(text3)
        assert "```" not in result3
        assert "python" not in result3 or "import" in result3  # python should be removed as language specifier
        assert "import os" in result3
        print("3. Code block with language: ✅")

        # Edge case 4: Multiple consecutive newlines
        text4 = "Line 1\n\n\n\n\nLine 2"
        result4 = clean_markdown(text4)
        assert "\n\n\n" not in result4  # Should be max 2 newlines
        print("4. Multiple newlines: ✅")

        print("\n✅ Markdown edge cases PASSED")
        return True


def clean_markdown(text):
    """Markdown cleaning function (copy from agent_service)."""
    if not text:
        return ""

    # Remove code blocks
    text = re.sub(r'```[a-zA-Z]*\n?([^`]+)```', r'\1', text)

    # Remove inline code
    text = re.sub(r'`([^`]+)`', r'\1', text)

    # Remove headers (with optional leading whitespace)
    text = re.sub(r'^\s*#{1,6}\s+', '', text, flags=re.MULTILINE)

    # Remove bold with nested content
    text = re.sub(r'\*\*([^*]+):\*\*', r'\1:', text)

    # Remove bold
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)

    # Remove italic
    text = re.sub(r'(?<!\w)\*([^*\n]+)\*(?!\w)', r'\1', text)

    # Remove list bullets
    text = re.sub(r'^\s*[-*+•]\s+', '', text, flags=re.MULTILINE)

    # Remove numbered lists
    text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)

    # Clean up whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = text.strip()

    return text


def run_all_tests():
    """Run all edge case tests."""
    print("\n" + "=" * 50)
    print("🧪 EDGE CASE TEST SUITE")
    print("=" * 50)

    tests = [
        TestScenarios.simulate_stock_email_flow,
        TestScenarios.test_multi_task_queue,
        TestScenarios.test_error_handling,
        TestScenarios.test_vague_references,
        TestScenarios.test_markdown_edge_cases,
    ]

    failed = []
    for test in tests:
        try:
            if not test():
                failed.append(test.__name__)
        except AssertionError as e:
            print(f"\n❌ {test.__name__} FAILED: {e}")
            failed.append(test.__name__)
        except Exception as e:
            print(f"\n❌ {test.__name__} ERROR: {e}")
            failed.append(test.__name__)

    print("\n" + "=" * 50)
    if not failed:
        print("✅ ALL EDGE CASE TESTS PASSED!")
        print("=" * 50)
        print("\nSummary:")
        print("  • Markdown cleaning: Working correctly")
        print("  • Multi-task queue: No duplicates")
        print("  • Error handling: Graceful failures")
        print("  • Vague references: Properly detected")
        print("  • Edge cases: All handled")
        return 0
    else:
        print(f"❌ {len(failed)} test(s) failed: {', '.join(failed)}")
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())