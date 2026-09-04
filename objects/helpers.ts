import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

export function addBox(
  parent: THREE.Object3D,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function addCylinder(
  radius: number,
  height: number,
  position: [number, number, number],
  material: THREE.Material,
  parent: THREE.Object3D,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 12),
    material,
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function addSphere(
  radius: number,
  position: [number, number, number],
  material: THREE.Material,
  parent: THREE.Object3D,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 10), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function createCharacterLabel(name: string, role: string, height = 2.2): CSS2DObject {
  const element = document.createElement("div");
  element.className = "character-label";
  element.innerHTML = `<strong>${name}</strong><span>${role}</span>`;
  const label = new CSS2DObject(element);
  label.position.set(0, height, 0);
  return label;
}
