# Opportunity Owner user search plan

## Confirmed decisions
- Scope is limited to the `/hours` route and its Opportunity Information card.
- Keep the existing Pursuit Lead text field unchanged.
- Add a separate field labeled **Opportunity Owner**.
- Use the **Office 365 Users** connector and `SearchUserV2` to search Entra users by display name.
- Allow one selected user.
- Display and retain the selected user's display name and email/UPN in component state only.
- Do not update Dataverse or the app data model; the selection resets when the page session ends.

## Current-state findings
- `shared_office365users` is already registered in `apps/wbs-planner/power.config.json`; it does not need to be re-added.
- Generated connector artifacts already exist, including `Office365UsersService.SearchUserV2(searchTerm, top, isSearchTermRequired, skipToken)` and the corresponding user model.
- The old `pursuit-lead-picker.tsx` and `use-m365-people-search.ts` files are empty placeholders and should not be reused for the new, distinctly named Opportunity Owner feature.

## Implementation steps
1. Confirm the existing purpose-matched theme variables in `apps/wbs-planner/src/index.css`; only adjust them if they do not meet the app theme and contrast requirements.
2. Create a focused `use-entra-user-search` hook that calls the generated `Office365UsersService.SearchUserV2` method through TanStack Query. Debounce the display-name query, require at least two characters, request at most 8 results, and map only valid records with an ID, display name, and email/UPN.
3. Create an `opportunity-owner-picker.tsx` single-select combobox using the existing shadcn Command/Popover primitives. It will provide an accessible text search, loading state, no-results state, connector error with retry, keyboard selection, selected-user summary, and a clear action.
4. Add session-only Opportunity Owner state to the `/hours` page and render the picker as a separate field in the Opportunity Information card next to the existing Pursuit Lead field. The selected object will contain `id`, `displayName`, and `email`, but will not be included in opportunity create/update payloads.
5. Ensure changing the active opportunity or leaving/re-entering the route clears the session-only owner selection rather than implying it was persisted.
6. Run `validate_appgen_sdk_usage` for the Office 365 Users hook, then run `validate_project`; resolve all errors before completion.

## Interaction details
- Placeholder: `Search by display name…`
- Search begins after two characters and a short debounce to avoid a request per keystroke.
- Results show display name as the primary line and email/UPN as the secondary line, which disambiguates duplicate names.
- Selecting a result closes the list and shows the selected name and email in the field.
- Clearing returns the control to search mode.
- No photos will be fetched, avoiding extra connector calls and latency.

## Non-goals
- No replacement or modification of Pursuit Lead.
- No multi-select behavior.
- No Opportunity schema or Dataverse changes.
- No persistence across refreshes or route sessions.
- No new page or route.
