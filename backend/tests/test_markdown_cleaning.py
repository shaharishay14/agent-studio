#!/usr/bin/env python3
"""
Standalone tests for markdown cleaning functionality.
No Django or external dependencies required.
"""

import re
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def clean_markdown_formatting(text):
    """
    Standalone version of markdown cleaning function for testing.
    This is a direct copy of the method from agent_service.py
    """
    if not text:
        return ""

    # Remove code blocks (```code``` -> code)
    text = re.sub(r'```[a-zA-Z]*\n?([^`]+)```', r'\1', text)

    # Remove inline code (`code` -> code)
    text = re.sub(r'`([^`]+)`', r'\1', text)

    # Remove headers (### Header -> Header)
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)

    # Remove bold with nested content (**text:** -> text:)
    text = re.sub(r'\*\*([^*]+):\*\*', r'\1:', text)

    # Remove bold (**text** -> text)
    text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)

    # Remove italic (*text* -> text) - be careful not to remove multiplication
    text = re.sub(r'(?<!\w)\*([^*\n]+)\*(?!\w)', r'\1', text)

    # Remove list bullets with various markers (-, *, +)
    text = re.sub(r'^\s*[-*+]\s+', '', text, flags=re.MULTILINE)

    # Remove bullet points (• text -> text)
    text = re.sub(r'^\s*[•]\s+', '', text, flags=re.MULTILINE)

    # Remove numbered lists (1. text -> text)
    text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)

    # Remove blockquotes (> text -> text)
    text = re.sub(r'^\s*>\s+', '', text, flags=re.MULTILINE)

    # Remove horizontal rules (--- or *** or ___)
    text = re.sub(r'^[-*_]{3,}$', '', text, flags=re.MULTILINE)

    # Clean up extra whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)  # Max 2 newlines
    text = text.strip()

    return text


def test_clean_markdown_headers():
    """Test removal of markdown headers."""
    test_cases = [
        ("### AAPL Stock Analysis", "AAPL Stock Analysis"),
        ("## Overview", "Overview"),
        ("# Main Title", "Main Title"),
        ("#### Deep Header", "Deep Header"),
        ("##### Very Deep", "Very Deep"),
        ("###### Deepest", "Deepest"),
    ]

    for input_text, expected in test_cases:
        result = clean_markdown_formatting(input_text)
        assert result == expected, f"Failed for: {input_text}\nExpected: {expected}\nGot: {result}"
    print("✅ test_clean_markdown_headers PASSED")


def test_clean_markdown_bold():
    """Test removal of bold markdown."""
    test_cases = [
        ("**Important:** This is text", "Important: This is text"),
        ("This is **bold** text", "This is bold text"),
        ("**nested: content** here", "nested: content here"),
        ("**Start** middle **end**", "Start middle end"),
    ]

    for input_text, expected in test_cases:
        result = clean_markdown_formatting(input_text)
        assert result == expected, f"Failed for: {input_text}\nExpected: {expected}\nGot: {result}"
    print("✅ test_clean_markdown_bold PASSED")


def test_clean_markdown_lists():
    """Test removal of list markers."""
    test_cases = [
        ("- Item 1", "Item 1"),
        ("* Item 2", "Item 2"),
        ("+ Item 3", "Item 3"),
        ("• Bullet item", "Bullet item"),
        ("1. Numbered item", "Numbered item"),
        ("  - Indented item", "Indented item"),
    ]

    for input_text, expected in test_cases:
        result = clean_markdown_formatting(input_text)
        assert result == expected, f"Failed for: {input_text}\nExpected: {expected}\nGot: {result}"
    print("✅ test_clean_markdown_lists PASSED")


def test_clean_markdown_code_blocks():
    """Test removal of code blocks."""
    test_cases = [
        ("```python\nprint('hello')\n```", "print('hello')"),
        ("```\ncode here\n```", "code here"),
        # Note: The regex preserves newlines in the content
        ("Normal\n```js\nfunction() {}\n```\nText", "Normal\nfunction() {}\n\nText"),
        # Test inline code as well
        ("This is `inline code` here", "This is inline code here"),
        ("Multiple `code1` and `code2` blocks", "Multiple code1 and code2 blocks"),
    ]

    for input_text, expected in test_cases:
        result = clean_markdown_formatting(input_text)
        assert result == expected, f"Failed for: {input_text}\nExpected: {expected}\nGot: {result}"
    print("✅ test_clean_markdown_code_blocks PASSED")


