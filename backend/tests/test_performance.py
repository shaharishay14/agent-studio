"""
Performance Benchmark Script for Agent Service

Tests multi-tool execution time to measure Phase 1 improvements
and establish baseline for Phase 2 optimizations.

Target: <10 seconds for multi-tool tasks
Current baseline: 20-25 seconds (after Phase 1 optimizations)
"""

import time
import asyncio
import sys
import os
import django
import json
from datetime import datetime
from pathlib import Path

# Setup Django environment
# Add parent directory (backend) to path so we can import config
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api_agents.agents.services.agent_service import AgentService
from api_agents.models import User, Agent


async def benchmark_single_tool():
    """
    Benchmark 1: Simple single tool execution
    Expected: 5-8 seconds
    """
    print("\n" + "="*80)
    print("BENCHMARK 1: Single Tool Execution (Send Email)")
    print("="*80)

    # Get test user
    user = User.objects.filter(is_active=True).first()
    if not user:
        print("❌ No active user found. Please create a user first.")
        return None

    print(f"📊 Using user: {user.username} (ID: {user.id})")

    # Get agent with Gmail connection
    agent = Agent.objects.filter(
        user=user,
        app_connections__contains=['GMAIL']
    ).first()

    if not agent:
        print("❌ No agent with Gmail connection found.")
        print("💡 Please create an agent with Gmail connected first.")
        return None

    print(f"🤖 Using agent: {agent.name}")

    # Create agent service
    agent_service = AgentService(user)

    # Benchmark single tool call
    message = "Send an email to test@example.com with subject 'Test' and body 'This is a performance test'"

    print(f"\n📝 Test message: {message}")
    print(f"⏱️  Starting benchmark...")

    start = time.time()

    try:
        result = await agent_service.chat(
            agent_model=agent,
            message=message,
            chat_history=[],
            callback=None
        )

        duration = time.time() - start

        print(f"\n✅ Completed in {duration:.2f} seconds")
        print(f"📊 Result preview: {str(result)[:200]}...")

        return {
            'test': 'single_tool',
            'duration': duration,
            'success': True
        }

    except Exception as e:
        duration = time.time() - start
        print(f"\n❌ Failed after {duration:.2f} seconds")
        print(f"Error: {str(e)}")
        return {
            'test': 'single_tool',
            'duration': duration,
            'success': False,
            'error': str(e)
        }


async def benchmark_multi_tool():
    """
    Benchmark 2: Multi-tool execution (3 tools)
    Expected: 20-25 seconds (after Phase 1)
    Target: <10 seconds (after Phase 2)
    """
    print("\n" + "="*80)
    print("BENCHMARK 2: Multi-Tool Execution (Email + Docs + Calendar)")
    print("="*80)

    # Get test user
    user = User.objects.filter(is_active=True).first()
    if not user:
        print("❌ No active user found")
        return None

    print(f"📊 Using user: {user.username} (ID: {user.id})")

    # Get agent with multiple connections
    agent = Agent.objects.filter(user=user).first()

    if not agent:
        print("❌ No agent found")
        return None

    print(f"🤖 Using agent: {agent.name}")
    print(f"🔧 Connected apps: {', '.join(agent.app_connections)}")

    # Create agent service
    agent_service = AgentService(user)

    # Benchmark multi-tool call
    message = """
    Do three things:
    1. Send an email to test@example.com with subject 'Performance Test'
    2. Create a Google Doc titled 'Performance Benchmark Results'
    3. Create a calendar event for tomorrow at 2pm titled 'Review Performance'
    """

    print(f"\n📝 Test message: {message.strip()}")
    print(f"⏱️  Starting benchmark...")

    start = time.time()

    try:
        result = await agent_service.chat(
            agent_model=agent,
            message=message,
            chat_history=[],
            callback=None
        )

        duration = time.time() - start

        print(f"\n✅ Completed in {duration:.2f} seconds")
        print(f"📊 Result preview: {str(result)[:200]}...")

        # Analyze performance
        print(f"\n📈 Performance Analysis:")
        print(f"   Current: {duration:.2f}s")
        print(f"   Phase 1 Target: 20-25s")
        print(f"   Phase 2 Target: <10s")

        if duration < 10:
            print(f"   ✅ EXCELLENT - Already below target!")
        elif duration < 25:
            print(f"   ✅ GOOD - Phase 1 optimizations working")
            print(f"   💡 Phase 2 should get us to <10s")
        else:
            print(f"   ⚠️  SLOW - Phase 1 optimizations may not be active")

        return {
            'test': 'multi_tool',
            'duration': duration,
            'success': True
        }

    except Exception as e:
        duration = time.time() - start
        print(f"\n❌ Failed after {duration:.2f} seconds")
        print(f"Error: {str(e)}")
        return {
            'test': 'multi_tool',
            'duration': duration,
            'success': False,
            'error': str(e)
        }


def save_results_to_file(results, phase="baseline"):
    """Save benchmark results to JSON file"""
    try:
        # Create results directory if it doesn't exist
        results_dir = Path(__file__).parent / "results"
        results_dir.mkdir(exist_ok=True)

        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"benchmark_{phase}_{timestamp}.json"
        filepath = results_dir / filename

        # Prepare data
        data = {
            "timestamp": datetime.now().isoformat(),
            "phase": phase,
            "results": results,
            "summary": {
                "total_tests": len(results),
                "passed": sum(1 for r in results if r['success']),
                "failed": sum(1 for r in results if not r['success']),
                "average_duration": sum(r['duration'] for r in results) / len(results) if results else 0
            }
        }

        # Save to file
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

        print(f"\n💾 Results saved to: {filepath}")
        return str(filepath)

    except Exception as e:
        print(f"\n❌ Failed to save results: {e}")
        return None


async def run_benchmarks():
    """Run all benchmarks and save results"""
    print("\n" + "="*80)
    print("🚀 AGENT SERVICE PERFORMANCE BENCHMARKS")
    print("="*80)
    print("Testing Phase 1 optimizations and establishing Phase 2 baseline")
    print("")

    results = []

    # Run single tool benchmark
    result1 = await benchmark_single_tool()
    if result1:
        results.append(result1)

    # Wait a bit between tests
    await asyncio.sleep(2)

    # Run multi-tool benchmark
    result2 = await benchmark_multi_tool()
    if result2:
        results.append(result2)

    # Summary
    print("\n" + "="*80)
    print("📊 BENCHMARK SUMMARY")
    print("="*80)

    for result in results:
        status = "✅ PASS" if result['success'] else "❌ FAIL"
        print(f"{status} {result['test']}: {result['duration']:.2f}s")
        if 'error' in result:
            print(f"    Error: {result['error']}")

    print("\n")

    # Save results to file
    if results:
        save_results_to_file(results, phase="phase1_baseline")

    return results


if __name__ == "__main__":
    asyncio.run(run_benchmarks())
