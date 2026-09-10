"""Generate the original, uncompressed sample GLB using only Python's standard library.

The sample is authored for this repository: a 2.4 m safety bollard with a
round base, teal body, and two reflective bands. Y-up; origin at base centre.
Run from any directory with Python 3. No external art or licensed inputs.
"""
import json
import math
import struct
from pathlib import Path

binary = bytearray()
views = []
accessors = []
meshes = []
nodes = []


def accessor(values, component, shape, bounds=False):
    while len(binary) % 4:
        binary.append(0)
    offset = len(binary)
    flat = [n for row in values for n in row]
    binary.extend(struct.pack("<" + ("f" if component == 5126 else "H") * len(flat), *flat))
    views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(binary) - offset})
    result = {"bufferView": len(views) - 1, "componentType": component, "count": len(values), "type": shape}
    if bounds:
        result.update(min=[min(row[i] for row in values) for i in range(3)], max=[max(row[i] for row in values) for i in range(3)])
    accessors.append(result)
    return len(accessors) - 1


def cylinder(name, radius, bottom, top, material):
    positions, normals, indices = [], [], []
    segments = 32
    for i in range(segments):
        a, b = 2 * math.pi * i / segments, 2 * math.pi * (i + 1) / segments
        ca, sa, cb, sb = math.cos(a), math.sin(a), math.cos(b), math.sin(b)
        start = len(positions)
        positions.extend([(radius * ca, bottom, radius * sa), (radius * ca, top, radius * sa), (radius * cb, top, radius * sb), (radius * cb, bottom, radius * sb)])
        normals.extend([(ca, 0, sa), (ca, 0, sa), (cb, 0, sb), (cb, 0, sb)])
        indices.extend([(start,), (start + 1,), (start + 2,), (start,), (start + 2,), (start + 3,)])
        for height, sign in [(bottom, -1), (top, 1)]:
            start = len(positions)
            positions.extend([(0, height, 0), (radius * ca, height, radius * sa), (radius * cb, height, radius * sb)])
            normals.extend([(0, sign, 0)] * 3)
            indices.extend([(start,), (start + (2 if sign == 1 else 1),), (start + (1 if sign == 1 else 2),)])
    meshes.append({"name": name, "primitives": [{"attributes": {"POSITION": accessor(positions, 5126, "VEC3", True), "NORMAL": accessor(normals, 5126, "VEC3")}, "indices": accessor(indices, 5123, "SCALAR"), "material": material}]})
    nodes.append({"name": name, "mesh": len(meshes) - 1})


cylinder("Weighted base", 0.48, 0, 0.18, 0)
cylinder("Teal body", 0.23, 0.18, 2.32, 1)
cylinder("Lower reflector", 0.235, 1.65, 1.82, 2)
cylinder("Upper reflector", 0.235, 2.03, 2.20, 2)
cylinder("Metal cap", 0.25, 2.32, 2.4, 0)

document = {
    "asset": {"version": "2.0", "generator": "Fleet Project original sample generator"},
    "scene": 0, "scenes": [{"nodes": list(range(len(nodes)))}],
    "nodes": nodes, "meshes": meshes, "bufferViews": views, "accessors": accessors,
    "buffers": [{"byteLength": len(binary)}],
    "materials": [
        {"name": "Brushed metal", "pbrMetallicRoughness": {"baseColorFactor": [0.24, 0.3, 0.32, 1], "metallicFactor": 0.7, "roughnessFactor": 0.4}},
        {"name": "Teal coating", "pbrMetallicRoughness": {"baseColorFactor": [0.08, 0.62, 0.46, 1], "metallicFactor": 0.1, "roughnessFactor": 0.5}},
        {"name": "Reflective ivory", "pbrMetallicRoughness": {"baseColorFactor": [0.95, 0.88, 0.61, 1], "metallicFactor": 0.15, "roughnessFactor": 0.25}},
    ],
}
encoded = json.dumps(document, separators=(",", ":")).encode()
encoded += b" " * (-len(encoded) % 4)
binary.extend(b"\0" * (-len(binary) % 4))
payload = struct.pack("<II", len(encoded), 0x4E4F534A) + encoded + struct.pack("<II", len(binary), 0x004E4942) + binary
target = Path(__file__).resolve().parents[1] / "public/models/sample-bollard.glb"
target.parent.mkdir(parents=True, exist_ok=True)
target.write_bytes(struct.pack("<III", 0x46546C67, 2, 12 + len(payload)) + payload)
print(f"Wrote {target} ({target.stat().st_size} bytes)")