def test_clean_markdown_complex():
    """Test cleaning complex markdown with multiple elements."""
    input_text = """### **Stock Analysis Report**

**Date:** December 4, 2025

## Key Metrics:
- **Price:** $242.84
- **Volume:** 15.2M
* **Change:** +2.3%

```
P/E Ratio: 32.5
Market Cap: $3.85T
```

### Summary
The stock showed **strong** performance today."""

    expected = """Stock Analysis Report

Date: December 4, 2025

Key Metrics:
Price: $242.84
Volume: 15.2M
Change: +2.3%

P/E Ratio: 32.5
Market Cap: $3.85T

Summary
The stock showed strong performance today."""

    result = clean_markdown_formatting(input_text)
    assert result == expected, f"Complex markdown test failed\nExpected:\n{expected}\n\nGot:\n{result}"
    print("✅ test_clean_markdown_complex PASSED")


def test_edge_cases():
    """Test edge cases."""
    # Test None
    assert clean_markdown_formatting(None) == ""

    # Test empty string
    assert clean_markdown_formatting("") == ""

    # Test string with only markdown
    assert clean_markdown_formatting("### ") == ""
    assert clean_markdown_formatting("**") == "**"  # Incomplete markdown stays

    # Test mixed content
    text = "Normal **bold** and *italic* and `code`"
    result = clean_markdown_formatting(text)
    assert "**" not in result
    assert "*" not in result or result.count("*") == 0

    print("✅ test_edge_cases PASSED")


def test_real_world_stock_analysis():
    """Test with real-world stock analysis data."""
    input_text = """### AAPL (Apple Inc.) Stock Analysis

## **Current Trading Information**

**Price:** $242.84 USD
**Change:** +$5.62 (+2.37%)

### Key Metrics:
- **Market Cap:** $3.85T
- **P/E Ratio:** 32.5
- **52 Week High:** $250.80
- **52 Week Low:** $164.08

## Technical Analysis
* **RSI:** 58.3 (Neutral)
* **MACD:** Bullish crossover
* **Moving Averages:**
  - 50-day MA: $235.20
  - 200-day MA: $195.50

```
Volume: 45,234,123 shares
Average Volume: 52,123,456 shares
```

### **Investment Recommendation**
Based on current metrics, AAPL shows **strong** momentum."""

    result = clean_markdown_formatting(input_text)

    # Check all markdown is removed
    assert "###" not in result
    assert "##" not in result
    assert "**" not in result
    assert "```" not in result

    # Check content is preserved
    assert "AAPL (Apple Inc.) Stock Analysis" in result
    assert "Price: $242.84 USD" in result
    assert "Market Cap: $3.85T" in result
    assert "RSI: 58.3 (Neutral)" in result
    assert "Volume: 45,234,123 shares" in result
    assert "strong momentum" in result

    print("✅ test_real_world_stock_analysis PASSED")


def run_all_tests():
    """Run all tests and report results."""
    print("\n🧪 Running Markdown Cleaning Tests\n")
    print("=" * 50)

    tests = [
        test_clean_markdown_headers,
        test_clean_markdown_bold,
        test_clean_markdown_lists,
        test_clean_markdown_code_blocks,
        test_clean_markdown_complex,
        test_edge_cases,
        test_real_world_stock_analysis,
    ]

    failed = []
    for test in tests:
        try:
            test()
        except AssertionError as e:
            print(f"❌ {test.__name__} FAILED")
            print(f"   Error: {e}")
            failed.append(test.__name__)
        except Exception as e:
            print(f"❌ {test.__name__} ERROR: {e}")
            failed.append(test.__name__)

    print("=" * 50)
    if not failed:
        print("\n✅ All tests passed successfully!")
        return 0
    else:
        print(f"\n❌ {len(failed)} test(s) failed: {', '.join(failed)}")
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())