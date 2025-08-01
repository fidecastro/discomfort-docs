# ComfyConnector API Reference

The `ComfyConnector` class is an asynchronous singleton that manages ComfyUI server instances in a serverless-like environment. It handles server lifecycle, browser automation for workflow conversion, and provides robust communication with ComfyUI's API.

## Class Overview

```python
from custom_nodes.discomfort.discomfort import Discomfort

# Access through Discomfort instance (recommended)
discomfort = await Discomfort.create()
connector = discomfort.Worker

# Or create directly (advanced usage)
from custom_nodes.discomfort.comfy_serverless import ComfyConnector
connector = await ComfyConnector.create()
```

## Factory and Lifecycle

### `ComfyConnector.create(config_path=None)` {#create}

**Async factory method to create and initialize the singleton ComfyConnector instance.**

#### Parameters
- **`config_path`** _(str, optional)_ - Path to custom configuration file

#### Returns
- **`ComfyConnector`** - Fully initialized singleton instance

#### Example
```python
# Create with default configuration
connector = await ComfyConnector.create()

# Create with custom configuration
connector = await ComfyConnector.create("custom_comfy_config.json")

print(f"Server running at: {connector.server_address}")
print(f"WebSocket at: {connector.ws_address}")
```

#### Configuration File Format
```json
{
    "API_COMMAND_LINE": "python3 main.py",
    "API_WORKING_DIRECTORY": "./",
    "API_URL": "127.0.0.1", 
    "INITIAL_PORT": 8188,
    "TEST_PAYLOAD_FILE": "test_server.json",
    "MAX_COMFY_START_ATTEMPTS": 10,
    "COMFY_START_ATTEMPTS_SLEEP": 1.0,
    "COMFYUI_PATH": "./"
}
```

#### Notes
- **Singleton pattern** - Only one instance per process
- **Automatic server startup** - Starts ComfyUI server and browser
- **Resource validation** - Verifies all components are ready
- **Retry logic** - Robust initialization with exponential backoff

---

### `kill_api()` {#kill-api}

**Gracefully shuts down the ComfyUI server and releases all resources.**

#### Returns
- None

#### Example
```python
# Always clean up when done
try:
    await connector.run_workflow(prompt)
finally:
    await connector.kill_api()
```

#### Cleanup Operations
1. **Terminates ComfyUI server** - SIGTERM followed by SIGKILL if needed
2. **Closes browser connections** - Shuts down Playwright browser
3. **Cleans up temp files** - Removes ephemeral uploads
4. **Closes WebSocket** - Terminates real-time communication
5. **Resets singleton state** - Allows fresh initialization

---

## Workflow Execution

### `run_workflow(payload, use_workflow_json=True)` {#run-workflow}

**Main method to execute workflows with ComfyUI.**

#### Parameters
- **`payload`** _(Union[Dict, str])_ - Workflow data or prompt data
- **`use_workflow_json`** _(bool, optional)_ - Whether payload is workflow JSON (True) or prompt (False)

#### Returns
- **`Dict[str, Any]`** - Execution history containing outputs and metadata

#### Example
```python
# Run workflow JSON
workflow_data = json.load(open("my_workflow.json"))
history = await connector.run_workflow(workflow_data, use_workflow_json=True)

# Run prompt directly
prompt_data = await connector.get_prompt_from_workflow(workflow_data)
history = await connector.run_workflow(prompt_data, use_workflow_json=False)

# Extract outputs from history
if history:
    for node_id, node_output in history.items():
        if "outputs" in node_output:
            print(f"Node {node_id} outputs: {list(node_output['outputs'].keys())}")
```

#### Return Structure
```python
{
    "prompt_id": {
        "outputs": {
            "node_id": {
                "images": [...],  # For image outputs
                "text": [...],    # For text outputs
                # ... other output types
            }
        },
        "status": {
            "status_str": "success",
            "completed": True,
            "messages": [...]
        }
    }
}
```

---

### `get_prompt_from_workflow(workflow)` {#get-prompt-from-workflow}

**Converts a ComfyUI workflow JSON into an API-ready prompt using browser automation.**

#### Parameters
- **`workflow`** _(Dict[str, Any])_ - ComfyUI workflow JSON data

#### Returns
- **`Dict[str, Any]`** - ComfyUI prompt data ready for execution

