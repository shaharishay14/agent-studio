import os
import json
from composio import Composio
from dotenv import load_dotenv

# --- Setup ---
print("🚀 Starting trigger fetcher...")

# 1. Load API key from .env file
env_path = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"✅ Loaded environment from {env_path}")
else:
    print(f"⚠️ Warning: .env file not found.")

COMPOSIO_API_KEY = os.getenv('COMPOSIO_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY') # Needed by provider

if not COMPOSIO_API_KEY or not OPENAI_API_KEY:
    print("❌ Error: API keys not found. Please check .env file.")
    exit(1)

# 2. Initialize Composio client
try:
    from composio_openai_agents import OpenAIAgentsProvider
    
    client = Composio(
        api_key=COMPOSIO_API_KEY,
        provider=OpenAIAgentsProvider(api_key=OPENAI_API_KEY)
    )
    print("✅ Composio client initialized.")
except Exception as e:
    print(f"❌ Error initializing Composio client: {e}")
    exit(1)

# --- Fetching and Processing ---
try:
    print("🔄 Fetching available trigger strings...")
    
    available_triggers = client.triggers.list_enum()
    
    if not available_triggers:
        print("🤷 No available triggers found.")
        exit(0)

    print(f"✅ Found {len(available_triggers)} trigger strings.")

    # 4. Introspection: Print the first 30 strings
    print("\n--- 🔍 Introspection: First 30 Triggers ---")
    
    for i, trigger_slug in enumerate(available_triggers[:30]):
        print(f"  {i+1}: {trigger_slug}")
        
    print("--------------------------------------------------\n")
    print("✅ Debug script finished.")
    print("Please paste this output in the chat.")

except Exception as e:
    print(f"\n❌ An error occurred during fetching: {e}")
    import traceback
    traceback.print_exc()