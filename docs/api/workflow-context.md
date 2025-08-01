# WorkflowContext API Reference

The `WorkflowContext` class manages ephemeral data I/O for stateful execution runs. It provides intelligent storage with automatic RAM/disk fallback, thread-safe operations, and support for both pass-by-value and pass-by-reference data handling.

## Class Overview

```python
from custom_nodes.discomfort.discomfort import Discomfort

# Access through Discomfort instance (recommended)
discomfort = await Discomfort.create()
context = discomfort.Context()

# Or use as context manager (best practice)
with discomfort.Context() as context:
    context.save("data", my_data)
    result = context.load("data")
# Automatic cleanup happens here
```

## Initialization

### `WorkflowContext(config_path=None, max_ram_gb=None, run_id=None, create=True)` {#init}

**Creates a new WorkflowContext instance for data management.**

#### Parameters
- **`config_path`** _(str, optional)_ - Path to custom configuration file
- **`max_ram_gb`** _(float, optional)_ - Direct RAM limit override in GB
- **`run_id`** _(str, optional)_ - Unique run identifier (auto-generated if None)
- **`create`** _(bool, optional)_ - Create new context (True) or load existing (False)

#### Returns
- **`WorkflowContext`** - Initialized context instance

#### Example
```python
# Create new context with defaults
context = WorkflowContext()

# Create with custom RAM limit
context = WorkflowContext(max_ram_gb=8.0)

# Load existing context
existing_context = WorkflowContext(run_id="abc123", create=False)

# Custom configuration
context = WorkflowContext(config_path="my_config.json")
```

#### Configuration Options
The configuration file supports:
```json
{
    "MAX_RAM_PERCENT": 50,        // Use 50% of system RAM
    "MAX_RAM_GB": 16,             // Or limit to 16GB absolute
    "CONTEXTS_DIR_NAME": "contexts"  // Directory name for temp files
}
```

---

## Data Operations

### `save(unique_id, data, use_ram=True, pass_by="val")` {#save}

**Saves data to the context with intelligent storage selection.**

#### Parameters
- **`unique_id`** _(str)_ - Unique identifier for the data
- **`data`** _(Any)_ - Data to store (any pickleable object)
- **`use_ram`** _(bool, optional)_ - Prefer RAM storage over disk
- **`pass_by`** _(str, optional)_ - Storage method: "val" or "ref"

#### Returns
- None

#### Example
```python
# Basic data storage
context.save("prompt", "A beautiful landscape")
context.save("seed", 12345)
context.save("cfg_scale", 7.5)

# Image storage (typically pass-by-value)
image_tensor = tools.open_image_as_tensor("photo.jpg")
context.save("input_image", image_tensor)

# Model storage (typically pass-by-reference)
context.save("loaded_model", model_workflow, pass_by="ref")

# Force disk storage for large data
large_dataset = generate_large_dataset()
context.save("dataset", large_dataset, use_ram=False)
```

#### Storage Selection Logic
1. **pass_by="val"**: Data stored directly as serialized object
2. **pass_by="ref"**: Data stored as workflow graph for reconstruction
3. **use_ram=True**: Prefer RAM, fallback to disk if capacity exceeded
4. **use_ram=False**: Force disk storage

---

### `load(unique_id)` {#load}

**Loads data from the context.**

#### Parameters
- **`unique_id`** _(str)_ - Identifier of data to load

#### Returns
- **`Any`** - The stored data

#### Raises
- **`KeyError`** - If unique_id not found in context

#### Example
```python
# Load various data types
prompt = context.load("prompt")           # str
seed = context.load("seed")              # int  
image = context.load("input_image")      # torch.Tensor
model = context.load("loaded_model")     # Reconstructed from workflow

print(f"Loaded prompt: {prompt}")
print(f"Image shape: {image.shape}")

# Handle missing data
try:
    result = context.load("nonexistent_key")
except KeyError:
    print("Data not found in context")
```

---

## Context Management

### `get_storage_info(unique_id)` {#get-storage-info}

