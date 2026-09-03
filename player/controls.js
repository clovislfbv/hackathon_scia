import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export function createControls(camera, renderer) {
  const controls = new PointerLockControls(camera, renderer.domElement);
  renderer.domElement.addEventListener("click", () => controls.lock());
  return controls;
}
