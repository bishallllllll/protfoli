import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

// Each landing icon: a real glyph SVG path extruded into a floating 3D mesh
// that links to its page. Colours echo the site's per-page accent variables.
const ICONS = [
  {
    id: 'landing-about',
    color: 0x58d4ff,
    url: 'about.html',
    // Person glyph
    paths: [
      'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-4.42 0-8 2.91-8 6.5V22h16v-1.5c0-3.59-3.58-6.5-8-6.5z',
    ],
  },
  {
    id: 'landing-projects',
    color: 0xffb956,
    url: 'projects.html',
    // Stacked layers glyph
    paths: [
      'M12 2 2 7l10 5 10-5-10-5zM2 12l10 5 10-5M2 17l10 5 10-5',
    ],
    outline: true,
  },
  {
    id: 'landing-blog',
    color: 0xb176ff,
    url: 'blog.html',
    // Pen / write glyph
    paths: [
      'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    ],
  },
  {
    id: 'landing-contact',
    color: 0xff6d53,
    url: 'contact.html',
    // Envelope glyph
    paths: [
      'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    ],
  },
];

const SUPPORTS_WEBGL = (() => {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && c.getContext('webgl'));
  } catch {
    return false;
  }
})();

const PREFERS_REDUCED_MOTION = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches;

const block = document.querySelector('.landing-icon-block');

if (block && SUPPORTS_WEBGL) {
  block.classList.add('is-3d-active');
  const loader = new SVGLoader();
  ICONS.forEach((icon, i) => {
    const container = document.getElementById(icon.id);
    if (container) buildIcon(container, icon, loader, i);
  });
}
// If WebGL is missing the block keeps its plain text-card markup as the fallback.

function buildIcon(container, icon, loader, index) {
  const size = container.clientWidth || 150;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5.5;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(size, size);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const pivot = new THREE.Group();
  const logo = new THREE.Group();
  pivot.add(logo);
  scene.add(pivot);

  const material = new THREE.MeshStandardMaterial({
    color: icon.color,
    metalness: 0.4,
    roughness: 0.35,
  });

  const shapes = [];
  icon.paths.forEach((d) => {
    const parsed = loader.parse(`<svg><path d="${d}"/></svg>`);
    parsed.paths.forEach((p) => {
      const made = icon.outline
        ? SVGLoader.createShapes(p)
        : p.toShapes(true);
      made.forEach((s) => shapes.push(s));
    });
  });

  shapes.forEach((shape) => {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 4,
      bevelEnabled: true,
      bevelThickness: 1,
      bevelSize: 0.6,
      bevelSegments: 3,
      curveSegments: 12,
    });
    logo.add(new THREE.Mesh(geo, material));
  });

  // Centre the logo within the pivot (SVG y-axis points down -> scale.y < 0).
  const dims = new THREE.Box3().setFromObject(logo).getSize(new THREE.Vector3());
  const fit = 2.8 / Math.max(dims.x, dims.y);
  logo.scale.set(fit, -fit, fit);
  const center = new THREE.Box3()
    .setFromObject(logo)
    .getCenter(new THREE.Vector3());
  logo.position.set(-center.x, -center.y, -center.z);

  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 0.8);
  rim.position.set(-4, -2, 2);
  scene.add(rim);

  let targetX = 0;
  let targetY = 0;
  let hovered = false;

  container.addEventListener('mouseenter', () => (hovered = true));
  container.addEventListener('mouseleave', () => {
    hovered = false;
    targetX = 0;
    targetY = 0;
  });
  container.addEventListener('mousemove', (e) => {
    if (!hovered) return;
    const r = container.getBoundingClientRect();
    targetY = ((e.clientX - (r.left + r.width / 2)) / r.width) * 0.9;
    targetX = (-(e.clientY - (r.top + r.height / 2)) / r.height) * 0.9;
  });
  container.addEventListener('click', () => {
    window.location.href = icon.url;
  });

  function resize() {
    const s = container.clientWidth || size;
    renderer.setSize(s, s);
  }
  window.addEventListener('resize', resize);

  // Each icon bobs on its own phase so they float out of sync.
  const phase = index * 1.7;
  let frame = 0;

  function animate() {
    requestAnimationFrame(animate);
    frame += 1;
    pivot.rotation.x += (targetX - pivot.rotation.x) * 0.08;
    pivot.rotation.y += (targetY - pivot.rotation.y) * 0.08;
    if (!hovered && !PREFERS_REDUCED_MOTION) {
      pivot.rotation.y += 0.008;
      const t = frame * 0.018 + phase;
      pivot.position.y = Math.sin(t) * 0.22;
      pivot.position.x = Math.cos(t * 0.6) * 0.08;
    }
    renderer.render(scene, camera);
  }
  animate();
}
