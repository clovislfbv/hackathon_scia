import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101827);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 2.2, -5.1);
camera.lookAt(0, 1.4, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.HemisphereLight(0xbad7ff, 0x182238, 2);
scene.add(ambientLight);

const keyLight = new THREE.PointLight(0xffffff, 20);
keyLight.position.set(0, 3, 0);
keyLight.castShadow = true;
scene.add(keyLight);

const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0xe8dfcf,
  roughness: 0.9,
  side: THREE.BackSide,
});

const floorMaterial = new THREE.MeshStandardMaterial({
  color: 0x8b735d,
  roughness: 0.85,
  side: THREE.BackSide,
});

const woodMaterial = new THREE.MeshStandardMaterial({
  color: 0x9b5f35,
  roughness: 0.7,
});

const darkWoodMaterial = new THREE.MeshStandardMaterial({
  color: 0x5b3424,
  roughness: 0.75,
});

const whiteMaterial = new THREE.MeshStandardMaterial({
  color: 0xf7f3e8,
  roughness: 0.55,
});

const boardMaterial = new THREE.MeshStandardMaterial({
  color: 0xfaf9f4,
  roughness: 0.4,
});

const collisionBoxes = [];
const playerRadius = 0.35;

function addCollisionBox(centerX, centerZ, width, depth) {
  collisionBoxes.push({
    minX: centerX - width / 2,
    maxX: centerX + width / 2,
    minZ: centerZ - depth / 2,
    maxZ: centerZ + depth / 2,
  });
}

function addBox(size, position, material, parent = scene) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createDesk(position, width = 2.5) {
  const desk = new THREE.Group();
  desk.position.set(...position);
  addCollisionBox(position[0], position[2], width, 1.1);
  addBox([width, 0.16, 1.1], [0, 1.05, 0], woodMaterial, desk);
  for (const x of [-width / 2 + 0.14, width / 2 - 0.14]) {
    for (const z of [-0.38, 0.38])
      addBox([0.12, 1.05, 0.12], [x, 0.52, z], darkWoodMaterial, desk);
  }
  scene.add(desk);
}

function createChair(position) {
  const chair = new THREE.Group();
  chair.position.set(...position);
  addCollisionBox(position[0], position[2], 0.85, 0.85);
  addBox([0.85, 0.12, 0.85], [0, 0.58, 0], woodMaterial, chair);
  addBox([0.85, 0.95, 0.12], [0, 1.02, 0.36], darkWoodMaterial, chair);
  for (const x of [-0.32, 0.32]) {
    for (const z of [-0.28, 0.28])
      addBox([0.1, 0.58, 0.1], [x, 0.29, z], darkWoodMaterial, chair);
  }
  scene.add(chair);
}

function createDoor(position) {
  const door = new THREE.Group();
  door.position.set(...position);

  const doorHinge = new THREE.Group();
  doorHinge.position.set(0, 0, -1);
  door.add(doorHinge);

  const doorPanel = new THREE.Group();
  doorPanel.position.set(0, 0, 1);
  addBox([0.1, 3, 2], [0, 0, 0], woodMaterial, doorPanel);
  addBox([0.2, 0.4, 0.2], [0.05, 0, 0.5], whiteMaterial, doorPanel);
  addBox([0.05, 0.05, 0.3], [0.17, 0, 0.6], whiteMaterial, doorPanel);
  doorHinge.add(doorPanel);

  addBox([0.2, 3.2, 0.2], [0.1, 0, 1.1], darkWoodMaterial, door);
  addBox([0.2, 3.2, 0.2], [0.1, 0, -1.1], darkWoodMaterial, door);
  addBox([0.2, 0.2, 2.2], [0.1, 1.6, 0], darkWoodMaterial, door);
  scene.add(door);
  return doorHinge;
}

function createRoom(size, floorMat, wallMat, ceilingMat) {
  const materials = [
    wallMat, // Right wall
    wallMat, // Left wall
    ceilingMat, // Ceiling
    floorMat, // Floor
    wallMat, // Front wall
    wallMat, // Back wall
  ];

  const room = new THREE.Mesh(new THREE.BoxGeometry(...size), materials);
  room.position.set(0, size[1] / 2, 0);
  scene.add(room);
}

function createBoard(size, position, parent = scene) {
  const board = new THREE.Group();
  board.position.set(...position);

  const boardPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(...size),
    boardMaterial,
  );
  boardPlane.rotation.x = 0;
  board.add(boardPlane);
  for (const y of [-size[1] / 2, size[1] / 2])
    addBox([size[0], 0.1, 0.1], [0, y, 0], darkWoodMaterial, board);
  for (const x of [-size[0] / 2, size[0] / 2])
    addBox([0.1, size[1], 0.1], [x, 0, 0], darkWoodMaterial, board);

  parent.add(board);
}

// Create the walls, the ceiling and the floor
createRoom([14, 5, 14], floorMaterial, wallMaterial, floorMaterial);

// Teacher area, directly behind the starting camera position.
createDesk([0, 0, -4.1], 3);

// Create door
const doorHinge = createDoor([-7, 1.5, -4]);

// Four student tables, each with two chairs facing the board.
for (const z of [-1.2, 2.1]) {
  for (const x of [-2.5, 2.5]) {
    createDesk([x, 0, z]);
    createChair([x - 0.58, 0, z + 0.7]);
    createChair([x + 0.58, 0, z + 0.7]);
  }
}

// White board on the front wall, with a simple frame and tray.
createBoard([8, 3], [0, 2.5, -6.9]);

const controls = new PointerLockControls(camera, renderer.domElement);
renderer.domElement.addEventListener("click", () => controls.lock());

const keys = new Set();
let doorOpen = false;
let doorAngle = 0;
const doorWorldPosition = new THREE.Vector3();

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["z", "q", "s", "d"].includes(key)) {
    keys.add(key);
    event.preventDefault();
  }

  doorHinge.getWorldPosition(doorWorldPosition);
  if (
    key === "e" &&
    controls.isLocked &&
    camera.position.distanceTo(doorWorldPosition) < 2.5
  ) {
    doorOpen = !doorOpen;
    event.preventDefault();
  }
});
window.addEventListener("keyup", (event) =>
  keys.delete(event.key.toLowerCase()),
);

function updateDoor(delta) {
  const targetAngle = doorOpen ? Math.PI / 2 : 0;
  doorAngle = THREE.MathUtils.damp(doorAngle, targetAngle, 5, delta);
  doorHinge.rotation.y = doorAngle;
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

function updateMovement(delta) {
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

let previousTime = performance.now();

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", resize);

function animate() {
  const currentTime = performance.now();
  const delta = Math.min((currentTime - previousTime) / 1000, 0.1);
  previousTime = currentTime;
  updateMovement(delta);
  updateDoor(delta);
  renderer.render(scene, camera);

  //   console.log("Position: " + camera.position.toArray() + "    doorhinge: " + doorHinge.position.toArray())
}

renderer.setAnimationLoop(animate);
