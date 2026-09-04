import * as THREE from "three";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { addLighting } from "./scene/lighting.js";
import { createMaterials } from "./scene/materials.js";
import { createRoom } from "./scene/room.js";
import {
  createBoard,
  createChair,
  createDesk,
  createDoor,
  createSeatedStudent,
  createWindow
} from "./objects/index.js";
import {
  createCharacterInteraction,
  createCollisionSystem,
  createControls,
  createDoorInteraction,
  createGameplay,
  createMovement,
} from "./player/index.js";
import { createConversation } from "./chat/conversation.js";

// Setting up the scene
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
const upperBodies: THREE.Group[] = [];
const interactiveCharacters: THREE.Group[] = [];
const students: THREE.Group[] = [];
const lookTarget = new THREE.Vector3();

const collisionSystem = createCollisionSystem();
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

// White board on the front wall, with a simple frame and tray.
createBoard(
  scene,
  [8, 3],
  [0, 2.5, -6.9],
  materials,
  collisionSystem.addCollisionBox,
);

// Create window
createWindow(scene, [4.5, 3.2, 6.9], materials);

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

// Three students seated in the first row, facing the board.
const alex = createSeatedStudent(scene, [-3.08, 0, -0.5], materials, upperBodies, materials.shirtMaterial, false, { name: "Alex", role: "L'intello" });
alex.userData.characterId = "alex";
interactiveCharacters.push(alex);
students.push(alex);

const lucas = createSeatedStudent(scene, [1.92, 0, -0.5], materials, upperBodies, materials.redShirtMaterial, false, { name: "Lucas", role: "Le perturbateur" });
lucas.userData.characterId = "lucas";
interactiveCharacters.push(lucas);
students.push(lucas);

const sam = createSeatedStudent(scene, [3.08, 0, -0.5], materials, upperBodies, materials.greenShirtMaterial, false, { name: "Sam", role: "Le perdu" });
sam.userData.characterId = "sam";
interactiveCharacters.push(sam);
students.push(sam);

// The examiner observes the lesson from the last row.
const vautier = createSeatedStudent(scene, [3.08, 0, 2.8], materials, upperBodies, materials.examinerJacketMaterial, true, {
  name: "M. Vautier",
  role: "Examinateur",
  labelHeight: 2.35,
});
vautier.userData.characterId = "vautier";
interactiveCharacters.push(vautier);

const controls = createControls(camera, renderer, (event) => !event.defaultPrevented);
const movement = createMovement(camera, controls, collisionSystem.collidesAt);
const doorInteraction = createDoorInteraction(camera, controls, doorHinge);
let onBriefingComplete = () => {};
let onClassroomResponse = (_answer: string) => {};
const conversation = createConversation({
  controls,
  onBriefingComplete: () => onBriefingComplete(),
  onClassroomResponse: (answer: string) => onClassroomResponse(answer),
});
const gameplay = createGameplay({ conversation, students });
onBriefingComplete = gameplay.briefingComplete;
onClassroomResponse = gameplay.classroomResponse;
gameplay.start();
createCharacterInteraction(camera, renderer, controls, interactiveCharacters, (characterId) => {
  conversation.openDirect(characterId);
});

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.className = "character-labels";
labelRenderer.domElement.style.position = "fixed";
labelRenderer.domElement.style.inset = "0";
labelRenderer.domElement.style.pointerEvents = "none";
document.body.appendChild(labelRenderer.domElement);

let previousTime = performance.now();

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", resize);

function updateCharacterGaze() {
  for (const upperBody of upperBodies) {
    upperBody.getWorldPosition(lookTarget);
    upperBody.lookAt(camera.position.x, lookTarget.y, camera.position.z);
  }
}

function animate() {
  const currentTime = performance.now();
  const delta = Math.min((currentTime - previousTime) / 1000, 0.1);
  previousTime = currentTime;
  movement.update(delta);
  doorInteraction.update(delta);
  updateCharacterGaze();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
