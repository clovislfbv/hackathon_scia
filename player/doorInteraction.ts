import * as THREE from "three";

export function createDoorInteraction(
  camera: THREE.Camera,
  controls: { isLocked: boolean },
  doorHinge: THREE.Object3D,
): { update: (delta: number) => void } {
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

  function update(delta: number): void {
    const targetAngle = doorOpen ? Math.PI / 2 : 0;
    doorAngle = THREE.MathUtils.damp(doorAngle, targetAngle, 5, delta);
    doorHinge.rotation.y = doorAngle;
  }

  return { update };
}
