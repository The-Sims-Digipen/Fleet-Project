import { Component, useCallback, useLayoutEffect, useMemo, type ReactNode } from "react";
import type { Group } from "three";
import { createProceduralInstance } from "../models/proceduralModel";
import { getModelDefinition, type ModelDefinition } from "../scene/catalog";
import { copyTransform } from "../domain/spatial";
import type { ProjectWorldObject } from "../scene/projectWorld";
import type { ProjectEntityReference } from "../domain/project";

class ObjectBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

type RendererProps = { object: ProjectWorldObject; definition: ModelDefinition; selected: boolean };

function ProceduralRenderer({ object, definition, selected }: RendererProps) {
  const instance = useMemo(() => createProceduralInstance(definition.createModel), [definition]);
  useLayoutEffect(() => () => instance.dispose(), [instance]);
  useLayoutEffect(() => { instance.applyTint(object.tint); }, [instance, object.tint]);

  return <group dispose={null}>
    <primitive object={instance.group} />
    <primitive object={instance.outline} visible={selected} />
  </group>;
}

export function ModelObject({ object, isClick, selected, onSelect, registerRoot }: {
  object: ProjectWorldObject;
  isClick: () => boolean;
  selected: boolean;
  onSelect: () => void;
  registerRoot?: (reference: ProjectEntityReference, root: Group | null) => void;
}) {
  const definition = getModelDefinition(object.modelId);
  const transform = copyTransform(object.transform);
  const setRoot = useCallback((root: Group | null) => {
    registerRoot?.(object.reference, root);
  }, [object, registerRoot]);
  if (!definition) return null;

  return <group ref={registerRoot ? setRoot : undefined} {...transform} onClick={(event) => {
    event.stopPropagation();
    if (isClick()) onSelect();
  }}>
    <ObjectBoundary><ProceduralRenderer object={object} definition={definition} selected={selected} /></ObjectBoundary>
  </group>;
}
