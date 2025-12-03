# Testing Guide - TRUNK Phase Features

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Testing the Job Engine

### 1. Submit a New Job

1. Navigate to **Job & Batch Center** from the Desktop
2. Click **"Submit New Job"** button (top right)
3. Fill in the form:
   - **Name**: TEST_JOB_SUCCESS
   - **Type**: BATCH
   - **Priority**: HIGH
   - **Workspace**: DEV
   - **Description**: Test job for success scenario
   - **Tags**: test, success
4. Click **"Submit Job"**
5. Verify the job appears in the table with status **PENDING**

### 2. Run Worker Tick

1. Switch to **Ops Omar** (OPERATOR role) using the top bar dropdown
2. Click **"⚙️ Run Worker Tick"** button
3. Watch the job transition:
   - Immediately: **PENDING** → **RUNNING**
   - After 2 seconds: **RUNNING** → **COMPLETED** (80% chance) or **FAILED** (20% chance)
4. Click on the job to view its timeline in the detail panel
5. Verify all events are logged with timestamps

### 3. Test Job Failure and Retry

1. Submit a new job with name: **TEST_JOB_FAIL**
2. Add tag: **fail** (this forces failure in the simulation)
3. Run worker tick
4. Job should fail and transition to **RETRYING**
5. Run worker tick again (it will retry automatically)
6. After 3 failures, job should reach **FAILED** status
7. Click on the failed job
8. Click **"Retry Job"** button (only visible to OPERATOR/ADMIN)
9. Job returns to **PENDING** status
10. Run worker tick to process it again

### 4. Test Job Cancellation

1. Submit a new job (any name)
2. Click **"⚙️ Run Worker Tick"** to start it (status: RUNNING)
3. Quickly click on the job in the table
4. Click **"Cancel Job"** button
5. Job should transition to **CANCELLED**
6. Verify the timeline shows the cancellation event with your username

### 5. Test Priority Scheduling

1. Submit three jobs:
   - Job A: Priority **LOW**, Name: LOW_PRIORITY_JOB
   - Job B: Priority **HIGH**, Name: HIGH_PRIORITY_JOB
   - Job C: Priority **NORMAL**, Name: NORMAL_PRIORITY_JOB
2. Run worker tick
3. Verify **HIGH_PRIORITY_JOB** is processed first (check timeline)
4. Run worker tick again
5. Verify **NORMAL_PRIORITY_JOB** is processed second
6. Run worker tick again
7. Verify **LOW_PRIORITY_JOB** is processed last

## Testing Ghost ABEND

### 1. View Failed Jobs

1. Navigate to **Ghost ABEND** from the Desktop
2. You should see failed jobs from the mock data (j3, j7) plus any you created
3. Each card shows:
   - Job name and risk level (CRITICAL for PROD, HIGH for UAT, MEDIUM for DEV)
   - Workspace, owner, attempts, type
   - Last error message
   - Explanation of the failure
   - Suggested fix

### 2. Test Different Failure Types

Create jobs with these names to trigger different explanations:

- **TIMEOUT_TEST** → Timeout explanation
- **AUTH_FAIL_TEST** → Authentication/permission explanation
- **VALIDATION_ERROR** → Data validation explanation
- **GENERIC_FAIL** → Generic failure explanation

Submit each, run worker tick with tag "fail" to force failure, then view in Ghost ABEND.

## Testing Permissions

### 1. DEV Role (Dev Dora)

- ✅ Can submit jobs
- ❌ Cannot run worker tick (button hidden)
- ❌ Cannot retry jobs (button disabled)
- ❌ Cannot cancel jobs (button disabled)

### 2. OPERATOR Role (Ops Omar)

- ✅ Can submit jobs
- ✅ Can run worker tick
- ✅ Can retry jobs
- ✅ Can cancel jobs

### 3. AUDITOR Role (Audit Asha)

- ❌ Cannot submit jobs (button disabled)
- ❌ Cannot run worker tick (button hidden)
- ❌ Cannot retry jobs (button disabled)
- ❌ Cannot cancel jobs (button disabled)
- ✅ Can view all jobs and audit logs

### 4. ADMIN Role (Admin Anil)

- ✅ Full access to all features

## Testing Audit Logging

1. Navigate to **Telemetry & Audit Explorer**
2. Perform various actions (submit job, run worker tick, retry, cancel)
3. Return to Audit Explorer
4. Verify all actions are logged with:
   - Timestamp
   - User who performed the action
   - Action type (JOB_SUBMITTED, JOB_COMPLETED, etc.)
   - Resource type and ID
   - Details

## Testing Job Timeline

1. Click on any job in the Job & Batch Center
2. Scroll to **"Execution Timeline"** section
3. Verify events are displayed in chronological order
4. Each event should show:
   - Timestamp
   - Event type (JOB_CREATED, JOB_STARTED, etc.)
   - Message
   - Actor (who triggered it, if applicable)

## Edge Cases to Test

### Empty States
- View Job Center with no jobs (clear mock data temporarily)
- View Ghost ABEND with no failed jobs

### Max Attempts
- Create a job with tag "fail"
- Run worker tick 3 times
- Verify job reaches FAILED status after 3 attempts
- Verify timeline shows all retry attempts

### Concurrent Jobs
- Submit 5 jobs with different priorities
- Run worker tick multiple times
- Verify only one job processes at a time
- Verify priority order is respected

### Workspace Filtering
- Submit jobs in different workspaces (DEV, UAT, PROD)
- Use workspace filter in Job Center
- Verify filtering works correctly

### Search and Filters
- Use status filter checkboxes
- Use owner filter dropdown
- Use search box (searches name and tags)
- Combine multiple filters

## Performance Testing

1. Submit 20+ jobs rapidly
2. Verify UI remains responsive
3. Run worker tick multiple times
4. Verify state updates correctly
5. Check browser console for errors

## Browser Console Checks

Open browser DevTools (F12) and check:
- No React errors or warnings
- Worker tick logs show which job is being processed
- No TypeScript type errors
- Audit events are logged correctly

## Known Behaviors

- Worker tick processes one job at a time (by design)
- 2-second delay simulates job execution time
- Jobs with "fail" in name/tags always fail (for testing)
- Other jobs have 80% success / 20% failure rate
- Failed jobs automatically retry up to maxAttempts (3)
- Completed/Failed/Cancelled jobs cannot be modified

## Troubleshooting

**Job not processing?**
- Check job status (must be PENDING or RETRYING)
- Verify you're logged in as OPERATOR or ADMIN
- Check browser console for errors

**Button disabled?**
- Check your current role (top bar)
- Some actions require MANAGE_JOBS permission
- Switch to Ops Omar or Admin Anil

**Timeline not showing?**
- Click on a job row to select it
- Detail panel appears on the right
- Scroll down to see timeline

**Modal not appearing?**
- Check if you have SUBMIT_JOB permission
- Try switching to Dev Dora or Ops Omar
- Check browser console for errors
