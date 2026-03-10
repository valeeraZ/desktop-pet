const PET_PROFILE_KEY = "desktopPetProfile";
const MAX_DIMENSION = 640;

const uploadInput = document.getElementById("pet-upload");
const preview = document.getElementById("preview");
const showBtn = document.getElementById("show-pet");
const hideBtn = document.getElementById("hide-pet");
const statusNode = document.getElementById("status");

init().catch((error) => {
  setStatus(`Init failed: ${error.message}`);
});

async function init() {
  const existing = await readStorage(PET_PROFILE_KEY);
  if (existing) {
    renderPreview(existing.imageDataUrl);
    showBtn.disabled = false;
    setStatus("Saved profile loaded.");
  }

  uploadInput.addEventListener("change", async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    try {
      setStatus("Processing image...");
      const profile = await buildProfile(file);
      await writeStorage({ [PET_PROFILE_KEY]: profile });
      renderPreview(profile.imageDataUrl);
      showBtn.disabled = false;
      setStatus("Profile saved. Click Show pet.");
    } catch (error) {
      setStatus(`Upload failed: ${error.message}`);
    }
  });

  showBtn.addEventListener("click", async () => {
    const response = await sendRuntimeMessage({ type: "PET_SHOW_REQUEST" });
    if (!response || !response.ok) {
      setStatus(response?.error || "Unable to show pet on this tab.");
      return;
    }

    setStatus("Pet shown on active tab.");
  });

  hideBtn.addEventListener("click", async () => {
    const response = await sendRuntimeMessage({ type: "PET_HIDE_REQUEST" });
    if (!response || !response.ok) {
      setStatus(response?.error || "Unable to hide pet.");
      return;
    }

    setStatus("Pet hidden.");
  });
}

function setStatus(text) {
  statusNode.textContent = text;
}

function renderPreview(dataUrl) {
  preview.innerHTML = "";
  const image = document.createElement("img");
  image.alt = "Pet preview";
  image.src = dataUrl;
  preview.appendChild(image);
}

async function buildProfile(file) {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
    throw new Error("Only PNG/JPEG/WEBP is supported in MVP.");
  }

  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: true });
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/webp", 0.88);
  });
  if (!blob) {
    throw new Error("Failed to normalize image.");
  }
  const normalizedDataUrl = await blobToDataUrl(blob);

  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    imageDataUrl: normalizedDataUrl,
    width,
    height
  };
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Cannot convert processed image."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function readStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => resolve(result[key] || null));
  });
}

function writeStorage(payload) {
  return new Promise((resolve) => {
    chrome.storage.local.set(payload, () => resolve());
  });
}

function sendRuntimeMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response);
    });
  });
}
