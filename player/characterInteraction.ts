import * as THREE from "three";

export function createCharacterInteraction(
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  controls: { isLocked: boolean },
  characters: THREE.Object3D[],
  onSelect: (characterId: string) => void,
): { pick: () => string | null } {
  const raycaster = new THREE.Raycaster();
  let pointerDown = null;

  function selectedCharacter(object: THREE.Object3D): string | null {
    let current = object;
    while (current) {
      if (current.userData.characterId) return current.userData.characterId;
      current = current.parent;
    }
    return null;
  }

  function pick(): string | null {
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const hit = raycaster.intersectObjects(characters, true)[0];
    return hit ? selectedCharacter(hit.object) : null;
  }

  renderer.domElement.addEventListener("pointerdown", (event) => {
    pointerDown = { x: event.clientX, y: event.clientY };
  });
  renderer.domElement.addEventListener("click", (event) => {
    if (!controls.isLocked) return;
    if (!pointerDown || Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) return;
    const characterId = pick();
    if (!characterId) return;
    event.preventDefault();
    onSelect(characterId);
  }, true);

  return { pick };
}