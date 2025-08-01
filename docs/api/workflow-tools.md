# WorkflowTools API Reference

The `WorkflowTools` class provides essential utilities for workflow manipulation, port discovery, workflow stitching, and graph analysis. It's the engine behind many of Discomfort's core features.

## Class Overview

```python
from custom_nodes.discomfort.discomfort import Discomfort

# Access through Discomfort instance (recommended)
discomfort = await Discomfort.create()
tools = discomfort.Tools

# Or import directly
from custom_nodes.discomfort.workflow_tools import WorkflowTools
tools = WorkflowTools()
```

## Image Utilities

### `open_image_as_tensor(image_path)` {#open-image-as-tensor}

**Loads an image file as a ComfyUI-compatible tensor.**

#### Parameters
- **`image_path`** _(str)_ - Path to the image file

#### Returns
- **`torch.Tensor`** - Image tensor in ComfyUI format `[batch, height, width, channels]`

#### Example
```python
# Load an image for workflow input
image = tools.open_image_as_tensor("input/my_photo.jpg")
print(f"Image shape: {image.shape}")  # [1, 512, 512, 3]

# Use in workflow
with discomfort.Context() as context:
    context.save("input_image", image)
    await discomfort.run(["img2img_workflow.json"], context=context)
```

#### Notes
- Automatically converts to RGB format
- Normalizes pixel values to [0, 1] range
- Adds batch dimension if not present
- Supported formats: PNG, JPG, JPEG, BMP, TIFF

---

### `save_comfy_image_to_disk(tensor, output_path)` {#save-comfy-image-to-disk}

**Saves a ComfyUI image tensor to disk.**

#### Parameters
- **`tensor`** _(torch.Tensor)_ - Image tensor from ComfyUI workflow
- **`output_path`** _(str)_ - Path where to save the image

#### Returns
- None

#### Example
```python
# Save workflow output
results = await discomfort.run(["workflow.json"])
if "output_image" in results:
    image_tensor = results["output_image"]
    tools.save_comfy_image_to_disk(image_tensor, "outputs/result.png")
    print("Image saved successfully!")
```

#### Notes
- Handles tensor format conversion automatically
- Clamps values to valid range [0, 255]
- Creates output directory if it doesn't exist
- Supports PNG, JPG output formats

---

## Workflow Analysis

### `discover_port_nodes(workflow_path)` {#discover-port-nodes}

**Analyzes a workflow to identify DiscomfortPort nodes and their types.**

#### Parameters
- **`workflow_path`** _(str)_ - Path to workflow JSON file

#### Returns
- **`Dict[str, Any]`** - Dictionary containing port analysis:
  ```python
  {
      "inputs": {unique_id: port_info, ...},
      "outputs": {unique_id: port_info, ...}, 
      "passthrus": {unique_id: port_info, ...},
      "execution_order": [node_id, ...],
      "nodes": {node_id: node_data, ...},
      "links": [link_data, ...],
      "unique_id_to_node": {unique_id: node_id, ...}
  }
  ```

#### Example
```python
# Analyze a workflow
ports = tools.discover_port_nodes("my_workflow.json")

# Check available inputs
print("Available inputs:")
for uid, info in ports["inputs"].items():
    print(f"  {uid}: {info['type']} (node {info['node_id']})")

# Check available outputs  
print("Available outputs:")
for uid, info in ports["outputs"].items():
    print(f"  {uid}: {info['type']} (node {info['node_id']})")

# Validate workflow structure
if not ports["inputs"]:
    print("Warning: No input ports found!")
```

#### Port Info Structure
Each port info contains:
```python
{
    "node_id": 123,           # Node ID in workflow
    "tags": ["tag1", "tag2"], # User-defined tags
    "type": "IMAGE",          # Inferred data type
    "input_type": "IMAGE",    # Type from input connection
    "output_type": "IMAGE"    # Type from output connection
}
```

---

