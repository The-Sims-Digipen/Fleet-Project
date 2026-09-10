import { useEffect, useId, useRef, useState } from "react";
import { objectDefinitions } from "../scene/catalog";
import { useSceneStore } from "../state/sceneStore";
import { CollapsibleSection } from "./CollapsibleSection";

const actionClass = "min-h-8 rounded border border-line-strong px-2.5 text-xs font-semibold text-secondary enabled:hover:bg-white/5 enabled:hover:text-primary disabled:cursor-default disabled:opacity-40";

function AddObjectDialog({ onDismiss }: { onDismiss: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [definitionId, setDefinitionId] = useState<string>(Object.keys(objectDefinitions)[0] ?? "");
  const dismiss = () => { dialog.current?.close(); onDismiss(); };
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);

  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); dismiss(); }} onClose={(event) => {
    // Strict Mode can queue a cleanup close event before reopening the dialog.
    if (!event.currentTarget.open) onDismiss();
  }}
    className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl border border-line-strong bg-panel p-6 text-primary shadow-2xl backdrop:bg-black/60">
    <form className="grid gap-5" onSubmit={(event) => {
      event.preventDefault();
      if (!Object.hasOwn(objectDefinitions, definitionId)) return;
      useSceneStore.getState().addObject(definitionId);
      dismiss();
    }}>
      <div><h2 id={titleId} className="text-lg font-semibold">Add Object</h2><p className="mt-1 text-sm text-secondary">What would you like to add to the world?</p></div>
      <fieldset className="m-0 grid max-h-60 gap-1.5 overflow-y-auto border-0 p-1">
        <legend className="sr-only">Object type</legend>
        {Object.entries(objectDefinitions).map(([id, definition]) => <label key={id} className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line-strong px-3 py-2 has-checked:border-accent has-checked:bg-accent/10">
          <input type="radio" name="object-type" value={id} checked={definitionId === id} onChange={() => setDefinitionId(id)} className="accent-accent" />
          <span className="text-sm">{definition.name}</span>
        </label>)}
        {!Object.keys(objectDefinitions).length && <p className="text-sm text-secondary">No object types available.</p>}
      </fieldset>
      <div className="flex justify-end gap-2">
        <button type="button" className={actionClass} onClick={dismiss}>Cancel</button>
        <button type="submit" disabled={!definitionId} className="min-h-9 rounded bg-accent px-4 text-xs font-bold text-accent-ink disabled:opacity-40">Create Object</button>
      </div>
    </form>
  </dialog>;
}

export function WorldObjects() {
  const objects = useSceneStore((state) => state.document.objects);
  const selectedId = useSceneStore((state) => state.editor.selectedObjectId);
  const selectObject = useSceneStore((state) => state.selectObject);
  const deleteObject = useSceneStore((state) => state.deleteObject);
  const [adding, setAdding] = useState(false);
  const hasSelection = objects.some((object) => object.id === selectedId);

  return <CollapsibleSection title="World Objects" defaultOpen onBeforeCollapse={() => useSceneStore.getState().commitEdit()}>
    <div className="overflow-hidden rounded border border-line-strong bg-control">
      <div className="flex items-center gap-1.5 border-b border-line-strong px-2 py-1.5">
        <button type="button" className={actionClass} onClick={() => { useSceneStore.getState().commitEdit(); setAdding(true); }}>Add Object</button>
        <button type="button" className={actionClass} disabled={!hasSelection} onClick={() => { if (selectedId) deleteObject(selectedId); }}>Delete Object</button>
        <span className="ml-auto text-xs text-secondary">{objects.length}</span>
      </div>
      <div className="h-44 overflow-y-auto overscroll-contain p-1">
        {objects.length ? <ul aria-label="World objects" className="m-0 list-none p-0">
          {objects.map((object, index) => <li key={object.id}>
            <button type="button" aria-label={`Select ${object.name}, object ${index + 1}`} aria-pressed={object.id === selectedId}
              className="flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-xs text-secondary hover:bg-white/5 aria-pressed:bg-accent/15 aria-pressed:text-primary"
              onClick={() => selectObject(object.id)}>
              <span aria-hidden="true" className="shrink-0 text-accent">◇</span>
              <span className="min-w-0 flex-1 truncate" title={object.name}>{object.name}</span>
              <span aria-hidden="true" className="shrink-0 font-mono text-[10px] opacity-60">{index + 1}</span>
            </button>
          </li>)}
        </ul> : <p className="px-2 py-4 text-xs text-secondary">No objects in the world. Click Add Object to get started.</p>}
      </div>
      <div className="flex items-center justify-between border-t border-line-strong px-2 py-1 text-[11px] text-secondary">
        <span>{objects.length} {objects.length === 1 ? "object" : "objects"}</span>
        <button type="button" className="min-h-6 hover:text-primary disabled:opacity-40" disabled={!hasSelection} onClick={() => selectObject(null)}>Clear selection</button>
      </div>
    </div>
    {adding && <AddObjectDialog onDismiss={() => setAdding(false)} />}
  </CollapsibleSection>;
}
