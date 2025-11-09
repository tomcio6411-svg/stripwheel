import * as THREE from 'https://unpkg.com/three@0.159.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.159.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.159.0/examples/jsm/loaders/GLTFLoader.js';

const canvas3d = document.getElementById('three-canvas');
const wheelCanvas = document.getElementById('wheelCanvas');
const loadBtn = document.getElementById('loadBtn');
const spinBtn = document.getElementById('spinBtn');
const genderSelect = document.getElementById('genderSelect');
const limitSelect = document.getElementById('limitSelect');
const logArea = document.getElementById('logArea');

let renderer, scene, camera, controls, modelRoot;
let meshMap = {};
let removedLayersCount = 0;

initThree();
drawWheelInitial();

loadBtn.addEventListener('click', () => {
  const gender = genderSelect.value;
  const url = gender === 'female'
    ? 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF-Binary/BrainStem.glb'
    : 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb';
  loadModel(url);
});

spinBtn.addEventListener('click', () => {
  if (!modelRoot) {
    log('Najpierw wczytaj model!');
    return;
  }
  spinWheelAndApply();
});

function initThree() {
  renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
  renderer.setSize(canvas3d.clientWidth, canvas3d.clientHeight, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(45, canvas3d.clientWidth / canvas3d.clientHeight, 0.1, 100);
  camera.position.set(0, 1.6, 3);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.update();

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(3, 5, 4);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));

  window.addEventListener('resize', onWindowResize);
  animate();
}

function onWindowResize() {
  const w = canvas3d.clientWidth;
  const h = canvas3d.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

function loadModel(url) {
  log(`Wczytywanie modelu: ${url}`);
  const loader = new GLTFLoader();
  loader.load(url, (gltf) => {
    if (modelRoot) scene.remove(modelRoot);
    modelRoot = gltf.scene;
    modelRoot.position.set(0, 0, 0);
    scene.add(modelRoot);
    log('Model wczytany!');
  });
}

const wheel = {
  ctx: wheelCanvas.getContext('2d'),
  segments: [
    { label: '-0', value: 0 },
    { label: '-1', value: 1 },
    { label: '-2', value: 2 },
    { label: '-3', value: 3 },
  ],
  angle: 0,
  spinning: false,
};

function drawWheelInitial() {
  const ctx = wheel.ctx;
  const w = wheelCanvas.width;
  const h = wheelCanvas.height;
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.45;
  const seg = wheel.segments.length;

  for (let i = 0; i < seg; i++) {
    const start = (i / seg) * Math.PI * 2 + wheel.angle;
    const end = ((i + 1) / seg) * Math.PI * 2 + wheel.angle;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? '#333' : '#555';
    ctx.fill();
    ctx.strokeStyle = '#111';
    ctx.stroke();
    ctx.save();
    ctx.translate(cx, cy);
    const mid = (start + end) / 2;
    ctx.rotate(mid);
    ctx.fillStyle = '#fff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(wheel.segments[i].label, r - 10, 5);
    ctx.restore();
  }
}

function spinWheelAndApply() {
  if (wheel.spinning) return;
  wheel.spinning = true;
  const segCount = wheel.segments.length;
  const targetIndex = Math.floor(Math.random() * segCount);
  const rotations = 4 + Math.floor(Math.random() * 3);
  const segAngle = (2 * Math.PI) / segCount;
  const finalAngle = -(targetIndex + 0.5) * segAngle;
  const startAngle = wheel.angle;
  const endAngle = rotations * 2 * Math.PI + finalAngle;
  const duration = 2500;
  const startTime = performance.now();

  function animateSpin(now) {
    const t = Math.min(1, (now - startTime) / duration);
    const e = 1 - Math.pow(1 - t, 3);
    wheel.angle = startAngle + (endAngle - startAngle) * e;
    drawWheelInitial();
    if (t < 1) requestAnimationFrame(animateSpin);
    else {
      wheel.spinning = false;
      const landedIndex = Math.floor((wheel.angle / (2 * Math.PI) * segCount)) % segCount;
      const outcome = wheel.segments[(segCount - landedIndex) % segCount];
      log(`Wynik: ${outcome.label}`);
    }
  }
  requestAnimationFrame(animateSpin);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function log(msg) {
  const time = new Date().toLocaleTimeString('pl-PL');
  logArea.textContent = `[${time}] ${msg}\n` + logArea.textContent;
}