**Retrieves metadata about stored data.**

#### Parameters
- **`unique_id`** _(str)_ - Identifier to query

#### Returns
- **`Optional[Dict]`** - Storage metadata or None if not found:
  ```python
  {
      "storage_type": "ram",     # "ram" or "disk"
      "size": 1024000,          # Size in bytes
      "pass_by": "val",         # "val" or "ref"
      "shm_name": "...",        # Shared memory name (RAM only)
      "path": "/tmp/..."        # File path (disk only)
  }
  ```

#### Example
```python
# Check storage details
info = context.get_storage_info("input_image")
if info:
    print(f"Storage: {info['storage_type']}")
    print(f"Size: {info['size'] / 1024**2:.1f} MB")
    print(f"Method: pass-by-{info['pass_by']}")
else:
    print("Data not found")
```

---

### `list_keys()` {#list-keys}

**Returns all stored unique_ids.**

#### Returns
- **`List[str]`** - List of all stored identifiers

#### Example
```python
# Check what's stored
keys = context.list_keys()
print(f"Stored data: {keys}")

# Iterate through all stored data
for key in context.list_keys():
    info = context.get_storage_info(key)
    print(f"{key}: {info['storage_type']} ({info['size']} bytes)")
```

---

### `get_usage()` {#get-usage}

**Reports current memory and storage usage.**

#### Returns
- **`Dict[str, Any]`** - Usage statistics:
  ```python
  {
      "ram_usage_bytes": 104857600,      # Current RAM usage
      "ram_capacity_bytes": 536870912,   # Total RAM capacity
      "ram_usage_gb": 0.1,               # RAM usage in GB
      "ram_capacity_gb": 0.5,            # RAM capacity in GB
      "temp_disk_usage_bytes": 52428800, # Disk usage in bytes
      "temp_disk_usage_mb": 50.0,        # Disk usage in MB
      "stored_keys_count": 5              # Number of stored items
  }
  ```

#### Example
```python
# Monitor memory usage
usage = context.get_usage()
print(f"RAM: {usage['ram_usage_gb']:.1f}/{usage['ram_capacity_gb']:.1f} GB")
print(f"Disk: {usage['temp_disk_usage_mb']:.1f} MB") 
print(f"Items: {usage['stored_keys_count']}")

# Check if approaching capacity
ram_percent = usage['ram_usage_bytes'] / usage['ram_capacity_bytes'] * 100
if ram_percent > 80:
    print("⚠️ RAM usage high - consider using disk storage")
```

---

## Data Persistence

### `export_data(unique_id, destination_path, overwrite=False)` {#export-data}

**Makes ephemeral data permanent by saving to disk.**

#### Parameters
- **`unique_id`** _(str)_ - Identifier of data to export
- **`destination_path`** _(str)_ - Path where to save the data
- **`overwrite`** _(bool, optional)_ - Whether to overwrite existing files

#### Returns
- None

#### Raises
- **`KeyError`** - If unique_id not found
- **`TypeError`** - If trying to export pass-by-reference data
- **`FileExistsError`** - If destination exists and overwrite=False

#### Example
```python
# Export important results for permanent storage
context.save("final_image", image_tensor)
context.save("best_parameters", {"seed": 12345, "cfg": 7.5})

# Export to permanent location
context.export_data("final_image", "/results/final_image.pkl")
context.export_data("best_parameters", "/results/params.pkl", overwrite=True)

# Data is now persistent and removed from ephemeral context
print("Data exported successfully!")
```

#### Notes
- Exported data is **removed** from the ephemeral context
- Cannot export pass-by-reference data (workflow graphs)
- Creates destination directory if it doesn't exist
- Uses cloudpickle for robust serialization

---

## Context Lifecycle

### `shutdown()` {#shutdown}

**Gracefully shuts down the context and cleans up all resources.**

#### Returns
- None

#### Example
```python
# Manual shutdown
context = WorkflowContext()
try:
    context.save("data", my_data)
    # ... use context ...
finally:
    context.shutdown()  # Always clean up

# Or use context manager (recommended)
with WorkflowContext() as context:
    context.save("data", my_data)
    # ... use context ...
# Automatic shutdown happens here
```

