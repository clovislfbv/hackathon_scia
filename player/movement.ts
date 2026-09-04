import * as THREE from "three";

export function createMovement(
  camera: THREE.Camera,
  controls: { isLocked: boolean },
  collidesAt: (x: number, z: number) => boolean,
): { update: (delta: number) => void } {
  const keys = new Set<string>();

  function isEditableTarget(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      (target.matches("input, textarea, select") || target.isContentEditable)
    );
  }

  window.addEventListener("keydown", (event) => {
    if (isEditableTarget(event.target)) return;
    const key = event.key.toLowerCase();
    if (["z", "q", "s", "d"].includes(key)) {
      keys.add(key);
      event.preventDefault();
    }
  });
  window.addEventListener("keyup", (event) =>
    keys.delete(event.key.toLowerCase()),
  );

  function update(delta: number): void {
    if (!controls.isLocked) return;

    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();

    const right = new THREE.Vector3(-direction.z, 0, direction.x);
    const movement = new THREE.Vector3();
    if (keys.has("z")) movement.add(direction);
    if (keys.has("s")) movement.sub(direction);
    if (keys.has("d")) movement.add(right);
    if (keys.has("q")) movement.sub(right);
    if (movement.lengthSq() === 0) return;

    movement.normalize().multiplyScalar(3 * delta);
    const nextX = camera.position.x + movement.x;
    const nextZ = camera.position.z + movement.z;
    if (!collidesAt(nextX, camera.position.z)) camera.position.x = nextX;
    if (!collidesAt(camera.position.x, nextZ)) camera.position.z = nextZ;
  }

  return { update };
}
