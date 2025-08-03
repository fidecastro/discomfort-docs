# Parameter Sweep Example

This example demonstrates how to systematically test different parameter combinations using Discomfort. We'll create a script that generates images with various seeds, CFG scales, and sampling steps to find optimal settings.

## Overview

Parameter sweeps are essential for:
- 🎯 **Finding optimal settings** for your specific model and style
- 📊 **Comparing different configurations** systematically  
- 🔬 **Understanding parameter interactions** and their effects
- 📈 **Generating datasets** for analysis or comparison

## What We'll Build

A script that:
1. Tests multiple seeds, CFG scales, and step counts
2. Generates a grid of images with different combinations
3. Saves results with descriptive filenames
4. Tracks performance metrics and memory usage
5. Exports a summary report

## Prerequisites

- ✅ Discomfort installed and working
- ✅ A ComfyUI workflow with DiscomfortPorts
- ✅ A model loaded in your workflow

## Step 1: Prepare the Workflow

Create a workflow named `parameter_sweep_workflow.json` with these DiscomfortPorts:

### Input Ports
- `"prompt"` - Text prompt for generation
- `"negative_prompt"` - Negative prompt  
- `"seed"` - Random seed
- `"cfg_scale"` - CFG guidance scale
- `"steps"` - Number of sampling steps
- `"width"` - Image width
- `"height"` - Image height

### Output Ports
- `"output_image"` - Generated image

### Example Workflow Structure
```
[DiscomfortPort:prompt] → [CLIPTextEncode+] ↘
                                            [KSampler] → [VAEDecode] → [DiscomfortPort:output_image]
[DiscomfortPort:negative_prompt] → [CLIPTextEncode-] ↗     ↑
[DiscomfortPort:seed] → [KSampler] ← [DiscomfortPort:cfg_scale]
[DiscomfortPort:steps] → [KSampler]
[DiscomfortPort:width] → [EmptyLatentImage] → [KSampler]
[DiscomfortPort:height] → [EmptyLatentImage]
```

## Step 2: Basic Parameter Sweep Script