#### Example
```python
# Convert workflow to prompt
workflow = json.load(open("workflow.json"))
prompt = await connector.get_prompt_from_workflow(workflow)

print(f"Prompt has {len(prompt)} nodes")

# Use prompt directly
history = await connector.run_workflow(prompt, use_workflow_json=False)
```

#### Conversion Process
1. **Starts isolated browser context** - Fresh environment per conversion
2. **Loads ComfyUI web interface** - Navigates to server address
3. **Waits for app initialization** - Ensures JavaScript is ready
4. **Loads workflow data** - Injects workflow into ComfyUI app
5. **Generates prompt** - Calls ComfyUI's internal conversion function
6. **Extracts result** - Returns API-ready prompt data

#### Error Handling
- **Automatic retries** - Up to 3 attempts with timeout
- **Browser restart** - Fresh browser on each retry
- **Timeout protection** - 3-second timeout per attempt

---

## File Management

### `upload_data(source_path, folder_type='input', subfolder=None, overwrite=False, is_ephemeral=False)` {#upload-data}

**Uploads files directly to ComfyUI's directory structure.**

#### Parameters
- **`source_path`** _(str)_ - Path to file to upload
- **`folder_type`** _(str, optional)_ - Destination folder: 'input', 'output', 'temp', 'models'
- **`subfolder`** _(str, optional)_ - Sub-directory within folder_type
- **`overwrite`** _(bool, optional)_ - Whether to overwrite existing files
- **`is_ephemeral`** _(bool, optional)_ - Mark for automatic cleanup on shutdown

#### Returns
- **`str`** - Full path to uploaded file

#### Example
```python
# Upload input image
image_path = connector.upload_data(
    source_path="my_photo.jpg",
    folder_type="input",
    is_ephemeral=True  # Will be cleaned up automatically
)
print(f"Image uploaded to: {image_path}")

# Upload model file
model_path = connector.upload_data(
    source_path="my_model.safetensors",
    folder_type="models",
    subfolder="checkpoints",
    overwrite=True
)

# Upload to custom subfolder
temp_path = connector.upload_data(
    source_path="data.json",
    folder_type="temp",
    subfolder="processing",
    is_ephemeral=True
)
```

#### Folder Types
- **`input`** - Images and input files
- **`output`** - Generated outputs  
- **`temp`** - Temporary processing files
- **`models`** - Model files (requires subfolder)

#### Model Subfolders
- `checkpoints` - Main models (.safetensors, .ckpt)
- `loras` - LoRA models
- `vae` - VAE models
- `controlnet` - ControlNet models
- `upscale_models` - Upscaling models
- `gguf` - GGUF format models

---

## Internal Methods

### `_ensure_initialized()` {#ensure-initialized}

**Internal method that ensures server and browser are started and validated.**

#### Returns
- None

#### Initialization Steps
1. **State validation** - Checks if already initialized and valid
2. **Resource reset** - Cleans up any stale resources
3. **Port allocation** - Finds available port for server
4. **Playwright startup** - Initializes browser automation
5. **Server startup** - Launches ComfyUI server process
6. **WebSocket connection** - Establishes real-time communication
7. **Server testing** - Validates functionality with test workflow

---

### `_validate_resources()` {#validate-resources}

**Validates that all underlying resources are operational.**

#### Returns
- **`bool`** - True if all resources are healthy

#### Validation Checks
- **Process health** - ComfyUI server process is running
- **Browser connection** - Playwright browser is connected
- **WebSocket status** - Real-time communication is active
- **HTTP response** - Server responds to requests

#### Example
```python
# Check if resources are healthy
if await connector._validate_resources():
    print("All systems operational")
else:
    print("Resource validation failed - may need restart")
```

---

### `_init_playwright()` {#init-playwright}

**Initializes Playwright browser automation with auto-installation.**

#### Returns
- None

#### Features
- **Auto-installation** - Downloads Chromium if missing
- **Headless operation** - Runs browser without GUI
- **WebGL support** - Enables GPU acceleration for ComfyUI
- **Error recovery** - Handles missing dependencies

#### Browser Configuration
```python
# Browser launched with these settings
await playwright.chromium.launch(
    headless=True,
    args=['--enable-webgl', '--disable-gpu']
)
```

---

### `_find_available_port()` {#find-available-port}

