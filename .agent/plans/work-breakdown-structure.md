# Work breakdown structure app plan

## Goal
Build a single React/TypeScript app that helps users create, organize, estimate, assign, track, and review a work breakdown structure for projects.

## App direction
- A focused productivity workspace with a structured, data-first interface for project managers, delivery leads, and team members.
- Visual style: industrial/utilitarian with a clear blue-teal work-management palette, dense cards, tables, status indicators, and practical dashboards.
- Navigation: left sidebar because the solution needs 5+ work areas.

## Core pages
- Dashboard: project health, WBS completion, application access, effort totals, and upcoming milestones.
- Projects: create and manage projects that contain WBS structures.
- WBS Builder: hierarchical breakdown view for phases, deliverables, work packages, and tasks.
- Staffing Plan: create and edit Dataverse opportunities, staffing resources, skillsets, and weekly/monthly resource-hour grids.
- Opportunities: review, filter, edit, and delete saved opportunity records with a live Dataverse connection diagnostic.
- Team: workload, ownership, RACI-style responsibility overview, and assignment gaps.
- Reports: export-ready summaries for scope, estimates, progress, resource hours, and risks.

## Key features
- Create projects with objectives, dates, status, and ownership.
- Build a multi-level WBS hierarchy with parent-child work items.
- Add effort, duration, cost, priority, dependencies, owners, and status to work items.
- Enter resource hours in a dense grid with WBS rows, resource columns or resource rows, and weekly/monthly time periods.
- Toggle the hours grid between weekly and monthly entry modes.
- Show planned vs actual hours and variance while users enter time.
- Switch between outline, board, grid, and summary views.
- Track completion, blocked items, overdue tasks, and estimate variance.
- Use forms with validation for project and WBS item entry.
- Personalize dashboards and assignments for the signed-in user where relevant.

## Data entities
- Projects
- WBS Items
- Assignments
- Team Members
- Dependencies
- Estimates
- Staffing Plan Resources
- Resource Skillsets
- Resource Hours (staffing-plan-resource hours by time period)
- Time Periods
- Opportunities
- Risks
- Comments
- Applications (managed application catalog access and component state)

## Data source plan
- Use Dataverse structured data for projects, WBS items, assignments, estimates, opportunities, staffing plan resources, resource skillsets, resource hours, time periods, risks, dependencies, comments, and application catalog access.
- Store weekly and monthly grid hour values in Resource Hours by staffing plan resource, opportunity, and generated time period so reporting can compare planned, actual, and remaining work.
- Use Office 365 Users and current-user context for pursuit-lead lookup, personalization, and default ownership.
- Keep Dataverse runtime configuration bound to the published app’s `default.cds` database reference in the target environment.

## What stays out of scope
- No separate admin app; use one unified app with pages and role-aware views if needed.
- No login/logout or account menu.
- No external websites or real production URLs in sample data.
- No multi-app architecture.

## Verification target
- Final implementation should pass full project validation with the customized theme, data model, data layer, routing, forms, charts, and working UI actions in place.
