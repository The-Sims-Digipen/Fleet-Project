import { useEffect } from "react";
import { useSceneStore, type TransformMode } from "../state/sceneStore";

const modes: { mode: TransformMode; label: string; shortcut: string }[] = [
  { mode: "translate", label: "Move", shortcut: "W" },
  { mode: "rotate", label: "Rotate", shortcut: "E" },
  { mode: "scale", label: "Scale", shortcut: "R" },
];

const buttonClass = "min-h-9 rounded-md border border-line-strong bg-panel/95 px-3 text-xs font-bold text-secondary shadow-sm backdrop-blur transition-colors hover:border-[#668078] hover:text-primary aria-pressed:border-accent aria-pressed:bg-accent/15 aria-pressed:text-primary";

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.matches("input, textarea, select") || target.isContentEditable);
}

export function TransformToolbar() {
  const selected = useSceneStore((state) => state.editor.selectedObjectId !== null);
  const mode = useSceneStore((state) => state.editor.transformMode);
  const space = useSceneStore((state) => state.editor.transformSpace);
  const snap = useSceneStore((state) => state.editor.snapEnabled);
  const editing = useSceneStore((state) => state.history.baseline !== null);
  const setMode = useSceneStore((state) => state.setTransformMode);
  const setSpace = useSceneStore((state) => state.setTransformSpace);
  const setSnap = useSceneStore((state) => state.setSnapEnabled);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (editing || isTypingTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
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
  }, [editing, setMode, setSpace, space]);

  return <div className="pointer-events-auto absolute top-[108px] left-[clamp(20px,3vw,42px)] z-20 flex max-w-[calc(100%-40px)] flex-wrap items-center gap-1.5" role="toolbar" aria-label="Transform tools">
    <div className="flex gap-1" aria-label="Transform mode">
      {modes.map((item) => <button key={item.mode} type="button" className={buttonClass} disabled={!selected} aria-pressed={mode === item.mode} title={`${item.label} (${item.shortcut})`} onClick={() => setMode(item.mode)}>
        {item.label}<span className="ml-1.5 font-mono text-[10px] opacity-60">{item.shortcut}</span>
      </button>)}
    </div>
    <button type="button" className={buttonClass} disabled={!selected} aria-pressed={space === "local"} title="Toggle transform space (Q)" onClick={() => setSpace(space === "world" ? "local" : "world")}>
      {space === "world" ? "World" : "Local"}<span className="ml-1.5 font-mono text-[10px] opacity-60">Q</span>
    </button>
    <button type="button" className={buttonClass} disabled={!selected} aria-pressed={snap} title="Toggle snapping" onClick={() => setSnap(!snap)}>
      Snap
    </button>
  </div>;
}
