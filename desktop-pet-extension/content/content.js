const PANEL_ID = "desktop-pet-mvp-panel";

let controller = null;
let panelNode = null;
let canvasNode = null;
let titleNode = null;
let toyBtn = null;
let pauseBtn = null;
let dragCleanup = null;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "PET_SHOW") {
    mountPanel(message.profile)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "PET_HIDE") {
    unmountPanel();
    sendResponse({ ok: true });
    return false;
  }

  return false;
});

async function mountPanel(profile) {
  if (!panelNode) {
    panelNode = buildPanel();
    document.documentElement.appendChild(panelNode);
  }

  panelNode.hidden = false;

  if (!controller) {
    controller = new window.DesktopPetEngine(canvasNode, profile);
    await controller.init();
  } else {
    await controller.loadProfile(profile);
    controller.setPaused(false);
  }

  titleNode.textContent = "Desktop Pet MVP";
}

function unmountPanel() {
  if (controller) {
    controller.stop();
    controller = null;
  }

  if (panelNode) {
    panelNode.remove();
    panelNode = null;
    canvasNode = null;
    toyBtn = null;
    pauseBtn = null;
    titleNode = null;
  }

  if (dragCleanup) {
    dragCleanup();
    dragCleanup = null;
  }
}

function buildPanel() {
  const panel = document.createElement("section");
  panel.id = PANEL_ID;
  panel.innerHTML = `
    <header class="desktop-pet-header">
      <strong id="desktop-pet-title">Desktop Pet MVP</strong>
      <div class="desktop-pet-actions">
        <button id="desktop-pet-toy" title="Toggle toy mode">Toy</button>
        <button id="desktop-pet-pause" title="Pause animation">Pause</button>
        <button id="desktop-pet-close" title="Close">x</button>
      </div>
    </header>
    <canvas id="desktop-pet-canvas" width="320" height="180"></canvas>
    <p class="desktop-pet-hint">Click pet to force jump. Toggle Toy and move cursor inside panel.</p>
  `;

  canvasNode = panel.querySelector("#desktop-pet-canvas");
  titleNode = panel.querySelector("#desktop-pet-title");
  toyBtn = panel.querySelector("#desktop-pet-toy");
  pauseBtn = panel.querySelector("#desktop-pet-pause");
  const closeBtn = panel.querySelector("#desktop-pet-close");

  let toyEnabled = false;
  let paused = false;

  toyBtn.addEventListener("click", () => {
    if (!controller) return;
    toyEnabled = !toyEnabled;
    controller.setToyMode(toyEnabled);
    toyBtn.classList.toggle("active", toyEnabled);
  });

  pauseBtn.addEventListener("click", () => {
    if (!controller) return;
    paused = !paused;
    controller.setPaused(paused);
    pauseBtn.textContent = paused ? "Resume" : "Pause";
  });

  closeBtn.addEventListener("click", () => {
    unmountPanel();
  });

  canvasNode.addEventListener("mousemove", (event) => {
    if (!controller || !toyEnabled) return;
    const point = projectPoint(event, canvasNode);
    controller.onPointerMove(point.x, point.y);
  });

  canvasNode.addEventListener("click", (event) => {
    if (!controller) return;
    const point = projectPoint(event, canvasNode);
    controller.onCanvasClick(point.x, point.y);
  });

  dragCleanup = setupDrag(panel, panel.querySelector(".desktop-pet-header"));
  return panel;
}

function setupDrag(panel, handle) {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  const onMouseDown = (event) => {
    dragging = true;
    const rect = panel.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    panel.classList.add("dragging");
  };

  const onMouseMove = (event) => {
    if (!dragging) return;
    const maxX = window.innerWidth - panel.offsetWidth;
    const maxY = window.innerHeight - panel.offsetHeight;
    const nextX = clamp(event.clientX - offsetX, 8, Math.max(8, maxX - 8));
    const nextY = clamp(event.clientY - offsetY, 8, Math.max(8, maxY - 8));
    panel.style.left = `${nextX}px`;
    panel.style.top = `${nextY}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  };

  const onMouseUp = () => {
    if (!dragging) return;
    dragging = false;
    panel.classList.remove("dragging");
  };

  handle.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  return () => {
    handle.removeEventListener("mousedown", onMouseDown);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };
}

function projectPoint(event, target) {
  const rect = target.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * target.width,
    y: ((event.clientY - rect.top) / rect.height) * target.height
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
