import { Mesh, type BufferGeometry, type Group, type Material } from "three";

type Vector3Tuple = [number, number, number];

export interface AddMeshOptions {
  name: string;
  geometry: BufferGeometry;
  material: Material;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export function addMesh(group: Group, options: AddMeshOptions) {
  const mesh = new Mesh(options.geometry, options.material);

  mesh.name = options.name;
  mesh.position.set(...(options.position ?? [0, 0, 0]));
  mesh.rotation.set(...(options.rotation ?? [0, 0, 0]));
  mesh.scale.set(...(options.scale ?? [1, 1, 1]));
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;

  group.add(mesh);

  return mesh;
}
