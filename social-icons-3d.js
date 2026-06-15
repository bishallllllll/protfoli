import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

// Each icon: real brand-logo SVG path data, extruded into a 3D mesh.
const ICONS = [
  {
    id: 'email',
    color: 0xea4335,
    url: 'mailto:bishalarkar443@gmail.com',
    // Material-style envelope: one filled path with the flap as a cutout.
    paths: [
      'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    ],
  },
  {
    id: 'instagram',
    color: 0xe1306c,
    url: 'https://instagram.com/bishal_sarkarr',
    paths: [
      // Rounded-square camera body (outline)
      'M7 1h10a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H7a6 6 0 0 1-6-6V7a6 6 0 0 1 6-6zm0 2a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h10a4 4 0 0 0 4-4V7a4 4 0 0 0-4-4H7z',
      // Lens ring
      'M12 6.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11zm0 2a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7z',
      // Flash dot
      'M17.8 5.2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6z',
    ],
  },
  {
    id: 'github',
    color: 0xf0f0f0,
    url: 'https://github.com/bishallllllll',
    paths: [
      // Octocat silhouette
      'M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.05-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.25 2.87.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.22.7.83.58A12.01 12.01 0 0 0 24 12.5C24 5.87 18.63.5 12 .5z',
    ],
  },
  {
    id: 'linkedin',
    color: 0x0a66c2,
    url: 'https://www.linkedin.com/in/bishal-sarkar-839aa3284/',
    paths: [
      // Rounded badge
      'M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z',
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

function fail() {
  document
    .querySelectorAll('.social-icon-3d')
    .forEach((el) => (el.style.display = 'none'));
  const fallback = document.querySelector('.contact-social-icons-fallback');
  if (fallback) fallback.style.display = 'block';
}

if (document.querySelector('.contact-social-icons') && SUPPORTS_WEBGL) {
  const fallback = document.querySelector('.contact-social-icons-fallback');
  if (fallback) fallback.style.display = 'none';
  const loader = new SVGLoader();
  ICONS.forEach((icon) => {
    const container = document.getElementById(icon.id);
    if (container) buildIcon(container, icon, loader);
  });
} else {
  fail();
}

function buildIcon(container, icon, loader) {
  const size = container.clientWidth || 120;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(size, size);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  container.style.cursor = 'pointer';

  // Build extruded geometry from the SVG paths.
  const logo = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: icon.color,
    metalness: 0.35,
    roughness: 0.4,
  });

  const shapes = [];
  icon.paths.forEach((d) => {
    const parsed = loader.parse(`<svg><path d="${d}"/></svg>`);
    parsed.paths.forEach((p) => {
      p.toShapes(true).forEach((s) => shapes.push(s));
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

  // The logo lives inside a pivot so we can flip/scale it, then recenter the
  // whole thing in the pivot's space (SVG y-axis points down, hence scale.y < 0).
  const pivot = new THREE.Group();
  pivot.add(logo);
  scene.add(pivot);

  const dims = new THREE.Box3().setFromObject(logo).getSize(new THREE.Vector3());
  const fit = 3 / Math.max(dims.x, dims.y);
  logo.scale.set(fit, -fit, fit);

  const center = new THREE.Box3()
    .setFromObject(logo)
    .getCenter(new THREE.Vector3());
  logo.position.set(-center.x, -center.y, -center.z);

  // Lighting that flatters the bevels.
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x88aaff, 0.8);
  rim.position.set(-4, -2, 2);
  scene.add(rim);

  // Pointer-driven tilt.
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
  container.addEventListener('click', () => window.open(icon.url, '_blank'));

  function resize() {
    const s = container.clientWidth || size;
    renderer.setSize(s, s);
  }
  window.addEventListener('resize', resize);

  function animate() {
    requestAnimationFrame(animate);
    pivot.rotation.x += (targetX - pivot.rotation.x) * 0.08;
    pivot.rotation.y += (targetY - pivot.rotation.y) * 0.08;
    if (!hovered && !PREFERS_REDUCED_MOTION) pivot.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
}