**Finds an available network port for the ComfyUI server.**

#### Returns
- **`int`** - Available port number

#### Algorithm
1. **Starts from initial port** - Uses configured starting port
2. **Tests availability** - Attempts HTTP connection
3. **Increments on conflict** - Tries next port if busy
4. **Returns first available** - Stops when free port found

---

### `_start_api()` {#start-api}

**Starts the ComfyUI server as a subprocess with monitoring.**

#### Returns
- None

#### Process Management
- **Subprocess creation** - Launches ComfyUI with custom port
- **Health monitoring** - Checks process and HTTP response
- **Startup timeout** - Fails if server doesn't respond in time
- **Error detection** - Monitors for unexpected termination

#### Command Line
```bash
python3 main.py --port 8188
# Executed in ComfyUI directory
```

---

### `_is_api_running()` {#is-api-running}

**Checks if ComfyUI server is responding to HTTP requests.**

#### Returns
- **`bool`** - True if server is responding

#### Implementation
```python
# Quick HTTP health check
async with aiohttp.ClientSession() as session:
    async with session.get(server_address, timeout=1) as response:
        return response.status == 200
```

---

### `_restart_browser()` {#restart-browser}

**Restarts the browser for isolation between operations.**

#### Returns
- None

#### Restart Process
1. **Graceful close attempt** - Tries normal browser.close()
2. **Timeout handling** - Force-kills if close hangs
3. **Process cleanup** - Kills browser processes via psutil
4. **Playwright restart** - Recreates Playwright instance if needed
5. **Fresh browser launch** - Creates new clean browser instance

#### Use Cases
- **Before workflow conversion** - Ensures clean state
- **After conversion errors** - Recovers from browser issues
- **Memory management** - Prevents browser memory leaks

---

### `_attempt_workflow_to_prompt_conversion(workflow)` {#attempt-workflow-to-prompt-conversion}

**Performs a single workflow-to-prompt conversion attempt in isolated context.**

#### Parameters
- **`workflow`** _(Dict[str, Any])_ - Workflow JSON data

#### Returns
- **`Dict[str, Any]`** - Converted prompt data

#### Isolation Features
- **New browser context** - Completely isolated environment
- **Fresh page** - No cached state or variables
- **Network idle wait** - Ensures full page load
- **Automatic cleanup** - Context and page closed after use

#### Conversion Steps
```python
# Create isolated environment
context = await browser.new_context()
page = await context.new_page()

# Load ComfyUI interface
await page.goto(server_address)
await page.wait_for_load_state('networkidle')

# Wait for ComfyUI app
await page.wait_for_function("() => typeof window.app !== 'undefined'")

# Load workflow and convert
await page.evaluate("async (wf) => { await window.app.loadGraphData(wf); }", workflow)
prompt_data = await page.evaluate("async () => { return await window.app.graphToPrompt(); }")

# Return converted data
return prompt_data['output']
```

---

### `_execute_prompt_and_wait(prompt)` {#execute-prompt-and-wait}

**Executes a prompt and waits for completion via WebSocket monitoring.**

#### Parameters
- **`prompt`** _(Dict[str, Any])_ - ComfyUI prompt data

#### Returns
- **`Dict[str, Any]`** - Execution history with outputs

#### Execution Flow
1. **Queue prompt** - Submits to ComfyUI API with client ID
2. **Monitor WebSocket** - Listens for execution messages
3. **Wait for completion** - Watches for 'executing' message with null node
4. **Retrieve history** - Fetches final results via HTTP

#### WebSocket Messages
```python
# Execution start
{"type": "executing", "data": {"node": "node_id", "prompt_id": "..."}}

# Execution complete (node is null)
{"type": "executing", "data": {"node": null, "prompt_id": "..."}}
```

---

### `_test_server()` {#test-server}

**Tests server readiness by running a simple validation workflow.**

#### Returns
- **`bool`** - True if test passes

#### Test Process
1. **Loads test workflow** - Uses configured test payload
2. **Converts to prompt** - Tests workflow conversion
3. **Executes workflow** - Runs through full pipeline
4. **Validates result** - Checks for successful completion

#### Test Workflow
Simple workflow that generates a small empty image to verify:
- Server responsiveness
- Browser automation
- Workflow conversion
- Execution pipeline
- Result retrieval

