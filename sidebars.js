/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a "Next" and "Previous" button
 - display the sidebar
 - provide a way to navigate the docs
 */

// @ts-check

// @ts-nocheck
/** Main documentation sidebar */
const sidebars = {
  // Main documentation sidebar
  mainSidebar: [
    'intro',
    'installation',
    
    {
      type: 'category',
      label: 'Core Concepts',
      items: [
        'core-concepts/ports-and-context',
        'core-concepts/pass-by-reference',
        'core-concepts/workflow-stitching',
        'core-concepts/architecture',
      ],
    },
    
    {
      type: 'category',
      label: 'Tutorial - Basics',
      items: [
        'tutorial-basics/create-first-workflow',
        'tutorial-basics/using-context',
        'tutorial-basics/workflow-stitching',
        'tutorial-basics/error-handling',
      ],
    },
    
    {
      type: 'category',
      label: 'Tutorial - Advanced',
      items: [
        'tutorial-advanced/iterative-workflows',
        'tutorial-advanced/memory-management',
        'tutorial-advanced/custom-nodes',
        'tutorial-advanced/performance-optimization',
      ],
    },
    
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/discomfort-class',
        'api/workflow-tools',
        'api/workflow-context',
        'api/comfy-connector',
        'api/nodes',
      ],
    },
    
    {
      type: 'category',
      label: 'Examples',
      items: [
        'examples/parameter-sweep',
        'examples/batch-processing',
        'examples/model-comparison',
        'examples/iterative-refinement',
      ],
    },
    
    {
      type: 'category',
      label: 'Configuration',
      items: [
        'configuration/server-settings',
        'configuration/context-settings',
        'configuration/pass-by-rules',
        'configuration/docker-setup',
      ],
    },
    
    {
      type: 'category',
      label: 'Troubleshooting',
      items: [
        'troubleshooting/common-issues',
        'troubleshooting/performance-problems',
        'troubleshooting/memory-issues',
        'troubleshooting/debug-workflows',
      ],
    },
  ],
};

module.exports = sidebars;
