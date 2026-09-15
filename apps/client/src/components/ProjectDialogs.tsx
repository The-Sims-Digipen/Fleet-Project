import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { validateName, type ProjectSummary } from "../project/types";
import { useProjectStore } from "../state/projectStore";

const secondaryButton = "min-h-9 rounded border border-line-strong px-3 text-xs font-semibold text-secondary enabled:hover:bg-white/5 enabled:hover:text-primary disabled:cursor-default disabled:opacity-40";
const primaryButton = "min-h-9 rounded bg-accent px-4 text-xs font-bold text-accent-ink disabled:cursor-default disabled:opacity-40";
const dangerButton = "min-h-9 rounded bg-red-400 px-4 text-xs font-bold text-red-950";

function Modal({ title, description, onDismiss, children }: { title: string; description?: string; onDismiss: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);

  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onDismiss(); }} onClose={(event) => {
    // Strict Mode can queue a cleanup close event before reopening the dialog.
    if (!event.currentTarget.open) onDismiss();
  }}
    className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border border-line-strong bg-panel p-6 text-primary shadow-2xl backdrop:bg-black/60">
    <div className="grid gap-5">
      <div><h2 id={titleId} className="text-lg font-semibold">{title}</h2>{description && <p className="mt-1 text-sm text-secondary">{description}</p>}</div>
      {children}
    </div>
  </dialog>;
}

function DiscardWarning({ dirty, projectName }: { dirty: boolean; projectName: string }) {
  return dirty ? <p role="alert" className="rounded-lg border border-amber-400/50 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">⚠ Unsaved changes in “{projectName}” will be discarded.</p> : null;
}

export function NewProjectDialog({ dirty, onDismiss }: { dirty: boolean; onDismiss: () => void }) {
  const currentName = useProjectStore((state) => state.name);
  const [name, setName] = useState("Untitled project");
  const [touched, setTouched] = useState(false);
  const error = validateName(name);
  const inputId = useId();

  return <Modal title="New Project" description="Starts an unsaved project with one scenario, Plan A." onDismiss={onDismiss}>
    <form className="grid gap-5" onSubmit={(event) => {
      event.preventDefault();
      setTouched(true);
      if (error) return;
      useProjectStore.getState().newProject(name);
      onDismiss();
    }}>
      <div className="grid gap-2">
        <label htmlFor={inputId} className="text-[0.72rem] font-semibold text-secondary">Project name</label>
        <input id={inputId} type="text" value={name} autoFocus spellCheck={false} aria-invalid={touched && error !== null} aria-describedby={touched && error ? `${inputId}-error` : undefined}
          className="min-h-11 rounded-lg border border-line-strong bg-control px-[11px] text-sm text-primary aria-invalid:border-red-400"
          onChange={(event) => { setName(event.target.value); setTouched(true); }} />
        {touched && error && <p id={`${inputId}-error`} className="text-xs text-red-300">{error}</p>}
      </div>
      <DiscardWarning dirty={dirty} projectName={currentName} />
      <div className="flex justify-end gap-2">
        <button type="button" className={secondaryButton} onClick={onDismiss}>Cancel</button>
        <button type="submit" className={primaryButton} disabled={touched && error !== null}>Create Project</button>
      </div>
    </form>
  </Modal>;
}

type ListState = { state: "loading" } | { state: "error"; message: string } | { state: "ready"; projects: ProjectSummary[] };

export function OpenProjectDialog({ dirty, onDismiss }: { dirty: boolean; onDismiss: () => void }) {
  const currentName = useProjectStore((state) => state.name);
  const currentId = useProjectStore((state) => state.projectId);
  const [list, setList] = useState<ListState>({ state: "loading" });
  const [openError, setOpenError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    useProjectStore.getState().listProjects().then(
      (projects) => { if (active) setList({ state: "ready", projects }); },
      (error: unknown) => { if (active) setList({ state: "error", message: error instanceof Error ? error.message : "Projects could not be loaded." }); },
    );
    return () => { active = false; };
  }, [attempt]);

  async function open(id: string) {
    setOpening(true);
    setOpenError(null);
    try {
      await useProjectStore.getState().openProject(id);
      onDismiss();
    } catch (error) {
      setOpenError(error instanceof Error ? error.message : "The project could not be opened.");
      setOpening(false);
    }
  }

  return <Modal title="Open Project" description="Choose a saved project. Saved projects last until this page is reloaded." onDismiss={onDismiss}>
    <DiscardWarning dirty={dirty} projectName={currentName} />
    {list.state === "loading" && <p className="text-sm text-secondary" role="status">Loading projects…</p>}
    {list.state === "error" && <div role="alert" className="grid gap-2 text-sm text-red-300">
      <p>{list.message} Your open edits are retained.</p>
      <button type="button" className={`${secondaryButton} justify-self-start`} onClick={() => { setList({ state: "loading" }); setAttempt((value) => value + 1); }}>Retry</button>
    </div>}
    {list.state === "ready" && (list.projects.length
      ? <ul aria-label="Saved projects" className="m-0 grid max-h-72 list-none gap-1.5 overflow-y-auto p-0">
        {list.projects.map((project) => <li key={project.id} className="flex items-center gap-3 rounded-lg border border-line-strong px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" title={project.name}>{project.name}{project.id === currentId && <span className="ml-2 text-xs font-normal text-accent">(open)</span>}</p>
            <p className="text-xs text-secondary">{project.scenarioCount} {project.scenarioCount === 1 ? "scenario" : "scenarios"} · Updated {new Date(project.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
          <button type="button" className={secondaryButton} disabled={opening} aria-label={`Open ${project.name}`} onClick={() => open(project.id)}>Open</button>
        </li>)}
      </ul>
      : <p className="text-sm text-secondary">No saved projects. Create a project and save it to see it here.</p>)}
    {openError && <p role="alert" className="text-sm text-red-300">{openError}</p>}
    <div className="flex justify-end"><button type="button" className={secondaryButton} onClick={onDismiss}>Cancel</button></div>
  </Modal>;
}

export function DeleteScenarioDialog({ scenarioId, onDismiss }: { scenarioId: string; onDismiss: () => void }) {
  const scenario = useProjectStore((state) => state.scenarios.find((item) => item.id === scenarioId));
  if (!scenario) return null;
  return <Modal title="Delete Scenario" description={`Delete “${scenario.name}” and its depot scene? Other scenarios are not affected.`} onDismiss={onDismiss}>
    <div className="flex justify-end gap-2">
      <button type="button" className={secondaryButton} onClick={onDismiss}>Cancel</button>
      <button type="button" className={dangerButton} onClick={() => { useProjectStore.getState().deleteScenario(scenario.id); onDismiss(); }}>Delete Scenario</button>
    </div>
  </Modal>;
}
