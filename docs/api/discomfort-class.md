# Discomfort Class API Reference

The `Discomfort` class is the main entry point for programmatic ComfyUI workflow execution. It provides a unified API that combines workflow management, context handling, and server management.

## Class Overview

```python
from custom_nodes.discomfort.discomfort import Discomfort

# Create and initialize
discomfort = await Discomfort.create()

# Use the instance
with discomfort.Context() as context:
    await discomfort.run(["workflow.json"], context=context)

# Clean shutdown
await discomfort.shutdown()
```

## Creation and Initialization

### `Discomfort.create(config_path=None)` {#create}

**Async factory method** to create and initialize a Discomfort instance. This is the primary way to instantiate Discomfort.

#### Parameters
- **`config_path`** _(str, optional)_ - Path to custom configuration file for ComfyConnector

#### Returns
- **`Discomfort`** - Fully initialized instance with Worker ready

#### Example
```python
import asyncio
from custom_nodes.discomfort.discomfort import Discomfort

async def main():
    # Default configuration
    discomfort = await Discomfort.create()
    
    # Custom configuration
    discomfort = await Discomfort.create("my_config.json")
    
    # Your workflow code here...
    
    await discomfort.shutdown()

asyncio.run(main())
```

#### Notes
- **Always use this method** instead of calling `Discomfort()` directly
- Automatically starts the ComfyUI server and browser components
- Includes retry logic and validation for robust initialization

---

## Workflow Execution

### `discomfort.run(workflows, inputs=None, iterations=1, use_ram=True, context=None)` {#run}

**Main execution method** that runs workflows with state preservation and context management.

#### Parameters

- **`workflows`** _(List[Union[str, dict]])_ - List of workflows to execute
  - **File paths** (str): `"path/to/workflow.json"`  
  - **Workflow objects** (dict): Direct workflow JSON data

- **`inputs`** _(Dict[str, Any], optional)_ - Initial input values mapped to unique_ids
  - Default: `{}`

- **`iterations`** _(int, optional)_ - Number of iterations to run
  - Default: `1`
  - Range: `1` to `1000` (practical limit)

- **`use_ram`** _(bool, optional)_ - Whether to prefer RAM storage for context data
  - Default: `True`
  - `False` forces disk storage

- **`context`** _(WorkflowContext, optional)_ - External context for stateful runs
  - Default: `None` (creates temporary context)
  - Use for persistent state across multiple `run()` calls

#### Returns
- **`Dict[str, Any]`** - Dictionary mapping output unique_ids to their values

#### Examples

##### Basic Single Workflow
```python
# Run a single workflow
results = await discomfort.run(["my_workflow.json"])
print(f"Results: {list(results.keys())}")
```

##### Multiple Workflows
```python
# Run multiple workflows in sequence
workflows = [
    "load_model.json",
    "prepare_latent.json", 
    "sample.json"
]
results = await discomfort.run(workflows)
```

##### With Initial Inputs
```python
# Provide initial data
inputs = {
    "prompt": "A beautiful landscape",
    "seed": 12345,
    "cfg_scale": 7.5
}
results = await discomfort.run(["workflow.json"], inputs=inputs)
```

##### Multiple Iterations
```python
# Run the same workflow multiple times
results = await discomfort.run(
    ["workflow.json"], 
    inputs={"base_seed": 1000},
    iterations=10  # Runs 10 times
)
```

##### With Persistent Context
```python
# Use persistent state across multiple calls
with discomfort.Context() as context:
    # First run - loads model
    await discomfort.run(["load_model.json"], context=context)
    
    # Subsequent runs - reuse loaded model
    for i in range(5):
        inputs = {"prompt": f"Image {i}", "seed": 1000 + i}
        results = await discomfort.run(
            ["main_workflow.json"], 
            inputs=inputs,
            context=context
        )
```

##### Workflow Objects (Not Files)
```python
# Use workflow data directly
workflow_data = {
    "nodes": [...],
    "links": [...],
    # ... rest of workflow JSON
}

results = await discomfort.run([workflow_data])
```

#### Error Handling
```python
try:
    results = await discomfort.run(["workflow.json"])
except ValueError as e:
    print(f"Invalid workflow: {e}")
except RuntimeError as e:
    print(f"Execution failed: {e}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

---

## Cleanup and Shutdown

### `discomfort.shutdown()` {#shutdown}

**Gracefully shuts down** the managed ComfyUI worker instance and releases all resources.

#### Parameters
- None

#### Returns
- None

#### Example
```python
async def main():
    discomfort = await Discomfort.create()
    
    try:
        # Your workflow code here
        await discomfort.run(["workflow.json"])
    finally:
        # Always clean up
        await discomfort.shutdown()

# Or use a context manager pattern
async def main():
    discomfort = await Discomfort.create()
    
    # Ensure cleanup even if exceptions occur
    try:
        await discomfort.run(["workflow.json"])
    finally:
        await discomfort.shutdown()
