import * as THREE from "three";
import { addBox } from "./helpers.js";

export function createWindow(parent, position, materials) {
  const windowGroup = new THREE.Group();
  windowGroup.position.set(...position);

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x8fc9e8,
    roughness: 0.2,
    metalness: 0.1,
  });
  addBox(windowGroup, [3, 2, 0.08], [0, 0, 0], glassMaterial);
  addBox(windowGroup, [3.2, 0.12, 0.12], [0, 1.06, 0], materials.darkWood);
  addBox(windowGroup, [3.2, 0.12, 0.12], [0, -1.06, 0], materials.darkWood);
  addBox(windowGroup, [0.12, 2.24, 0.12], [-1.56, 0, 0], materials.darkWood);
  addBox(windowGroup, [0.12, 2.24, 0.12], [1.56, 0, 0], materials.darkWood);
  addBox(windowGroup, [0.08, 2, 0.12], [0, 0, 0], materials.darkWood);

  parent.add(windowGroup);
  return windowGroup;
}
