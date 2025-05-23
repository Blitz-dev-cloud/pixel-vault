// utils/orbitControls.js
import * as THREE from "three";

export function createOrbitControls(camera, renderer) {
  let isMouseDown = false;
  let mouseX = 0;
  let mouseY = 0;
  let theta = 0;
  let phi = Math.PI / 2;
  let distance = 15;
  const spherical = new THREE.Spherical();
  const target = new THREE.Vector3(0, 0, 0);

  const onMouseDown = (event) => {
    isMouseDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
  };

  const onMouseUp = () => {
    isMouseDown = false;
  };

  const onMouseMove = (event) => {
    if (!isMouseDown) return;
    const deltaX = event.clientX - mouseX;
    const deltaY = event.clientY - mouseY;
    theta -= deltaX * 0.01;
    phi += deltaY * 0.01;
    phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));
    mouseX = event.clientX;
    mouseY = event.clientY;
  };

  const onWheel = (event) => {
    distance += event.deltaY * 0.01;
    distance = Math.max(5, Math.min(30, distance));
  };

  const update = () => {
    spherical.set(distance, phi, theta);
    const position = new THREE.Vector3().setFromSpherical(spherical);
    position.add(target);
    camera.position.copy(position);
    camera.lookAt(target);
  };

  renderer.domElement.addEventListener("mousedown", onMouseDown);
  renderer.domElement.addEventListener("mouseup", onMouseUp);
  renderer.domElement.addEventListener("mousemove", onMouseMove);
  renderer.domElement.addEventListener("wheel", onWheel);

  return {
    update,
    dispose: () => {
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      renderer.domElement.removeEventListener("mouseup", onMouseUp);
      renderer.domElement.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("wheel", onWheel);
    },
  };
}
