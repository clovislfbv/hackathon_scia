import * as THREE from "three";

export function addLighting(scene: THREE.Scene): void {
  const ambientLight = new THREE.HemisphereLight(0xbad7ff, 0x182238, 2);
  scene.add(ambientLight);

  const keyLight = new THREE.PointLight(0xffffff, 20);
  keyLight.position.set(0, 3, 0);
  keyLight.castShadow = true;
  scene.add(keyLight);
}
