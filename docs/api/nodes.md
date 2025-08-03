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

#### PASSTHRU Mode (No interaction)

When in PASSTHRU Mode, the DiscomfortPort is inactive. The only thing it does it to return, as outputs, the inputs it receives.

DiscomfortPorts that get connected to other DiscomfortPorts are automatically assigned to PASSTHRU mode.

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

Those are variable types that are handled directly. Discomfortstores their values in context, which can be freely manipulated on Python.

Examples:
- **IMAGE** - Tensor data stored directly
- **LATENT** - Latent space representations
- **MASK** - Binary masks
- **STRING** - Text data
- **INT/FLOAT** - Numeric values

#### Pass-by-Reference Types

Those are variable types that are handled indirectly, usually due to their size. Instead of saving them directly (which could be costly in terms of time/memory/compute), Discomfort saves the smallest possible workflow JSON that leads to their actual value in ComfyUI. These sub-workflows are retrieved when a ComfyUI workflow requires the variable, with the sub-workflow then being stitched into the workflow being run.

Examples:
- **MODEL** - Stored as workflow graphs for reconstruction
- **CLIP** - Text encoder models
- **VAE** - Variational autoencoders
- **CONDITIONING** - Text conditioning data
- **CONTROL_NET** - ControlNet models

### Best Practices

1. **Use descriptive unique_ids**: `"input_image"` instead of `"img"`
2. **Place INPUT ports early**: At the beginning of workflows
3. **Place OUTPUT ports late**: At the end of processing chains
4. **Use PASSTHRU for debugging**: Connect INPUT to OUTPUT DiscomfortPorts when testing on ComfyUI

---

## DiscomfortTestRunner

**Specialized node for automated testing and validation workflows.**

### Purpose

The DiscomfortTestRunner enables automated testing by executing validation checks within ComfyUI workflows and reporting results back to Python.

This node can be used in ComfyUI as a testbed for Discomfort workflows. Just add a path/to/workflow containing DiscomfortPorts and it will expose the INPUT and OUTPUT DiscomfortPorts of that sub-workflow to your existing workflow.

Always make sure you get the `unique_id`s right when using this node; if you do so, it should work well.

---

## Internal Nodes

These nodes are automatically inserted by Discomfort during workflow execution and are not meant to be manually placed. They replace DiscomfortPorts at Discomfort's runtime, simply by changing the class of the node inside the prompt JSON that will be sent for ComfyUI processing.

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
- **Pass-by-reference**: (NOT handled by the DiscomfortContextLoader; instead, handled by the run() method directly)

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
# Error: Two ports with same unique_id; 
#        the first one will be overwritten. 
#        Be strategic about your unique_id names!
# Port 1: unique_id = "image_data"
# Port 2: unique_id = "image_data"  # Duplicate!

# Fix: Use unique identifiers
# Port 1: unique_id = "input_image"
# Port 2: unique_id = "output_image"
```

### Best Practices for Robustness

1. **Validate unique_ids**: Check for duplicates and naming conflicts
2. **Use descriptive names**: Clear naming reduces confusion
3. **Test workflows**: Use DiscomfortTestRunner for validation

## Next Steps

- **[Discomfort Class](./discomfort-class)** - Main orchestration API
- **[WorkflowTools API](./workflow-tools)** - Workflow manipulation utilities
- **[WorkflowContext API](./workflow-context)** - Data management and persistence
- **[Core Concepts](../core-concepts/ports-and-context)** - Understanding DiscomfortPorts 