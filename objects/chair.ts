import * as THREE from "three";
import { addBox } from "./helpers.js";
import type { createMaterials } from "../scene/materials.js";

type Materials = ReturnType<typeof createMaterials>;

export function createChair(
  parent: THREE.Object3D,
  position: [number, number, number],
  materials: Materials,
  addCollisionBox: (centerX: number, centerZ: number, width: number, depth: number) => void,
): THREE.Group {
  const chair = new THREE.Group();
  chair.position.set(...position);
  addCollisionBox(position[0], position[2], 0.85, 0.85);
  addBox(chair, [0.85, 0.12, 0.85], [0, 0.58, 0], materials.wood);
  addBox(chair, [0.85, 0.95, 0.12], [0, 1.02, 0.36], materials.darkWood);

  for (const x of [-0.32, 0.32]) {
    for (const z of [-0.28, 0.28]) {
      addBox(chair, [0.1, 0.58, 0.1], [x, 0.29, z], materials.darkWood);
    }
  }

  parent.add(chair);
  return chair;
}
