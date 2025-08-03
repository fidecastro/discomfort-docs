# DiscomfortPorts and Context

The two foundational concepts in Discomfort are **DiscomfortPorts** and **Context**. Understanding these will help you master programmatic workflow execution.

## DiscomfortPorts: The Gateway to Programmability

DiscomfortPorts are special nodes that act as the interface between your ComfyUI workflows and Python code. They operate in three distinct modes:

### 🔌 INPUT Mode
When a DiscomfortPort has **no incoming connections**, it becomes an INPUT port that injects data from Python into your workflow.

```python
# Python side: Save data to context
context.save("my_prompt", "A beautiful landscape, 4k, masterpiece")
context.save("my_seed", 42069)

# Workflow side: DiscomfortPorts with unique_ids "my_prompt" and "my_seed" 
# will automatically receive this data
```

**Workflow Setup:**
1. Add a DiscomfortPort node
2. Set `unique_id` to "my_prompt" 
3. **Don't connect anything to its input**
4. Connect its output to whatever needs the prompt

### 📤 OUTPUT Mode  
When a DiscomfortPort has **no outgoing connections**, it becomes an OUTPUT port that extracts data from your workflow to Python.

```python
# Workflow side: DiscomfortPort receives image from your workflow
# and has unique_id "final_image"

# Python side: Extract the result
result_image = context.load("final_image")
discomfort.Tools.save_comfy_image_to_disk(result_image, "output.png")
```

**Workflow Setup:**
1. Add a DiscomfortPort node  
2. Set `unique_id` to "final_image"
3. Connect something to its input (the data you want to extract)
4. **Don't connect anything to its output**

### 🔄 PASSTHRU Mode
When a DiscomfortPort has **both incoming and outgoing connections**, it becomes a passthrough node that simply forwards data unchanged.

This mode is useful for:
- Creating connection points for workflow stitching
- Adding debugging/monitoring points  
- Future extensibility

## Context: Your Data Store

The **WorkflowContext** is Discomfort's intelligent data store that manages all data between workflow executions. It handles:

### 💾 Automatic Storage Management
- **RAM storage** for fast access to frequently used data
- **Disk fallback** when RAM capacity is exceeded  
- **Automatic cleanup** when context is closed

```python
with discomfort.Context() as context:
    # Data automatically managed and cleaned up
    context.save("large_image", my_4k_image)  # May go to disk
    context.save("small_data", {"cfg": 7.5})  # Likely stays in RAM
# Automatic cleanup happens here
```

### 🔄 Pass-by-Value vs Pass-by-Reference

Discomfort intelligently handles different data types:

#### Pass-by-Value ("val")
Simple data is stored directly. Examples:
- **Images, latents** - Raw tensor data
- **Strings, numbers** - Primitive values  
- **Small objects** - Direct serialization

A pass-by-value variable has its value directly stored by Discomfort. Upon a `context.save()` request it is serialized and stored in memory (disk or RAM); upon a `context.load()` request it is deserialized and can be handled via Python.

```python
# These are stored as actual data
context.save("prompt", "Beautiful landscape")
context.save("cfg_scale", 7.5)
context.save("image", image_tensor)
```

#### Pass-by-Reference ("ref")  
Complex objects are stored as workflow graphs. Examples:
- **Models** - Stored as the workflow that creates them
- **CLIP encoders** - The nodes that load them
- **VAE** - The complete loading pipeline

Instead of handling its actual value, Discomfort relies on ComfyUI to recreate the variable from its original workflow recipe (that is, from the minimal ComfyUI workflow that would reproduce its value). This is a critical optimization step to avoid out-of-memory errors or unacceptable overhead for large variables such as model checkpoints or other tensors.

A pass-by-reference variable thus _cannot be directly handled via Python_; to do that, you must change its pass-by rule on the `pass_by_rules.json` so that it is always passed as value. Note that this will likely create large bottlenecks in time, compute and memory, especially for large/complex workflows.

```python
# This stores the WORKFLOW that creates the model, not the model itself
context.save("my_model", model_object)  # Becomes a workflow graph

# Later, when loaded, the workflow is executed to recreate the model
loaded_model = context.load("my_model")  # Runs the stored workflow
```

### 🧠 Type Rules Configuration

You can customize which types use which storage method in `pass_by_rules.json`. The presets are as follows:

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

