import { useProjectStore } from "../state/projectStore";
import { topBarControl } from "./topBarStyles";

export function HistoryControls() {
  const canUndo = useProjectStore(
    (state) =>
      state.runtime.history.past.length > 0 ||
      state.runtime.history.activeEdit !== null,
  );
  const canRedo = useProjectStore((state) => state.runtime.history.future.length > 0);
  const undo = useProjectStore((state) => state.undo);
  const redo = useProjectStore((state) => state.redo);

  return (
    <div className="flex gap-2" aria-label="Edit history">
      <button
        type="button"
        className={topBarControl}
        disabled={!canUndo}
        onClick={undo}
      >
        Undo
      </button>
      <button
        type="button"
        className={topBarControl}
        disabled={!canRedo}
        onClick={redo}
      >
        Redo
      </button>
    </div>
  );
}
