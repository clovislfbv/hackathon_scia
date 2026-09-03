import * as THREE from "three";
import { addBox } from "./helpers.js";

export function createBoard(parent, size, position, materials, addCollisionBox) {
  const board = new THREE.Group();
  board.position.set(...position);
  addCollisionBox(position[0], position[2], size[0], 0.2);

  const boardPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(...size),
    materials.board,
  );
  board.add(boardPlane);

  for (const y of [-size[1] / 2, size[1] / 2]) {
    addBox(board, [size[0], 0.1, 0.1], [0, y, 0], materials.darkWood);
  }
  for (const x of [-size[0] / 2, size[0] / 2]) {
    addBox(board, [0.1, size[1], 0.1], [x, 0, 0], materials.darkWood);
  }

  parent.add(board);
  return board;
}
