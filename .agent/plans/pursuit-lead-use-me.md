# Pursuit Lead “Use me” plan

1. Confirm the generated Office 365 Users client exposes `MyProfile()` and use its generated response type rather than adding a second identity mechanism.
2. On `/hours`, keep Pursuit Lead as an editable text input and place a compact `Use me` button with a user icon directly beside it.
3. Add a click handler that calls `Office365Users.MyProfile()`, reads `DisplayName`, immediately replaces the Pursuit Lead value, and marks the staffing plan as having unsaved changes.
4. Add a button-level loading/disabled state to prevent duplicate requests. If the connector call fails or returns no display name, preserve the existing text and show a concise rich-color error toast.
5. Validate the generated connector usage and run full project validation, correcting any SDK or TypeScript errors before completion.

Decisions confirmed:
- Button label: `Use me`.
- Existing Pursuit Lead text: replace immediately on success.
- Scope: `/hours` only; no people picker or automatic profile lookup on page load.
