# Discomfort Documentation

This repository contains the complete documentation for **Discomfort**, a powerful ComfyUI extension that enables programmatic workflow execution with loops, conditionals, and state management.

## 🚀 What is Discomfort?

Discomfort is a ComfyUI extension that allows you to:
- **Execute workflows programmatically** with Python
- **Add loops and conditionals** to your ComfyUI workflows
- **Manage state** between workflow executions
- **Stitch multiple workflows** together dynamically
- **Handle complex data types** automatically (pass-by-value vs pass-by-reference)

## 📚 Documentation Structure

This documentation is built with [Docusaurus](https://docusaurus.io/) and covers:

### Getting Started
- **[Introduction](docs/intro.md)** - What Discomfort is and why you need it
- **[Installation Guide](docs/installation.md)** - Complete setup instructions
- **[Core Concepts](docs/core-concepts/)** - Understand DiscomfortPorts and Context

### Tutorials
- **[Basic Tutorial](docs/tutorial-basics/create-first-workflow.md)** - Create your first Discomfort workflow
- **[Core Concepts](docs/core-concepts/ports-and-context.md)** - Understanding DiscomfortPorts and Context

### Examples
- **[Parameter Sweep](docs/examples/parameter-sweep.md)** - Systematic parameter testing

### API Reference
- **[Discomfort Class](docs/api/discomfort-class.md)** - Main API reference
- **[WorkflowTools](docs/api/workflow-tools.md)** - Utility functions
- **[WorkflowContext](docs/api/workflow-context.md)** - Data management
- **[ComfyConnector](docs/api/comfy-connector.md)** - Server management
- **[Nodes](docs/api/nodes.md)** - DiscomfortPort and internal nodes

## 🔧 Development

### Prerequisites
- Node.js 16.14 or higher
- npm or yarn

### Installation
```bash
npm install
```

### Local Development
```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build
```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## 📖 Key Documentation Features

### Comprehensive Coverage
Every aspect of Discomfort is documented:
- ✅ **All classes and methods** with complete API reference
- ✅ **Step-by-step tutorials** from beginner to advanced
- ✅ **Real-world examples** with working code
- ✅ **Configuration options** explained in detail
- ✅ **Troubleshooting guides** for common issues

### Code Examples
All documentation includes:
- **Working Python scripts** you can run immediately
- **ComfyUI workflow examples** with DiscomfortPorts
- **Error handling patterns** and best practices
- **Performance optimization** techniques

### Interactive Elements
- **Syntax-highlighted** code blocks
- **Cross-referenced** API documentation
- **Progressive tutorials** building on previous concepts
- **Practical examples** solving real problems

## 🎯 Core Documentation Highlights

### 1. [Complete API Reference](docs/api/discomfort-class.md)
Comprehensive documentation of the main `Discomfort` class including:
- `Discomfort.create()` - Async factory method
- `discomfort.run()` - Main workflow execution
- `discomfort.Context()` - State management
- `discomfort.Tools` - Utility functions
- Error handling and best practices

### 2. [Getting Started Tutorial](docs/tutorial-basics/create-first-workflow.md)
Step-by-step guide that teaches you to:
- Add DiscomfortPorts to ComfyUI workflows
- Write Python scripts to control workflows
- Handle inputs and outputs programmatically
- Implement iterative execution with loops

### 3. [Parameter Sweep Example](docs/examples/parameter-sweep.md)
Advanced example showing:
- Systematic testing of different parameter combinations
- Performance monitoring and reporting
- Memory management for large sweeps
- Resume functionality for interrupted runs

### 4. [Core Concepts](docs/core-concepts/ports-and-context.md)
In-depth explanation of:
- **DiscomfortPorts**: INPUT, OUTPUT, and PASSTHRU modes
- **Context management**: Automatic storage and cleanup
- **Pass-by-value vs pass-by-reference**: Smart data handling
- **Memory management**: RAM and disk storage strategies

## 🔗 Links and Resources

- **[Discomfort GitHub Repository](https://github.com/fidecastro/comfyui-discomfort)** - Source code and issues
- **[ComfyUI](https://github.com/comfyanonymous/ComfyUI)** - The underlying workflow engine
- **[Docusaurus](https://docusaurus.io/)** - Documentation framework used

## 🤝 Contributing

This documentation is open source! To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Areas where contributions are welcome:
- Additional examples and tutorials
- Improvements to existing documentation
- Translations to other languages
- Bug fixes and clarifications

## 📄 License

This documentation is licensed under MIT License. The Discomfort project itself is also MIT licensed.

## 🆘 Getting Help

If you need help with Discomfort:

1. **Check the documentation** - Start with the [Installation Guide](docs/installation.md)
2. **Browse examples** - Look at [Parameter Sweep](docs/examples/parameter-sweep.md) and other examples
3. **Search issues** - Check the [GitHub Issues](https://github.com/fidecastro/comfyui-discomfort/issues)
4. **Ask questions** - Create a new issue with the "question" label

---

**Ready to transform your ComfyUI workflows?** Start with the [Introduction](docs/intro.md) and begin your journey to programmatic workflow mastery! 🚀
