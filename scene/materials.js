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
    skinMaterial: new THREE.MeshStandardMaterial({
      color: 0xd69a72,
      roughness: 0.7,
    }),
    shirtMaterial: new THREE.MeshStandardMaterial({
      color: 0x3d6fa3,
      roughness: 0.75,
    }),
    redShirtMaterial: new THREE.MeshStandardMaterial({
      color: 0xb94a4a,
      roughness: 0.75,
    }),
    greenShirtMaterial: new THREE.MeshStandardMaterial({
      color: 0x43835c,
      roughness: 0.75,
    }),
    examinerJacketMaterial: new THREE.MeshStandardMaterial({
      color: 0x252832,
      roughness: 0.7,
    }),
    trousersMaterial: new THREE.MeshStandardMaterial({
      color: 0x26364a,
      roughness: 0.8,
    }),
    hairMaterial: new THREE.MeshStandardMaterial({
      color: 0x2b1c18,
      roughness: 0.9,
    })
  };
}
