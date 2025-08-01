# Nodes API Reference

Discomfort provides several node types that enable programmatic control within ComfyUI workflows. These nodes act as bridges between your Python code and ComfyUI's execution graph.

## DiscomfortPort

**The primary node for data exchange between Python and ComfyUI workflows.**

### Purpose

DiscomfortPort is the main interface node that operates in three distinct modes based on its connections:

- 🔌 **INPUT Mode** - No incoming connections, data flows from Python → ComfyUI
- 📤 **OUTPUT Mode** - No outgoing connections, data flows from ComfyUI → Python  
- 🔄 **PASSTHRU Mode** - Both incoming and outgoing connections, data passes through

### Node Properties

#### `unique_id` (Required)
**Unique identifier that links this port to your Python code.**

- **Type**: String
- **Purpose**: Key used in `context.save()` and `context.load()` operations
- **Rules**: Must be unique across all DiscomfortPorts in a workflow
- **Examples**: `"input_image"`, `"model"`, `"final_result"`

#### `tags` (Optional)
**User-defined tags for categorization and filtering.**

- **Type**: String (comma-separated values)
- **Purpose**: Organizational metadata for complex workflows
- **Examples**: `"model,checkpoint"`, `"temp,debug"`, `"output,final"`

### Usage Examples

#### INPUT Mode (Python → ComfyUI)
```python
# Python side
with discomfort.Context() as context:
    image = tools.open_image_as_tensor("photo.jpg")
    context.save("input_image", image)
    
    await discomfort.run(["workflow.json"], context=context)
```

```json
// Workflow side - DiscomfortPort with unique_id="input_image"
{
    "id": 5,
    "type": "DiscomfortPort",
    "inputs": {},  // No incoming connections = INPUT mode
    "widgets_values": ["input_image", ""],
    "pos": [100, 200]
}
```

#### OUTPUT Mode (ComfyUI → Python)
```python
# Python side
with discomfort.Context() as context:
    results = await discomfort.run(["workflow.json"], context=context)
    output_image = context.load("final_result")
    tools.save_comfy_image_to_disk(output_image, "result.png")
```

```json
// Workflow side - DiscomfortPort with unique_id="final_result"
{
    "id": 10,
    "type": "DiscomfortPort", 
    "inputs": {
        "value": ["8", 0]  // Connected to previous node
    },
    "widgets_values": ["final_result", ""],
    "pos": [800, 400]
    // No outputs defined = OUTPUT mode
}
```

#### PASSTHRU Mode (Data Inspection)
```python
# Python side - inspect intermediate results
with discomfort.Context() as context:
    results = await discomfort.run(["workflow.json"], context=context)
    
    # Check intermediate values
    intermediate = context.load("debug_checkpoint")
    print(f"Intermediate result: {type(intermediate)}")
```

```json
// Workflow side - DiscomfortPort with unique_id="debug_checkpoint"  
{
    "id": 7,
    "type": "DiscomfortPort",
    "inputs": {
        "value": ["6", 0]  // Input from previous node
    },
    "outputs": {
        "0": ["8", 0]      // Output to next node
    },
    "widgets_values": ["debug_checkpoint", "debug"],
    "pos": [400, 300]
}
```

### Data Type Handling

DiscomfortPort automatically handles various ComfyUI data types:

#### Pass-by-Value Types
- **IMAGE** - Tensor data stored directly
- **LATENT** - Latent space representations
- **MASK** - Binary masks
- **STRING** - Text data
- **INT/FLOAT** - Numeric values

#### Pass-by-Reference Types
- **MODEL** - Stored as workflow graphs for reconstruction
- **CLIP** - Text encoder models
- **VAE** - Variational autoencoders
- **CONDITIONING** - Text conditioning data
- **CONTROL_NET** - ControlNet models

### Best Practices

1. **Use descriptive unique_ids**: `"input_image"` instead of `"img"`
2. **Group related ports with tags**: `"model,main"` vs `"model,backup"`
3. **Place INPUT ports early**: At the beginning of workflows
4. **Place OUTPUT ports late**: At the end of processing chains
5. **Use PASSTHRU for debugging**: Insert temporary inspection points

---

## DiscomfortTestRunner

**Specialized node for automated testing and validation workflows.**

### Purpose

The DiscomfortTestRunner enables automated testing by executing validation checks within ComfyUI workflows and reporting results back to Python.

