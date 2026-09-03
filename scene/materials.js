import * as THREE from "three";

export function createMaterials() {
  return {
    wall: new THREE.MeshStandardMaterial({
      color: 0xe8dfcf,
      roughness: 0.9,
      side: THREE.BackSide,
    }),
    floor: new THREE.MeshStandardMaterial({
      color: 0x8b735d,
      roughness: 0.85,
      side: THREE.BackSide,
    }),
    wood: new THREE.MeshStandardMaterial({
      color: 0x9b5f35,
      roughness: 0.7,
    }),
    darkWood: new THREE.MeshStandardMaterial({
      color: 0x5b3424,
      roughness: 0.75,
    }),
    white: new THREE.MeshStandardMaterial({
      color: 0xf7f3e8,
      roughness: 0.55,
    }),
    board: new THREE.MeshStandardMaterial({
      color: 0xfaf9f4,
      roughness: 0.4,
    }),
  };
}
