import { useEffect } from "react";
import { useSceneStore } from "../state/sceneStore";
import { topBarControl } from "./topBarStyles";

export function HistoryControls() {
  const canUndo = useSceneStore(
    (state) =>
      state.history.past.length > 0 ||
      (state.history.baseline !== null &&
        state.history.baseline !== state.document),
  );
  const canRedo = useSceneStore((state) => state.history.future.length > 0);
  const undo = useSceneStore((state) => state.undo);
  const redo = useSceneStore((state) => state.redo);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.matches("input, textarea, select") || target.isContentEditable)
      )
        return;
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key === "z" || key === "y") {
        event.preventDefault();
        if (key === "y" || event.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo]);

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
