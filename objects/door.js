import * as THREE from "three";
import { addBox } from "./helpers.js";

export function createDoor(parent, position, materials) {
  const door = new THREE.Group();
  door.position.set(...position);

  const doorHinge = new THREE.Group();
  doorHinge.position.set(0, 0, -1);
  door.add(doorHinge);

  const doorPanel = new THREE.Group();
  doorPanel.position.set(0, 0, 1);
  addBox(doorPanel, [0.1, 3, 2], [0, 0, 0], materials.wood);
  addBox(doorPanel, [0.2, 0.4, 0.2], [0.05, 0, 0.5], materials.white);
  addBox(doorPanel, [0.05, 0.05, 0.3], [0.17, 0, 0.6], materials.white);
  doorHinge.add(doorPanel);

  addBox(door, [0.2, 3.2, 0.2], [0.1, 0, 1.1], materials.darkWood);
  addBox(door, [0.2, 3.2, 0.2], [0.1, 0, -1.1], materials.darkWood);
  addBox(door, [0.2, 0.2, 2.2], [0.1, 1.6, 0], materials.darkWood);
  parent.add(door);

  return doorHinge;
}
