import { ipcMain, app, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import activeWin from "active-win";
import Store from "electron-store";
createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const store = new Store();
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let trackingInterval = null;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  win.setMenu(null);
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
async function trackActiveWindow() {
  try {
    const result = await activeWin();
    if (!result) return;
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const logs = store.get("logs") || {};
    if (!logs[today]) {
      logs[today] = {};
    }
    const appName = result.owner.name;
    logs[today][appName] = (logs[today][appName] || 0) + 5;
    store.set("logs", logs);
  } catch (err) {
    console.error("Tracking error:", err);
  }
}
ipcMain.handle("get-logs", () => {
  return store.get("logs") || {};
});
ipcMain.handle("get-categories", () => {
  return store.get("categories") || {};
});
ipcMain.handle("set-category", (_, appName, category) => {
  const categories = store.get("categories") || {};
  categories[appName] = category;
  store.set("categories", categories);
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  createWindow();
  trackingInterval = setInterval(trackActiveWindow, 5e3);
});
app.on("will-quit", () => {
  if (trackingInterval) clearInterval(trackingInterval);
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