### `validate_workflow(workflow)` {#validate-workflow}

**Validates workflow structure for compatibility with Discomfort.**

#### Parameters
- **`workflow`** _(Dict[str, Any])_ - Workflow JSON data

#### Returns
- **`bool`** - True if valid, False otherwise

#### Example
```python
import json

# Load and validate workflow
with open("workflow.json", "r") as f:
    workflow_data = json.load(f)

if tools.validate_workflow(workflow_data):
    print("✅ Workflow is valid")
else:
    print("❌ Workflow validation failed")
```

#### Validation Checks
- Required keys: `nodes`, `links`
- Link integrity (valid source/target nodes)
- Proper link format `[link_id, source_id, source_slot, target_id, target_slot, type]`
- Node ID consistency

---

## Workflow Manipulation

### `stitch_workflows(workflows, delete_input_ports=False, delete_output_ports=False)` {#stitch-workflows}

**Combines multiple workflows into a single executable workflow.**

#### Parameters
- **`workflows`** _(List[Union[str, dict]])_ - List of workflow paths or objects
- **`delete_input_ports`** _(bool, optional)_ - Remove unconnected input ports from result
- **`delete_output_ports`** _(bool, optional)_ - Remove unconnected output ports from result

#### Returns
- **`Dict[str, Any]`** - Stitching result:
  ```python
  {
      "stitched_workflow": workflow_data,
      "inputs": {unique_id: port_info, ...},
      "outputs": {unique_id: port_info, ...},
      "execution_order": [node_id, ...]
  }
  ```

#### Example
```python
# Basic workflow stitching
workflows = [
    "load_model.json",      # Loads model and outputs "model", "clip", "vae"
    "prepare_latent.json",  # Uses "model" input, outputs "latent"
    "ksampler.json"         # Uses "model", "latent" inputs, outputs "image"
]

result = tools.stitch_workflows(workflows)
stitched = result["stitched_workflow"]

# Save stitched workflow
with open("stitched_complete.json", "w") as f:
    json.dump(stitched, f, indent=2)

# Use stitched workflow
await discomfort.run([stitched])
```

#### Advanced Example
```python
# Stitch with port cleanup
result = tools.stitch_workflows(
    workflows=["partial1.json", "partial2.json", "partial3.json"],
    delete_input_ports=True,   # Remove unused inputs
    delete_output_ports=True   # Remove unused outputs
)

stitched = result["stitched_workflow"]
print(f"Final inputs: {list(result['inputs'].keys())}")
print(f"Final outputs: {list(result['outputs'].keys())}")

# Use cleaned workflow
await discomfort.run([stitched], inputs={"prompt": "A beautiful scene"})
```

#### How Stitching Works
1. **Renumbers all nodes and links** to avoid conflicts
2. **Connects workflows** via shared `unique_id` values
3. **Preserves execution order** through topological sorting
4. **Validates connections** between compatible data types

---

## Advanced Workflow Operations

### `remove_reroute_nodes(nodes, links)` {#remove-reroute-nodes}

**Removes Reroute nodes and rewires connections directly.**

#### Parameters
- **`nodes`** _(Dict[int, dict])_ - Dictionary of node data by ID
- **`links`** _(List[list])_ - List of link data

#### Returns
- **`Tuple[Dict, List, Dict]`** - `(clean_nodes, clean_links, link_id_map)`

#### Example
```python
import json

# Load workflow
with open("workflow_with_reroutes.json", "r") as f:
    workflow = json.load(f)

nodes_dict = {node["id"]: node for node in workflow["nodes"]}
links_list = workflow["links"]

# Remove reroutes
clean_nodes, clean_links, link_map = tools.remove_reroute_nodes(nodes_dict, links_list)

# Create clean workflow
clean_workflow = {
    "nodes": list(clean_nodes.values()),
    "links": clean_links,
    **{k: v for k, v in workflow.items() if k not in ["nodes", "links"]}
}

print(f"Removed {len(nodes_dict) - len(clean_nodes)} reroute nodes")
```

