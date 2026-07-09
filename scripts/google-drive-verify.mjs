import { existsSync, readFileSync } from "node:fs";

function loadDotenv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    if (!(key in process.env)) process.env[key] = trimmed.slice(eq + 1);
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function getAccessToken() {
  const body = new URLSearchParams({
    client_id: requiredEnv("GOOGLE_DRIVE_CLIENT_ID"),
    client_secret: requiredEnv("GOOGLE_DRIVE_CLIENT_SECRET"),
    refresh_token: requiredEnv("GOOGLE_DRIVE_REFRESH_TOKEN"),
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Unable to refresh Google access token (${res.status}): ${JSON.stringify(json).slice(0, 240)}`);
  }
  return json.access_token;
}

loadDotenv();

const folderId = requiredEnv("GOOGLE_DRIVE_ARCHIVE_FOLDER_ID");
const accessToken = await getAccessToken();

const fields = [
  "id",
  "name",
  "mimeType",
  "webViewLink",
  "capabilities/canAddChildren",
  "capabilities/canEdit",
].join(",");

const res = await fetch(
  `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?fields=${encodeURIComponent(fields)}&supportsAllDrives=true`,
  {
    headers: { Authorization: `Bearer ${accessToken}` },
  },
);

const json = await res.json();
if (!res.ok) {
  throw new Error(`Unable to read Google Drive folder (${res.status}): ${JSON.stringify(json).slice(0, 240)}`);
}

console.log(JSON.stringify({
  id: json.id,
  name: json.name,
  mimeType: json.mimeType,
  canAddChildren: Boolean(json.capabilities?.canAddChildren),
  canEdit: Boolean(json.capabilities?.canEdit),
  webViewLink: json.webViewLink,
}, null, 2));
