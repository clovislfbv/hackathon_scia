import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export function createControls(camera, renderer, canLock = () => true) {
  const controls = new PointerLockControls(camera, renderer.domElement);
  renderer.domElement.addEventListener("click", (event) => {
    if (canLock(event)) controls.lock();
  });
  return controls;
}