```

#### Notes
- **Always call this method** when done with a Discomfort instance
- Terminates the ComfyUI server process
- Closes browser connections  
- Cleans up temporary files
- Safe to call multiple times

---

## Properties and Attributes

### `discomfort.Context` {#context-property}

**Direct access** to the WorkflowContext class for creating context instances.

#### Usage
```python
# Create a context instance
context = discomfort.Context()

# Or use as context manager (recommended)
with discomfort.Context() as context:
    context.save("data", my_data)
    await discomfort.run(["workflow.json"], context=context)
# Automatic cleanup happens here
```

### `discomfort.Tools` {#tools-property}

**Direct access** to the WorkflowTools instance for utility operations.

#### Usage
```python
# Load an image as tensor
image = discomfort.Tools.open_image_as_tensor("input.png")

# Save an image to disk
discomfort.Tools.save_comfy_image_to_disk(image_tensor, "output.png")

# Stitch workflows
result = discomfort.Tools.stitch_workflows(["wf1.json", "wf2.json"])
stitched = result["stitched_workflow"]

# Discover ports in a workflow
ports = discomfort.Tools.discover_port_nodes("workflow.json")
print(f"Inputs: {list(ports['inputs'].keys())}")
print(f"Outputs: {list(ports['outputs'].keys())}")
```

### `discomfort.Worker` {#worker-property}

**Direct access** to the ComfyConnector instance for advanced server operations.

#### Usage
```python
# Upload a file to ComfyUI
path = discomfort.Worker.upload_data(
    "my_image.png", 
    folder_type="input",
    is_ephemeral=True
)

# Convert workflow to prompt manually
prompt = await discomfort.Worker.get_prompt_from_workflow(workflow_data)

# Run a prompt directly
history = await discomfort.Worker.run_workflow(prompt, use_workflow_json=False)
```

---

## Complete Example

Here's a comprehensive example showing typical Discomfort usage:

```python
import asyncio
from custom_nodes.discomfort.discomfort import Discomfort

async def parameter_sweep():
    """Run a parameter sweep across different seeds and CFG values."""
    
    # Initialize Discomfort
    discomfort = await Discomfort.create()
    
    try:
        # Load input image
        input_image = discomfort.Tools.open_image_as_tensor("input.jpg")
        
        with discomfort.Context() as context:
            # Set up base parameters
            context.save("input_image", input_image)
            context.save("prompt", "A beautiful landscape, masterpiece")
            
            # Load model once
            context.save("model_name", "my_model.safetensors")
            await discomfort.run(["load_model.json"], context=context)
            
            # Parameter sweep
            seeds = [1000, 2000, 3000, 4000, 5000]
            cfg_values = [6.0, 7.0, 8.0, 9.0, 10.0]
            
            results = []
            for i, (seed, cfg) in enumerate(zip(seeds, cfg_values)):
                print(f"Running iteration {i+1}/5: seed={seed}, cfg={cfg}")
                
                # Update parameters
                context.save("seed", seed)
                context.save("cfg_scale", cfg)
                
                # Run main workflow
                output = await discomfort.run(
                    ["img2img_workflow.json"], 
                    context=context
                )
                
                # Save result
                image = context.load("output_image")
                filename = f"result_seed{seed}_cfg{cfg}.png"
                discomfort.Tools.save_comfy_image_to_disk(image, filename)
                
                results.append({
                    "seed": seed,
                    "cfg": cfg,
                    "filename": filename
                })
                
                # Check memory usage
                usage = context.get_usage()
                print(f"Memory: {usage['ram_usage_gb']:.1f}GB RAM, "
                      f"{usage['temp_disk_usage_mb']:.1f}MB disk")
            
            print(f"Generated {len(results)} images successfully!")
            return results
            
    except Exception as e:
        print(f"Error during parameter sweep: {e}")
        raise
    finally:
        # Always clean up
        await discomfort.shutdown()

# Run the example
if __name__ == "__main__":
    results = asyncio.run(parameter_sweep())
    print(f"Final results: {results}")
```

## Error Reference

### Common Exceptions

#### `ValueError`
- Invalid workflow paths or data
- Missing required parameters
- Invalid parameter ranges

#### `RuntimeError`  
- Workflow execution failed
- ComfyUI server communication errors
- Resource allocation failures

#### `FileNotFoundError`
- Workflow files don't exist
- Missing configuration files
- Input files not found

#### `TypeError`
- Wrong parameter types
- Invalid workflow object structure

### Best Practices

1. **Always use `await Discomfort.create()`** - Never instantiate directly
2. **Always call `shutdown()`** - Prevents resource leaks
3. **Use context managers** - Automatic cleanup with `with` statements
4. **Handle exceptions** - Wrap workflow execution in try/except blocks
5. **Monitor memory usage** - Check `context.get_usage()` for large workflows

## Next Steps

- **[WorkflowTools API](./workflow-tools)** - Utility functions for workflow manipulation
- **[WorkflowContext API](./workflow-context)** - Data management and persistence  
- **[ComfyConnector API](./comfy-connector)** - Server management and communication
- **[Node Reference](./nodes)** - DiscomfortPort and internal node documentation 