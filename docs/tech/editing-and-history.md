# Edit lifecycle and history

The saved baseline is the complete version 1 Project document from the last successful save. Dirty-state checks compare the current document with that baseline. A Project without a successful save has no baseline. It stays dirty until its first successful save. The baseline is separate from Undo history and an active edit.

`beginEdit`, `commitEdit`, and `cancelEdit` define an active edit. Continuous previews become one undo step after commit. Cancellation restores the document from the start of the active edit. Number fields preview valid values as the user enters text. They commit on blur or Enter and cancel on Escape.

Sliders group pointer drags and held arrow keys. Pointer cancellation restores the initial value. Color edits form one group until the picker loses focus. Preset controls and checkboxes produce discrete edits. Blank or invalid numeric drafts stay local to their control.

Selection changes, panel collapse, history navigation, and interaction/transform-tool changes finish pending edits. One Project history covers Scenarios, Vehicles, Presets, Analysis Settings, Depot transforms, Vehicle transforms, and persisted `activeScenarioId`.

Selection, interaction mode, Plan year/playback, Compare Scenario choices/year/playback, lighting, and camera movement belong to Project runtime only. Undo excludes these values. Plan and Compare keep independent canonical timelines. A workspace exit pauses playback without a change to its selected year.

Workspace mode, global Project dialogs, and panel expansion belong to application state in `appStore`. Undo also excludes these values. They remain stable when the open Project changes. Continuous runtime controls use a separate edit snapshot. Cancellation restores the initial runtime value without a Project history entry.

Viewport gizmo drags use the Project-document edit lifecycle. Pointer down starts an edit. Live transforms update the Project document. Pointer up commits one undo step. Escape restores the drag baseline and ends the pointer gesture. Pointer cancellation or loss of window focus also cancels the active gizmo drag. Cancellation enables camera controls again. A later pointer-up cannot commit the cancelled drag.

A document change clears selection if the selected typed Project object no longer exists. This rule also applies to undo/redo. Object restoration through history does not select that object again. New edits discard redo history. An edit without a document change adds no history entry.

Application shortcuts operate even when visible history buttons are not mounted. Ctrl/Cmd+Z undoes. Ctrl+Y or Ctrl/Cmd+Shift+Z redoes. Focused form fields retain their native shortcuts.

See [system architecture](architecture.md#ownership-boundaries) for state ownership.
