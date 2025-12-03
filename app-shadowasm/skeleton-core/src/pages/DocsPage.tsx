// NOTE: When finalizing the Kiroween submission, mirror the explanations from this page
// into the Devpost description and a separate Kiro usage doc that describes:
// - Vibe coding conversations
// - Specs used
// - Hooks configured
// - Any steering and MCP usage

import React, { useEffect } from 'react';
import { useActiveUser, useAuditLog } from '../core/ZeroframeContext';
import { HACKATHON_CONFIG } from '../core/hackathonConfig';
import '../styles/DocsPage.css';

const DocsPage: React.FC = () => {
  const user = useActiveUser();
  const { logAuditEvent } = useAuditLog();

  useEffect(() => {
    logAuditEvent({
      userId: user.id,
      action: 'DOCS_VIEWED',
      resourceType: 'SYSTEM_APP',
      resourceId: 'docs',
      details: 'Opened Documentation',
    });
  }, [logAuditEvent, user.id]);

  return (
    <div className="docs-page">
      <div className="docs-header">
        <h1>📖 Zeroframe OS Documentation</h1>
        <div className="hackathon-banner">
          <span className="banner-label">{HACKATHON_CONFIG.name}</span>
          <span className="banner-category">{HACKATHON_CONFIG.primaryCategory}</span>
          <span className="banner-theme">{HACKATHON_CONFIG.secondaryTheme}</span>
        </div>
      </div>

      <section className="docs-section">
        <h2>What is Zeroframe OS?</h2>
        <p>
          Zeroframe OS is a <strong>browser-native, mainframe-inspired operating system</strong> that brings
          the reliability, security, and operational excellence of mainframe computing into a modern web environment.
        </p>
        <p>
          It serves as a <strong>platform for "system apps"</strong> like Ghost ABEND and ShadowASM, providing
          shared services for job management, dataset handling, security policies, and comprehensive audit logging.
        </p>
        
        <div className="resurrection-box">
          <h3>🧟 Resurrection Theme</h3>
          <p>
            Zeroframe OS <strong>revives classic mainframe concepts</strong> in a modern, web-native environment:
          </p>
          <ul>
            <li><strong>JES (Job Entry Subsystem)</strong> → Job & Batch Center</li>
            <li><strong>RACF (Resource Access Control Facility)</strong> → Security & Policies</li>
            <li><strong>SMF (System Management Facilities)</strong> → Telemetry & Audit Explorer</li>
            <li><strong>LPARs (Logical Partitions)</strong> → Workspaces (DEV/UAT/PROD)</li>
            <li><strong>ABEND Analysis</strong> → Ghost ABEND system app</li>
            <li><strong>Assembly Language</strong> → ShadowASM high-level assembly</li>
          </ul>
          <p className="resurrection-tagline">
            We're bringing back the best parts of mainframe computing—without the hardware costs or complexity.
          </p>
        </div>
      </section>

      <section className="docs-section skeleton-section">
        <h2>🦴 Skeleton Crew Template</h2>
        <p>
          Zeroframe OS is intentionally structured as a <strong>skeleton template</strong> that demonstrates
          how multiple independent applications can be built on top of a shared platform.
        </p>
        
        <div className="template-features">
          <div className="feature-card">
            <h4>Reusable SystemApp Interface</h4>
            <p>
              All apps implement the same <code>SystemAppDefinition</code> interface and register
              in a central registry (<code>src/core/systemApps.ts</code>).
            </p>
          </div>
          
          <div className="feature-card">
            <h4>Shared OS Services</h4>
            <p>
              Apps access common services: job management, dataset storage, user authentication,
              and audit logging—all provided by the OS core.
            </p>
          </div>
          
          <div className="feature-card">
            <h4>Consistent Navigation & State</h4>
            <p>
              The OS shell handles routing, workspace switching, user context, and UI theming,
              so apps can focus on their unique functionality.
            </p>
          </div>
        </div>

        <div className="how-to-build">
          <h3>How to Build a New System App</h3>
          <ol>
            <li>
              <strong>Create your screen component</strong> in <code>src/pages/</code>
              <pre className="code-snippet">
{`// src/pages/MyNewApp.tsx
import React from 'react';

const MyNewApp: React.FC = () => {
  return <div>My New System App</div>;
};

export default MyNewApp;`}
              </pre>
            </li>
            <li>
              <strong>Register it in the SystemApp registry</strong>
              <pre className="code-snippet">
{`// src/core/systemApps.ts
export const SYSTEM_APPS: SystemAppDefinition[] = [
  // ... existing apps
  {
    id: 'my-new-app',
    name: 'My New App',
    description: 'Does something awesome',
    route: '/apps/my-new-app',
    icon: '🚀',
    category: 'SYSTEM',
  },
];`}
              </pre>
            </li>
            <li>
              <strong>Add the route</strong> in <code>src/App.tsx</code>
              <pre className="code-snippet">
{`<Route path="apps/my-new-app" element={<MyNewApp />} />`}
              </pre>
            </li>
            <li>
              <strong>Use OS services</strong> via context and hooks
              <pre className="code-snippet">
{`import { useApp } from '../context/AppContext';
import { jobs } from '../data/mockData';

const { activeUser, activeWorkspace } = useApp();
// Access jobs, datasets, audit events, etc.`}
              </pre>
            </li>
          </ol>
        </div>
      </section>

      <section className="docs-section">
        <h2>🎯 Example System Apps</h2>
        <p>
          Zeroframe OS includes <strong>two distinct applications</strong> built on the same skeleton template,
          proving the "Skeleton Crew" concept:
        </p>

        <div className="example-apps">
          <div className="app-example">
            <div className="app-example-header">
              <span className="app-example-icon">👻</span>
              <h3>Ghost ABEND</h3>
            </div>
            <p className="app-example-desc">
              Consumes Zeroframe job engine state and audit logs to analyze failed jobs, derive severity, 
              capture RCA notes, and trigger safe retries.
            </p>
            <div className="app-example-details">
              <h4>Uses OS SDK:</h4>
              <ul>
                <li><strong>useOsAppApi('ghost-abend'):</strong> Clean interface to OS services</li>
                <li><strong>Job Engine:</strong> Queries jobs with <code>status === 'FAILED'</code></li>
                <li><strong>Audit Logs:</strong> Logs RCA saves and retry operations via <code>logAppAudit</code></li>
                <li><strong>Permissions:</strong> Checks MANAGE_JOBS before allowing retries</li>
              </ul>
              <h4>Unique Functionality:</h4>
              <ul>
                <li>Automated severity assessment (LOW, MEDIUM, HIGH, CRITICAL)</li>
                <li>Intelligent failure explanations based on error patterns</li>
                <li>Workspace, severity, and text search filters</li>
                <li>Root Cause Analysis (RCA) note capture and persistence</li>
                <li>"Simulate Fix & Retry" operation for failed jobs</li>
              </ul>
            </div>
          </div>

          <div className="app-example">
            <div className="app-example-header">
              <span className="app-example-icon">🔧</span>
              <h3>ShadowASM</h3>
            </div>
            <p className="app-example-desc">
              Provides a high-level assembly playground that runs locally in the browser, and can submit 
              simulation jobs into Zeroframe OS for tracking and governance.
            </p>
            <div className="app-example-details">
              <h4>Uses OS SDK:</h4>
              <ul>
                <li><strong>useOsAppApi('shadowasm'):</strong> Clean interface to OS services</li>
                <li><strong>Job Submission:</strong> Creates SIMULATION jobs via <code>submitJob</code></li>
                <li><strong>Audit Logs:</strong> Logs local runs and job submissions via <code>logAppAudit</code></li>
                <li><strong>Workspace Context:</strong> Submits jobs to active workspace (DEV/UAT/PROD)</li>
              </ul>
              <h4>Unique Functionality:</h4>
              <ul>
                <li>Simple assembly language with LOAD, ADD, SUB, PRINT, JNZ, HALT instructions</li>
                <li>Browser-based interpreter with register state and output display</li>
                <li>Sample programs (sum, countdown, fibonacci)</li>
                <li>Ability to submit programs as SIMULATION jobs to the OS job engine</li>
                <li>Execution safety (max steps limit to prevent infinite loops)</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="skeleton-proof">
          <p>
            <strong>These two apps prove the Skeleton Crew pattern:</strong> They share the same OS infrastructure
            (jobs, datasets, audit, security) but provide completely different user experiences and solve different problems.
          </p>
        </div>
      </section>

      <section className="docs-section kiro-section">
        <h2>🤖 Using Kiro to Build This Project</h2>
        <p>
          Zeroframe OS was built using Kiro's AI-powered development features. Here's how we leveraged
          different Kiro capabilities:
        </p>

        <div className="kiro-features">
          <div className="kiro-feature">
            <h3>Vibe Coding</h3>
            <p>
              TODO: Document how we used Kiro's vibe coding to scaffold the OS and apps.
            </p>
            <p className="placeholder-note">
              We'll describe the initial conversation where we outlined the mainframe-inspired OS concept,
              and how Kiro helped us structure the skeleton template pattern.
            </p>
          </div>

          <div className="kiro-feature">
            <h3>Spec-Driven Development</h3>
            <p>
              TODO: Document the specs we created for each major feature.
            </p>
            <p className="placeholder-note">
              We'll list the spec files used for: SystemApp registry, Job engine, Dataset management,
              Security policies, and Audit logging.
            </p>
          </div>

          <div className="kiro-feature">
            <h3>Agent Hooks</h3>
            <p>
              TODO: Document any agent hooks configured for automated tasks.
            </p>
            <p className="placeholder-note">
              We'll describe hooks for: running tests on save, updating audit logs, validating
              SystemApp registrations, etc.
            </p>
          </div>

          <div className="kiro-feature">
            <h3>Steering Docs</h3>
            <p>
              TODO: Document steering rules for code style and architecture.
            </p>
            <p className="placeholder-note">
              We'll explain the steering docs that enforce: TypeScript strict mode, component structure,
              naming conventions, and the SystemApp interface contract.
            </p>
          </div>

          <div className="kiro-feature">
            <h3>MCP Extensions</h3>
            <p>
              TODO: Document any MCP tools used for external integrations.
            </p>
            <p className="placeholder-note">
              We'll list MCP servers used for: documentation generation, API testing, deployment automation, etc.
            </p>
          </div>
        </div>
      </section>

      <section className="docs-section startup-section">
        <h2>🚀 Startup / SaaS Potential</h2>
        <p>
          While Zeroframe OS started as a hackathon project, it has clear potential as a <strong>commercial SaaS platform</strong>
          for regulated industries that need mainframe-like reliability without the cost and complexity.
        </p>

        <div className="startup-vision">
          <h3>Business Model</h3>
          <ul>
            <li><strong>Core Platform:</strong> Free tier with basic job scheduling and dataset management</li>
            <li><strong>System Apps:</strong> Paid add-ons (Ghost ABEND, ShadowASM, compliance tools, etc.)</li>
            <li><strong>Enterprise:</strong> Multi-tenant deployment with SSO, advanced security, and SLAs</li>
          </ul>

          <h3>Target Markets</h3>
          <ul>
            <li><strong>Financial Services:</strong> Banks and insurance companies migrating from mainframes</li>
            <li><strong>Healthcare:</strong> HIPAA-compliant batch processing and audit trails</li>
            <li><strong>Government:</strong> Secure, auditable job execution for public sector workloads</li>
            <li><strong>Manufacturing:</strong> Supply chain batch jobs with workspace isolation</li>
          </ul>

          <h3>Competitive Advantages</h3>
          <ul>
            <li>Browser-native (no client installation)</li>
            <li>Mainframe concepts without mainframe costs</li>
            <li>Extensible via SystemApp marketplace</li>
            <li>Built-in security, audit, and compliance features</li>
          </ul>
        </div>
      </section>

      <footer className="docs-footer">
        <p>
          Built for <strong>{HACKATHON_CONFIG.name}</strong> • Category: <strong>{HACKATHON_CONFIG.primaryCategory}</strong> • Theme: <strong>{HACKATHON_CONFIG.secondaryTheme}</strong>
        </p>
      </footer>
    </div>
  );
};

export default DocsPage;
