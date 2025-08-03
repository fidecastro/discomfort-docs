---
sidebar_position: 2
---

# ComfyConnector: The Engine Behind Discomfort

At the heart of Discomfort's execution logic is the **ComfyConnector**, a singleton class that acts as a powerful Python wrapper for the ComfyUI API. It's the engine that allows you to programmatically start, stop, and interact with ComfyUI servers. 

## What It Does

ComfyConnector is designed to be a standalone utility, meaning you can use it even without the rest of the Discomfort library. It provides five key methods to manage the ComfyUI lifecycle:

-   `create()`: This is the entry point. It instantiates the singleton and boots up a dedicated ComfyUI server instance, ready to receive instructions.
-   `run_workflow()`: The core execution method. It queues a `workflow.json` for execution on the managed ComfyUI server. It can handle both standard `WORKFLOW` JSON files and the lower-level `PROMPT` JSON format. Once the workflow is complete, it returns a history object containing all the outputs from the run.
-   `kill_api()`: Once your programmatic workflow is complete, this method cleanly shuts down the managed ComfyUI server and all associated processes, freeing up system resources.
-   `get_prompt_from_workflow()`: A handy utility that takes a standard `workflow.json` and uses browser automation to convert it into the `PROMPT` JSON format that the ComfyUI API requires for execution.
-   `upload_data()`: Before you can run a workflow, you often need to provide it with data like images, models, or LoRAs. This method allows you to upload these files directly to the appropriate ComfyUI folders. To prevent your system from filling up with temporary files, you can flag uploads as **ephemeral**, and they will be automatically deleted when the server is shut down.

## Why It's a Core Concept

Originally created to act as a wrapper for serverless ComfyUI deployments, the ComfyConnector class is what makes Discomfort's programmatic control possible. By managing the server lifecycle and providing a clean API for queuing workflows, it allows you to:

-   **Isolate runs**: A Discomfort run will always start its own managed ComfyUI server, preventing conflicts with any ComfyUI instance being run by the user.
-   **Automate execution**: Scripts can start a server, run a series of workflows, and then shut everything down without any manual intervention.
-   **Simplify development**: ComfyConnector accepts both workflow and prompt JSON files, meaning that you can just queue the workflows you export instead of having to manually transform them to a workflow_api.json -- greatly simplifying debugging of complex workflows. 

While you will typically interact with the `Discomfort` class, understanding the `ComfyConnector` is key to grasping how Discomfort is able to control ComfyUI under the hood.
