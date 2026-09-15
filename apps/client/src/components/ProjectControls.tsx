import { useEffect, useState } from "react";
import { useProjectDirty, useProjectStore } from "../state/projectStore";
import { NameField } from "./NameField";
import { NewProjectDialog, OpenProjectDialog } from "./ProjectDialogs";

const buttonClass = "min-h-9 rounded-lg border border-line-strong bg-transparent px-3 text-xs font-bold text-secondary transition-colors duration-150 enabled:hover:border-[#668078] enabled:hover:text-primary disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none";

/** Header controls for the open project: name, save state, and New/Open/Save. The Scenarios sidebar panel selects the active scenario. */
export function ProjectControls() {
  const name = useProjectStore((state) => state.name);
  const projectId = useProjectStore((state) => state.projectId);
  const saveStatus = useProjectStore((state) => state.saveStatus);
  const dirty = useProjectDirty();
  const [dialog, setDialog] = useState<"new" | "open" | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const status = saveStatus.state === "saving" ? { text: "Saving…", tone: "text-secondary" }
    : saveStatus.state === "error" ? { text: "Save failed", detail: `${saveStatus.message} Your edits are still here.`, tone: "text-red-300" }
    : dirty ? { text: "Unsaved changes", tone: "text-amber-200" }
    : projectId ? { text: "Saved", tone: "text-accent" }
    : { text: "Not saved yet", tone: "text-secondary" };

  return <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1" aria-label="Project">
    <div className="grid w-[22ch] min-w-0">
      <span className="px-2 font-mono text-[0.68rem] font-bold tracking-[0.14em] text-accent uppercase">Project</span>
      <NameField label="Project name" value={name} onCommit={(next) => useProjectStore.getState().renameProject(next)} compact />
    </div>
    <p role="status" title={"detail" in status ? status.detail : undefined} className={`w-[16ch] self-end pb-2 text-xs whitespace-nowrap font-semibold ${status.tone}`}>
      {status.text}{"detail" in status && <span className="sr-only">: {status.detail}</span>}
    </p>
    <div className="ml-auto flex gap-2 self-end">
      <button type="button" className={buttonClass} onClick={() => setDialog("new")}>New</button>
      <button type="button" className={buttonClass} onClick={() => setDialog("open")}>Open</button>
      <button type="button" className="min-h-9 rounded-lg bg-accent px-3 text-xs font-bold text-accent-ink disabled:cursor-default disabled:opacity-40" disabled={saveStatus.state === "saving"}
        onClick={() => useProjectStore.getState().saveProject()}>{saveStatus.state === "error" ? "Retry Save" : "Save"}</button>
    </div>
    {dialog === "new" && <NewProjectDialog dirty={dirty} onDismiss={() => setDialog(null)} />}
    {dialog === "open" && <OpenProjectDialog dirty={dirty} onDismiss={() => setDialog(null)} />}
  </div>;
}
