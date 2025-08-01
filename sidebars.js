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
      ],
    },
    
    {
      type: 'category',
      label: 'Tutorial - Basics',
      items: [
        'tutorial-basics/create-first-workflow',
        'tutorial-basics/create-a-document',
        'tutorial-basics/create-a-page',
        'tutorial-basics/create-a-blog-post',
        'tutorial-basics/markdown-features',
        'tutorial-basics/deploy-your-site',
        'tutorial-basics/congratulations',
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
      ],
    },
    
    {
      type: 'category',
      label: 'Tutorial - Extras',
      items: [
        'tutorial-extras/manage-docs-versions',
        'tutorial-extras/translate-your-site',
      ],
    },
  ],
};

module.exports = sidebars;
