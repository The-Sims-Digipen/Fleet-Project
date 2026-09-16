import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  type Material,
} from "three";

function addMesh(
  group: Group,
  name: string,
  geometry: BoxGeometry | PlaneGeometry,
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

function addParkingBay(
  depot: Group,
  x: number,
  z: number,
  width: number,
  length: number,
  lineMaterial: Material,
) {
  const lineWidth = 0.08;
  const lineHeight = 0.012;

  addMesh(
    depot,
    "Parking bay line",
    new BoxGeometry(lineWidth, lineHeight, length),
    lineMaterial,
    [x - width / 2, lineHeight / 2, z],
  );

  addMesh(
    depot,
    "Parking bay line",
    new BoxGeometry(lineWidth, lineHeight, length),
    lineMaterial,
    [x + width / 2, lineHeight / 2, z],
  );

  addMesh(
    depot,
    "Parking bay end",
    new BoxGeometry(width, lineHeight, lineWidth),
    lineMaterial,
    [x, lineHeight / 2, z + length / 2],
  );
}

/**
 * Creates a simple low-poly fleet depot.
 *
 * Y-up.
 *
 * Designed so vehicles can be added separately and positioned
 * inside the parking bays.
 */
export function createDepotModel() {
  const depot = new Group();
  depot.name = "Depot";

  const groundMaterial = new MeshStandardMaterial({
    name: "Depot ground",
    color: "#45494b",
    roughness: 0.95,
  });

  const buildingMaterial = new MeshStandardMaterial({
    name: "Depot building",
    color: "#b9bfc0",
    roughness: 0.8,
  });

  const roofMaterial = new MeshStandardMaterial({
    name: "Depot roof",
    color: "#656b6d",
    roughness: 0.85,
  });

  const windowMaterial = new MeshStandardMaterial({
    name: "Building windows",
    color: "#253b43",
    roughness: 0.25,
    metalness: 0.1,
  });

  const doorMaterial = new MeshStandardMaterial({
    name: "Depot doors",
    color: "#596163",
    roughness: 0.75,
  });

  const parkingLineMaterial = new MeshStandardMaterial({
    name: "Parking lines",
    color: "#eeeeea",
    roughness: 0.75,
  });

  const roadLineMaterial = new MeshStandardMaterial({
    name: "Road lines",
    color: "#e2c552",
    roughness: 0.7,
  });

  const curbMaterial = new MeshStandardMaterial({
    name: "Curbs",
    color: "#aeb2b2",
    roughness: 0.9,
  });

  // ---------------------------------------------------------------------------
  // Ground
  // ---------------------------------------------------------------------------

  const depotWidth = 30;
  const depotLength = 34;

  addMesh(
    depot,
    "Ground",
    new BoxGeometry(depotWidth, 0.2, depotLength),
    groundMaterial,
    [0, -0.1, 0],
  );

  // ---------------------------------------------------------------------------
  // Depot building
  // ---------------------------------------------------------------------------

  const buildingWidth = 20;
  const buildingDepth = 6;
  const buildingHeight = 4.5;

  const buildingZ = 13;

  addMesh(
    depot,
    "Depot building",
    new BoxGeometry(
      buildingWidth,
      buildingHeight,
      buildingDepth,
    ),
    buildingMaterial,
    [0, buildingHeight / 2, buildingZ],
  );

  // Roof
  addMesh(
    depot,
    "Depot roof",
    new BoxGeometry(
      buildingWidth + 0.4,
      0.25,
      buildingDepth + 0.4,
    ),
    roofMaterial,
    [0, buildingHeight + 0.125, buildingZ],
  );

  // ---------------------------------------------------------------------------
  // Garage doors
  // ---------------------------------------------------------------------------

  const garageDoorWidth = 4;
  const garageDoorHeight = 3.2;

  for (const x of [-5, 0, 5]) {
    addMesh(
      depot,
      "Garage door",
      new BoxGeometry(
        garageDoorWidth,
        garageDoorHeight,
        0.06,
      ),
      doorMaterial,
      [x, garageDoorHeight / 2, buildingZ - buildingDepth / 2 - 0.031],
    );
  }

  // ---------------------------------------------------------------------------
  // Office windows
  // ---------------------------------------------------------------------------

  for (const x of [-8.3, 8.3]) {
    addMesh(
      depot,
      "Office window",
      new BoxGeometry(1.8, 1.3, 0.06),
      windowMaterial,
      [x, 2.4, buildingZ - buildingDepth / 2 - 0.032],
    );
  }

  // ---------------------------------------------------------------------------
  // Parking bays
  // ---------------------------------------------------------------------------

  const bayWidth = 2.8;
  const bayLength = 5.5;

  const columns = 5;
  const spacing = 3.2;

  const leftRowZ = -7;
  const rightRowZ = 1;

  for (let i = 0; i < columns; i++) {
    const x =
      (i - (columns - 1) / 2) * spacing;

    addParkingBay(
      depot,
      x,
      leftRowZ,
      bayWidth,
      bayLength,
      parkingLineMaterial,
    );

    addParkingBay(
      depot,
      x,
      rightRowZ,
      bayWidth,
      bayLength,
      parkingLineMaterial,
    );
  }

  // ---------------------------------------------------------------------------
  // Main driving lane
  // ---------------------------------------------------------------------------

  const laneZ = -3;

  addMesh(
    depot,
    "Road centre line",
    new BoxGeometry(18, 0.015, 0.08),
    roadLineMaterial,
    [0, 0.01, laneZ],
  );

  // ---------------------------------------------------------------------------
  // Curbs
  // ---------------------------------------------------------------------------

  addMesh(
    depot,
    "Left curb",
    new BoxGeometry(0.3, 0.18, depotLength),
    curbMaterial,
    [-depotWidth / 2 + 0.15, 0.09, 0],
  );

  addMesh(
    depot,
    "Right curb",
    new BoxGeometry(0.3, 0.18, depotLength),
    curbMaterial,
    [depotWidth / 2 - 0.15, 0.09, 0],
  );

  addMesh(
    depot,
    "Rear curb",
    new BoxGeometry(depotWidth, 0.18, 0.3),
    curbMaterial,
    [0, 0.09, -depotLength / 2 + 0.15],
  );

  return depot;
}
