import { useEffect, useRef, useState } from "react";
import { downloadPortableProject, parsePortableProject } from "../project/portableProject";
import { useProjectDirty, useProjectStore } from "../state/projectStore";
import { NameField } from "./NameField";
import { NewProjectDialog, OpenProjectDialog } from "./ProjectDialogs";
import { topBarControl, topBarControlActive } from "./topBarStyles";

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
      const text = await file.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        // A raw SyntaxError names a byte offset, which tells the reader nothing about the file.
        throw new Error("This file is not a readable project file. Choose a .fleetproject file exported from this app.");
      }
      await useProjectStore.getState().importProject(parsePortableProject(data));
    } catch (error) {
      setFileError(error instanceof Error ? error.message : "The project file could not be imported.");
    } finally {
      setImporting(false);
      if (importInput.current) importInput.current.value = "";
    }
  }

  return <div className="flex shrink-0 items-center gap-2" aria-label="Project">
    <div className="w-[clamp(12rem,20vw,19rem)] shrink-0">
      <NameField label="Project name" value={name} onCommit={(next) => useProjectStore.getState().renameProject(next)} compact />
    </div>
    <button type="button" aria-label="New project" className={topBarControl} onClick={() => setDialog("new")}>New</button>
    <button type="button" aria-label="Open project" className={topBarControl} onClick={() => setDialog("open")}>Open</button>
    <button type="button" aria-label="Import project" className={topBarControl} disabled={importing} onClick={() => importInput.current?.click()}>{importing ? "Importing…" : "Import"}</button>
    <button type="button" aria-label="Export project" className={topBarControl} onClick={() => downloadPortableProject(useProjectStore.getState().exportProject())}>Export</button>
    <button type="button" aria-label={saveStatus.state === "error" ? "Retry saving project" : "Save project"} className={topBarControlActive} disabled={saveStatus.state === "saving" || importing}
      onClick={() => useProjectStore.getState().saveProject()}>{saveStatus.state === "error" ? "Retry Save" : "Save"}</button>
    <p role="status" title={"detail" in status ? status.detail : undefined} className={`shrink-0 px-1 text-xs whitespace-nowrap font-semibold ${status.tone}`}>
      {status.text}{"detail" in status && <span className="sr-only">: {status.detail}</span>}
    </p>
    <input ref={importInput} className="hidden" type="file" accept=".fleetproject,application/json" aria-label="Choose project file" onChange={(event) => {
      const file = event.currentTarget.files?.[0];
      if (file) void importFile(file);
    }} />
    {fileError && <p role="alert" className="fixed top-16 right-4 z-40 max-w-md rounded-lg border border-red-400/50 bg-panel px-3 py-2 text-xs text-red-300 shadow-lg">{fileError}</p>}
    {dialog === "new" && <NewProjectDialog dirty={dirty} onDismiss={() => setDialog(null)} />}
    {dialog === "open" && <OpenProjectDialog dirty={dirty} onDismiss={() => setDialog(null)} />}
  </div>;
}
