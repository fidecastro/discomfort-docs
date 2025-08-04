import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import CodeBlock from '@theme/CodeBlock';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <img
          src="img/discomfort-logo.png"
          alt="Discomfort Logo"
          className={styles.heroLogo}
          width="200"
          height="200"
        />
        <h1 className="hero__title">Control ComfyUI with Python</h1>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/tutorial-basics/running-a-workflow">
            Get Started - 5min ⏱️
          </Link>
          <Link
            className="button button--primary button--lg margin-left--md"
            to="/docs/api/discomfort-class">
            API Reference
          </Link>
          <Link
            className="button button--success button--lg margin-left--md"
            to="https://www.paypal.com/donate/?hosted_button_id=3A23MDRAT9EKY">
            ❤️ Support the Project
          </Link>
        </div>
        <div className="text--center margin-top--md">
          <h2 className={styles.subtitle}>10x faster development of ComfyUI pipelines. MIT License.</h2>
        </div>
      </div>
    </header>
  );
}

function FeatureHighlight({title, description, code}) {
  return (
    <div className="col col--6 margin-bottom--lg">
      <div className="card">
        <div className="card__header">
          <h3>{title}</h3>
        </div>
        <div className="card__body">
          <p>{description}</p>
          <CodeBlock language="python">{code}</CodeBlock>
        </div>
      </div>
    </div>
  );
}

function CodeExamples() {
  return (
    <section className="margin-top--lg margin-bottom--lg">
      <div className="container">
        <h2 className="text--center margin-bottom--lg">See Discomfort in Action</h2>
        <div className="row">
          <FeatureHighlight
            title="Iterative Workflows with State"
            description="Run workflows with loops and persistent state management"
            code={`async def main():
    discomfort = await Discomfort.create()
    
    with discomfort.Context() as context:
        for i in range(10):
            context.save("seed", 1000 + i)
            context.save("cfg", 4.0 + i * 0.5)
            await discomfort.run(["workflow.json"], 
                               context=context)`}
          />
          <FeatureHighlight
            title="Workflow Stitching"
            description="Combine multiple partial workflows programmatically"
            code={`workflows = [
    "load_model.json",
    "img2img_latent.json", 
    "ksampler.json"
]

stitched = discomfort.Tools.stitch_workflows(workflows)
await discomfort.run([stitched["stitched_workflow"]])`}
          />
          <FeatureHighlight
            title="Conditional Execution"
            description="Branch workflow execution based on runtime conditions"
            code={`for i in range(10):
    if i % 2 == 0:
        # Use empty latent
        await discomfort.run(["empty_latent.json"])
    else:
        # Use img2img
        context.save("input_image", image)
        await discomfort.run(["img2img.json"])`}
          />
          <FeatureHighlight
            title="Data Type Handling"
            description="Automatic pass-by-value and pass-by-reference for different data types"
            code={`# Images pass by value (direct storage)
context.save("my_image", image_tensor)

# Models pass by reference (workflow graphs)
context.save("my_model", model_workflow)

# Load any type seamlessly
loaded_data = context.load("my_image")`}
          />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Programmatic ComfyUI Workflows`}
      description="Discomfort enables programmatic control of ComfyUI workflows with loops, conditionals, and state management">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <CodeExamples />
      </main>
    </Layout>
  );
}