### Node Properties

#### `unique_id` (Required)
**Identifier for accessing test results.**

#### `test_type` (Required)
**Type of test to perform.**

Options:
- `"image_similarity"` - Compare two images using SSIM/MSE
- `"tensor_validation"` - Validate tensor properties (shape, range, etc.)
- `"output_existence"` - Check if expected outputs exist
- `"custom_function"` - Run user-defined test function

#### `expected_value` (Optional)
**Expected result for comparison tests.**

#### `tolerance` (Optional)
**Tolerance for numerical comparisons.**

- **Default**: `0.01`
- **Range**: `0.0` to `1.0`

### Usage Example

```python
# Python side - run test workflow
with discomfort.Context() as context:
    # Set up test inputs
    context.save("test_image", reference_image)
    context.save("tolerance_value", 0.05)
    
    results = await discomfort.run(["test_workflow.json"], context=context)
    
    # Check test results
    test_result = context.load("validation_result")
    if test_result["passed"]:
        print("✅ Test passed!")
    else:
        print(f"❌ Test failed: {test_result['error']}")
```

```json
// Workflow side
{
    "id": 15,
    "type": "DiscomfortTestRunner",
    "inputs": {
        "input_a": ["10", 0],      // Generated image
        "input_b": ["11", 0],      // Reference image 
        "tolerance": ["12", 0]     // Tolerance value
    },
    "widgets_values": ["validation_result", "image_similarity", "", "0.01"],
    "pos": [600, 500]
}
```

### Test Result Format

```python
{
    "passed": True,           # Boolean result
    "score": 0.987,          # Numerical score (if applicable)
    "error": None,           # Error message (if failed)
    "details": {             # Additional test-specific data
        "ssim": 0.987,
        "mse": 0.002,
        "max_diff": 0.05
    }
}
```

---

## Internal Nodes

These nodes are automatically inserted by Discomfort during workflow execution and are not meant to be manually placed.

### DiscomfortContextLoader

**Internal node that loads data from WorkflowContext.**

#### Purpose
- Automatically replaces INPUT mode DiscomfortPorts during execution
- Loads data from the active context using the `unique_id`
- Handles pass-by-value and pass-by-reference data appropriately

#### Automatic Insertion
```python
# Original workflow has DiscomfortPort in INPUT mode
# Discomfort automatically replaces it with:
{
    "id": 100,
    "type": "DiscomfortContextLoader",
    "inputs": {},
    "widgets_values": ["input_image", "val"],  // [unique_id, pass_by_method]
    "pos": [100, 200]
}
```

#### Data Loading
- **Pass-by-value**: Loads serialized data directly
- **Pass-by-reference**: Reconstructs data by executing workflow graph

---

### DiscomfortContextSaver

**Internal node that saves data to WorkflowContext.**

#### Purpose
- Automatically replaces OUTPUT mode DiscomfortPorts during execution
- Saves data to the active context using the `unique_id`
- Enables data extraction after workflow completion

#### Automatic Insertion
```python
# Original workflow has DiscomfortPort in OUTPUT mode
# Discomfort automatically replaces it with:
{
    "id": 101,
    "type": "DiscomfortContextSaver", 
    "inputs": {
        "value": ["8", 0]  // Connected to data source
    },
    "widgets_values": ["final_result", "val"],  // [unique_id, pass_by_method]
    "pos": [800, 400]
}
```

#### Data Saving
- **Pass-by-value**: Serializes and stores data directly
- **Pass-by-reference**: Stores minimal workflow graph for reconstruction

---

### DiscomfortWorkflowGraphLoader

**Internal node for loading pass-by-reference data.**

#### Purpose
- Handles reconstruction of complex objects (models, VAEs, etc.)
- Executes minimal workflow graphs to recreate objects
- Optimizes memory usage for large models

#### Automatic Usage
```python
# When loading a MODEL that was saved by reference:
{
    "id": 102,
    "type": "DiscomfortWorkflowGraphLoader",
    "inputs": {},
    "widgets_values": ["model_checkpoint", "reference_workflow_data"],
    "pos": [50, 100]
}
```

#### Reference Workflow Data
Contains minimal ComfyUI workflow needed to reconstruct the object:
```python
{
    "nodes": [
        {
            "id": 1,
            "type": "CheckpointLoaderSimple",
            "inputs": {},
            "widgets_values": ["my_model.safetensors"]
        }
    ],
    "links": [],
    "target_output_node": 1,
    "target_output_slot": 0
}
```

