const PET_PROFILE_KEY = "desktopPetProfile";

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get([PET_PROFILE_KEY], (result) => {
    if (!result[PET_PROFILE_KEY]) {
      chrome.storage.local.set({
        desktopPetSettings: {
          autoShow: false,
          muted: true
        }
      });
    }
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "PET_SHOW_REQUEST") {
    routeToActiveTab("PET_SHOW").then(sendResponse);
    return true;
  }

  if (message?.type === "PET_HIDE_REQUEST") {
    routeToActiveTab("PET_HIDE").then(sendResponse);
    return true;
  }

  return false;
});

async function routeToActiveTab(action) {
  const tabs = await queryTabs({ active: true, lastFocusedWindow: true });
  const tab = tabs[0];
  if (!tab?.id) {
    return { ok: false, error: "No active tab found." };
  }

  if (!tab.url || !/^https?:\/\//.test(tab.url)) {
    return { ok: false, error: "Open a regular webpage first." };
  }

  let profile = null;
  if (action === "PET_SHOW") {
    const result = await storageGet([PET_PROFILE_KEY]);
    profile = result[PET_PROFILE_KEY] || null;
    if (!profile) {
      return { ok: false, error: "Please upload one pet image first." };
    }
  }

  try {
    await sendMessageToTab(tab.id, {
      type: action,
      profile
    });
    return { ok: true };
  } catch (_error) {
    return { ok: false, error: "Cannot connect to this page. Try reloading it." };
  }
}

function queryTabs(queryInfo) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query(queryInfo, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(tabs || []);
    });
  });
}

function storageGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(result || {});
    });
  });
}

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}
