import * as THREE from "three";
import { addLighting } from "./scene/lighting.js";
import { createMaterials } from "./scene/materials.js";
import { createRoom } from "./scene/room.js";
import {
  createBoard,
  createChair,
  createDesk,
  createDoor,
  createWindow,
} from "./objects/index.js";
import {
  createCollisionSystem,
  createControls,
  createDoorInteraction,
  createMovement,
} from "./player/index.js";

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

const materials = createMaterials();
addLighting(scene);

const collisionSystem = createCollisionSystem();
createRoom(
  scene,
  [14, 5, 14],
  materials.floor,
  materials.wall,
  materials.floor,
);

// Create the walls, the ceiling and the floor
createRoom(
  scene,
  [14, 5, 14],
  materials.floor,
  materials.wall,
  materials.floor,
);

// Teacher area, directly behind the starting camera position.
createDesk(scene, [0, 0, -4.1], materials, collisionSystem.addCollisionBox, 3);

// Create door
const doorHinge = createDoor(scene, [-7, 1.5, -4], materials);

// Four student tables, each with two chairs facing the board.
for (const z of [-1.2, 2.1]) {
  for (const x of [-2.5, 2.5]) {
    createDesk(scene, [x, 0, z], materials, collisionSystem.addCollisionBox);
    createChair(
      scene,
      [x - 0.58, 0, z + 0.7],
      materials,
      collisionSystem.addCollisionBox,
    );
    createChair(
      scene,
      [x + 0.58, 0, z + 0.7],
      materials,
      collisionSystem.addCollisionBox,
    );
  }
}

// White board on the front wall, with a simple frame and tray.
createBoard(
  scene,
  [8, 3],
  [0, 2.5, -6.9],
  materials,
  collisionSystem.addCollisionBox,
);
createWindow(scene, [4.5, 3.2, 6.9], materials);

const controls = createControls(camera, renderer);
const movement = createMovement(camera, controls, collisionSystem.collidesAt);
const doorInteraction = createDoorInteraction(camera, controls, doorHinge);

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
  movement.update(delta);
  doorInteraction.update(delta);
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