```python
import asyncio
import itertools
import time
import json
from pathlib import Path
from custom_nodes.discomfort.discomfort import Discomfort

async def parameter_sweep():
    """Run a comprehensive parameter sweep."""
    
    # Initialize Discomfort
    discomfort = await Discomfort.create()
    
    try:
        # Define parameter ranges to test
        seeds = [1000, 2000, 3000, 4000, 5000]
        cfg_scales = [6.0, 7.0, 8.0, 9.0, 10.0]
        step_counts = [20, 30, 40, 50]
        
        # Base parameters
        base_params = {
            "prompt": "A beautiful portrait of a woman with flowing hair, masterpiece, best quality, detailed",
            "negative_prompt": "blurry, low quality, worst quality, jpeg artifacts",
            "width": 512,
            "height": 512,
        }
        
        # Generate all combinations
        param_combinations = list(itertools.product(seeds, cfg_scales, step_counts))
        total_combinations = len(param_combinations)
        
        print(f"🎯 Starting parameter sweep with {total_combinations} combinations")
        print(f"📊 Seeds: {seeds}")
        print(f"📊 CFG Scales: {cfg_scales}")
        print(f"📊 Steps: {step_counts}")
        print()
        
        # Create output directory
        output_dir = Path("parameter_sweep_results")
        output_dir.mkdir(exist_ok=True)
        
        # Track results
        results = []
        start_time = time.time()
        
        with discomfort.Context() as context:
            for i, (seed, cfg_scale, steps) in enumerate(param_combinations):
                combination_start = time.time()
                
                print(f"🔄 [{i+1}/{total_combinations}] Testing: seed={seed}, cfg={cfg_scale}, steps={steps}")
                
                # Prepare parameters for this combination
                params = base_params.copy()
                params.update({
                    "seed": seed,
                    "cfg_scale": cfg_scale,
                    "steps": steps
                })
                
                try:
                    # Run the workflow
                    workflow_results = await discomfort.run(
                        workflows=["parameter_sweep_workflow.json"],
                        inputs=params,
                        context=context
                    )
                    
                    # Save the generated image
                    if "output_image" in workflow_results:
                        output_image = workflow_results["output_image"]
                        filename = f"seed{seed}_cfg{cfg_scale}_steps{steps}.png"
                        filepath = output_dir / filename
                        
                        discomfort.Tools.save_comfy_image_to_disk(output_image, str(filepath))
                        
                        # Record successful result
                        combination_time = time.time() - combination_start
                        result = {
                            "seed": seed,
                            "cfg_scale": cfg_scale,
                            "steps": steps,
                            "filename": filename,
                            "generation_time": round(combination_time, 2),
                            "status": "success"
                        }
                        results.append(result)
                        
                        print(f"✅ Saved: {filename} (took {combination_time:.1f}s)")
                    else:
                        print(f"❌ No output image generated")
                        results.append({
                            "seed": seed, "cfg_scale": cfg_scale, "steps": steps,
                            "status": "failed", "error": "No output image"
                        })
                
                except Exception as e:
                    print(f"❌ Error: {e}")
                    results.append({
                        "seed": seed, "cfg_scale": cfg_scale, "steps": steps,
                        "status": "failed", "error": str(e)
                    })
                
                # Show progress and memory usage
                usage = context.get_usage()
                print(f"📈 Progress: {i+1}/{total_combinations} ({(i+1)/total_combinations*100:.1f}%)")
                print(f"💾 Memory: {usage['ram_usage_gb']:.1f}GB RAM, {usage['stored_keys_count']} items")
                print()
        
        # Generate summary report
        await generate_report(results, output_dir, time.time() - start_time)
        
    finally:
        await discomfort.shutdown()

async def generate_report(results, output_dir, total_time):
    """Generate a comprehensive report of the parameter sweep."""
    
    # Calculate statistics
    successful_results = [r for r in results if r["status"] == "success"]
    failed_results = [r for r in results if r["status"] == "failed"]
    
    total_runs = len(results)
    success_rate = len(successful_results) / total_runs * 100 if total_runs > 0 else 0
    
    # Performance statistics
    if successful_results:
        generation_times = [r["generation_time"] for r in successful_results]
        avg_time = sum(generation_times) / len(generation_times)
        min_time = min(generation_times)
        max_time = max(generation_times)
    else:
        avg_time = min_time = max_time = 0
    
    # Create detailed report
    report = {
        "summary": {
            "total_combinations": total_runs,
            "successful_generations": len(successful_results),
            "failed_generations": len(failed_results),
            "success_rate_percent": round(success_rate, 1),
            "total_time_seconds": round(total_time, 2),
            "average_generation_time": round(avg_time, 2),
            "fastest_generation": round(min_time, 2),
            "slowest_generation": round(max_time, 2)
        },
        "parameter_analysis": analyze_parameters(successful_results),
        "detailed_results": results
    }
    
    # Save report as JSON
    report_path = output_dir / "parameter_sweep_report.json"
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    
    # Create human-readable summary
    summary_path = output_dir / "SUMMARY.txt"
    with open(summary_path, 'w') as f:
        f.write("🎯 PARAMETER SWEEP SUMMARY\n")
        f.write("=" * 50 + "\n\n")
        f.write(f"📊 Total Combinations Tested: {total_runs}\n")
        f.write(f"✅ Successful Generations: {len(successful_results)}\n")
        f.write(f"❌ Failed Generations: {len(failed_results)}\n")
        f.write(f"📈 Success Rate: {success_rate:.1f}%\n\n")
        f.write(f"⏱️  Performance:\n")
        f.write(f"   Total Time: {total_time/60:.1f} minutes\n")
        f.write(f"   Average per Image: {avg_time:.1f} seconds\n")
        f.write(f"   Fastest Generation: {min_time:.1f} seconds\n")
        f.write(f"   Slowest Generation: {max_time:.1f} seconds\n\n")
        
        if failed_results:
            f.write("❌ Failed Combinations:\n")
            for result in failed_results:
                f.write(f"   Seed {result['seed']}, CFG {result['cfg_scale']}, Steps {result['steps']}: {result.get('error', 'Unknown error')}\n")
    
    print(f"📋 Report saved to: {report_path}")
    print(f"📋 Summary saved to: {summary_path}")
    print(f"\n🎉 Parameter sweep completed!")
    print(f"✅ {len(successful_results)}/{total_runs} combinations successful ({success_rate:.1f}%)")
    print(f"⏱️  Total time: {total_time/60:.1f} minutes")

def analyze_parameters(successful_results):
    """Analyze which parameter values work best."""
    if not successful_results:
        return {}
    
    # Group by parameter values
    by_cfg = {}
    by_steps = {}
    by_seed = {}
    
    for result in successful_results:
        cfg = result["cfg_scale"]
        steps = result["steps"]
        seed = result["seed"]
        time = result["generation_time"]
        
        # Track CFG performance
        if cfg not in by_cfg:
            by_cfg[cfg] = []
        by_cfg[cfg].append(time)
        
        # Track steps performance
        if steps not in by_steps:
            by_steps[steps] = []
        by_steps[steps].append(time)
        
        # Track seed performance
        if seed not in by_seed:
            by_seed[seed] = []
        by_seed[seed].append(time)
    
    # Calculate averages
    analysis = {
        "cfg_scale_performance": {
            str(cfg): {
                "average_time": round(sum(times) / len(times), 2),
                "sample_count": len(times)
            }
            for cfg, times in by_cfg.items()
        },
        "steps_performance": {
            str(steps): {
                "average_time": round(sum(times) / len(times), 2),
                "sample_count": len(times)
            }
            for steps, times in by_steps.items()
        },
        "seed_performance": {
            str(seed): {
                "average_time": round(sum(times) / len(times), 2),
                "sample_count": len(times)
            }
            for seed, times in by_seed.items()
        }
    }
    
    return analysis

if __name__ == "__main__":
    asyncio.run(parameter_sweep())
```