#### Cleanup Operations
1. **Clears all RAM** - Unlinks shared memory segments
2. **Deletes temp files** - Removes all disk storage
3. **Removes directories** - Cleans up temporary directories
4. **Thread-safe** - Safe to call multiple times

---

## Context Manager Protocol

### `__enter__()` and `__exit__()` {#context-manager}

**Enables use as a context manager for automatic resource cleanup.**

#### Example
```python
# Recommended usage pattern
with WorkflowContext() as context:
    # Set up data
    context.save("model_name", "my_model.safetensors")
    context.save("prompt", "A beautiful scene")
    
    # Run workflows
    await discomfort.run(["workflow.json"], context=context)
    
    # Extract results
    result = context.load("output_image")
    
# Automatic cleanup happens here - all resources released
```

#### Benefits of Context Manager
- **Automatic cleanup** - No need to remember `shutdown()`
- **Exception safety** - Cleanup happens even if exceptions occur
- **Resource management** - Prevents memory leaks
- **Clear scope** - Easy to see context lifetime

---

## Advanced Features

### Thread Safety

All WorkflowContext operations are thread-safe using file-based locking:

```python
import threading
import asyncio

async def worker_function(context, worker_id):
    """Multiple workers can safely share a context."""
    for i in range(10):
        # Thread-safe operations
        context.save(f"worker_{worker_id}_item_{i}", f"data_{i}")
        
        # Check what others have stored
        keys = context.list_keys()
        print(f"Worker {worker_id} sees {len(keys)} items")

# Use shared context across threads
with WorkflowContext() as shared_context:
    tasks = []
    for worker_id in range(3):
        task = worker_function(shared_context, worker_id)
        tasks.append(task)
    
    await asyncio.gather(*tasks)
```

### Memory Management Strategies

```python
# Strategy 1: Monitor and manage memory
def check_and_manage_memory(context):
    usage = context.get_usage()
    ram_percent = usage['ram_usage_bytes'] / usage['ram_capacity_bytes'] * 100
    
    if ram_percent > 85:
        print("⚠️ High RAM usage - switching to disk storage")
        return False  # Use disk for next saves
    return True  # Continue using RAM

# Strategy 2: Selective storage
with WorkflowContext() as context:
    use_ram = True
    
    for i in range(100):
        data = generate_large_data(i)
        use_ram = check_and_manage_memory(context)
        context.save(f"data_{i}", data, use_ram=use_ram)

# Strategy 3: Export large results immediately
with WorkflowContext() as context:
    # Process data
    result = process_large_dataset()
    
    # Export immediately to free memory
    context.save("large_result", result)
    context.export_data("large_result", "results/large_result.pkl")
    # Result is now permanent and context memory is freed
```

### Multiple Context Coordination

```python
async def orchestrator_worker_pattern():
    """Example of orchestrator-worker context pattern."""
    
    # Master context for overall coordination
    with WorkflowContext() as master_context:
        master_context.save("global_config", {"model": "my_model.safetensors"})
        master_context.save("input_batch", image_batch)
        
        # Worker contexts for individual tasks
        results = []
        for i in range(len(image_batch)):
            with WorkflowContext() as worker_context:
                # Load shared config
                config = master_context.load("global_config")
                image = image_batch[i]
                
                # Process individual item
                worker_context.save("config", config)
                worker_context.save("input", image)
                
                result = await discomfort.run(["workflow.json"], context=worker_context)
                results.append(result)
                
                # Worker context automatically cleaned up
        
        # Store final results in master context
        master_context.save("final_results", results)
```

## Configuration Examples

### Memory Configuration (`workflow_context.json`)

```json
{
    "MAX_RAM_PERCENT": 30,
    "CONTEXTS_DIR_NAME": "discomfort_contexts"
}
```

```json
{
    "MAX_RAM_GB": 8,
    "CONTEXTS_DIR_NAME": "temp_contexts"
}
```

