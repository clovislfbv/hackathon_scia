import * as THREE from "three";

export function createRoom(
  scene: THREE.Scene,
  size: [number, number, number],
  floorMaterial: THREE.Material,
  wallMaterial: THREE.Material,
  ceilingMaterial: THREE.Material,
): void {
  const materials = [
    wallMaterial,
    wallMaterial,
    ceilingMaterial,
    floorMaterial,
    wallMaterial,
    wallMaterial,
  ];

  const room = new THREE.Mesh(new THREE.BoxGeometry(...size), materials);
  room.position.set(0, size[1] / 2, 0);
  scene.add(room);
}
