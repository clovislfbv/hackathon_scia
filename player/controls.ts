import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import * as THREE from "three";

export function createControls(
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  canLock: (event: MouseEvent) => boolean = () => true,
): PointerLockControls {
  const controls = new PointerLockControls(camera, renderer.domElement);
  renderer.domElement.addEventListener("click", (event: MouseEvent) => {
    if (canLock(event)) controls.lock();
  });
  return controls;
}
