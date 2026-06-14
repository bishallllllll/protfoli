const canvas = document.querySelector('.hero-canvas');

if (canvas) {
  const supportsWebGL = (() => {
    try {
      const probe = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && probe.getContext('webgl'));
    } catch {
      return false;
    }
  })();

  const sceneRoot = document.querySelector('.three-hero-scene');
  const portraitShell = document.querySelector('.portrait-shell');

  if (supportsWebGL && sceneRoot) {
    import('https://unpkg.com/three@0.166.1/build/three.module.js')
      .then((THREE) => {
        const prefersReducedMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)',
        ).matches;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
        camera.position.z = 9;

        const ambient = new THREE.AmbientLight(0xffffff, 0.35);
        scene.add(ambient);

        const coolLight = new THREE.PointLight(0x8edaff, 0.42, 18);
        coolLight.position.set(-2.6, 1.4, 5.4);
        scene.add(coolLight);

        const warmLight = new THREE.PointLight(0xf1a24e, 0.34, 16);
        warmLight.position.set(2.9, -0.4, 4.4);
        scene.add(warmLight);

        const particleCount = 6000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i += 1) {
          const i3 = i * 3;
          const x = (Math.random() - 0.5) * 9;
          const y = (Math.random() - 0.5) * 11;
          const z = (Math.random() - 0.5) * 9;
          positions[i3] = x;
          positions[i3 + 1] = y;
          positions[i3 + 2] = z;

          // White core with a cool-blue minority for depth and temperature.
          const tone = Math.random();
          if (tone < 0.8) {
            colors[i3] = 1.0;
            colors[i3 + 1] = 1.0;
            colors[i3 + 2] = 0.99;
          } else {
            colors[i3] = 0.68;
            colors[i3 + 1] = 0.85;
            colors[i3 + 2] = 1.0;
          }
        }

        const particlesGeometry = new THREE.BufferGeometry();
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particlesMaterial = new THREE.PointsMaterial({
          size: 0.03,
          transparent: true,
          opacity: 0.42,
          vertexColors: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);

        const arcGeometry = new THREE.TorusGeometry(3.6, 0.014, 10, 220);
        const arcMaterial = new THREE.MeshBasicMaterial({
          color: 0xe8edf5,
          transparent: true,
          opacity: 0.05,
        });
        const arc = new THREE.Mesh(arcGeometry, arcMaterial);
        arc.rotation.x = Math.PI / 2.4;
        arc.rotation.y = Math.PI / 5;
        arc.position.set(1.15, 0.3, -0.5);
        scene.add(arc);

        const pointer = { x: 0, y: 0 };

        function resize() {
          const { clientWidth, clientHeight } = sceneRoot;
          renderer.setSize(clientWidth, clientHeight, false);
          camera.aspect = clientWidth / clientHeight;
          camera.updateProjectionMatrix();
        }

        function onPointerMove(event) {
          const rect = sceneRoot.getBoundingClientRect();
          pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
        }

        function onPointerLeave() {
          pointer.x = 0;
          pointer.y = 0;
        }

        window.addEventListener('resize', resize);
        resize();

        if (prefersReducedMotion) {
          // Honour reduced-motion: render a single crisp, static frame, no parallax.
          renderer.render(scene, camera);
          return;
        }

        sceneRoot.addEventListener('pointermove', onPointerMove);
        sceneRoot.addEventListener('pointerleave', onPointerLeave);

        const clock = new THREE.Clock();

        function animate() {
          const elapsed = clock.getElapsedTime();

          particles.rotation.y = elapsed * 0.006;
          particles.rotation.x = Math.sin(elapsed * 0.03) * 0.022;
          particles.position.x += ((pointer.x * 0.18) - particles.position.x) * 0.024;
          particles.position.y += ((-pointer.y * 0.12) - particles.position.y) * 0.024;

          arc.rotation.z = elapsed * 0.01;
          arc.position.x += (((pointer.x * 0.24) + 1.15) - arc.position.x) * 0.014;
          arc.position.y += (((-pointer.y * 0.12) + 0.3) - arc.position.y) * 0.014;

          coolLight.intensity = 0.34 + Math.sin(elapsed * 0.38) * 0.04;
          warmLight.intensity = 0.24 + Math.cos(elapsed * 0.42) * 0.03;

          particlesMaterial.opacity = 0.34 + ((Math.sin(elapsed * 0.24) + 1) * 0.03);

          if (portraitShell) {
            const tx = pointer.x * 7;
            const ty = pointer.y * -6;
            portraitShell.style.transform = `translate3d(calc(-50% + ${tx}px), ${ty}px, 0)`;
          }

          renderer.render(scene, camera);
          requestAnimationFrame(animate);
        }

        animate();
      })
      .catch(() => {
        canvas.style.display = 'none';
      });
  } else {
    canvas.style.display = 'none';
  }
}
