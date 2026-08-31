# Resource skillsets modal plan

## Change

Add a modal-style skillsets screen from the `/hours` resource grid, without changing the user’s current route.

## User-facing behavior

- Add a skillsets action icon in the Actions column for each resource row, next to the delete action.
- Clicking the icon opens a modal over the `/hours` page for that specific grid row.
- The modal identifies the selected row using the current resource/labor category and resource name where available.
- Since skillset fields will be defined later, the modal starts as a prepared workspace with a clear empty state and placeholder message.
- Closing the modal returns the user to the unchanged `/hours` grid context.

## What stays the same

- The `/hours` route remains the active page.
- Existing grid columns, calculations, add resource behavior, delete behavior, and save behavior remain unchanged.
- Skillsets are scoped per grid row, not shared across labor categories or resources.

## Design direction

- Use a compact dialog/modal pattern suitable for row-level editing.
- Keep the Actions column usable with two clear icon buttons: skillsets and delete.
- Use existing app styling and semantic UI components for consistency.

## Future-ready decisions

- Store the currently selected row for the modal so later skillset fields can be saved against that exact row.
- Do not create a separate route unless the skillset form later becomes large enough to need a full page.