/**
 * 用 Three.js 生成默认数字人 GLB 并写入 public/avatar.glb
 * 运行：node scripts/generate-avatar.mjs 或 npm run generate-avatar
 */
// Node 下 GLTFExporter 会用到 FileReader，做简易 polyfill
if (typeof FileReader === 'undefined') {
  global.FileReader = class FileReader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((ab) => {
        this.result = ab;
        if (this.onloadend) this.onloadend();
      });
    }
  };
}

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'public', 'avatar.glb');

function mat(color) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.65,
    metalness: 0.08,
  });
}

function buildAvatar() {
  const root = new THREE.Group();
  root.position.set(0, 0.4, 0);
  root.scale.setScalar(1.05);

  // 头部
  const headGeo = new THREE.SphereGeometry(0.28, 32, 32);
  const head = new THREE.Mesh(headGeo, mat('#c9b8a8'));
  head.position.set(0, 1.52, 0);
  root.add(head);

  // 头发（头顶半球）
  const hairGeo = new THREE.SphereGeometry(0.2, 20, 20, 0, Math.PI * 2, 0, Math.PI * 0.45);
  const hair = new THREE.Mesh(hairGeo, mat('#4a3f35'));
  hair.position.set(0, 1.62, -0.08);
  root.add(hair);

  // 左眼
  const eyeGeo = new THREE.SphereGeometry(0.04, 12, 12);
  const leftEye = new THREE.Mesh(eyeGeo, mat('#2c2419'));
  leftEye.position.set(-0.1, 1.56, 0.24);
  root.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo.clone(), mat('#2c2419'));
  rightEye.position.set(0.1, 1.56, 0.24);
  root.add(rightEye);

  // 嘴
  const mouthGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.02, 16);
  const mouth = new THREE.Mesh(mouthGeo, mat('#8b7355'));
  mouth.position.set(0, 1.42, 0.26);
  mouth.rotation.x = Math.PI / 2;
  root.add(mouth);

  // 脖子
  const neckGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.12, 16);
  const neck = new THREE.Mesh(neckGeo, mat('#c9b8a8'));
  neck.position.set(0, 1.22, 0);
  root.add(neck);

  // 躯干
  const torsoGeo = new THREE.BoxGeometry(0.42, 0.5, 0.22);
  const torso = new THREE.Mesh(torsoGeo, mat('#475569'));
  torso.position.set(0, 0.82, 0);
  root.add(torso);

  // 左臂
  const armGeo = new THREE.CylinderGeometry(0.06, 0.05, 0.4, 16);
  const leftArm = new THREE.Mesh(armGeo, mat('#64748b'));
  leftArm.position.set(-0.28, 0.92, 0.06);
  leftArm.rotation.set(0.15, 0, 0.15);
  root.add(leftArm);
  const rightArm = new THREE.Mesh(armGeo.clone(), mat('#64748b'));
  rightArm.position.set(0.28, 0.92, 0.06);
  rightArm.rotation.set(0.15, 0, -0.15);
  root.add(rightArm);

  // 左腿
  const legGeo = new THREE.CylinderGeometry(0.09, 0.07, 0.5, 16);
  const leftLeg = new THREE.Mesh(legGeo, mat('#334155'));
  leftLeg.position.set(-0.12, 0.22, 0.02);
  root.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeo.clone(), mat('#334155'));
  rightLeg.position.set(0.12, 0.22, 0.02);
  root.add(rightLeg);

  return root;
}

async function main() {
  const scene = new THREE.Scene();
  scene.add(buildAvatar());

  const exporter = new GLTFExporter();
  const options = { binary: true };
  const result = await exporter.parseAsync(scene, options);

  if (!(result instanceof ArrayBuffer)) {
    throw new Error('Expected GLB ArrayBuffer');
  }
  fs.writeFileSync(outPath, Buffer.from(result));
  console.log('Generated:', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
