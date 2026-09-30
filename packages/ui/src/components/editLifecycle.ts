/**
 * EditLifecycle — the begin/commit/cancel hooks a field calls as the user edits.
 *
 * Fields keep an internal draft so in-progress text is shown without pushing
 * every keystroke to the consumer. The lifecycle lets a consumer bracket an
 * edit: `beginEdit` on first change/focus, `commitEdit` on blur or Enter, and
 * `cancelEdit` on Escape. It is designed to drive an undo/history boundary
 * (e.g. one history entry per committed edit) but is entirely optional — a
 * field without an `edit` prop behaves as a plain controlled input.
 */
export type EditLifecycle = {
  beginEdit?: () => void;
  commitEdit?: () => void;
  cancelEdit?: () => void;
};

/** Invoke a lifecycle hook if the `edit` object and the hook are both present. */
export function runEdit(edit: EditLifecycle | undefined, phase: keyof EditLifecycle): void {
  edit?.[phase]?.();
}
