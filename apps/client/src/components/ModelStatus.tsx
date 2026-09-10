import { getAsset, getDefinition } from "../scene/catalog";
import { modelResources, useModelResource } from "../scene/modelResources";
import type { SceneObject } from "../scene/types";

function AssetStatus({ url }: { url: string }) {
  const resource = useModelResource(url);
  if (resource.status === "ready") return <span>Model ready</span>;
  if (resource.status === "loading") return <span role="status">Loading model…</span>;
  return <span role="alert">Model could not load. <button type="button" className="underline underline-offset-4" onClick={() => modelResources.retry(url)}>Retry</button></span>;
}

export function ModelStatus({ object }: { object: SceneObject }) {
  const definition = getDefinition(object.definitionId);
  const asset = definition && getAsset(definition.assetId);
  return <div className="text-xs text-secondary">{asset ? <AssetStatus url={asset.url} /> : <span role="alert">Unknown object definition or model asset. Update the catalog or delete this object.</span>}</div>;
}
