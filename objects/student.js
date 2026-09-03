import * as THREE from "three";
import { addBox, addCylinder, addSphere, createCharacterLabel } from "./helpers.js";

export function createSeatedStudent(
  parent,
  position,
  materials,
  upperBodies,
  studentShirtMaterial = materials.shirtMaterial,
  hasAfro = false,
  identity,
) {
  const student = new THREE.Group();
  student.position.set(...position);
  const upperBody = new THREE.Group();
  upperBody.position.set(0, 0.82, 0);
  student.add(upperBody);
  upperBodies.push(upperBody);

  // Hips and legs stay seated facing the board.
  addBox(student, [0.58, 0.22, 0.52], [0, 0.76, -0.06], materials.trousersMaterial);
  // The upper body turns independently to keep eye contact with the user.
  addBox(upperBody, [0.64, 0.75, 0.34], [0, 0.36, -0.08], studentShirtMaterial);
  addCylinder(0.22, 0.12, [0, 0.8, -0.08], materials.skinMaterial, upperBody);
  addCylinder(0.22, 0.38, [0, 0.9, -0.08], materials.skinMaterial, upperBody);
  if (hasAfro) {
    addSphere(0.35, [0, 1.05, -0.22], materials.hairMaterial, upperBody);
  } else {
    addCylinder(0.25, 0.12, [0, 1.14, -0.08], materials.hairMaterial, upperBody);
  }

  // Bent legs: thighs point to the desk, calves return down to the floor.
  for (const x of [-0.18, 0.18]) {
    const thigh = addBox(student, [0.2, 0.2, 0.52], [x, 0.7, -0.29], materials.trousersMaterial);
    thigh.rotation.x = -0.2;
    addBox(student, [0.2, 0.56, 0.2], [x, 0.42, -0.51], materials.trousersMaterial);
    addBox(student, [0.24, 0.12, 0.38], [x, 0.11, -0.62], materials.darkWood);
  }

  // Arms rotate along with the torso.
  for (const x of [-0.4, 0.4]) {
    const arm = addCylinder(0.09, 0.62, [x, 0.36, -0.25], studentShirtMaterial, upperBody);
    arm.rotation.x = -0.8;
    addCylinder(0.09, 0.16, [x, 0.16, -0.5], materials.skinMaterial, upperBody).rotation.x = -0.8;
  }

  if (identity) student.add(createCharacterLabel(identity.name, identity.role, identity.labelHeight));
  parent.add(student);
  return student;
}