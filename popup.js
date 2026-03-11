const DEFAULT_SETTINGS = {
  enabled: true,
  clientId: "",
  sendFullUrl: false
};

function setStatus(message, isError = false) {
  const statusEl = document.getElementById("status");
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b91c1c" : "#166534";
}

function loadSettings() {
  chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
    document.getElementById("enabled").checked = settings.enabled;
    document.getElementById("clientId").value = settings.clientId;
    document.getElementById("sendFullUrl").checked = settings.sendFullUrl;
  });
}

function saveSettings() {
  const enabled = document.getElementById("enabled").checked;
  const clientId = document.getElementById("clientId").value.trim();
  const sendFullUrl = document.getElementById("sendFullUrl").checked;

  chrome.storage.local.set({ enabled, clientId, sendFullUrl }, () => {
    setStatus("설정이 저장되었습니다.");
    setTimeout(() => setStatus(""), 1800);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();
  document.getElementById("saveButton").addEventListener("click", saveSettings);
});
