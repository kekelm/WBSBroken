# Entra-backed Pursuit Lead picker plan

## Recommended solution

Use a Microsoft Graph-backed runtime people search in the Opportunity form on `/hours`, with a searchable combobox that only commits a value when the user selects a verified active internal Entra member. Keep the existing `pursuitLead` text field as the display-name/legacy field and add two optional Dataverse text columns for the selected identity: `pursuitLeadEmail` and `pursuitLeadEntraObjectId`.

The current `Office365UsersService.SearchUserV2` hook is not sufficient as-is: it depends on the previously unreliable `office365users` runtime binding, and its search response alone does not guarantee `accountEnabled = true` and `userType = Member`. The preferred production path is a Microsoft Graph-capable runtime connector whose user-search operation returns or can filter on `id`, `displayName`, `mail`, `userPrincipalName`, `accountEnabled`, and `userType`. Query by display name or email, limit results, and enforce `accountEnabled eq true` plus `userType eq 'Member'` before presenting options. If tenant policy prevents the standard connector from exposing those fields/filters, use an approved custom connector or secured API facade over Graph rather than weakening the eligibility rule.

## Data contract

- Preserve the existing `pursuitLead` column for display name and legacy name-only records.
- Add optional `pursuitLeadEmail` text/email column.
- Add optional `pursuitLeadEntraObjectId` text column sized for an Entra GUID.
- Keep all three columns optional at Dataverse schema level so legacy records remain valid.
- Enforce the required rule in the Opportunity form:
  - New Opportunity: selected directory identity is mandatory.
  - Existing record with object ID: selected directory identity remains mandatory.
  - Existing legacy record with name only: unchanged legacy value may be saved.
  - Once the legacy Pursuit Lead is cleared or changed, a directory result must be selected and all three values saved together.

## Form behavior

- Replace only the Pursuit Lead input in `apps/wbs-planner/src/pages/hours.tsx`.
- Use a debounced searchable combobox; begin searching after 2 characters.
- Show name and email for each result, plus loading, no-results, and connector-error states.
- Selecting a result stores display name, mail/UPN fallback, and Entra object ID in form state.
- Typing is search text only and never becomes a saved Pursuit Lead value.
- Provide a clear/change action. Clearing a verified or legacy value makes the form invalid until another directory identity is selected.
- For a legacy name-only record, display a clear “Legacy value” indicator and preserve it unless the user explicitly changes it.
- Block every save path, including save-on-navigation, when the Pursuit Lead rule is not satisfied.

## Implementation sequence

1. Add the two Opportunity columns in Dataverse/Data Workspace. The current Opportunity schema is Dataverse-owned and read-only to the data-model update tool, so this schema change must be made in the owning Dataverse table first.
2. Regenerate the app data layer so `Opportunity` create/update models expose the two new fields.
3. Confirm/provision the Graph-capable runtime connection and generated service operation. Validate that it can search all tenant users and return `accountEnabled` and `userType`; do not rely on environment `systemuser` records because they exclude employees not enabled in the environment.
4. Replace or supersede `src/hooks/use-m365-people-search.ts` with a React Query hook that initializes the runtime, debounces searches, limits results, retries connector startup failures, filters to active members, normalizes email as `mail || userPrincipalName`, and surfaces errors.
5. Add a reusable lower-case filename Pursuit Lead combobox component and integrate it only into `src/pages/hours.tsx`.
6. Extend form hydration, dirty-state handling, and save payloads for name/email/object ID, including the legacy-preservation state machine.
7. Update `docs/overview.md`, run full project validation, and run AppGen SDK validation for the connector hook.

## Acceptance checks

- Search by partial name and email returns active internal members from the full Entra tenant, including users absent from Dataverse `systemuser`.
- Guests and disabled accounts never appear as selectable results.
- Results show display name and email.
- New Opportunities cannot save without a selected directory result.
- Selecting a person saves matching display name, email/UPN, and Entra object ID.
- Existing name-only records can save unchanged.
- Changing or clearing an existing legacy name requires a directory selection before save.
- The Opportunities list continues displaying `pursuitLead` without requiring list-page changes.
- Connector failures show an actionable inline error and do not permit free-text fallback.

## Main risks

- Microsoft Graph directory search permissions and tenant consent must allow reading basic profiles across the tenant.
- The existing Office 365 Users connection previously failed runtime resolution; reusing it without proving deployment binding would reproduce the issue.
- Filtering only the first page after search can hide valid employees if guests/disabled users consume the result limit; eligibility filtering should occur server-side whenever possible.
- Dataverse column logical names generated after creation must be confirmed before regeneration and coding.
