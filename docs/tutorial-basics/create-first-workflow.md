# Create Your First Discomfort Workflow

In this tutorial, you'll create your first programmatic ComfyUI workflow using Discomfort. We'll build a simple image generation workflow that demonstrates the core concepts.

## What You'll Learn

- How to add DiscomfortPorts to a ComfyUI workflow
- How to write Python code to control the workflow  
- How to handle inputs and outputs programmatically
- How to run iterative workflows with changing parameters

## Prerequisites

- ✅ **ComfyUI installed and working**
- ✅ **Discomfort installed** (see [Installation Guide](../installation))
- ✅ **Basic Python knowledge** (async/await, context managers)
- ✅ **Basic ComfyUI workflow creation** (nodes, connections)

## Step 1: Create the Base Workflow

First, let's create a simple text-to-image workflow in ComfyUI.

### 1.1 Open ComfyUI and Create Basic Workflow

Create a workflow with these nodes:
1. **CheckpointLoaderSimple** - Load your model
2. **CLIPTextEncode** (x2) - For positive and negative prompts
3. **KSampler** - Generate the image
4. **VAEDecode** - Decode latent to image
5. **SaveImage** - Save the result

Connect them in the standard txt2img pattern:

```
[CheckpointLoader] → [KSampler] → [VAEDecode] → [SaveImage]
         ↓              ↓
[CLIPTextEncode+] → [KSampler]
[CLIPTextEncode-] → [KSampler]
```

### 1.2 Test Your Base Workflow

Before adding Discomfort integration:
1. Set some default values (prompt, seed, etc.)
2. Queue the workflow and verify it works
3. Save it as `base_workflow.json`

## Step 2: Add DiscomfortPorts

Now we'll modify the workflow to work with Discomfort by adding DiscomfortPorts.

### 2.1 Add Input Ports

Add **DiscomfortPort** nodes for these inputs:

#### Prompt Input Port
1. Add a **DiscomfortPort** node
2. Set `unique_id` to `"prompt"`
3. **Don't connect anything to its input** (this makes it an INPUT port)
4. Connect its output to the **positive CLIPTextEncode** node

#### Seed Input Port  
1. Add another **DiscomfortPort** node
2. Set `unique_id` to `"seed"`
3. **Don't connect anything to its input**
4. Connect its output to the **KSampler** seed input

#### CFG Scale Input Port
1. Add another **DiscomfortPort** node  
2. Set `unique_id` to `"cfg_scale"`
3. **Don't connect anything to its input**
4. Connect its output to the **KSampler** cfg input

### 2.2 Add Output Port

Add a **DiscomfortPort** for the output:

1. Add a **DiscomfortPort** node
2. Set `unique_id` to `"output_image"`  
3. Connect the **VAEDecode** output to its input
4. **Don't connect anything to its output** (this makes it an OUTPUT port)

### 2.3 Final Workflow Structure

Your workflow should now look like this:

```
[CheckpointLoader] → [KSampler] → [VAEDecode] → [DiscomfortPort:output_image]
         ↓              ↓
[DiscomfortPort:prompt] → [CLIPTextEncode+] → [KSampler]
[CLIPTextEncode-] → [KSampler]
         ↑
[DiscomfortPort:seed] → [KSampler]
[DiscomfortPort:cfg_scale] → [KSampler]
```

### 2.4 Save the Workflow

Save this modified workflow as `discomfort_workflow.json`.

## Step 3: Write the Python Script

Now let's create a Python script to control this workflow.

### 3.1 Basic Script Structure

Create a file called `my_first_discomfort.py`:

```python
import asyncio
from custom_nodes.discomfort.discomfort import Discomfort

async def main():
    # Initialize Discomfort
    discomfort = await Discomfort.create()
    
    try:
        # Your workflow code will go here
        await run_workflow(discomfort)
    finally:
        # Always clean up
        await discomfort.shutdown()

async def run_workflow(discomfort):
    """Run our first Discomfort workflow."""
    pass  # We'll implement this next

if __name__ == "__main__":
    asyncio.run(main())
```

### 3.2 Single Run Implementation

Let's implement a single workflow run:

```python
async def run_workflow(discomfort):
    """Run our first Discomfort workflow."""
    
    # Prepare input data
    inputs = {
        "prompt": "A beautiful landscape with mountains and a lake, masterpiece, 4k",
        "seed": 12345,
        "cfg_scale": 7.5
    }
    
    print("Running workflow with inputs:")
    for key, value in inputs.items():
        print(f"  {key}: {value}")
    
    # Run the workflow
    results = await discomfort.run(
        workflows=["discomfort_workflow.json"],  # Path to your workflow
        inputs=inputs
    )
    
    print(f"Workflow completed! Results: {list(results.keys())}")
    
    # Extract and save the output image
    if "output_image" in results:
        output_image = results["output_image"]
        discomfort.Tools.save_comfy_image_to_disk(output_image, "my_first_result.png")
        print("Saved image as: my_first_result.png")
    else:
        print("No output image found in results")
```

