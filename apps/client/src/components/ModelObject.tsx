import { Component, useLayoutEffect, useMemo, type ComponentType, type ReactNode } from "react";
import { createProceduralInstance } from "../models/proceduralModel";
import { getDefinition, type ObjectDefinition } from "../scene/catalog";
import type { SceneObject } from "../scene/types";
import { useResolvedModelId } from "../state/presetStore";
import { useSceneStore } from "../state/sceneStore";

class ObjectBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

type RendererProps = { object: SceneObject; definition: ObjectDefinition; selected: boolean };

function ProceduralRenderer({ object, definition, selected }: RendererProps) {
  const instance = useMemo(() => createProceduralInstance(definition.createModel), [definition]);
  useLayoutEffect(() => () => instance.dispose(), [instance]);
  useLayoutEffect(() => { instance.applyAppearance(object.appearance); }, [instance, object.appearance]);

  return <group dispose={null}>
    <primitive object={instance.group} />
    <primitive object={instance.outline} visible={selected} />
  </group>;
}

const renderers: Record<ObjectDefinition["kind"], ComponentType<RendererProps>> = {
  procedural: ProceduralRenderer,
};

export function ModelObject({ object, isClick, selectable = true }: { object: SceneObject; isClick: () => boolean; selectable?: boolean }) {
  const selected = useSceneStore((state) => selectable && state.editor.selectedObjectId === object.id);
  const modelId = useResolvedModelId(object);
  const definition = getDefinition(modelId);
  if (!definition) return null;
  const Renderer = renderers[definition.kind];

  return <group {...object.transform} onClick={(event) => {
    event.stopPropagation();
    if (selectable && isClick()) useSceneStore.getState().selectObject(object.id);
  }}>
    <ObjectBoundary><Renderer object={object} definition={definition} selected={selected} /></ObjectBoundary>
  </group>;
}
