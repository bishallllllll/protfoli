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

        const starLayers = [
          { count: 6200, spread: [9, 11, 9], size: 0.028, opacity: 0.36 },
          { count: 2600, spread: [12, 14, 12], size: 0.05, opacity: 0.2 },
          { count: 1000, spread: [7, 8, 6], size: 0.08, opacity: 0.12 },
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
            const gatherRadius = 0.06 + (Math.pow(Math.random(), 1.8) * (0.55 + (layerIndex * 0.16)));
            gatherOffsets[i * 2] = Math.cos(gatherAngle) * gatherRadius;
            gatherOffsets[(i * 2) + 1] = Math.sin(gatherAngle) * gatherRadius;

            const brightness = 0.72 + Math.pow(Math.random(), 1.5) * 0.28;
            const tone = Math.random();
            if (tone < 0.74) {
              colors[i3] = brightness;
              colors[i3 + 1] = brightness;
              colors[i3 + 2] = brightness * 0.99;
            } else if (tone < 0.94) {
              colors[i3] = brightness * 0.68;
              colors[i3 + 1] = brightness * 0.85;
              colors[i3 + 2] = brightness;
            } else {
              colors[i3] = brightness;
              colors[i3 + 1] = brightness * 0.84;
              colors[i3 + 2] = brightness * 0.72;
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
          points.rotation.z = layerIndex * 0.16;
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

        const pointer = { x: 0, y: 0, active: false, strength: 0 };
        let touchReleaseTimer = 0;

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
          pointer.active = (
            event.clientX >= rect.left
            && event.clientX <= rect.right
            && event.clientY >= rect.top
            && event.clientY <= rect.bottom
          );
        }

        function onPointerDown(event) {
          onPointerMove(event);
          if (event.pointerType === 'touch') window.clearTimeout(touchReleaseTimer);
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

        window.addEventListener('resize', resize);
        resize();

        if (prefersReducedMotion) {
          renderer.render(scene, camera);
          return;
        }

        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerdown', onPointerDown, { passive: true });
        window.addEventListener('pointerup', onPointerUp, { passive: true });
        window.addEventListener('pointercancel', onPointerUp, { passive: true });
        window.addEventListener('pointerleave', onPointerLeave);

        const clock = new THREE.Clock();

        function animate() {
          const elapsed = clock.getElapsedTime();
          pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * 0.09;
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
            points.rotation.y = elapsed * (0.0038 + (depth * 0.0019));
            points.rotation.x = Math.sin(elapsed * (0.026 + (depth * 0.004))) * (0.01 + (depth * 0.006));
            points.position.x += (((pointer.x * (0.1 + (depth * 0.05))) / depth) - points.position.x) * 0.024;
            points.position.y += (((-pointer.y * (0.07 + (depth * 0.04))) / depth) - points.position.y) * 0.024;
            material.opacity = starLayers[index].opacity + (Math.sin((elapsed * 0.24) + (index * 1.35)) * 0.028);

            const gatherAmount = pointer.strength * (0.76 - (index * 0.1));
            const positionAttribute = geometry.getAttribute('position');
            const orbit = elapsed * (0.32 + (index * 0.08));
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
              positions[i3] += (desiredX - positions[i3]) * (0.04 + (pointer.strength * 0.06));
              positions[i3 + 1] += (desiredY - positions[i3 + 1]) * (0.04 + (pointer.strength * 0.06));
            }
            positionAttribute.needsUpdate = true;
          });

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
