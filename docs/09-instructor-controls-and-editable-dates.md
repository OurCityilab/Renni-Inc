# Instructor Controls and Editable Due Dates

The starter kit now includes live seeded deliverables with **instructor-editable due dates**.

## How due dates should work

- `dueDate` is the **suggested working due date** loaded at seed time.
- `instructorCanEditDueDate` should default to `true` for seeded deliverables.
- In the portal, the instructor should be able to:
  - change a due date
  - record why it changed
  - notify the owner and approver automatically
  - keep the rest of the deliverable record intact

## Recommended Firestore fields

For each deliverable, support these fields:

- `dueDate`
- `suggestedDueDate`
- `instructorCanEditDueDate`
- `lastDueDateEditedBy`
- `lastDueDateEditedAt`
- `dueDateOverrideReason`

## Recommended permissions

The instructor/program lead should be able to:
- edit any due date
- bulk shift dates for a whole department
- bulk shift dates for all deliverables tied to a chapter
- reopen a completed deliverable if a new due date is assigned

Co-CEOs may also be allowed to edit due dates if you want leadership flexibility, but the instructor should always have final override.

## UI recommendation

On each deliverable card or detail page, show:

- current due date
- original suggested due date
- editable toggle or button: `Adjust Due Date`
- override reason
- audit trail

## Seed-file note

The live deliverables CSV includes:
- `dueDate`
- `instructorCanEditDueDate`
- `dueDateNotes`

These dates are meant to get the project moving immediately and can be changed by the instructor without changing ownership, status, or templates.