## Practical Example: Complete Workflow

Let's see how ports and context work together:

### 1. Prepare Your Workflow
```
[LoadModel] → [DiscomfortPort:my_model] → [KSampler] 
                                              ↓
[DiscomfortPort:prompt] → [CLIPTextEncode] → [KSampler] → [DiscomfortPort:output]
                                              ↓
[DiscomfortPort:seed] → [KSampler] → [VAEDecode] → [DiscomfortPort:output]
```

### 2. Write Your Python Script

```python
import asyncio
from custom_nodes.discomfort.discomfort import Discomfort

async def main():
    discomfort = await Discomfort.create()
    
    with discomfort.Context() as context:
        # Load model once (pass-by-reference)
        context.save("model_name", "my_model.safetensors")
        await discomfort.run(["load_model.json"], context=context)
        
        # Now my_model is available for subsequent runs
        for i in range(5):
            # Update parameters (pass-by-value)
            context.save("prompt", f"Image {i}: A beautiful scene")
            context.save("seed", 1000 + i)
            
            # Run main workflow - reuses the loaded model
            await discomfort.run(["main_workflow.json"], context=context)
            
            # Extract result
            image = context.load("output")
            discomfort.Tools.save_comfy_image_to_disk(image, f"output_{i}.png")
    
    await discomfort.shutdown()

asyncio.run(main())
```

## Context Best Practices

### ✅ Do This
```python
# Use context managers for automatic cleanup
with discomfort.Context() as context:
    # Your workflow code here
    pass  # Automatic cleanup upon closing the 'with' clause 

# Reuse heavy objects across runs
context.save("model_name", my_model)  # Load once
for i in range(10):
    await discomfort.run(["workflow.json"], context=context)  # Reuse model

# Use descriptive unique_ids
context.save("main_character_prompt", prompt)
context.save("background_image", bg_img)
```

### ❌ Avoid This
```python
# Don't forget context cleanup
context = discomfort.Context()
# ... use context ...
# Missing: context.shutdown() - will leak resources!
# Instead, use a `with` clause to ensure it always shuts down the context

# Avoid switching heavy objects unnecessarily
for i in range(10):
    my_model = f"model{i}.safetensors"
    context.save("model_name", my_model)  # Possibly wasteful; try clustering model use
    await discomfort.run(["workflow.json"], context=context)

# Don't use generic unique_ids
context.save("data", something)  # What is "data"?
context.save("output", result)   # Which output?
```

## Memory Management

### RAM Usage
Check current usage:
```python
usage = context.get_usage()
print(f"RAM: {usage['ram_usage_gb']:.2f} / {usage['ram_capacity_gb']:.2f} GB")
print(f"Disk: {usage['temp_disk_usage_mb']:.1f} MB")
print(f"Items: {usage['stored_keys_count']}")
```

### Configuration
Adjust memory limits in `workflow_context.json`:
```json
{
    "MAX_RAM_PERCENT": 50,    // Use 50% of free system RAM
    "MAX_RAM_GB": 16,         // Or cap at 16GB
    "CONTEXTS_DIR_NAME": "contexts"
}
```
Note: if `MAX_RAM_PERCENT` is present, then its value is used and the `MAX_RAM_GB` data is ignored. Use one or the other.

## Advanced Context Features

### Export Persistent Data
Context data is handled internally with `cloudpickle`. Exported data should correspondingly be in .pkl format.

```python
# Make temporary data permanent
context.export_data("final_result", "/path/to/permanent/file.pkl")
```

### List Stored Keys
```python
# See what's in your context
keys = context.list_keys()
print(f"Stored data: {keys}")
```

### Multiple Contexts
```python
# Use different contexts for different tasks
with discomfort.Context() as training_context:
    # Training workflows
    pass

with discomfort.Context() as inference_context:
    # Inference workflows  
    pass
```

## Next Steps

Now that you understand ports and context:

- **[Watch the Basic Tutorial](../tutorial-basics/running-a-workflow)** - Hands-on practice
- **[Parameter Sweep Example](../examples/parameter-sweep)** - More advanced practical usage example
- **[API Reference](../api/discomfort-class)** - Explore the full Discomfort API
- **[Workflow Tools](../api/workflow-tools)** - Learn about workflow manipulation 