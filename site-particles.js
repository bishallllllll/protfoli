const canvas = document.querySelector('.site-particles-canvas');

if (canvas) {
  const supportsWebGL = (() => {
    try {
      const probe = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && probe.getContext('webgl'));
    } catch {
      return false;
    }
  })();

  const sceneRoot = document.querySelector('.site-particles-scene');

  if (supportsWebGL && sceneRoot) {
    import('https://unpkg.com/three@0.166.1/build/three.module.js')
      .then((THREE) => {
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 120);
        camera.position.z = 11;

        const ambient = new THREE.AmbientLight(0xffffff, 0.28);
        scene.add(ambient);

        const coolLight = new THREE.PointLight(0x8edaff, 0.28, 18);
        coolLight.position.set(-3.4, 2.2, 6.4);
        scene.add(coolLight);

        const warmLight = new THREE.PointLight(0xdce8ff, 0.16, 16);
        warmLight.position.set(3.6, -1.6, 5.8);
        scene.add(warmLight);

        const particleCount = 4200;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i += 1) {
          const i3 = i * 3;
          positions[i3] = (Math.random() - 0.5) * 20;
          positions[i3 + 1] = (Math.random() - 0.5) * 22;
          positions[i3 + 2] = (Math.random() - 0.5) * 14;

          // Per-star brightness gives crisp depth instead of a uniform haze.
          const brightness = 0.55 + Math.pow(Math.random(), 1.6) * 0.45;
          const tone = Math.random();
          if (tone < 0.78) {
            // Crisp white.
            colors[i3] = brightness;
            colors[i3 + 1] = brightness;
            colors[i3 + 2] = brightness * 0.99;
          } else if (tone < 0.97) {
            // Cool blue.
            colors[i3] = brightness * 0.7;
            colors[i3 + 1] = brightness * 0.86;
            colors[i3 + 2] = brightness;
          } else {
            // Faint warm highlight to echo the accent gradient.
            colors[i3] = brightness;
            colors[i3 + 1] = brightness * 0.92;
            colors[i3 + 2] = brightness * 0.82;
          }
        }

        const particlesGeometry = new THREE.BufferGeometry();
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particlesMaterial = new THREE.PointsMaterial({
          size: 0.038,
          transparent: true,
          opacity: 0.92,
          vertexColors: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);

        const ringGeometry = new THREE.TorusGeometry(4.8, 0.018, 10, 220);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: 0xe8edf5,
          transparent: true,
          opacity: 0.03,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2.6;
        ring.rotation.y = Math.PI / 6;
        ring.position.set(1.2, 0.3, -1);
        scene.add(ring);

        const pointer = { x: 0, y: 0 };

        function resize() {
          const { clientWidth, clientHeight } = sceneRoot;
          renderer.setSize(clientWidth, clientHeight, false);
          camera.aspect = clientWidth / clientHeight;
          camera.updateProjectionMatrix();
        }

        function onPointerMove(event) {
          pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
          pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
        }

        function onPointerLeave() {
          pointer.x = 0;
          pointer.y = 0;
        }

        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerleave', onPointerLeave);
        window.addEventListener('resize', resize);
        resize();

        const clock = new THREE.Clock();

        function animate() {
          const elapsed = clock.getElapsedTime();

          particles.rotation.y = elapsed * 0.006;
          particles.rotation.x = Math.sin(elapsed * 0.03) * 0.018;
          particles.position.x += ((pointer.x * 0.16) - particles.position.x) * 0.016;
          particles.position.y += ((-pointer.y * 0.1) - particles.position.y) * 0.016;

          ring.rotation.z = elapsed * 0.01;
          ring.position.x += (((pointer.x * 0.22) + 1.2) - ring.position.x) * 0.014;
          ring.position.y += (((-pointer.y * 0.12) + 0.3) - ring.position.y) * 0.014;

          coolLight.intensity = 0.28 + Math.sin(elapsed * 0.42) * 0.04;
          warmLight.intensity = 0.18 + Math.cos(elapsed * 0.46) * 0.03;

          // Subtle collective twinkle around a high, crisp baseline.
          particlesMaterial.opacity = 0.88 + ((Math.sin(elapsed * 0.24) + 1) * 0.03);

          renderer.render(scene, camera);
          requestAnimationFrame(animate);
        }

        animate();
      })
      .catch(() => {
        sceneRoot.classList.add('site-particles-fallback');
        canvas.style.display = 'none';
      });
  } else {
    sceneRoot.classList.add('site-particles-fallback');
    canvas.style.display = 'none';
  }
}