---

## Internal Methods

### `_get_workflow_with_reroutes_removed(workflow)` {#get-workflow-with-reroutes-removed}

**Returns a clean workflow with all Reroute nodes removed.**

#### Parameters
- **`workflow`** _(Dict[str, Any])_ - Original workflow data

#### Returns
- **`Dict[str, Any]`** - Cleaned workflow

#### Example
```python
# Internal usage (typically called automatically)
clean_workflow = tools._get_workflow_with_reroutes_removed(original_workflow)
```

---

### `_load_pass_by_rules()` {#load-pass-by-rules}

**Loads pass-by-reference rules from configuration file.**

#### Returns
- **`Dict[str, str]`** - Mapping of data types to pass-by methods

#### Example
```python
# View current rules
rules = tools.pass_by_rules
for data_type, method in rules.items():
    print(f"{data_type}: {method}")

# Output:
# MODEL: ref
# CLIP: ref  
# VAE: ref
# IMAGE: val
# LATENT: val
```

---

### `_discover_context_handlers(workflow)` {#discover-context-handlers}

**Discovers internal DiscomfortContextLoader/Saver nodes in workflows.**

#### Parameters
- **`workflow`** _(Dict[str, Any])_ - Workflow data

#### Returns
- **`Dict[str, List[Dict]]`** - Found handlers:
  ```python
  {
      "loaders": [{"node_id": 123, "unique_id": "model"}, ...],
      "savers": [{"node_id": 456, "unique_id": "output"}, ...]
  }
  ```

---

### `_prune_workflow_to_output(workflow, target_output_unique_id)` {#prune-workflow-to-output}

**Creates a minimal workflow that generates only a specific output.**

#### Parameters
- **`workflow`** _(Dict[str, Any])_ - Original workflow
- **`target_output_unique_id`** _(str)_ - The output to preserve

#### Returns
- **`Dict[str, Any]`** - Pruned workflow containing only necessary nodes

#### Example
```python
# Create minimal workflow for specific output
original = json.load(open("complex_workflow.json"))
minimal = tools._prune_workflow_to_output(original, "final_image")

print(f"Original: {len(original['nodes'])} nodes")
print(f"Minimal: {len(minimal['nodes'])} nodes")

# Save minimal workflow for reference storage
context.save("model_ref", minimal, pass_by="ref")
```

---

### `_prepare_prompt_for_contextual_run(prompt, port_info, context, pass_by_behaviors, handlers_info=None)` {#prepare-prompt-for-contextual-run}

**Converts a prompt for contextual execution by swapping DiscomfortPorts.**

#### Parameters
- **`prompt`** _(Dict[str, Any])_ - ComfyUI prompt data
- **`port_info`** _(Dict[str, Any])_ - Port discovery results
- **`context`** _(WorkflowContext)_ - Active context instance
- **`pass_by_behaviors`** _(Dict[str, str])_ - Pass-by rules for each unique_id
- **`handlers_info`** _(Dict, optional)_ - Handler discovery results

#### Returns
- **`Dict[str, Any]`** - Modified prompt with context loaders/savers

---

## Configuration and Rules

### `pass_by_rules` Property

**Dictionary defining which data types use pass-by-value vs pass-by-reference.**

#### Structure
```python
{
    "MODEL": "ref",        # Models stored as workflow graphs
    "CLIP": "ref",         # CLIP encoders as workflow graphs
    "VAE": "ref",          # VAE as workflow graphs
    "CONDITIONING": "ref", # Conditioning as workflow graphs
    "CONTROL_NET": "ref",  # ControlNet as workflow graphs
    "IMAGE": "val",        # Images as direct tensor data
    "LATENT": "val",       # Latents as direct tensor data
    "MASK": "val",         # Masks as direct tensor data
    "STRING": "val",       # Text as direct string data
    "INT": "val",          # Integers as direct values
    "FLOAT": "val",        # Floats as direct values
    "BOOLEAN": "val",      # Booleans as direct values
    "ANY": "val"           # Default to pass-by-value
}
```

