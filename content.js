const DEFAULT_SETTINGS = {
	enabled: true,
	clientId: "",
	sendFullUrl: false,
	endpoint: "http://127.0.0.1:32145/activity"
};

let lastPayloadKey = "";
let pendingTimer = null;
const SEND_DEBOUNCE_MS = 1200;

function getSettings() {
	return new Promise((resolve) => {
		chrome.storage.local.get(DEFAULT_SETTINGS, (stored) => {
			resolve(stored);
		});
	});
}

function sanitizeUrl(rawUrl, sendFullUrl) {
	try {
		const parsed = new URL(rawUrl);
		return sendFullUrl
			? `${parsed.origin}${parsed.pathname}`
			: parsed.origin;
	} catch {
		return rawUrl || "";
	}
}

async function pushActivity(tab) {
	if (!tab || !tab.url || !tab.title) {
		return;
	}

	const settings = await getSettings();
	if (!settings.enabled) {
		return;
	}

	const payload = {
		title: tab.title,
		url: sanitizeUrl(tab.url, settings.sendFullUrl),
		fullUrl: tab.url,
		clientId: settings.clientId,
		timestamp: Date.now()
	};

	const payloadKey = `${payload.title}|${payload.url}|${payload.clientId}`;
	if (payloadKey === lastPayloadKey) {
		return;
	}
	lastPayloadKey = payloadKey;

	try {
		await fetch(settings.endpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload)
		});
	} catch (error) {
		console.debug("Discord bridge is not reachable:", error);
	}
}

function scheduleSend(tab) {
	if (pendingTimer) {
		clearTimeout(pendingTimer);
	}

	pendingTimer = setTimeout(() => {
		pushActivity(tab);
	}, SEND_DEBOUNCE_MS);
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
	chrome.tabs.get(tabId, (tab) => {
		scheduleSend(tab);
	});
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (!changeInfo.title && !changeInfo.url && changeInfo.status !== "complete") {
		return;
	}
	scheduleSend(tab);
});

chrome.storage.onChanged.addListener((changes, area) => {
	if (area !== "local") {
		return;
	}

	if (changes.enabled || changes.clientId || changes.sendFullUrl) {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs[0]) {
				scheduleSend(tabs[0]);
			}
		});
	}
});