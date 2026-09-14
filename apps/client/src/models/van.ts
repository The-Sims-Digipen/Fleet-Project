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

function addMesh(
  group: Group,
  name: string,
  geometry: BufferGeometry,
  material: Material,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0],
) {
  const mesh = new Mesh(geometry, material);

  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  group.add(mesh);

  return mesh;
}

/**
 * Cab wedge.
 *
 * The rear of the cab exactly meets the cargo body, while the front
 * slopes backwards towards the roof to give the van a proper silhouette.
 */
function createCabGeometry() {
  const halfWidth = 0.92;

  const frontBottom = -1.0;
  const frontTop = -0.52;
  const rear = 0.74;
  const height = 1.24;

  const geometry = new BufferGeometry();

  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(
      [
        // Bottom
        -halfWidth, 0, frontBottom, // 0 front-left
         halfWidth, 0, frontBottom, // 1 front-right
        -halfWidth, 0, rear,        // 2 rear-left
         halfWidth, 0, rear,        // 3 rear-right

        // Top
        -halfWidth, height, frontTop, // 4 front-left
         halfWidth, height, frontTop, // 5 front-right
        -halfWidth, height, rear,     // 6 rear-left
         halfWidth, height, rear,     // 7 rear-right
      ],
      3,
    ),
  );

  geometry.setIndex([
    // Bottom — faces down
    0, 1, 2,
    1, 3, 2,

    // Roof — faces up
    4, 6, 5,
    5, 6, 7,

    // Sloped front — faces forwards (-Z)
    0, 4, 5,
    0, 5, 1,

    // Rear — faces backwards (+Z)
    2, 3, 6,
    3, 7, 6,

    // Left side
    0, 2, 4,
    2, 6, 4,

    // Right side
    1, 5, 3,
    3, 5, 7,
  ]);

  geometry.computeVertexNormals();

  return geometry;
}

function createCabSideWindowGeometry() {
  const geometry = new BufferGeometry();

  // Trapezoidal window matching the cab's sloped front.
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(
      [
        0, -0.34, -0.68,
        0, -0.34, 0.5,
        0, 0.34, 0.5,
        0, 0.34, -0.42,
      ],
      3,
    ),
  );

  geometry.setIndex([
    0, 1, 2,
    0, 2, 3,
  ]);

  geometry.computeVertexNormals();

  return geometry;
}

/**
 * Creates a self-contained low-poly delivery van.
 *
 * Units are metres.
 * Y-up.
 * Forward direction is -Z.
 */
export function createVanModel() {
  const van = new Group();
  van.name = "Low-poly van";

  const paint = new MeshStandardMaterial({
    name: "Van paint",
    color: "#55d6be",
    roughness: 0.55,
    metalness: 0.08,
    flatShading: true,
  });

  const windowMaterial = new MeshStandardMaterial({
    name: "Windows",
    color: "#18333d",
    roughness: 0.2,
    metalness: 0.25,
    side: DoubleSide,
  });

  const darkMaterial = new MeshStandardMaterial({
    name: "Tyres and trim",
    color: "#151b1d",
    roughness: 0.82,
    flatShading: true,
  });

  const metalMaterial = new MeshStandardMaterial({
    name: "Wheel hubs",
    color: "#8ca0a0",
    roughness: 0.35,
    metalness: 0.72,
    flatShading: true,
  });

  const headlightMaterial = new MeshStandardMaterial({
    name: "Headlights",
    color: "#fff2ad",
    roughness: 0.25,
  });

  const rearLightMaterial = new MeshStandardMaterial({
    name: "Rear lights",
    color: "#d94343",
    roughness: 0.35,
  });

  /*
   * BODY
   *
   * The cab rear and cargo front now meet almost exactly, making the
   * silhouette look like a single vehicle rather than stacked boxes.
   */

  addMesh(
    van,
    "Lower body",
    new BoxGeometry(1.92, 0.62, 4.55),
    paint,
    [0, 0.72, -0.02],
  );

  addMesh(
    van,
    "Cargo body",
    new BoxGeometry(1.84, 1.24, 2.6),
    paint,
    [0, 1.62, 0.8],
  );

  addMesh(
    van,
    "Cab",
    createCabGeometry(),
    paint,
    [0, 1.0, -1.25],
  );

  /*
   * WINDOWS
   */

  const windshieldAngle = Math.atan2(0.48, 1.24);

  addMesh(
    van,
    "Windshield",
    new PlaneGeometry(1.58, 0.72),
    windowMaterial,
    [0, 1.72, -1.98],
    [windshieldAngle, 0, 0],
  );

  addMesh(
    van,
    "Left cab window",
    createCabSideWindowGeometry(),
    windowMaterial,
    [-0.931, 1.7, -1.25],
  );

  addMesh(
    van,
    "Right cab window",
    createCabSideWindowGeometry(),
    windowMaterial,
    [0.931, 1.7, -1.25],
  );

  /*
   * BUMPERS + TRIM
   */

  addMesh(
    van,
    "Front bumper",
    new BoxGeometry(1.98, 0.17, 0.18),
    darkMaterial,
    [0, 0.5, -2.34],
  );

  addMesh(
    van,
    "Rear bumper",
    new BoxGeometry(1.98, 0.17, 0.18),
    darkMaterial,
    [0, 0.5, 2.3],
  );

  addMesh(
    van,
    "Front grille",
    new BoxGeometry(0.9, 0.25, 0.04),
    darkMaterial,
    [0, 0.82, -2.31],
  );

  /*
   * WHEELS
   */

  const wheelRadius = 0.42;
  const wheelX = 0.99;
  const wheelY = 0.47;

  const wheelPositions = [
    [-wheelX, -1.47],
    [wheelX, -1.47],
    [-wheelX, 1.48],
    [wheelX, 1.48],
  ] as const;

  for (const [x, z] of wheelPositions) {
    const side = x < 0 ? "Left" : "Right";
    const axle = z < 0 ? "front" : "rear";

    addMesh(
      van,
      `${side} ${axle} tyre`,
      new CylinderGeometry(
        wheelRadius,
        wheelRadius,
        0.22,
        12,
      ),
      darkMaterial,
      [x, wheelY, z],
      [0, 0, Math.PI / 2],
    );

    addMesh(
      van,
      `${side} ${axle} hub`,
      new CylinderGeometry(
        0.2,
        0.2,
        0.235,
        12,
      ),
      metalMaterial,
      [x, wheelY, z],
      [0, 0, Math.PI / 2],
    );
  }

  /*
   * LIGHTS
   */

  for (const x of [-0.61, 0.61]) {
    addMesh(
      van,
      x < 0 ? "Left headlight" : "Right headlight",
      new BoxGeometry(0.4, 0.2, 0.045),
      headlightMaterial,
      [x, 0.95, -2.3],
    );
  }

  for (const x of [-0.73, 0.73]) {
    addMesh(
      van,
      x < 0 ? "Left rear light" : "Right rear light",
      new BoxGeometry(0.19, 0.38, 0.045),
      rearLightMaterial,
      [x, 1.04, 2.12],
    );
  }

  /*
   * SIDE DETAILS
   */

  addMesh(
    van,
    "Left sliding door handle",
    new BoxGeometry(0.025, 0.06, 0.28),
    darkMaterial,
    [-0.931, 1.48, 0.48],
  );

  addMesh(
    van,
    "Right sliding door handle",
    new BoxGeometry(0.025, 0.06, 0.28),
    darkMaterial,
    [0.931, 1.48, 0.48],
  );

  return van;
}
