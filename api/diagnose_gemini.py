"""
GEMINI DIAGNOSTIC SCRIPT
Run this on Render to see what's actually happening with the API.
"""

import sys
print("=" * 60)
print("GEMINI DIAGNOSTIC REPORT")
print("=" * 60)

# 1. Check Python version
print(f"\n1. Python Version: {sys.version}")

# 2. Check if google.generativeai is installed
print("\n2. Checking google-generativeai installation...")
try:
    import google.generativeai as genai
    print(f"   ✅ Module imported successfully")
    print(f"   Version: {genai.__version__ if hasattr(genai, '__version__') else 'Unknown'}")
except ImportError as e:
    print(f"   ❌ Failed to import: {e}")
    exit(1)

# 3. Check API key
import os
api_key = os.getenv('GEMINI_API_KEY')
print(f"\n3. API Key Status:")
print(f"   Present: {bool(api_key)}")
if api_key:
    print(f"   Starts with: {api_key[:10]}...")
    print(f"   Length: {len(api_key)} characters")
else:
    print("   ❌ NO API KEY FOUND!")
    exit(1)

# 4. Configure and list models
print("\n4. Configuring Gemini...")
try:
    genai.configure(api_key=api_key)
    print("   ✅ Configuration successful")
except Exception as e:
    print(f"   ❌ Configuration failed: {e}")
    exit(1)

# 5. List available models
print("\n5. Available Models:")
try:
    models = list(genai.list_models())
    print(f"   Found {len(models)} total models")

    generate_models = [m for m in models if 'generateContent' in m.supported_generation_methods]
    print(f"   {len(generate_models)} support generateContent:\n")

    for m in generate_models:
        print(f"   ✅ {m.name}")
        print(f"      Display: {m.display_name}")
        print(f"      Methods: {', '.join(m.supported_generation_methods)}")
        print()

except Exception as e:
    print(f"   ❌ Failed to list models: {e}")
    print(f"   Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()

# 6. Test gemini-pro
print("\n6. Testing 'gemini-pro' model:")
try:
    model = genai.GenerativeModel('gemini-pro')
    print("   ✅ Model initialized")

    response = model.generate_content(
        "Say 'SYNTH ONLINE' and nothing else",
        generation_config={'max_output_tokens': 10, 'temperature': 0.5}
    )
    print(f"   ✅ Generate successful!")
    print(f"   Response: {response.text}")

except Exception as e:
    print(f"   ❌ FAILED: {e}")
    print(f"   Error type: {type(e).__name__}")
    import traceback
    traceback.print_exc()

# 7. Test gemini-1.5-flash
print("\n7. Testing 'gemini-1.5-flash' model:")
try:
    model = genai.GenerativeModel('gemini-1.5-flash')
    print("   ✅ Model initialized")

    response = model.generate_content(
        "Say 'SYNTH ONLINE' and nothing else",
        generation_config={'max_output_tokens': 10, 'temperature': 0.5}
    )
    print(f"   ✅ Generate successful!")
    print(f"   Response: {response.text}")

except Exception as e:
    print(f"   ❌ FAILED: {e}")
    print(f"   Error type: {type(e).__name__}")

# 8. Test gemini-1.5-pro
print("\n8. Testing 'gemini-1.5-pro' model:")
try:
    model = genai.GenerativeModel('gemini-1.5-pro')
    print("   ✅ Model initialized")

    response = model.generate_content(
        "Say 'SYNTH ONLINE' and nothing else",
        generation_config={'max_output_tokens': 10, 'temperature': 0.5}
    )
    print(f"   ✅ Generate successful!")
    print(f"   Response: {response.text}")

except Exception as e:
    print(f"   ❌ FAILED: {e}")
    print(f"   Error type: {type(e).__name__}")

print("\n" + "=" * 60)
print("DIAGNOSTIC COMPLETE")
print("=" * 60)
