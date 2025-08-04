import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Programmatic Control',
    description: (
      <>
        Take full control of ComfyUI workflows with Python. Execute workflows 
        programmatically with loops, conditionals, and complex logic that goes 
        beyond traditional node-based execution.
      </>
    ),
  },
  {
    title: 'State Management',
    description: (
      <>
        Preserve data between workflow executions with automatic state management.
        Pass-by-value for images and primitives, pass-by-reference for models and 
        heavy objects - all handled automatically.
      </>
    ),
  },
  {
    title: 'Workflow Composition',
    description: (
      <>
        Break free from monolithic workflows. Stitch together partial workflows,
        create reusable components, and build complex pipelines from simple building blocks.
        No more spaghetti workflows!
      </>
    ),
  },
];

function Feature({title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
        
        <div className={styles.useCasesSection}>
          <h2 className="text--center margin-top--xl margin-bottom--lg">Perfect For</h2>
          <div className="row">
            <div className="col col--3">
              <div className="card">
                <div className="card__body text--center">
                  <h4>🔄 Iterative Refinement</h4>
                  <p>Progressively improve outputs through multiple passes</p>
                </div>
              </div>
            </div>
            <div className="col col--3">
              <div className="card">
                <div className="card__body text--center">
                  <h4>🎛️ Parameter Sweeps</h4>
                  <p>Test multiple configurations automatically</p>
                </div>
              </div>
            </div>
            <div className="col col--3">
              <div className="card">
                <div className="card__body text--center">
                  <h4>📊 Batch Processing</h4>
                  <p>Process large datasets with custom logic</p>
                </div>
              </div>
            </div>
            <div className="col col--3">
              <div className="card">
                <div className="card__body text--center">
                  <h4>🧪 A/B Testing</h4>
                  <p>Compare different approaches systematically</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}