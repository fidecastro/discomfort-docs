---
sidebar_position: 1
---

# Welcome to Discomfort

**Discomfort** is a powerful ComfyUI extension that revolutionizes how you work with AI workflows by enabling **programmatic execution with loops, conditionals, and persistent state management**.

## The Problem

ComfyUI's native execution model follows a Directed Acyclic Graph (DAG) pattern, executing nodes once in topological order. While powerful for single-pass workflows, this model doesn't natively support:

- 🔄 **Iterative refinement workflows**
- ⚡ **Conditional execution paths**  
- 💾 **State preservation across iterations**
- 🧩 **Dynamic workflow composition**
- 🐍 **Programmatic access and management**

You spend 95% of your time building "Comfy spaghetti" instead of just creating. **What if you could just write a script that tells ComfyUI exactly what to do?**

## The Solution

Discomfort addresses these limitations by introducing an execution layer on top of ComfyUI's DAG model, using:

- **Pre-execution graph manipulation** for dynamic workflow modification
- **Self-managed ComfyUI server** for isolated runs  
- **Simple data store** that handles context throughout execution
- **Intelligent pass-by-value/reference** system for different data types

## ✨ Key Features

### 🐍 **Loops & Conditionals**
```python
for i in range(10):
    if i % 2 == 0:
        await discomfort.run(["empty_latent.json"])
    else:
        await discomfort.run(["img2img.json"])
```

### 💾 **Persistent State Management**
```python
with discomfort.Context() as context:
    context.save("model", my_model)  # Saved across runs
    await discomfort.run(["workflow.json"], context=context)
    result = context.load("output_image")
```

### 🧩 **Workflow Stitching**
```python
workflows = ["load_model.json", "process.json", "save.json"]
stitched = discomfort.Tools.stitch_workflows(workflows)
await discomfort.run([stitched["stitched_workflow"]])
```

### 🔌 **Simple Integration**
Just add `DiscomfortPort` nodes to your existing ComfyUI workflows - no complex modifications needed!

## 🚀 Quick Start

### 1. Install Discomfort

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/fidecastro/comfyui-discomfort.git discomfort
cd discomfort
pip install -r requirements.txt
```

### 2. Add DiscomfortPorts to Your Workflow

Open any ComfyUI workflow and add `DiscomfortPort` nodes:
- **INPUT ports**: Connect output → workflow (inject data from Python)
- **OUTPUT ports**: Connect workflow → input (extract data to Python)  
- Give each port a unique `unique_id`

### 3. Write Your Script

```python
import asyncio
from custom_nodes.discomfort.discomfort import Discomfort

async def main():
    discomfort = await Discomfort.create()
    
    with discomfort.Context() as context:
        # Set initial parameters
        context.save("prompt", "A beautiful landscape")
        context.save("seed", 12345)
        
        # Run workflow
        await discomfort.run(["my_workflow.json"], context=context)
        
        # Get results
        result_image = context.load("output_image")
        discomfort.Tools.save_comfy_image_to_disk(result_image, "result.png")
    
    await discomfort.shutdown()

asyncio.run(main())
```

## 📚 What's Next?

- **[Installation Guide](./installation)** - Detailed setup instructions
- **[Basic Tutorial](./tutorial-basics/create-first-workflow)** - Create your first Discomfort workflow
- **[Core Concepts](./core-concepts/ports-and-context)** - Understand DiscomfortPorts and Context
- **[API Reference](./api/discomfort-class)** - Complete method documentation
- **[Examples](./examples/parameter-sweep)** - Real-world usage patterns

## 🎯 Perfect For

- **🔄 Iterative refinement:** Progressively improve outputs through multiple passes
- **🎛️ Parameter sweeps:** Test multiple configurations automatically  
- **📊 Batch processing:** Process large datasets with custom logic
- **🧪 A/B testing:** Compare different approaches systematically
- **🏗️ Complex pipelines:** Build sophisticated multi-stage workflows

## ⚡ Current Status

Discomfort is in **alpha** but **fully operational**. Core functionality including:
- ✅ **Discomfort Class** - Complete programmatic API
- ✅ **Context Management** - State persistence and data handling  
- ✅ **Workflow Stitching** - Merge multiple workflows seamlessly
- ✅ **ComfyUI Integration** - Stable server management

Ready to transform your ComfyUI workflows? [Let's get started!](./installation)
