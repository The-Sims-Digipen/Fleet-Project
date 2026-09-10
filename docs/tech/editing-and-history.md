# Editing and history

`beginEdit`, `commitEdit`, and `cancelEdit` group continuous changes into one undo step. Number fields preview valid values while typing, commit on blur or Enter, and cancel on Escape. Sliders group pointer drags and held arrow keys; pointer cancellation restores the starting value. Color edits group until the picker loses focus. Presets and checkboxes are discrete edits. Blank or invalid numeric drafts stay local to their control.

Selection, reset actions, panel collapse, and history navigation finish pending edits. Undo includes object properties, lighting, and resets; selection, camera movement, and panel expansion are excluded. New edits discard redo, and no-op edits add no history. Ctrl/Cmd+Z undoes, Ctrl+Y or Ctrl/Cmd+Shift+Z redoes; focused form fields retain native shortcuts.

See the [scene-editor architecture](architecture.md#current-scene-editor-architecture) for state ownership.
