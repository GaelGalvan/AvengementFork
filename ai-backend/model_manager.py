#!/usr/bin/env python3
"""
Ollama Model Manager for Avengement AI
Helps manage and test different LLM models for the AI opponent
"""

import subprocess
import requests
import json
from pathlib import Path

OLLAMA_URL = "http://localhost:11434"
RECOMMENDED_MODELS = {
    "mistral": {"description": "Fast, capable general model (recommended)", "size": "4B"},
    "llama2": {"description": "Thoughtful, multi-step reasoning", "size": "7B"},
    "neural-chat": {"description": "Optimized for conversation", "size": "7B"},
    "dolphin-mixtral": {"description": "Expert reasoning, slower", "size": "46B"},
    "orca-mini": {"description": "Lightweight, fast responses", "size": "3B"},
}


def check_ollama():
    """Check if Ollama is running"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags")
        return response.status_code == 200
    except:
        return False


def list_models():
    """List installed models"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags")
        if response.status_code == 200:
            data = response.json()
            models = data.get("models", [])
            return models
        return []
    except Exception as e:
        print(f"Error: {e}")
        return []


def pull_model(model_name):
    """Pull a model from Ollama"""
    print(f"\n📥 Pulling model: {model_name}")
    print("   This may take several minutes...")
    try:
        result = subprocess.run(
            ["ollama", "pull", model_name],
            capture_output=False,
            text=True
        )
        if result.returncode == 0:
            print(f"✓ Successfully installed {model_name}")
            return True
        else:
            print(f"✗ Failed to install {model_name}")
            return False
    except FileNotFoundError:
        print("✗ Ollama not found. Make sure Ollama is installed and in PATH")
        return False


def test_model(model_name, prompt="What is the capital of France?"):
    """Test a model with a simple prompt"""
    print(f"\n🧪 Testing model: {model_name}")
    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": model_name,
                "prompt": prompt,
                "stream": False,
            }
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Model responded successfully")
            print(f"Response: {data['response'][:100]}...")
            return True
        else:
            print(f"✗ Error: {response.status_code}")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def update_backend_model(model_name):
    """Update the model in ollamaServer.js"""
    server_file = Path(__file__).parent / "ollamaServer.js"
    if not server_file.exists():
        print(f"✗ File not found: {server_file}")
        return False

    try:
        content = server_file.read_text()
        # Replace the MODEL constant
        old_line = f"const MODEL = 'mistral';"
        new_line = f"const MODEL = '{model_name}';"

        # Try to find the exact line
        import re
        pattern = r"const MODEL = '[^']*';"
        if re.search(pattern, content):
            content = re.sub(pattern, new_line, content)
            server_file.write_text(content)
            print(f"✓ Updated ollamaServer.js to use: {model_name}")
            return True
        else:
            print("✗ Could not find MODEL constant in ollamaServer.js")
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def show_menu():
    """Show interactive menu"""
    print("""
╔════════════════════════════════════════════╗
║  Avengement AI - Ollama Model Manager      ║
╚════════════════════════════════════════════╝
    """)

    if not check_ollama():
        print("⚠️  Ollama is not running!")
        print("   Start it with: ollama serve")
        print("   (or open the Ollama app)")
        return

    print("✓ Ollama is running\n")

    while True:
        print("\nOptions:")
        print("1. List installed models")
        print("2. Download a recommended model")
        print("3. Test a model")
        print("4. Update backend model")
        print("5. Show recommended models")
        print("0. Exit")

        choice = input("\nSelect option (0-5): ").strip()

        if choice == "1":
            models = list_models()
            if models:
                print("\n📦 Installed models:")
                for model in models:
                    print(f"   - {model['name']}")
            else:
                print("No models installed")

        elif choice == "2":
            print("\nRecommended models:")
            for i, (name, info) in enumerate(RECOMMENDED_MODELS.items(), 1):
                print(f"{i}. {name} ({info['size']}) - {info['description']}")
            print("0. Cancel")

            model_choice = input("Select model to download: ").strip()
            model_names = list(RECOMMENDED_MODELS.keys())
            if model_choice.isdigit() and 0 < int(model_choice) <= len(model_names):
                model = model_names[int(model_choice) - 1]
                pull_model(model)

        elif choice == "3":
            model_name = input("Enter model name to test: ").strip()
            if model_name:
                test_model(model_name)

        elif choice == "4":
            model_name = input("Enter model name to set in backend: ").strip()
            if model_name:
                update_backend_model(model_name)

        elif choice == "5":
            print("\n🎯 Recommended Models for Avengement AI:")
            for name, info in RECOMMENDED_MODELS.items():
                print(f"\n{name} ({info['size']})")
                print(f"  • {info['description']}")

        elif choice == "0":
            print("Goodbye!")
            break

        else:
            print("Invalid option")


if __name__ == "__main__":
    show_menu()
