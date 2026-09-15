import { useEffect, useRef, useState } from "react";
import { downloadPortableProject, parsePortableProject } from "../project/portableProject";
import { useProjectDirty, useProjectStore } from "../state/projectStore";
import { NameField } from "./NameField";
import { NewProjectDialog, OpenProjectDialog } from "./ProjectDialogs";

const buttonClass = "min-h-9 rounded-lg border border-line-strong bg-transparent px-3 text-xs font-bold text-secondary transition-colors duration-150 enabled:hover:border-[#668078] enabled:hover:text-primary disabled:cursor-default disabled:opacity-40 motion-reduce:transition-none";

/** Header controls for browser-local project persistence plus portable import/export. */
export function ProjectControls() {
  const name = useProjectStore((state) => state.name);
  const projectId = useProjectStore((state) => state.projectId);
  const saveStatus = useProjectStore((state) => state.saveStatus);
  const dirty = useProjectDirty();
  const [dialog, setDialog] = useState<"new" | "open" | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const status = saveStatus.state === "saving" ? { text: "Saving…", tone: "text-secondary" }
    : saveStatus.state === "error" ? { text: "Save failed", detail: `${saveStatus.message} Your edits are still here.`, tone: "text-red-300" }
    : dirty ? { text: "Unsaved changes", tone: "text-amber-200" }
    : projectId ? { text: "Saved locally", tone: "text-accent" }
    : { text: "Not saved yet", tone: "text-secondary" };

  async function importFile(file: File) {
    if (dirty && !window.confirm(`Importing a project will replace the current unsaved workspace “${name}”. Continue?`)) return;
    setImporting(true);
    setFileError(null);
    try {
      const parsed = parsePortableProject(JSON.parse(await file.text()));
      await useProjectStore.getState().importProject(parsed);
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "The project file could not be imported.");
    } finally {
      setImporting(false);
      if (importInput.current) importInput.current.value = "";
    }
  }

  return <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1" aria-label="Project">
    <div className="grid w-[22ch] min-w-0">
      <span className="px-2 font-mono text-[0.68rem] font-bold tracking-[0.14em] text-accent uppercase">Project</span>
      <NameField label="Project name" value={name} onCommit={(next) => useProjectStore.getState().renameProject(next)} compact />
    </div>
    <p role="status" title={"detail" in status ? status.detail : undefined} className={`w-[16ch] self-end pb-2 text-xs whitespace-nowrap font-semibold ${status.tone}`}>
      {status.text}{"detail" in status && <span className="sr-only">: {status.detail}</span>}
    </p>
    <div className="ml-auto flex flex-wrap gap-2 self-end">
      <button type="button" aria-label="New project" className={buttonClass} onClick={() => setDialog("new")}>New</button>
      <button type="button" aria-label="Open project" className={buttonClass} onClick={() => setDialog("open")}>Open</button>
      <button type="button" aria-label="Import project" className={buttonClass} disabled={importing} onClick={() => importInput.current?.click()}>{importing ? "Importing…" : "Import"}</button>
      <button type="button" aria-label="Export project" className={buttonClass} onClick={() => downloadPortableProject(useProjectStore.getState().exportProject())}>Export</button>
      <button type="button" aria-label={saveStatus.state === "error" ? "Retry saving project" : "Save project"} className="min-h-9 rounded-lg bg-accent px-3 text-xs font-bold text-accent-ink disabled:cursor-default disabled:opacity-40" disabled={saveStatus.state === "saving" || importing}
        onClick={() => useProjectStore.getState().saveProject()}>{saveStatus.state === "error" ? "Retry Save" : "Save"}</button>
      <input ref={importInput} className="hidden" type="file" accept=".fleetproject,application/json" aria-label="Choose project file" onChange={(event) => {
        const file = event.currentTarget.files?.[0];
        if (file) void importFile(file);
      }} />
    </div>
    {fileError && <p role="alert" className="basis-full text-right text-xs text-red-300">{fileError}</p>}
    {dialog === "new" && <NewProjectDialog dirty={dirty} onDismiss={() => setDialog(null)} />}
    {dialog === "open" && <OpenProjectDialog dirty={dirty} onDismiss={() => setDialog(null)} />}
  </div>;
}
