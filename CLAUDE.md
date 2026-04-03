# Wardi — Claude Instructions

## Project

Wardi is a mobile web storefront for WhatsApp-based sellers. Full context in [`project/overview.md`](project/overview.md).

## Workflow

### 1. Tasks come from Notion

The user manages all tasks and ideas in Notion. Do not ask the user to edit local files for task management.

- **Notion project page:** https://www.notion.so/33002f7af6c38091a962ef7cc9e865c2
- **Task database:** https://www.notion.so/33202f7af6c380208564e8a1e3b4a85e

Before starting work, check Notion to understand what needs to be done.

### 2. Design before code

Every screen must have an approved Banani design before implementation begins.

1. Check if a design exists in Banani for the screen
2. If no design exists — create one in Banani and ask the user to review and approve it
3. Only after approval — implement the screen from the Banani design

Non-visual work (backend logic, bug fixes with no UI change, Firestore rules) is exempt.

### 3. After completing a task

1. Mark the task as **Done** in the Notion task database
2. Update `project/progress.md` to mirror the new state

`progress.md` is a local snapshot for quick orientation — the user does not edit it directly.
