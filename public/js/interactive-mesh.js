/* Interactive Mesh Gradient cursor response. Background-only; no UI handlers. */
(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if (reducedMotion) return;

  let targetX = window.innerWidth * 0.5;
  let targetY = window.innerHeight * 0.42;
  let currentX = targetX;
  let currentY = targetY;
  let rafId = 0;

  const render = () => {
    // Low-pass interpolation creates gentle trailing without running a
    // permanent animation loop; a new frame is requested only while moving.
    currentX += (targetX - currentX) * 0.085;
    currentY += (targetY - currentY) * 0.085;
    root.style.setProperty('--mesh-cursor-x', `${currentX.toFixed(1)}px`);
    root.style.setProperty('--mesh-cursor-y', `${currentY.toFixed(1)}px`);
    const stage = document.getElementById('stage');
    if (stage) {
      const rect = stage.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const localX = Math.max(0, Math.min(100, ((currentX - rect.left) / rect.width) * 100));
        const localY = Math.max(0, Math.min(100, ((currentY - rect.top) / rect.height) * 100));
        stage.style.setProperty('--mesh-stage-x', `${localX.toFixed(1)}%`);
        stage.style.setProperty('--mesh-stage-y', `${localY.toFixed(1)}%`);
      }
    }

    if (Math.abs(targetX - currentX) > 0.6 || Math.abs(targetY - currentY) > 0.6) {
      rafId = requestAnimationFrame(render);
    } else {
      currentX = targetX;
      currentY = targetY;
      root.style.setProperty('--mesh-cursor-x', `${currentX.toFixed(1)}px`);
      root.style.setProperty('--mesh-cursor-y', `${currentY.toFixed(1)}px`);
      rafId = 0;
    }
  };

  const moveTo = (event) => {
    if (!event || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return;
    targetX = Math.max(0, Math.min(window.innerWidth, event.clientX));
    targetY = Math.max(0, Math.min(window.innerHeight, event.clientY));
    if (!rafId) rafId = requestAnimationFrame(render);
  };

  // Pointer Events support mouse, pen, and touch. These passive listeners do
  // not prevent scrolling, taps, cropping gestures, or native control actions.
  window.addEventListener('pointermove', moveTo, { passive: true });
  window.addEventListener('pointerdown', moveTo, { passive: true });
  window.addEventListener('resize', () => {
    targetX = Math.min(targetX, window.innerWidth);
    targetY = Math.min(targetY, window.innerHeight);
    if (!rafId) rafId = requestAnimationFrame(render);
  }, { passive: true });
  window.addEventListener('blur', () => {
    targetX = window.innerWidth * 0.5;
    targetY = window.innerHeight * 0.42;
    if (!rafId) rafId = requestAnimationFrame(render);
  }, { passive: true });
})();