### Runtime Configuration

```python
# Low memory system
low_mem_context = WorkflowContext(max_ram_gb=2.0)

# High memory system  
high_mem_context = WorkflowContext(max_ram_gb=32.0)

# Percentage-based (50% of system RAM)
# Set in config file: "MAX_RAM_PERCENT": 50
auto_context = WorkflowContext(config_path="auto_config.json")
```

## Error Handling

### Common Exceptions

#### `KeyError`
```python
try:
    data = context.load("nonexistent_key")
except KeyError as e:
    print(f"Data not found: {e}")
    # Handle missing data appropriately
```

#### `MemoryError`
```python
try:
    context.save("huge_data", massive_dataset, use_ram=True)
except MemoryError:
    print("RAM full, falling back to disk storage")
    context.save("huge_data", massive_dataset, use_ram=False)
```

#### `FileNotFoundError`
```python
try:
    context = WorkflowContext(run_id="missing123", create=False)
except FileNotFoundError:
    print("Context not found, creating new one")
    context = WorkflowContext()
```

### Best Practices

1. **Always use context managers** - Ensures automatic cleanup
2. **Monitor memory usage** - Check `get_usage()` for large workflows
3. **Export important results** - Make critical data permanent
4. **Handle missing data** - Use try/except for `load()` operations
5. **Use descriptive unique_ids** - Makes debugging easier
6. **Configure appropriate RAM limits** - Match your system capabilities

## Complete Example: Batch Processing with Context

```python
import asyncio
from pathlib import Path
from custom_nodes.discomfort.discomfort import Discomfort

async def batch_process_images():
    """Process a batch of images with intelligent memory management."""
    
    discomfort = await Discomfort.create()
    input_dir = Path("input_images")
    output_dir = Path("output_images")
    output_dir.mkdir(exist_ok=True)
    
    try:
        with discomfort.Context(max_ram_gb=4.0) as context:
            # Load model once
            context.save("model_name", "my_model.safetensors")
            await discomfort.run(["load_model.json"], context=context)
            
            # Process each image
            image_files = list(input_dir.glob("*.jpg"))
            for i, image_path in enumerate(image_files):
                print(f"Processing {i+1}/{len(image_files)}: {image_path.name}")
                
                # Load image
                image = discomfort.Tools.open_image_as_tensor(str(image_path))
                context.save("input_image", image)
                
                # Generate unique prompt
                context.save("prompt", f"Enhanced version of {image_path.stem}, 4k, detailed")
                context.save("seed", 1000 + i)
                
                # Process image
                results = await discomfort.run(["enhance_workflow.json"], context=context)
                
                # Save result
                if "enhanced_image" in results:
                    output_image = results["enhanced_image"]
                    output_path = output_dir / f"enhanced_{image_path.name}"
                    discomfort.Tools.save_comfy_image_to_disk(output_image, str(output_path))
                
                # Check memory and manage
                usage = context.get_usage()
                print(f"  Memory: {usage['ram_usage_gb']:.1f}GB used")
                
                # Export result if taking too much memory
                if usage['ram_usage_gb'] > 3.0:
                    export_path = output_dir / f"context_backup_{i}.pkl"
                    context.export_data("enhanced_image", str(export_path))
                    print(f"  Exported result to free memory")
            
            print("Batch processing completed!")
            
            # Final memory report
            final_usage = context.get_usage()
            print(f"Final memory usage: {final_usage['ram_usage_gb']:.1f}GB")
            print(f"Items in context: {final_usage['stored_keys_count']}")
    
    finally:
        await discomfort.shutdown()

if __name__ == "__main__":
    asyncio.run(batch_process_images())
```

## Next Steps

- **[ComfyConnector API](./comfy-connector)** - Server management and communication
- **[WorkflowTools API](./workflow-tools)** - Workflow manipulation utilities
- **[Discomfort Class](./discomfort-class)** - Main orchestration API
- **[Core Concepts](../core-concepts/ports-and-context)** - Understanding context management 