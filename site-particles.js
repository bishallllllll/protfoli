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
        const prefersReducedMotion = window.matchMedia(
          '(prefers-reduced-motion: reduce)',
        ).matches;
        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 120);
        camera.position.z = 11;

        const starLayers = [
          { count: 4200, spread: [20, 22, 14], size: 0.034, opacity: 0.88 },
          { count: 2400, spread: [26, 26, 20], size: 0.055, opacity: 0.38 },
          { count: 1200, spread: [14, 16, 10], size: 0.08, opacity: 0.18 },
        ];

        const starGroups = starLayers.map((layer, layerIndex) => {
          const positions = new Float32Array(layer.count * 3);
          const basePositions = new Float32Array(layer.count * 3);
          const colors = new Float32Array(layer.count * 3);
          const gatherOffsets = new Float32Array(layer.count * 2);

          for (let i = 0; i < layer.count; i += 1) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * layer.spread[0];
            positions[i3 + 1] = (Math.random() - 0.5) * layer.spread[1];
            positions[i3 + 2] = (Math.random() - 0.5) * layer.spread[2];
            basePositions[i3] = positions[i3];
            basePositions[i3 + 1] = positions[i3 + 1];
            basePositions[i3 + 2] = positions[i3 + 2];

            const gatherAngle = Math.random() * Math.PI * 2;
            const gatherRadius = 0.08 + (Math.pow(Math.random(), 1.8) * (0.85 + (layerIndex * 0.2)));
            gatherOffsets[i * 2] = Math.cos(gatherAngle) * gatherRadius;
            gatherOffsets[(i * 2) + 1] = Math.sin(gatherAngle) * gatherRadius;

            const brightness = 0.52 + Math.pow(Math.random(), 1.55) * 0.48;
            const tone = Math.random();
            if (tone < 0.74) {
              colors[i3] = brightness;
              colors[i3 + 1] = brightness;
              colors[i3 + 2] = brightness * 0.99;
            } else if (tone < 0.94) {
              colors[i3] = brightness * 0.7;
              colors[i3 + 1] = brightness * 0.86;
              colors[i3 + 2] = brightness;
            } else {
              colors[i3] = brightness;
              colors[i3 + 1] = brightness * 0.92;
              colors[i3 + 2] = brightness * 0.82;
            }
          }

          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

          const material = new THREE.PointsMaterial({
            size: layer.size,
            transparent: true,
            opacity: layer.opacity,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
          });

          const points = new THREE.Points(geometry, material);
          points.rotation.z = layerIndex * 0.18;
          scene.add(points);
          return {
            points,
            material,
            geometry,
            positions,
            basePositions,
            gatherOffsets,
            depth: layerIndex + 1,
          };
        });

        // A sparse foreground layer gives the field readable motion instead of
        // relying only on the very slow rotation of distant stars.
        const movingParticleCount = 180;
        const movingPositions = new Float32Array(movingParticleCount * 3);
        const movingColors = new Float32Array(movingParticleCount * 3);
        const movingVelocities = [];

        for (let i = 0; i < movingParticleCount; i += 1) {
          const i3 = i * 3;
          movingPositions[i3] = (Math.random() - 0.5) * 18;
          movingPositions[i3 + 1] = (Math.random() - 0.5) * 12;
          movingPositions[i3 + 2] = 1 + (Math.random() * 5);

          const warm = Math.random() > 0.84;
          movingColors[i3] = warm ? 1 : 0.62 + (Math.random() * 0.28);
          movingColors[i3 + 1] = warm ? 0.78 : 0.82 + (Math.random() * 0.18);
          movingColors[i3 + 2] = warm ? 0.48 : 1;
          movingVelocities.push({
            x: 0.08 + (Math.random() * 0.2),
            y: 0.16 + (Math.random() * 0.34),
            phase: Math.random() * Math.PI * 2,
          });
        }

        const movingGeometry = new THREE.BufferGeometry();
        movingGeometry.setAttribute('position', new THREE.BufferAttribute(movingPositions, 3));
        movingGeometry.setAttribute('color', new THREE.BufferAttribute(movingColors, 3));
        const movingMaterial = new THREE.PointsMaterial({
          size: 0.055,
          transparent: true,
          opacity: 0.74,
          vertexColors: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true,
        });
        const movingParticles = new THREE.Points(movingGeometry, movingMaterial);
        scene.add(movingParticles);

        const pointer = { x: 0, y: 0, active: false, strength: 0 };
        let scrollVelocity = 0;
        let previousScrollY = window.scrollY;
        let touchReleaseTimer = 0;

        function resize() {
          const { clientWidth, clientHeight } = sceneRoot;
          renderer.setSize(clientWidth, clientHeight, false);
          camera.aspect = clientWidth / clientHeight;
          camera.updateProjectionMatrix();
        }

        function onPointerMove(event) {
          pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
          pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
          pointer.active = true;
        }

        function onPointerDown(event) {
          onPointerMove(event);
          if (event.pointerType === 'touch') {
            window.clearTimeout(touchReleaseTimer);
          }
        }

        function onPointerUp(event) {
          if (event.pointerType === 'touch') {
            touchReleaseTimer = window.setTimeout(() => {
              pointer.active = false;
            }, 220);
          }
        }

        function onPointerLeave() {
          pointer.active = false;
        }

        function onScroll() {
          const delta = window.scrollY - previousScrollY;
          scrollVelocity = Math.max(-2.2, Math.min(2.2, delta * 0.018));
          previousScrollY = window.scrollY;
        }

        if (!prefersReducedMotion) {
          window.addEventListener('pointermove', onPointerMove, { passive: true });
          window.addEventListener('pointerdown', onPointerDown, { passive: true });
          window.addEventListener('pointerup', onPointerUp, { passive: true });
          window.addEventListener('pointercancel', onPointerUp, { passive: true });
          window.addEventListener('pointerleave', onPointerLeave);
          window.addEventListener('scroll', onScroll, { passive: true });
        }
        window.addEventListener('resize', resize);
        resize();

        const clock = new THREE.Clock();
        let previousElapsed = 0;

        function animate() {
          const elapsed = clock.getElapsedTime();
          const delta = Math.min(elapsed - previousElapsed, 0.04);
          previousElapsed = elapsed;
          pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * 0.085;
          const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * camera.position.z;
          const pointerWorldX = pointer.x * viewHeight * camera.aspect * 0.5;
          const pointerWorldY = -pointer.y * viewHeight * 0.5;

          starGroups.forEach(({
            points,
            material,
            geometry,
            positions,
            basePositions,
            gatherOffsets,
            depth,
          }, index) => {
            const driftX = Math.sin((elapsed * (0.11 + (index * 0.025))) + index) * (0.08 + (index * 0.04));
            const driftY = Math.cos((elapsed * (0.08 + (index * 0.018))) + index) * (0.06 + (index * 0.03));
            points.rotation.y = elapsed * (0.018 + (depth * 0.009));
            points.rotation.z = (index * 0.18) + (elapsed * (0.004 + (index * 0.003)));
            points.rotation.x = Math.sin(elapsed * (0.12 + (depth * 0.018))) * (0.018 + (depth * 0.008));
            points.position.x += ((((pointer.x * (0.18 + (depth * 0.08))) / depth) + driftX) - points.position.x) * 0.022;
            points.position.y += ((((-pointer.y * (0.12 + (depth * 0.06))) / depth) + driftY + (scrollVelocity * 0.12 * depth)) - points.position.y) * 0.022;
            material.opacity = starLayers[index].opacity + (Math.sin((elapsed * 0.9) + (index * 1.4)) * 0.055);

            const gatherAmount = pointer.strength * (0.78 - (index * 0.09));
            const positionAttribute = geometry.getAttribute('position');
            const orbit = elapsed * (0.28 + (index * 0.08));
            const orbitCos = Math.cos(orbit);
            const orbitSin = Math.sin(orbit);
            for (let i = 0; i < starLayers[index].count; i += 1) {
              const i3 = i * 3;
              const i2 = i * 2;
              const targetX = pointerWorldX
                + (gatherOffsets[i2] * orbitCos)
                - (gatherOffsets[i2 + 1] * orbitSin);
              const targetY = pointerWorldY
                + (gatherOffsets[i2] * orbitSin)
                + (gatherOffsets[i2 + 1] * orbitCos);
              const desiredX = basePositions[i3] + ((targetX - basePositions[i3]) * gatherAmount);
              const desiredY = basePositions[i3 + 1] + ((targetY - basePositions[i3 + 1]) * gatherAmount);
              positions[i3] += (desiredX - positions[i3]) * (0.035 + (pointer.strength * 0.055));
              positions[i3 + 1] += (desiredY - positions[i3 + 1]) * (0.035 + (pointer.strength * 0.055));
            }
            positionAttribute.needsUpdate = true;
          });

          const movingPositionAttribute = movingGeometry.getAttribute('position');
          for (let i = 0; i < movingParticleCount; i += 1) {
            const i3 = i * 3;
            const velocity = movingVelocities[i];
            movingPositions[i3] += (
              velocity.x
              + (Math.sin((elapsed * 0.7) + velocity.phase) * 0.08)
              + (scrollVelocity * 0.5)
            ) * delta;
            movingPositions[i3 + 1] += (velocity.y + (scrollVelocity * 1.45)) * delta;

            if (movingPositions[i3 + 1] > 6.4) movingPositions[i3 + 1] = -6.4;
            if (movingPositions[i3 + 1] < -6.4) movingPositions[i3 + 1] = 6.4;
            if (movingPositions[i3] > 9.4) movingPositions[i3] = -9.4;
            if (movingPositions[i3] < -9.4) movingPositions[i3] = 9.4;
          }
          movingPositionAttribute.needsUpdate = true;
          movingParticles.rotation.z = Math.sin(elapsed * 0.09) * 0.035;
          movingMaterial.opacity = 0.68 + (Math.sin(elapsed * 1.25) * 0.1);
          scrollVelocity *= 0.91;

          renderer.render(scene, camera);
          if (!prefersReducedMotion) requestAnimationFrame(animate);
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
