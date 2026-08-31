# Filter skillsets by solution area

## Change
- Update the Resource Skillsets modal so the Functional/Product/Technical dropdown is populated from the Solution Area Skillsets table.
- Filter dropdown options to only records whose displayed Solution Area name matches the selected Solution Area name in the main grid row.
- Use `skillset_area` as the dropdown option label and saved value.
- Keep the dropdown disabled when the main grid row has no Solution Area selected.
- Clear any existing Functional/Product/Technical values that no longer match the selected Solution Area.

## What stays the same
- The modal remains row-specific.
- The three fixed rows remain Primary, Secondary Skill 1, and Secondary Skillset 2.
- Level 1 Skillset Name and Level 2 Skillset Name remain unchanged.
- Save and Cancel behavior remains unchanged.

## Data entities
- Solution Area
- Solution Area Skillsets

## Validation
- Run full project validation after the update.