import { useProjectStore } from "../state/projectStore";
import type { EditLifecycle } from "./controls";

export const projectEditLifecycle: EditLifecycle = {
  beginEdit: () => useProjectStore.getState().beginEdit(),
  commitEdit: () => useProjectStore.getState().commitEdit(),
  cancelEdit: () => useProjectStore.getState().cancelEdit(),
};

export const projectEditorEditLifecycle: EditLifecycle = {
  beginEdit: () => useProjectStore.getState().beginEditorEdit(),
  commitEdit: () => useProjectStore.getState().commitEditorEdit(),
  cancelEdit: () => useProjectStore.getState().cancelEditorEdit(),
};