### 3.3 Test Your First Run

1. Make sure your workflow file path is correct
2. Run the script: `python my_first_discomfort.py`
3. Check for the output image: `my_first_result.png`

Expected output:
```
Running workflow with inputs:
  prompt: A beautiful landscape with mountains and a lake, masterpiece, 4k
  seed: 12345
  cfg_scale: 7.5
Workflow completed! Results: ['output_image']
Saved image as: my_first_result.png
```

## Step 4: Add Iterative Execution

Now let's make it more interesting by running multiple variations.

### 4.1 Parameter Sweep Implementation

Replace the `run_workflow` function with this version:

```python
async def run_workflow(discomfort):
    """Run multiple variations of our workflow."""
    
    # Base parameters
    base_prompt = "A beautiful landscape with mountains and a lake, masterpiece, 4k"
    
    # Variations to try
    variations = [
        {"prompt": f"{base_prompt}, autumn colors", "seed": 1000, "cfg_scale": 6.0},
        {"prompt": f"{base_prompt}, winter snow", "seed": 2000, "cfg_scale": 7.0},
        {"prompt": f"{base_prompt}, spring flowers", "seed": 3000, "cfg_scale": 8.0},
        {"prompt": f"{base_prompt}, summer sunset", "seed": 4000, "cfg_scale": 9.0},
    ]
    
    print(f"Running {len(variations)} variations...")
    
    # Use context for state management
    with discomfort.Context() as context:
        for i, inputs in enumerate(variations):
            print(f"\n--- Variation {i+1}/4 ---")
            print(f"Prompt: {inputs['prompt'][:50]}...")
            print(f"Seed: {inputs['seed']}, CFG: {inputs['cfg_scale']}")
            
            # Run this variation
            results = await discomfort.run(
                workflows=["discomfort_workflow.json"],
                inputs=inputs,
                context=context  # Reuse context for efficiency
            )
            
            # Save the result
            if "output_image" in results:
                output_image = results["output_image"]
                filename = f"variation_{i+1}_seed{inputs['seed']}.png"
                discomfort.Tools.save_comfy_image_to_disk(output_image, filename)
                print(f"Saved: {filename}")
            
            # Check memory usage
            usage = context.get_usage()
            print(f"Memory: {usage['ram_usage_gb']:.1f}GB RAM, {usage['stored_keys_count']} items")
    
    print("\nAll variations completed!")
```

### 4.2 Test the Variations

Run your script again:
```bash
python my_first_discomfort.py
```

You should see 4 different images generated with different prompts, seeds, and CFG values.

## Step 5: Add Error Handling and Logging

Let's make our script more robust:

```python
import asyncio
import logging
from custom_nodes.discomfort.discomfort import Discomfort

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def main():
    """Main entry point with proper error handling."""
    discomfort = None
    
    try:
        logger.info("Initializing Discomfort...")
        discomfort = await Discomfort.create()
        logger.info("Discomfort initialized successfully")
        
        await run_workflow(discomfort)
        logger.info("Workflow execution completed successfully")
        
    except FileNotFoundError as e:
        logger.error(f"Workflow file not found: {e}")
        logger.error("Make sure 'discomfort_workflow.json' exists in the current directory")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        if discomfort:
            logger.info("Shutting down Discomfort...")
            await discomfort.shutdown()
            logger.info("Shutdown complete")

async def run_workflow(discomfort):
    """Run multiple variations with error handling."""
    
    # Verify workflow file exists
    import os
    workflow_path = "discomfort_workflow.json"
    if not os.path.exists(workflow_path):
        raise FileNotFoundError(f"Workflow file not found: {workflow_path}")
    
    # Base parameters
    base_prompt = "A beautiful landscape with mountains and a lake, masterpiece, 4k"
    
    # Variations to try
    variations = [
        {"prompt": f"{base_prompt}, autumn colors", "seed": 1000, "cfg_scale": 6.0},
        {"prompt": f"{base_prompt}, winter snow", "seed": 2000, "cfg_scale": 7.0},
        {"prompt": f"{base_prompt}, spring flowers", "seed": 3000, "cfg_scale": 8.0},
        {"prompt": f"{base_prompt}, summer sunset", "seed": 4000, "cfg_scale": 9.0},
    ]
    
    logger.info(f"Running {len(variations)} variations...")
    successful_runs = 0
    
    with discomfort.Context() as context:
        for i, inputs in enumerate(variations):
            try:
                logger.info(f"Starting variation {i+1}/{len(variations)}")
                logger.info(f"  Prompt: {inputs['prompt'][:50]}...")
                logger.info(f"  Seed: {inputs['seed']}, CFG: {inputs['cfg_scale']}")
                
                # Run this variation
                results = await discomfort.run(
                    workflows=[workflow_path],
                    inputs=inputs,
                    context=context
                )
                
                # Save the result
                if "output_image" in results:
                    output_image = results["output_image"]
                    filename = f"variation_{i+1}_seed{inputs['seed']}.png"
                    discomfort.Tools.save_comfy_image_to_disk(output_image, filename)
                    logger.info(f"  Saved: {filename}")
                    successful_runs += 1
                else:
                    logger.warning(f"  No output image found for variation {i+1}")
                
                # Check memory usage
                usage = context.get_usage()
                logger.info(f"  Memory: {usage['ram_usage_gb']:.1f}GB RAM, {usage['stored_keys_count']} items")
                
            except Exception as e:
                logger.error(f"Error in variation {i+1}: {e}")
                # Continue with next variation instead of stopping
                continue
    
    logger.info(f"Completed {successful_runs}/{len(variations)} variations successfully")

if __name__ == "__main__":
    asyncio.run(main())
```

