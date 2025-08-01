# Installation Guide

This guide will walk you through installing Discomfort and setting up your environment for programmatic ComfyUI workflow execution.

## Prerequisites

Before installing Discomfort, ensure you have:

### Required Software
- **Python 3.8+** (Python 3.9+ recommended)
- **ComfyUI** installed and working
- **Git** for cloning the repository

### System Requirements
- **RAM**: 8GB minimum, 16GB+ recommended
- **GPU**: CUDA-compatible GPU recommended for ComfyUI
- **Disk Space**: 2GB for dependencies and temporary files

## Step 1: Install Discomfort

### Method 1: Clone into ComfyUI (Recommended)

1. Navigate to your ComfyUI custom nodes directory:
```bash
cd ComfyUI/custom_nodes
```

2. Clone the Discomfort repository:
```bash
git clone https://github.com/fidecastro/comfyui-discomfort.git discomfort
```

3. Install Python dependencies:
```bash
cd discomfort
pip install -r requirements.txt
```

### Method 2: Manual Installation

1. Download the repository as a ZIP file
2. Extract to `ComfyUI/custom_nodes/discomfort/`
3. Install dependencies as shown above

## Step 2: Verify Installation

1. **Restart ComfyUI** completely (close and reopen)

2. **Check for Discomfort nodes** in the ComfyUI interface:
   - Look for `discomfort/utilities` category
   - You should see `Discomfort Port (Input/Output)` node
   - You should see `Discomfort Test Runner` node

3. **Test the installation** with a simple script:

```python
# test_installation.py
import asyncio
import sys
import os

# Add ComfyUI to path if needed
sys.path.append('./ComfyUI')

async def test_discomfort():
    try:
        from custom_nodes.discomfort.discomfort import Discomfort
        
        print("✅ Discomfort import successful")
        
        # Test creating instance
        discomfort = await Discomfort.create()
        print("✅ Discomfort instance created")
        
        # Test context
        with discomfort.Context() as context:
            context.save("test_data", "Hello Discomfort!")
            loaded = context.load("test_data")
            assert loaded == "Hello Discomfort!"
            print("✅ Context management working")
        
        await discomfort.shutdown()
        print("✅ All tests passed! Discomfort is ready to use.")
        
    except Exception as e:
        print(f"❌ Installation test failed: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = asyncio.run(test_discomfort())
    if not success:
        print("\n📋 Troubleshooting tips:")
        print("1. Ensure ComfyUI is properly installed")
        print("2. Check that all dependencies are installed")
        print("3. Verify Python version is 3.8+")
```

Run the test:
```bash
python test_installation.py
```

## Dependencies Explained

Discomfort requires several Python packages for full functionality:

### Core Dependencies
- **`requests`** - HTTP communication with ComfyUI API
- **`pillow`** - Image processing and manipulation
- **`networkx`** - Graph analysis for workflow topology
- **`cloudpickle`** - Advanced serialization for complex objects

### Advanced Features
- **`playwright`** - Browser automation for workflow conversion
- **`websocket-client`** - Real-time communication with ComfyUI
- **`psutil`** - System resource monitoring
- **`backoff`** - Retry logic for robust operations

### Optional Dependencies
- **`openai`** - For AI-powered workflow features (if used)
- **`filelock`** - Thread-safe file operations
- **`numpy`** - Numerical operations

## Configuration

Discomfort comes with sensible defaults but can be customized:

### Memory Configuration
Edit `workflow_context.json`:
```json
{
    "MAX_RAM_PERCENT": 50,    // Use 50% of system RAM
    "MAX_RAM_GB": 32,         // Or limit to 32GB
    "CONTEXTS_DIR_NAME": "contexts"
}
```

### Server Configuration  
Edit `comfy_serverless.json`:
```json
{
    "API_COMMAND_LINE": "python3 main.py",
    "API_WORKING_DIRECTORY": "./",
    "API_URL": "127.0.0.1",
    "INITIAL_PORT": 8188,
    "MAX_COMFY_START_ATTEMPTS": 10,
    "COMFY_START_ATTEMPTS_SLEEP": 1.0,
    "COMFYUI_PATH": "./"
}
```

### Data Type Handling
Edit `pass_by_rules.json` to customize how different data types are handled:
```json
{
    "MODEL": "ref",     // Models passed by reference (workflow graphs)
    "CLIP": "ref",      // CLIP models passed by reference  
    "VAE": "ref",       // VAE models passed by reference
    "IMAGE": "val",     // Images passed by value (direct storage)
    "LATENT": "val",    // Latents passed by value
    "STRING": "val",    // Text passed by value
    "INT": "val",       // Numbers passed by value
    "FLOAT": "val"      // Decimals passed by value
}
```

## Troubleshooting

### Common Issues

#### ❌ "ModuleNotFoundError: No module named 'discomfort'"
**Solution**: Ensure the folder is named exactly `discomfort` and is in `ComfyUI/custom_nodes/`

#### ❌ "playwright._impl._api_types.Error: Executable doesn't exist"
**Solution**: Install Playwright browsers:
```bash
python -m playwright install --with-deps chromium
```

#### ❌ "Permission denied" errors on Linux/Mac
**Solution**: Fix permissions:
```bash
chmod +x ComfyUI/custom_nodes/discomfort/
```

#### ❌ Memory errors during large workflows
**Solution**: Reduce `MAX_RAM_PERCENT` in `workflow_context.json` or increase system RAM

#### ❌ ComfyUI doesn't start automatically
**Solution**: Check `comfy_serverless.json` paths:
- Ensure `API_WORKING_DIRECTORY` points to your ComfyUI folder
- Verify `API_COMMAND_LINE` matches your Python setup

### Getting Help

If you encounter issues:

1. **Check the logs** - Discomfort provides detailed logging
2. **Verify ComfyUI works** - Test ComfyUI independently first  
3. **Update dependencies** - Run `pip install -r requirements.txt --upgrade`
4. **Check system resources** - Ensure adequate RAM and disk space

## Next Steps

Now that Discomfort is installed:

1. **[Create your first workflow](./tutorial-basics/create-first-workflow)** - Basic tutorial
2. **[Learn core concepts](./core-concepts/ports-and-context)** - Understand DiscomfortPorts
3. **[Explore examples](./examples/parameter-sweep)** - See real-world usage patterns
4. **[Read the API reference](./api/discomfort-class)** - Detailed method documentation

Ready to start building? Let's [create your first Discomfort workflow](./tutorial-basics/create-first-workflow)! 🚀 