import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'ComfyUI + Python = 🔥',
    description: (
      <>
        Execute workflows with loops, conditionals, and logic that can't be done with nodes.
      </>
    ),
  },
  {
    title: 'Stateful ComfyUI',
    description: (
      <>
        Preserve data between workflow runs with minimal effort and time/compute overhead.
      </>
    ),
  },
  {
    title: 'No more spaghetti!',
    description: (
      <>
        Run partial workflows and build complex pipelines from simple building blocks.
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