# Zeroframe OS Demo Script

This document provides guidance for conducting live demonstrations of Zeroframe OS (Kiroween Edition). It's designed for judges, reviewers, and anyone showcasing the project.

## Demo Flow Overview

The recommended demo flow takes 5-7 minutes and covers all major features while highlighting the Kiroween themes.

### 1. Introduction (30 seconds)

**Screen:** Dashboard (`/dashboard`)

**Script:**
> "Welcome to Zeroframe OS - a browser-native, mainframe-inspired operating system. This dashboard gives us a high-level view of system health: jobs, workspaces, security posture, and recent activity."

**Key Points:**
- Point out the Kiroween Edition badge
- Show the summary cards (jobs, workspace, security, activity)
- Mention this is a complete skeleton template for building system apps

### 2. Role-Based Access Control (1 minute)

**Screen:** Any (stay on Dashboard)

**Script:**
> "Zeroframe OS has a robust permission system. Watch what happens when I switch between roles."

**Actions:**
1. Switch to DEV role - point out what they can do
2. Switch to OPERATOR role - show different permissions
3. Switch to AUDITOR role - read-only access
4. Switch to ADMIN role - full access

**Key Points:**
- Each role has specific permissions
- UI adapts based on role (buttons disabled, etc.)
- All role switches are logged in the audit trail

### 3. Job Submission (1 minute)

**Screen:** Job & Batch Center (`/jobs`)

**Script:**
> "As a DEV, I can submit jobs. Let's create a batch job."

**Actions:**
1. Click "Submit Job"
2. Fill in job details (name: "Data Processing", type: BATCH)
3. Submit and watch the toast notification
4. Show the job appears in the list with PENDING status

**Key Points:**
- Jobs are workspace-isolated
- Toast notifications provide feedback
- Job starts in PENDING state

### 4. Job Processing (1 minute)

**Screen:** Job & Batch Center (`/jobs`)

**Script:**
> "Now let's switch to OPERATOR and process some jobs."

**Actions:**
1. Switch to OPERATOR role
2. Click "Run Worker Tick"
3. Watch job transition: PENDING → RUNNING → COMPLETED (or FAILED)
4. Show toast notifications for state changes

**Key Points:**
- Worker tick simulates job execution
- Jobs can succeed or fail (80% success rate)
- Failed jobs retry up to 3 times
- All state changes are logged

### 5. Ghost ABEND - Resurrection Theme (1 minute)

**Screen:** Ghost ABEND (`/apps/ghost-abend`)

**Script:**
> "This is Ghost ABEND - our 'Resurrection' theme in action. It analyzes failed jobs and helps bring them back to life."

**Actions:**
1. Show the failed jobs list
2. Click on a failed job to see details
3. Show severity analysis, failure explanation, and RCA
4. Click "Retry Job" to resurrect it

**Key Points:**
- Ghost ABEND is a parasitic system app
- It reads OS data without modifying it
- Provides value-added analysis
- Resurrection theme: bringing dead jobs back to life

### 6. ShadowASM - Skeleton Crew Theme (1 minute)

**Screen:** ShadowASM (`/apps/shadowasm`)

**Script:**
> "ShadowASM is a high-level assembly playground. It demonstrates the 'Skeleton Crew' theme - a minimal but complete system."

**Actions:**
1. Show the sample program or write a simple one
2. Click "Run Locally" to execute
3. Show the output
4. Click "Submit as Simulation Job" to integrate with the OS

**Key Points:**
- ShadowASM uses the OS App API
- It can submit jobs back to the OS
- Demonstrates extensibility
- Skeleton Crew: minimal but functional

### 7. Audit Trail (30 seconds)

**Screen:** Telemetry & Audit Explorer (`/audit`)

**Script:**
> "Everything we've done is logged. Let's check the audit trail."

**Actions:**
1. Switch to AUDITOR role
2. Show recent events
3. Filter by action type or user
4. Point out the complete history

**Key Points:**
- Every significant action is logged
- Audit events include user, action, resource, timestamp
- Critical for governance and compliance
- Immutable event log

### 8. Wrap-Up (30 seconds)

**Screen:** Dashboard (`/dashboard`)

**Script:**
> "Back to the dashboard, we can see the updated system status. Zeroframe OS is a complete skeleton template for building mainframe-inspired web applications with modern UX."

**Key Points:**
- Dashboard reflects all changes
- Workspace-aware
- Ready for extension with new system apps
- Built for Kiroween with Skeleton Crew and Resurrection themes

## Demo Mode Feature

Zeroframe OS includes a built-in Demo Mode that guides users through this exact flow:

1. Click "🎬 Demo Mode" in the top bar
2. Follow the step-by-step overlay
3. Navigate through all major features
4. Close when done

## Tips for Live Demos

1. **Preparation:**
   - Clear browser cache before demo
   - Have a few jobs pre-created in different states
   - Know which role to use for each step

2. **Pacing:**
   - Don't rush through role switches
   - Let toasts appear and be read
   - Pause after major actions

3. **Storytelling:**
   - Emphasize the mainframe inspiration
   - Connect features to Kiroween themes
   - Show how apps build on the skeleton

4. **Troubleshooting:**
   - If no jobs fail, submit one with "fail" in the name
   - If demo mode breaks, continue manually
   - Refresh page if state gets confused

## Agent Guidance

**For future AI agents working on this codebase:**

1. **Demo Mode is Critical:**
   - Do not remove or break the Demo Mode overlay
   - Keep step descriptions in sync with actual features
   - Test demo flow after major changes

2. **Key Demo Screens:**
   - Dashboard: System overview
   - Job Center: Core functionality
   - Ghost ABEND: Resurrection theme
   - ShadowASM: Skeleton Crew theme
   - Audit Explorer: Governance

3. **When Modifying Features:**
   - Update demo-flow.yaml if steps change
   - Update this script if flow changes
   - Ensure demo mode still works end-to-end

4. **Regression Prevention:**
   - Don't break toast notifications (used in demo)
   - Don't break role switching (core to demo)
   - Don't break job submission/processing (main demo flow)
   - Don't break Ghost ABEND or ShadowASM (Kiroween themes)

5. **Extension Pattern:**
   - New system apps should be demo-able
   - Consider adding new demo steps for major features
   - Keep demo flow under 10 steps (cognitive load)

## Kiroween Theme Checklist

When demoing, make sure to highlight:

- ✅ **Skeleton Crew:** Complete OS skeleton that apps build on
- ✅ **Resurrection:** Ghost ABEND brings failed jobs back to life
- ✅ **Dark Theme:** Kiroween-appropriate styling
- ✅ **Extensibility:** Easy to add new system apps
- ✅ **Governance:** Complete audit trail
- ✅ **Modern UX:** Toasts, responsive design, smooth interactions
