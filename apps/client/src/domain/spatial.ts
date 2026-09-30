export type Vector3 = [number, number, number];
export type Transform = { position: Vector3; rotation: Vector3; scale: Vector3 };

export function copyTransform(value: Readonly<{
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  scale: readonly [number, number, number];
}>): Transform {
  return {
    position: [...value.position],
    rotation: [...value.rotation],
    scale: [...value.scale],
  };
}
