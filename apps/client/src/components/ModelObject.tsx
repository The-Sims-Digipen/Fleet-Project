import { Component, useLayoutEffect, useState, type ComponentType, type ReactNode } from "react";
import type { Object3D } from "three";
import { getAsset, getDefinition } from "../scene/catalog";
import { createModelInstance } from "../scene/modelInstance";
import { modelResources, useModelResource } from "../scene/modelResources";
import type { Appearance, ModelAsset, ObjectDefinition, SceneObject } from "../scene/types";
import { useSceneStore } from "../state/sceneStore";

class ModelBoundary extends Component<{ url: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { modelResources.reportError(this.props.url, error.message); }
  render() { return this.state.failed ? null : this.props.children; }
}

function ModelInstance({ source, appearance, selected }: { source: Object3D; appearance: Appearance; selected: boolean }) {
  const [instance, setInstance] = useState<ReturnType<typeof createModelInstance> | null>(null);
  useLayoutEffect(() => {
    const next = createModelInstance(source);
    setInstance(next);
    return () => next.dispose();
  }, [source]);
  useLayoutEffect(() => { instance?.applyAppearance(appearance); }, [instance, appearance]);
  return instance && <group dispose={null}>
    <primitive object={instance.scene} />
    <primitive object={instance.outline} visible={selected} />
  </group>;
}

type RendererProps = { object: SceneObject; asset: ModelAsset; selected: boolean };
function ModelRenderer({ object, asset, selected }: RendererProps) {
  const resource = useModelResource(asset.url);
  return <ModelBoundary key={`${asset.url}:${resource.attempt}`} url={asset.url}>
    {resource.status === "ready" && <group {...asset.correction}>
      <ModelInstance source={resource.scene} appearance={object.appearance} selected={selected} />
    </group>}
  </ModelBoundary>;
}

const renderers: Record<ObjectDefinition["kind"], ComponentType<RendererProps>> = { model: ModelRenderer };

export function ModelObject({ object, isClick }: { object: SceneObject; isClick: () => boolean }) {
  const selected = useSceneStore((state) => state.editor.selectedObjectId === object.id);
  const definition = getDefinition(object.definitionId);
  const asset = definition && getAsset(definition.assetId);
  if (!definition || !asset) return null;
  const Renderer = renderers[definition.kind];
  return <group {...object.transform} onClick={(event) => {
    event.stopPropagation();
    if (isClick()) useSceneStore.getState().selectObject(object.id);
  }}>
    <Renderer object={object} asset={asset} selected={selected} />
  </group>;
}

