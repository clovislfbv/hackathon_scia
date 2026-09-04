import * as THREE from "three";
import { addBox } from "./helpers.js";
import type { createMaterials } from "../scene/materials.js";

type Materials = ReturnType<typeof createMaterials>;

export function createDesk(
  parent: THREE.Object3D,
  position: [number, number, number],
  materials: Materials,
  addCollisionBox: (centerX: number, centerZ: number, width: number, depth: number) => void,
  width = 2.5,
): THREE.Group {
  const desk = new THREE.Group();
  desk.position.set(...position);
  addCollisionBox(position[0], position[2], width, 1.1);
  addBox(desk, [width, 0.16, 1.1], [0, 1.05, 0], materials.wood);

  for (const x of [-width / 2 + 0.14, width / 2 - 0.14]) {
    for (const z of [-0.38, 0.38]) {
      addBox(desk, [0.12, 1.05, 0.12], [x, 0.52, z], materials.darkWood);
    }
  }

  parent.add(desk);
  return desk;
}
