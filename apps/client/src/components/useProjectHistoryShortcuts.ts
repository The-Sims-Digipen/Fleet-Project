import { useEffect } from "react";

import { useProjectStore } from "../state/projectStore";
import { isTypingTarget } from "./eventTargets";

/** Keeps Project Undo/Redo available independently of visible history controls. */
export function useProjectHistoryShortcuts(): void {
  const undo = useProjectStore((state) => state.undo);
  const redo = useProjectStore((state) => state.redo);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target) || !(event.ctrlKey || event.metaKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key !== "z" && key !== "y") return;
      event.preventDefault();
      if (key === "y" || event.shiftKey) redo();
      else undo();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redo, undo]);
}
