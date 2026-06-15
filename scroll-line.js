const line = document.createElement('div');
line.className = 'scroll-line';
line.setAttribute('aria-hidden', 'true');
line.innerHTML = `
  <span class="scroll-line__rail"></span>
  <span class="scroll-line__traveler">
    <span class="scroll-line__head"></span>
  </span>
`;

document.body.append(line);

const traveler = line.querySelector('.scroll-line__traveler');
let frame = 0;

function updateScrollLine() {
  frame = 0;

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
  const travelDistance = Math.max(0, line.clientHeight - traveler.offsetHeight);

  traveler.style.transform = `translate3d(0, ${travelDistance * progress}px, 0)`;
  line.style.setProperty('--scroll-progress', progress);
}

function requestUpdate() {
  if (!frame) {
    frame = requestAnimationFrame(updateScrollLine);
  }
}

window.addEventListener('scroll', requestUpdate, { passive: true });
window.addEventListener('resize', requestUpdate);
window.addEventListener('load', requestUpdate);

updateScrollLine();