## Step 6: Verify Your Results

After running your completed script, you should have:

### Generated Files
- `variation_1_seed1000.png` - Autumn landscape
- `variation_2_seed2000.png` - Winter landscape  
- `variation_3_seed3000.png` - Spring landscape
- `variation_4_seed4000.png` - Summer landscape

### Console Output
```
2024-01-01 12:00:00,000 - INFO - Initializing Discomfort...
2024-01-01 12:00:05,000 - INFO - Discomfort initialized successfully
2024-01-01 12:00:05,100 - INFO - Running 4 variations...
2024-01-01 12:00:05,200 - INFO - Starting variation 1/4
2024-01-01 12:00:05,300 - INFO -   Prompt: A beautiful landscape with mountains and a lake, masterpiece, 4k, autumn colors...
2024-01-01 12:00:05,400 - INFO -   Seed: 1000, CFG: 6.0
2024-01-01 12:00:15,000 - INFO -   Saved: variation_1_seed1000.png
2024-01-01 12:00:15,100 - INFO -   Memory: 0.5GB RAM, 1 items
...
2024-01-01 12:01:00,000 - INFO - Completed 4/4 variations successfully
2024-01-01 12:01:00,100 - INFO - Workflow execution completed successfully
2024-01-01 12:01:00,200 - INFO - Shutting down Discomfort...
2024-01-01 12:01:02,000 - INFO - Shutdown complete
```

## Common Issues and Solutions

### Issue: "ModuleNotFoundError: No module named 'discomfort'"

**Solution**: Make sure Discomfort is installed correctly:
```bash
cd ComfyUI/custom_nodes/discomfort
pip install -r requirements.txt
```

### Issue: "FileNotFoundError: Workflow file not found"

**Solution**: Ensure your workflow file is in the correct location:
```bash
# Check if file exists
ls -la discomfort_workflow.json

# If not, check ComfyUI output directory or adjust path
```

### Issue: "No output image found in results"

**Solution**: Check your DiscomfortPort setup:
1. Verify the output port has `unique_id` = `"output_image"`
2. Ensure something is connected to the output port's input
3. Ensure nothing is connected to the output port's output

### Issue: Workflow fails to execute

**Solution**: 
1. Test the base workflow in ComfyUI first
2. Check that all DiscomfortPorts have unique `unique_id` values
3. Verify all input data types match what the workflow expects

## What's Next?

Congratulations! You've created your first Discomfort workflow. Here's what to explore next:

### Core Concepts
1. **[Understanding Ports and Context](../core-concepts/ports-and-context)** - Deep dive into the fundamentals
2. **[API Reference](../api/discomfort-class)** - Explore all available methods and classes
3. **[Workflow Tools](../api/workflow-tools)** - Learn about workflow manipulation utilities

### Practical Examples
1. **[Parameter Sweep](../examples/parameter-sweep)** - Systematic parameter exploration
2. **[Installation Guide](../installation)** - Advanced installation and configuration options
3. **[ComfyConnector API](../api/comfy-connector)** - Server management and communication

Happy experimenting with Discomfort! 🚀 