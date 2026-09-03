import * as THREE from "three";

export function createDoorInteraction(camera, controls, doorHinge) {
  let doorOpen = false;
  let doorAngle = 0;
  const doorWorldPosition = new THREE.Vector3();

  window.addEventListener("keydown", (event) => {
    if (
      event.key.toLowerCase() === "e" &&
      controls.isLocked &&
      camera.position.distanceTo(doorHinge.getWorldPosition(doorWorldPosition)) < 2.5
    ) {
      doorOpen = !doorOpen;
      event.preventDefault();
    }
  });

  function update(delta) {
    const targetAngle = doorOpen ? Math.PI / 2 : 0;
    doorAngle = THREE.MathUtils.damp(doorAngle, targetAngle, 5, delta);
    doorHinge.rotation.y = doorAngle;
  }

  return { update };
}