---

### `_ensure_fresh_websocket()` {#ensure-fresh-websocket}

**Ensures WebSocket connection is fresh and ready for communication.**

#### Returns
- None

#### Connection Management
- **Closes existing connection** - Safely terminates old WebSocket
- **Creates new WebSocket object** - Fresh client instance
- **Reconnects with keepalive** - Establishes new connection
- **Client ID management** - Uses unique client identifier

#### WebSocket Features
```python
# Connection with monitoring
ws.connect(ws_address, ping_interval=10)  # Automatic ping/pong
```

---

### `_delete_data()` {#delete-data}

**Cleans up all ephemeral files uploaded during the session.**

#### Returns
- None

#### Cleanup Process
- **Iterates ephemeral files** - Processes all marked files
- **Safe deletion** - Handles missing files gracefully
- **Error logging** - Reports but continues on deletion errors
- **List clearing** - Resets ephemeral file tracking

---

### `_sync_cleanup()` {#sync-cleanup}

**Synchronous cleanup method for atexit handler.**

#### Returns
- None

#### Emergency Cleanup
- **Process termination** - Force-kills ComfyUI server
- **File cleanup** - Removes ephemeral files
- **WebSocket closure** - Closes communication
- **No async operations** - Safe for program exit

---

## State Management

### Instance States

The ComfyConnector maintains internal state for robust operation:

#### State Values
- **`uninit`** - Not yet initialized
- **`initializing`** - Currently starting up  
- **`ready`** - Fully operational
- **`error`** - Failed initialization
- **`killed`** - Shut down

#### State Transitions
```python
uninit → initializing → ready
uninit → initializing → error
ready → killed
error → killed
```

### Properties

#### `server_address` {#server-address}
**HTTP URL of the running ComfyUI server.**
```python
print(f"Server: {connector.server_address}")  # http://127.0.0.1:8188
```

#### `ws_address` {#ws-address}
**WebSocket URL for real-time communication.**
```python
print(f"WebSocket: {connector.ws_address}")  # ws://127.0.0.1:8188/ws?clientId=...
```

#### `client_id` {#client-id}
**Unique identifier for this ComfyConnector instance.**
```python
print(f"Client ID: {connector.client_id}")  # UUID string
```

---

## Configuration Examples

### Basic Configuration (`comfy_serverless.json`)
```json
{
    "API_COMMAND_LINE": "python3 main.py",
    "API_WORKING_DIRECTORY": "./",
    "API_URL": "127.0.0.1",
    "INITIAL_PORT": 8188,
    "TEST_PAYLOAD_FILE": "test_server.json",
    "MAX_COMFY_START_ATTEMPTS": 10,
    "COMFY_START_ATTEMPTS_SLEEP": 1.0,
    "COMFYUI_PATH": "./"
}
```

### Advanced Configuration
```json
{
    "API_COMMAND_LINE": "python3 main.py --extra-model-paths-config extra_model_paths.yaml",
    "API_WORKING_DIRECTORY": "/path/to/ComfyUI",
    "API_URL": "0.0.0.0",
    "INITIAL_PORT": 8189,
    "TEST_PAYLOAD_FILE": "custom_test.json",
    "MAX_COMFY_START_ATTEMPTS": 20,
    "COMFY_START_ATTEMPTS_SLEEP": 2.0,
    "COMFYUI_PATH": "/path/to/ComfyUI"
}
```

### Docker Configuration
```json
{
    "API_COMMAND_LINE": "python3 main.py --listen 0.0.0.0",
    "API_WORKING_DIRECTORY": "/workspace/ComfyUI",
    "API_URL": "localhost",
    "INITIAL_PORT": 8188,
    "COMFYUI_PATH": "/workspace/ComfyUI"
}
```

---

## Error Handling

### Common Exceptions

#### `RuntimeError`
```python
try:
    connector = await ComfyConnector.create()
except RuntimeError as e:
    print(f"Initialization failed: {e}")
    # Check ComfyUI installation and dependencies
```

#### `FileNotFoundError`
```python
try:
    path = connector.upload_data("missing_file.jpg")
except FileNotFoundError:
    print("Source file not found")
```

#### `TimeoutError`
```python
try:
    prompt = await connector.get_prompt_from_workflow(workflow)
except TimeoutError:
    print("Workflow conversion timed out")
    # Try simpler workflow or restart connector
```

