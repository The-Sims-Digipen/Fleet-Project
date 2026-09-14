import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  type Material,
} from "three";

function addMesh(group: Group, name: string, geometry: BufferGeometry, material: Material, position: [number, number, number], rotation: [number, number, number] = [0, 0, 0]) {
  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function createCabGeometry() {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute([
    -0.9, 0, -0.9, 0.9, 0, -0.9, -0.9, 0, 0.9, 0.9, 0, 0.9,
    -0.9, 1, -0.5, 0.9, 1, -0.5, -0.9, 1, 0.9, 0.9, 1, 0.9,
  ], 3));
  geometry.setIndex([
    0, 2, 1, 1, 2, 3,
    4, 5, 6, 5, 7, 6,
    0, 1, 4, 1, 5, 4,
    2, 6, 3, 3, 6, 7,
    0, 4, 2, 2, 4, 6,
    1, 3, 5, 3, 7, 5,
  ]);
  geometry.computeVertexNormals();
  return geometry;
}

/** Creates a new, self-contained low-poly van in metres, Y-up and facing -Z. */
export function createVanModel() {
  const van = new Group();
  van.name = "Low-poly van";

  const paint = new MeshStandardMaterial({ name: "Van paint", color: "#55d6be", roughness: 0.55, metalness: 0.08, flatShading: true });
  const windowMaterial = new MeshStandardMaterial({ name: "Windows", color: "#18333d", roughness: 0.2, metalness: 0.25, side: DoubleSide });
  const darkMaterial = new MeshStandardMaterial({ name: "Tyres and trim", color: "#151b1d", roughness: 0.82, flatShading: true });
  const metalMaterial = new MeshStandardMaterial({ name: "Wheel hubs", color: "#8ca0a0", roughness: 0.35, metalness: 0.72, flatShading: true });
  const headlightMaterial = new MeshStandardMaterial({ name: "Headlights", color: "#fff2ad", roughness: 0.25 });
  const rearLightMaterial = new MeshStandardMaterial({ name: "Rear lights", color: "#d94343", roughness: 0.35 });

  addMesh(van, "Lower body", new BoxGeometry(1.9, 0.8, 4.5), paint, [0, 0.88, 0]);
  addMesh(van, "Cargo body", new BoxGeometry(1.86, 1.22, 2.45), paint, [0, 1.77, 0.78]);
  addMesh(van, "Cab", createCabGeometry(), paint, [0, 1.15, -1.3]);
  addMesh(van, "Front bumper", new BoxGeometry(1.96, 0.18, 0.18), darkMaterial, [0, 0.62, -2.34]);
  addMesh(van, "Rear bumper", new BoxGeometry(1.96, 0.18, 0.18), darkMaterial, [0, 0.62, 2.34]);

  const windshieldAngle = Math.atan2(0.4, 1);
  addMesh(van, "Windshield", new PlaneGeometry(1.55, 0.72), windowMaterial, [0, 1.66, -1.99], [-windshieldAngle, Math.PI, 0]);
  addMesh(van, "Left cab window", new BoxGeometry(0.025, 0.62, 0.72), windowMaterial, [-0.912, 1.63, -1.24]);
  addMesh(van, "Right cab window", new BoxGeometry(0.025, 0.62, 0.72), windowMaterial, [0.912, 1.63, -1.24]);

  for (const x of [-0.99, 0.99]) {
    for (const z of [-1.45, 1.45]) {
      addMesh(van, `${x < 0 ? "Left" : "Right"} ${z < 0 ? "front" : "rear"} tyre`, new CylinderGeometry(0.43, 0.43, 0.22, 10), darkMaterial, [x, 0.48, z], [0, 0, Math.PI / 2]);
      addMesh(van, `${x < 0 ? "Left" : "Right"} ${z < 0 ? "front" : "rear"} hub`, new CylinderGeometry(0.2, 0.2, 0.235, 10), metalMaterial, [x, 0.48, z], [0, 0, Math.PI / 2]);
    }
  }

  for (const x of [-0.62, 0.62]) addMesh(van, "Headlight", new BoxGeometry(0.42, 0.22, 0.04), headlightMaterial, [x, 0.88, -2.27]);
  for (const x of [-0.72, 0.72]) addMesh(van, "Rear light", new BoxGeometry(0.22, 0.35, 0.04), rearLightMaterial, [x, 1.02, 2.27]);

  return van;
}
