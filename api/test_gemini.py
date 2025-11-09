"""
Quick test to see what Gemini models are actually available with your API key.
Run this on Render or locally to debug.
"""

import google.generativeai as genai
import os

api_key = os.getenv('GEMINI_API_KEY')
print(f"API Key present: {bool(api_key)}")
print(f"API Key starts with: {api_key[:10] if api_key else 'NONE'}...")

if not api_key:
    print("❌ No API key found!")
    exit(1)

genai.configure(api_key=api_key)

print("\n🔍 Listing available models...")
try:
    models = genai.list_models()
    print(f"\nFound {len(list(models))} models total\n")

    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"✅ {m.name}")
            print(f"   Display name: {m.display_name}")
            print(f"   Methods: {m.supported_generation_methods}")
            print()
except Exception as e:
    print(f"❌ Error listing models: {e}")

print("\n🧪 Testing gemini-pro...")
try:
    model = genai.GenerativeModel('gemini-pro')
    response = model.generate_content("Say 'Hello SYNTH'")
    print(f"✅ gemini-pro works!")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ gemini-pro failed: {e}")

print("\n🧪 Testing gemini-1.5-flash...")
try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    response = model.generate_content("Say 'Hello SYNTH'")
    print(f"✅ gemini-1.5-flash works!")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ gemini-1.5-flash failed: {e}")