#### Usage
```python
# Check how a type is handled
image_method = tools.pass_by_rules.get("IMAGE", "val")
print(f"Images are passed by {image_method}")  # "val"

model_method = tools.pass_by_rules.get("MODEL", "val") 
print(f"Models are passed by {model_method}")  # "ref"
```

---

## Complete Example: Workflow Pipeline

```python
import asyncio
from custom_nodes.discomfort.discomfort import Discomfort
import json

async def build_and_run_pipeline():
    """Example of using WorkflowTools for a complete pipeline."""
    
    discomfort = await Discomfort.create()
    tools = discomfort.Tools
    
    try:
        # 1. Load and validate individual workflows
        workflows = ["load_model.json", "img2img.json", "upscale.json"]
        
        for wf_path in workflows:
            # Validate each workflow
            with open(wf_path, "r") as f:
                wf_data = json.load(f)
            
            if not tools.validate_workflow(wf_data):
                raise ValueError(f"Invalid workflow: {wf_path}")
            
            # Analyze ports
            ports = tools.discover_port_nodes(wf_path)
            print(f"{wf_path}:")
            print(f"  Inputs: {list(ports['inputs'].keys())}")
            print(f"  Outputs: {list(ports['outputs'].keys())}")
        
        # 2. Stitch workflows together
        print("\nStitching workflows...")
        stitch_result = tools.stitch_workflows(workflows)
        stitched_workflow = stitch_result["stitched_workflow"]
        
        # Save stitched workflow
        with open("pipeline_stitched.json", "w") as f:
            json.dump(stitched_workflow, f, indent=2)
        
        # 3. Prepare input data
        input_image = tools.open_image_as_tensor("input/photo.jpg")
        
        # 4. Run the pipeline
        with discomfort.Context() as context:
            inputs = {
                "input_image": input_image,
                "prompt": "A beautiful enhanced photo, 4k, detailed",
                "model_name": "my_model.safetensors",
                "upscale_factor": 2.0
            }
            
            results = await discomfort.run([stitched_workflow], inputs=inputs, context=context)
            
            # 5. Save outputs
            if "upscaled_image" in results:
                output_image = results["upscaled_image"]
                tools.save_comfy_image_to_disk(output_image, "output/enhanced.png")
                print("Pipeline completed successfully!")
            
            # 6. Check memory usage
            usage = context.get_usage()
            print(f"Memory used: {usage['ram_usage_gb']:.1f}GB")
    
    finally:
        await discomfort.shutdown()

if __name__ == "__main__":
    asyncio.run(build_and_run_pipeline())
```

## Error Handling

### Common Exceptions

#### `ValueError`
- Invalid workflow structure
- Missing required workflow keys
- Invalid pass-by rules configuration

#### `FileNotFoundError`
- Workflow files don't exist
- Pass-by rules configuration missing
- Image files not found

#### `KeyError`
- Target output not found in workflow
- Missing unique_id in port discovery

#### `NetworkXUnfeasible`
- Workflow contains cycles (from `stitch_workflows`)
- Invalid execution order

### Best Practices

1. **Always validate workflows** before stitching or execution
2. **Check port discovery results** before assuming inputs/outputs exist
3. **Handle file I/O errors** when loading workflows or images
4. **Monitor memory usage** when processing large images
5. **Use descriptive unique_ids** for better debugging

## Next Steps

- **[WorkflowContext API](./workflow-context)** - Data management and persistence
- **[ComfyConnector API](./comfy-connector)** - Server management and communication  
- **[Discomfort Class](./discomfort-class)** - Main orchestration API
- **[Core Concepts](../core-concepts/ports-and-context)** - Understanding DiscomfortPorts and Context 