---

## Node Development

### Creating Custom Nodes

You can extend Discomfort with custom nodes that integrate with the context system:

#### Basic Custom Node Structure
```python
class MyCustomDiscomfortNode:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "unique_id": ("STRING", {"default": "my_data"}),
                "input_data": ("*", ),  # Accepts any type
            },
            "optional": {
                "tags": ("STRING", {"default": ""}),
            }
        }
    
    RETURN_TYPES = ("*",)  # Returns any type
    FUNCTION = "process"
    CATEGORY = "discomfort/custom"
    
    def process(self, unique_id, input_data, tags=""):
        # Your processing logic here
        processed_data = self.custom_processing(input_data)
        
        # Optionally save to context
        # (requires access to active context)
        
        return (processed_data,)
    
    def custom_processing(self, data):
        # Your custom logic
        return data

# Register the node
NODE_CLASS_MAPPINGS = {
    "MyCustomDiscomfortNode": MyCustomDiscomfortNode
}
```

#### Integration with Context
```python
# Access active context in custom node
from custom_nodes.discomfort.workflow_context import get_active_context

def process(self, unique_id, input_data, tags=""):
    context = get_active_context()
    if context:
        # Save intermediate results
        context.save(f"{unique_id}_intermediate", input_data)
    
    return (processed_data,)
```

### Node Naming Conventions

- **DiscomfortPort**: Primary interface node
- **DiscomfortTestRunner**: Testing and validation
- **DiscomfortContext\***: Internal context management nodes
- **DiscomfortWorkflow\***: Internal workflow management nodes
- **Discomfort\***: All Discomfort-related nodes

### Registration Pattern

```python
# Standard registration in __init__.py
NODE_CLASS_MAPPINGS = {
    "DiscomfortPort": DiscomfortPort,
    "DiscomfortTestRunner": DiscomfortTestRunner,
    # ... other nodes
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "DiscomfortPort": "Discomfort Port",
    "DiscomfortTestRunner": "Discomfort Test Runner",
    # ... other display names
}
```

---

## Complete Example: Multi-Node Workflow

