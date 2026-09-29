import { Component, useCallback, useLayoutEffect, useMemo, type ComponentType, type ReactNode } from "react";
import type { Group } from "three";
import { createProceduralInstance } from "../models/proceduralModel";
import { getDefinition, type ObjectDefinition } from "../scene/catalog";
import { copyTransform, type SceneObject } from "../scene/types";
import type { WorldObjectReference, WorldObjectView } from "../scene/projectWorld";

class ObjectBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

type RenderableObject = SceneObject | WorldObjectView;
type RendererProps = { object: RenderableObject; definition: ObjectDefinition; selected: boolean };

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

export function ModelObject({ object, isClick, selected, onSelect, registerRoot }: {
  object: RenderableObject;
  isClick: () => boolean;
  selected: boolean;
  onSelect: () => void;
  registerRoot?: (reference: WorldObjectReference, root: Group | null) => void;
}) {
  const definitionId = "model" in object ? object.model.definitionId : object.definitionId;
  const definition = getDefinition(definitionId);
  const transform = copyTransform(object.transform);
  const setRoot = useCallback((root: Group | null) => {
    if ("reference" in object) registerRoot?.(object.reference, root);
  }, [object, registerRoot]);
  if (!definition) return null;
  const Renderer = renderers[definition.kind];

  return <group ref={registerRoot ? setRoot : undefined} {...transform} onClick={(event) => {
    event.stopPropagation();
    if (isClick()) onSelect();
  }}>
    <ObjectBoundary><Renderer object={object} definition={definition} selected={selected} /></ObjectBoundary>
  </group>;
}
