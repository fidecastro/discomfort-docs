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
        'tutorial-basics/running-a-workflow',
        'tutorial-basics/using-partial-workflows',
        'tutorial-basics/a-simple-loop-on-comfy',
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
        'examples/create-first-workflow', // <-- This was moved
        'examples/parameter-sweep',
      ],
    },
  ],
};

module.exports = sidebars;