```python
import asyncio
from custom_nodes.discomfort.discomfort import Discomfort
import json

async def complex_workflow_example():
    """Example using multiple Discomfort nodes."""
    
    discomfort = await Discomfort.create()
    
    try:
        with discomfort.Context() as context:
            # Prepare inputs
            image = discomfort.Tools.open_image_as_tensor("input.jpg")
            context.save("input_image", image)
            context.save("model_name", "my_model.safetensors") 
            context.save("prompt", "A beautiful enhanced image")
            context.save("test_tolerance", 0.03)
            
            # Create workflow with multiple DiscomfortPorts
            workflow = {
                "nodes": [
                    # INPUT: Load image from context
                    {
                        "id": 1,
                        "type": "DiscomfortPort",
                        "inputs": {},
                        "widgets_values": ["input_image", ""],
                        "pos": [0, 0]
                    },
                    
                    # INPUT: Load model name
                    {
                        "id": 2, 
                        "type": "DiscomfortPort",
                        "inputs": {},
                        "widgets_values": ["model_name", ""],
                        "pos": [0, 200]
                    },
                    
                    # Load the model
                    {
                        "id": 3,
                        "type": "CheckpointLoaderSimple",
                        "inputs": {
                            "ckpt_name": ["2", 0]
                        },
                        "pos": [300, 200]
                    },
                    
                    # INPUT: Load prompt
                    {
                        "id": 4,
                        "type": "DiscomfortPort", 
                        "inputs": {},
                        "widgets_values": ["prompt", ""],
                        "pos": [0, 400]
                    },
                    
                    # Process the image (simplified)
                    {
                        "id": 5,
                        "type": "VAEEncode",
                        "inputs": {
                            "pixels": ["1", 0],
                            "vae": ["3", 2]
                        },
                        "pos": [300, 0]
                    },
                    
                    # PASSTHRU: Debug intermediate result
                    {
                        "id": 6,
                        "type": "DiscomfortPort",
                        "inputs": {
                            "value": ["5", 0]
                        },
                        "outputs": {
                            "0": ["7", 0]
                        },
                        "widgets_values": ["debug_latent", "debug"],
                        "pos": [600, 0]
                    },
                    
                    # Continue processing
                    {
                        "id": 7,
                        "type": "VAEDecode",
                        "inputs": {
                            "samples": ["6", 0],
                            "vae": ["3", 2]
                        },
                        "pos": [900, 0]
                    },
                    
                    # OUTPUT: Save final result
                    {
                        "id": 8,
                        "type": "DiscomfortPort",
                        "inputs": {
                            "value": ["7", 0]
                        },
                        "widgets_values": ["final_image", ""],
                        "pos": [1200, 0]
                    },
                    
                    # TEST: Validate result quality
                    {
                        "id": 9,
                        "type": "DiscomfortTestRunner",
                        "inputs": {
                            "input_a": ["7", 0],      # Generated image
                            "input_b": ["1", 0],      # Original image
                            "tolerance": ["10", 0]    # Tolerance from context
                        },
                        "widgets_values": ["quality_test", "image_similarity", "", "0.01"],
                        "pos": [900, 300]
                    },
                    
                    # INPUT: Test tolerance
                    {
                        "id": 10,
                        "type": "DiscomfortPort",
                        "inputs": {},
                        "widgets_values": ["test_tolerance", ""],
                        "pos": [600, 400]
                    }
                ],
                "links": [
                    [1, 2, 0, 3, 0, "STRING"],
                    [2, 1, 0, 5, 0, "IMAGE"],
                    [3, 3, 2, 5, 1, "VAE"],
                    [4, 5, 0, 6, 0, "LATENT"],
                    [5, 6, 0, 7, 0, "LATENT"], 
                    [6, 3, 2, 7, 1, "VAE"],
                    [7, 7, 0, 8, 0, "IMAGE"],
                    [8, 7, 0, 9, 0, "IMAGE"],
                    [9, 1, 0, 9, 1, "IMAGE"],
                    [10, 10, 0, 9, 2, "FLOAT"]
                ]
            }
            
            # Execute workflow
            results = await discomfort.run([workflow], context=context)
            
            # Check results
            print("Workflow execution completed!")
            
            # Access debug data
            debug_latent = context.load("debug_latent")
            print(f"Debug latent shape: {debug_latent.shape}")
            
            # Access final result
            final_image = context.load("final_image")
            discomfort.Tools.save_comfy_image_to_disk(final_image, "enhanced.png")
            
            # Check test results
            test_result = context.load("quality_test")
            if test_result["passed"]:
                print(f"✅ Quality test passed! Score: {test_result['score']:.3f}")
            else:
                print(f"❌ Quality test failed: {test_result['error']}")
            
            return results
    
    finally:
        await discomfort.shutdown()

if __name__ == "__main__":
    asyncio.run(complex_workflow_example())
```

## Error Handling

### Common Node Errors

#### Missing unique_id
```python
# Error: DiscomfortPort without unique_id
{
    "id": 5,
    "type": "DiscomfortPort",
    "widgets_values": ["", ""]  # Empty unique_id
}

# Fix: Always provide unique_id
{
    "id": 5, 
    "type": "DiscomfortPort",
    "widgets_values": ["my_data", ""]
}
```

#### Duplicate unique_ids
```python
# Error: Two ports with same unique_id
# Port 1: unique_id = "image_data"
# Port 2: unique_id = "image_data"  # Duplicate!

# Fix: Use unique identifiers
# Port 1: unique_id = "input_image"
# Port 2: unique_id = "output_image"
```

#### Context Data Not Found
```python
# Python side - missing data
context.save("input_image", image)
# Workflow expects "input_img" but context has "input_image"

try:
    result = context.load("missing_key")
except KeyError:
    print("Data not found in context")
```

### Best Practices for Robustness

1. **Validate unique_ids**: Check for duplicates and naming conflicts
2. **Handle missing data**: Use try/except when loading from context
3. **Use descriptive names**: Clear naming reduces confusion
4. **Test workflows**: Use DiscomfortTestRunner for validation
5. **Monitor context usage**: Check `context.get_usage()` for memory issues

## Next Steps

- **[Discomfort Class](./discomfort-class)** - Main orchestration API
- **[WorkflowTools API](./workflow-tools)** - Workflow manipulation utilities
- **[WorkflowContext API](./workflow-context)** - Data management and persistence
- **[Core Concepts](../core-concepts/ports-and-context)** - Understanding DiscomfortPorts 