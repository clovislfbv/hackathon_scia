type CollisionBox = { minX: number; maxX: number; minZ: number; maxZ: number };

export function createCollisionSystem(playerRadius = 0.35): {
  addCollisionBox: (centerX: number, centerZ: number, width: number, depth: number) => void;
  collidesAt: (x: number, z: number) => boolean;
} {
  const collisionBoxes: CollisionBox[] = [];

  function addCollisionBox(centerX, centerZ, width, depth) {
    collisionBoxes.push({
      minX: centerX - width / 2,
      maxX: centerX + width / 2,
      minZ: centerZ - depth / 2,
      maxZ: centerZ + depth / 2,
    });
  }

  function collidesAt(x, z) {
    if (x < -6.7 + playerRadius || x > 6.7 - playerRadius) return true;
    if (z < -6.7 + playerRadius || z > 6.7 - playerRadius) return true;

    return collisionBoxes.some(
      ({ minX, maxX, minZ, maxZ }) =>
        x > minX - playerRadius &&
        x < maxX + playerRadius &&
        z > minZ - playerRadius &&
        z < maxZ + playerRadius,
    );
  }

  return { addCollisionBox, collidesAt };
}
