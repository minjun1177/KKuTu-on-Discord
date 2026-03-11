const express = require("express");
const RPC = require("discord-rpc");

const app = express();
app.use(express.json());

const PORT = 32145;
const DEFAULT_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
let currentClientId = DEFAULT_CLIENT_ID;

let rpcClient = null;
let isLoggingIn = false;
let pendingPresence = null;
let flushTimer = null;
const FLUSH_INTERVAL_MS = 1200;

const KKT_URLS = ["kkutu.kr", "kkutu.co.kr", "kkutu.io", "bfkkutu.kr", "mahan.kr", "antu.kro.kr", "legendkkutu.kr", "kkutu-n.xyz", "delzb.app"];
const KKT_TITLE_KEYWORDS = ["KKuTu", "kkutu", "끄투"];

function toSafeText(value, fallback) {
    if (!value || typeof value !== "string") {
        return fallback;
    }
    return value.slice(0, 120);
}

function isKKTurl(url) {
    try {
        const { hostname } = new URL(url);
        return KKT_URLS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
    } catch {
        return KKT_URLS.some((domain) => url.includes(domain));
    }
}

function isKKTtitle(title) {
    return KKT_TITLE_KEYWORDS.some((keyword) => title.includes(keyword));
}

async function ensureRpcConnected(clientId) {
    if (!clientId) {
        throw new Error("Discord Client ID is empty.");
    }

    if (rpcClient && currentClientId === clientId) {
        return rpcClient;
    }

    if (rpcClient && currentClientId !== clientId) {
        try {
            rpcClient.destroy();
        } catch {
            // ignore cleanup errors
        }
        rpcClient = null;
    }

    if (isLoggingIn) {
        return null;
    }

    isLoggingIn = true;
    currentClientId = clientId;

    const client = new RPC.Client({ transport: "ipc" });

    await new Promise((resolve, reject) => {
        client.once("ready", resolve);
        client.login({ clientId }).catch(reject);
    });

    rpcClient = client;
    isLoggingIn = false;
    return rpcClient;
}

async function flushPresence() {
    if (!pendingPresence) {
        return;
    }

    const next = pendingPresence;
    pendingPresence = null;

    try {
        const client = await ensureRpcConnected(next.clientId);
        if (!client) {
            return;
        }

        if (!isKKTurl(next.url) && !isKKTtitle(next.title)) {
            await client.setActivity({
                details: toSafeText("", "Browsing the web"),
                state: toSafeText("", "Not in KKuTu"),
                startTimestamp: next.startTimestamp,
                largeImageKey: "browser",
                largeImageText: "KKuTu Activity",
                instance: false
            }); 
        } else {
            await client.setActivity({
                details: toSafeText(next.title, "Browsing the web"),
                state: toSafeText(next.url, "In KKuTu"),
                startTimestamp: next.startTimestamp,
                largeImageKey: "kkutu",
                largeImageText: "KKuTu Activity",
                instance: false
            });
        }
    } catch (error) {
        console.error("Failed to update Discord presence:", error.message);
    }
}

function scheduleFlush() {
    if (flushTimer) {
        clearTimeout(flushTimer);
    }

    flushTimer = setTimeout(() => {
        flushPresence();
    }, FLUSH_INTERVAL_MS);
}

app.get("/health", (_, res) => {
    res.json({ ok: true, clientId: currentClientId || null });
});

app.post("/activity", (req, res) => {
    const body = req.body || {};
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";

    if (!title || !url) {
        res.status(400).json({ ok: false, error: "title and url are required" });
        return;
    }

    const resolvedClientId = clientId || DEFAULT_CLIENT_ID;
    if (!resolvedClientId) {
        res.status(400).json({ ok: false, error: "clientId is required" });
        return;
    }

    pendingPresence = {
        title,
        url,
        clientId: resolvedClientId,
        startTimestamp: new Date()
    };

    scheduleFlush();
    res.json({ ok: true });
});

app.listen(PORT, "127.0.0.1", () => {
    console.log(`Discord bridge listening at http://127.0.0.1:${PORT}`);
});
