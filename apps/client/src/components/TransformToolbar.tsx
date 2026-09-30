import { useEffect } from "react";
import { useProjectStore } from "../state/projectStore";
import type { ProjectEditorState } from "../state/projectRuntime";

const modes: { mode: ProjectEditorState["transformMode"]; label: string; shortcut: string }[] = [
  { mode: "translate", label: "Move", shortcut: "W" },
  { mode: "rotate", label: "Rotate", shortcut: "E" },
  { mode: "scale", label: "Scale", shortcut: "R" },
];

const buttonClass = "min-h-9 rounded-md border border-line-strong bg-panel/95 px-3 text-xs font-bold text-secondary shadow-sm backdrop-blur transition-colors hover:border-[#668078] hover:text-primary aria-pressed:border-accent aria-pressed:bg-accent/15 aria-pressed:text-primary";

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.matches("input, textarea, select") || target.isContentEditable);
}

export function TransformToolbar() {
  const selected = useProjectStore((state) => state.runtime.editor.selection !== null);
  const interactionMode = useProjectStore((state) => state.runtime.editor.interactionMode);
  const mode = useProjectStore((state) => state.runtime.editor.transformMode);
  const space = useProjectStore((state) => state.runtime.editor.transformSpace);
  const snap = useProjectStore((state) => state.runtime.editor.snapEnabled);
  const editing = useProjectStore((state) => state.runtime.history.activeEdit !== null);
  const setInteractionMode = useProjectStore((state) => state.setInteractionMode);
  const setMode = useProjectStore((state) => state.setTransformMode);
  const setSpace = useProjectStore((state) => state.setTransformSpace);
  const setSnap = useProjectStore((state) => state.setSnapEnabled);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (interactionMode !== "gizmo" || editing || isTypingTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
      const key = event.key.toLowerCase();
      const nextMode = key === "w" ? "translate" : key === "e" ? "rotate" : key === "r" ? "scale" : null;
      if (nextMode) {
        event.preventDefault();
        setMode(nextMode);
      } else if (key === "q") {
        event.preventDefault();
        setSpace(space === "world" ? "local" : "world");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editing, interactionMode, setMode, setSpace, space]);

  const gizmoEnabled = interactionMode === "gizmo";

  return <div className="pointer-events-auto absolute top-[108px] left-[clamp(20px,3vw,42px)] z-20 flex max-w-[calc(100%-40px)] flex-wrap items-center gap-1.5" role="toolbar" aria-label="Transform tools">
    <div className="flex gap-1" aria-label="Transform mode">
      {modes.map((item) => <button key={item.mode} type="button" className={buttonClass} disabled={!selected || !gizmoEnabled} aria-pressed={gizmoEnabled && mode === item.mode} title={`${item.label} (${item.shortcut})`} onClick={() => setMode(item.mode)}>
        {item.label}<span className="ml-1.5 font-mono text-[10px] opacity-60">{item.shortcut}</span>
      </button>)}
    </div>
    <button type="button" aria-label={`Interaction mode: ${gizmoEnabled ? "Gizmo" : "Inspect"}`} className={buttonClass} aria-pressed={gizmoEnabled} title={`Switch to ${gizmoEnabled ? "inspect" : "gizmo"} mode`} onClick={() => setInteractionMode(gizmoEnabled ? "inspect" : "gizmo")}>
      {gizmoEnabled ? "Gizmo" : "Inspect"}
    </button>
    <button type="button" aria-label={`Transform space: ${space === "world" ? "World" : "Local"}`} className={buttonClass} disabled={!selected || !gizmoEnabled} aria-pressed={space === "local"} title="Toggle transform space (Q)" onClick={() => setSpace(space === "world" ? "local" : "world")}>
      {space === "world" ? "World" : "Local"}<span className="ml-1.5 font-mono text-[10px] opacity-60">Q</span>
    </button>
    <button type="button" className={buttonClass} disabled={!selected || !gizmoEnabled} aria-pressed={snap} title="Toggle snapping" onClick={() => setSnap(!snap)}>
      Snap
    </button>
  </div>;
}
