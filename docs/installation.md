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
git clone https://github.com/Distillery-Dev/Discomfort.git discomfort
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
- **`filelock`** - Thread-safe file operations
- **`numpy`** - Numerical operations

## Configuration

Discomfort comes with sensible defaults but can be customized:

### Memory Configuration
Edit `workflow_context.json`:
```json
{
    "MAX_RAM_PERCENT": 50,    // Use 50% of free system RAM
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
You can edit `pass_by_rules.json` to customize how different data types are handled. The presets are as follows:
```json
{
    "MODEL": "ref",        // Models passed by reference (workflow graphs)
    "CLIP": "ref",         // CLIP models passed by reference  
    "VAE": "ref",          // VAE models passed by reference
    "CONDITIONING": "ref", // Conditioning passed by reference
    "LATENT": "val",       // Latents passed by value (direct storage)
    "IMAGE": "val",        // Images passed by value
    "MASK": "val",         // Masks passed by value
    "CONTROL_NET": "ref",  // ControlNet models passed by reference
    "STRING": "val",       // Text passed by value
    "INT": "val",          // Numbers passed by value
    "FLOAT": "val",        // Decimals passed by value
    "BOOLEAN": "val",      // Booleans passed by value
    "TUPLE": "val",        // Tuples passed by value
    "LIST": "val",         // Lists passed by value
    "DICT": "val",         // Dictionaries passed by value
    "ANY": "val"           // "ANY" type passed by value
}
```

## Troubleshooting

### Common Issues

#### ❌ "ModuleNotFoundError: No module named 'discomfort'"
**Solution**: Ensure the folder is named exactly `discomfort` and is in `ComfyUI/custom_nodes/`

#### ❌ "playwright._impl._api_types.Error: Executable doesn't exist"
**Solution**: Try installing Playwright browser directly:
```bash
python -m playwright install --with-deps chromium
```

#### ❌ "Permission denied" errors on Linux/Mac
**Solution**: Fix permissions:
```bash
chmod +x ComfyUI/custom_nodes/discomfort/
```

#### ❌ Memory errors during large workflows
**Solution**: Try increasing RAM or switching to disk memory. If this doesn't work, it's likely the issue is at the OS level. If you're on Linux, the OS may be capping your allocated memory for temp files; run `df -H` to confirm if that's the case and increase the size of `/dev/shm` accordingly.

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

1. **[Watch Tutorial videos](./tutorial-basics/running-a-workflow)** - Basic tutorial
2. **[Create your first workflow](./examples/create-first-workflow)** - Master the basics before advanced techniques
3. **[Learn core concepts](./core-concepts/ports-and-context)** - Understand DiscomfortPorts
4. **[Explore examples](./examples/parameter-sweep)** - See real-world usage patterns
5. **[Read the API reference](./api/discomfort-class)** - Detailed method documentation