## Step 3: Advanced Parameter Sweep with Grid Search

For more sophisticated parameter exploration:

```python
import asyncio
import numpy as np
from sklearn.model_selection import ParameterGrid
from custom_nodes.discomfort.discomfort import Discomfort

async def advanced_parameter_sweep():
    """Advanced parameter sweep using sklearn's ParameterGrid."""
    
    discomfort = await Discomfort.create()
    
    try:
        # Define parameter grid
        param_grid = {
            'seed': [1000, 2000, 3000],
            'cfg_scale': np.arange(6.0, 11.0, 1.0).tolist(),  # [6.0, 7.0, 8.0, 9.0, 10.0]
            'steps': [20, 30, 40, 50],
            'denoise': [0.7, 0.8, 0.9, 1.0]  # For img2img workflows
        }
        
        # Generate parameter combinations
        combinations = list(ParameterGrid(param_grid))
        print(f"🔬 Testing {len(combinations)} parameter combinations")
        
        # Base parameters
        base_params = {
            "prompt": "A serene landscape with mountains, detailed, photorealistic",
            "negative_prompt": "blurry, low quality",
            "width": 512,
            "height": 512,
        }
        
        # Track best results
        best_results = {
            "fastest": {"time": float('inf'), "params": None},
            "cfg_analysis": {},
            "steps_analysis": {}
        }
        
        output_dir = Path("advanced_sweep_results")
        output_dir.mkdir(exist_ok=True)
        
        with discomfort.Context() as context:
            for i, params in enumerate(combinations):
                print(f"🧪 [{i+1}/{len(combinations)}] Testing: {params}")
                
                # Merge with base parameters
                full_params = {**base_params, **params}
                
                start_time = time.time()
                
                try:
                    results = await discomfort.run(
                        workflows=["parameter_sweep_workflow.json"],
                        inputs=full_params,
                        context=context
                    )
                    
                    generation_time = time.time() - start_time
                    
                    if "output_image" in results:
                        # Save image with detailed filename
                        filename = (f"s{params['seed']}_cfg{params['cfg_scale']}"
                                  f"_st{params['steps']}_d{params['denoise']}.png")
                        filepath = output_dir / filename
                        
                        discomfort.Tools.save_comfy_image_to_disk(
                            results["output_image"], str(filepath)
                        )
                        
                        # Track fastest generation
                        if generation_time < best_results["fastest"]["time"]:
                            best_results["fastest"]["time"] = generation_time
                            best_results["fastest"]["params"] = params.copy()
                        
                        # Analyze CFG scale effectiveness
                        cfg = params['cfg_scale']
                        if cfg not in best_results["cfg_analysis"]:
                            best_results["cfg_analysis"][cfg] = []
                        best_results["cfg_analysis"][cfg].append(generation_time)
                        
                        print(f"✅ Generated in {generation_time:.1f}s: {filename}")
                    
                except Exception as e:
                    print(f"❌ Failed: {e}")
        
        # Report best findings
        print("\n🏆 BEST RESULTS:")
        if best_results["fastest"]["params"]:
            fastest_params = best_results["fastest"]["params"]
            fastest_time = best_results["fastest"]["time"]
            print(f"⚡ Fastest generation: {fastest_time:.1f}s")
            print(f"   Parameters: {fastest_params}")
        
        # CFG analysis
        print("\n📊 CFG Scale Analysis:")
        for cfg, times in best_results["cfg_analysis"].items():
            avg_time = sum(times) / len(times)
            print(f"   CFG {cfg}: {avg_time:.1f}s average ({len(times)} samples)")
    
    finally:
        await discomfort.shutdown()

if __name__ == "__main__":
    asyncio.run(advanced_parameter_sweep())
```

## Step 4: Running and Analyzing Results

### Execute the Parameter Sweep

```bash
# Run basic parameter sweep
python parameter_sweep.py

# Or run advanced version
python advanced_parameter_sweep.py
```

### Expected Output Structure

```
parameter_sweep_results/
├── seed1000_cfg6.0_steps20.png
├── seed1000_cfg6.0_steps30.png
├── seed1000_cfg7.0_steps20.png
├── ...
├── parameter_sweep_report.json
└── SUMMARY.txt
```

### Sample Report (parameter_sweep_report.json)