### Best Practices

1. **Always call `kill_api()`** - Prevents resource leaks
2. **Handle initialization failures** - ComfyUI may not be properly installed
3. **Use ephemeral uploads** - Mark temporary files for auto-cleanup
4. **Monitor resource health** - Call `_validate_resources()` if issues arise
5. **Configure appropriate timeouts** - Match your workflow complexity

---

## Complete Example: Advanced Usage

```python
import asyncio
import json
from pathlib import Path
from custom_nodes.discomfort.comfy_serverless import ComfyConnector

async def advanced_workflow_processing():
    """Advanced example showing ComfyConnector features."""
    
    connector = None
    try:
        # Initialize with custom config
        connector = await ComfyConnector.create("my_comfy_config.json")
        print(f"Server started at: {connector.server_address}")
        
        # Validate health
        if not await connector._validate_resources():
            raise RuntimeError("Resource validation failed")
        
        # Upload input files
        image_paths = []
        input_dir = Path("input_images")
        for image_file in input_dir.glob("*.jpg"):
            uploaded_path = connector.upload_data(
                source_path=str(image_file),
                folder_type="input",
                subfolder="batch",
                is_ephemeral=True  # Auto-cleanup
            )
            image_paths.append(uploaded_path)
            print(f"Uploaded: {image_file.name} → {uploaded_path}")
        
        # Load and convert workflow
        with open("complex_workflow.json", "r") as f:
            workflow = json.load(f)
        
        print("Converting workflow to prompt...")
        prompt = await connector.get_prompt_from_workflow(workflow)
        print(f"Prompt has {len(prompt)} nodes")
        
        # Process each uploaded image
        results = []
        for i, image_path in enumerate(image_paths):
            print(f"Processing image {i+1}/{len(image_paths)}")
            
            # Modify prompt for this image
            current_prompt = prompt.copy()
            # Update image path in prompt (assuming node ID 1 is LoadImage)
            if "1" in current_prompt:
                current_prompt["1"]["inputs"]["image"] = Path(image_path).name
            
            # Execute workflow
            history = await connector.run_workflow(current_prompt, use_workflow_json=False)
            
            if history:
                results.append(history)
                print(f"  ✅ Processed successfully")
                
                # Extract output info
                for prompt_id, data in history.items():
                    if "outputs" in data:
                        outputs = data["outputs"]
                        print(f"  📤 Generated {len(outputs)} outputs")
            else:
                print(f"  ❌ Processing failed")
        
        print(f"\n🎉 Batch processing complete!")
        print(f"📊 Processed {len(results)}/{len(image_paths)} images successfully")
        
        # Validate resources are still healthy
        if await connector._validate_resources():
            print("✅ All resources healthy after processing")
        else:
            print("⚠️ Resource degradation detected")
        
        return results
        
    except Exception as e:
        print(f"❌ Error during processing: {e}")
        import traceback
        traceback.print_exc()
        return []
        
    finally:
        # Always clean up
        if connector:
            await connector.kill_api()
            print("🧹 Cleanup completed")

if __name__ == "__main__":
    results = asyncio.run(advanced_workflow_processing())
    print(f"Final results: {len(results)} successful executions")
```

## Performance Considerations

### Memory Management
- **Browser restarts** - Fresh browser prevents memory leaks
- **Isolated contexts** - Each conversion uses new browser context
- **Resource cleanup** - Automatic cleanup on shutdown
- **Process monitoring** - Tracks ComfyUI server health

### Scalability
- **Singleton pattern** - One server per process prevents conflicts
- **Port allocation** - Automatic port finding for multiple instances
- **Resource validation** - Health checks prevent cascading failures
- **Graceful degradation** - Handles partial failures

### Error Recovery
- **Automatic retries** - Built-in retry logic with backoff
- **Resource validation** - Proactive health checking
- **Process restart** - Can recover from server failures
- **Browser recovery** - Handles browser crashes and hangs

## Next Steps

- **[Discomfort Class](./discomfort-class)** - Main orchestration API
- **[WorkflowTools API](./workflow-tools)** - Workflow manipulation utilities
- **[WorkflowContext API](./workflow-context)** - Data management and persistence
- **[Core Concepts](../core-concepts/architecture)** - Understanding system architecture 