```json
{
  "summary": {
    "total_combinations": 100,
    "successful_generations": 98,
    "failed_generations": 2,
    "success_rate_percent": 98.0,
    "total_time_seconds": 1247.5,
    "average_generation_time": 12.7,
    "fastest_generation": 8.2,
    "slowest_generation": 18.4
  },
  "parameter_analysis": {
    "cfg_scale_performance": {
      "6.0": {"average_time": 11.2, "sample_count": 20},
      "7.0": {"average_time": 12.1, "sample_count": 20},
      "8.0": {"average_time": 12.8, "sample_count": 20},
      "9.0": {"average_time": 13.5, "sample_count": 20},
      "10.0": {"average_time": 14.1, "sample_count": 18}
    }
  }
}
```

## Step 5: Optimization Tips

### Memory Management

```python
# Monitor memory usage during sweep
usage = context.get_usage()
if usage['ram_usage_gb'] > 15:  # If using > 15GB RAM
    print("⚠️  High memory usage detected, clearing context...")
    # Save important results first
    important_data = context.load("important_key")
    
    # Create new context
    context.shutdown()
    context = discomfort.Context()
    context.save("important_key", important_data)
```

### Parallel Processing

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

async def parallel_parameter_sweep():
    """Run parameter combinations in parallel."""
    
    discomfort = await Discomfort.create()
    
    async def run_single_combination(params):
        """Run a single parameter combination."""
        try:
            results = await discomfort.run(
                workflows=["workflow.json"],
                inputs=params
            )
            return {"status": "success", "params": params, "results": results}
        except Exception as e:
            return {"status": "error", "params": params, "error": str(e)}
    
    # Create parameter combinations
    combinations = [
        {"seed": seed, "cfg_scale": cfg}
        for seed in [1000, 2000, 3000]
        for cfg in [7.0, 8.0, 9.0]
    ]
    
    # Run in parallel (limit concurrency to avoid overwhelming the system)
    semaphore = asyncio.Semaphore(3)  # Max 3 concurrent runs
    
    async def run_with_semaphore(params):
        async with semaphore:
            return await run_single_combination(params)
    
    # Execute all combinations
    tasks = [run_with_semaphore(params) for params in combinations]
    results = await asyncio.gather(*tasks)
    
    await discomfort.shutdown()
    return results
```

### Resume Functionality

```python
def load_existing_results(output_dir):
    """Load previously generated results to resume interrupted sweeps."""
    existing = set()
    if output_dir.exists():
        for file in output_dir.glob("*.png"):
            # Extract parameters from filename
            parts = file.stem.split("_")
            if len(parts) >= 3:
                try:
                    seed = int(parts[0].replace("seed", ""))
                    cfg = float(parts[1].replace("cfg", ""))
                    steps = int(parts[2].replace("steps", ""))
                    existing.add((seed, cfg, steps))
                except ValueError:
                    continue
    return existing

async def resumable_parameter_sweep():
    """Parameter sweep that can resume from where it left off."""
    
    output_dir = Path("parameter_sweep_results")
    existing_results = load_existing_results(output_dir)
    
    # Generate all combinations
    all_combinations = [
        (seed, cfg, steps)
        for seed in [1000, 2000, 3000]
        for cfg in [7.0, 8.0, 9.0]
        for steps in [20, 30, 40]
    ]
    
    # Filter out already completed combinations
    remaining = [combo for combo in all_combinations if combo not in existing_results]
    
    print(f"📋 Found {len(existing_results)} existing results")
    print(f"🔄 {len(remaining)} combinations remaining")
    
    if remaining:
        discomfort = await Discomfort.create()
        # Continue with remaining combinations...
        await discomfort.shutdown()
    else:
        print("✅ All combinations already completed!")
```

## Use Cases and Applications

### 1. Model Comparison
```python
models = ["model_v1.safetensors", "model_v2.safetensors", "model_v3.safetensors"]
for model in models:
    # Run parameter sweep for each model
    # Compare results across models
```

### 2. Style Testing
```python
styles = [
    "photorealistic, detailed",
    "anime style, vibrant colors",
    "oil painting, classical art",
    "cyberpunk, neon lights"
]
# Test each style with different parameters
```

### 3. Resolution Scaling
```python
resolutions = [(512, 512), (768, 768), (1024, 1024)]
# Test how parameters affect different resolutions
```

## Next Steps

After running your parameter sweep:

1. **[Explore API Reference](../api/workflow-tools)** - Learn more workflow manipulation techniques
2. **[Create Your First Workflow](../examples/create-first-workflow)** - Master the basics before advanced techniques
3. **[Understanding Context](../core-concepts/ports-and-context)** - Deep dive into state management

The parameter sweep approach helps you make data-driven decisions about your ComfyUI workflows and find the best settings for your specific use cases! 📊✨ 