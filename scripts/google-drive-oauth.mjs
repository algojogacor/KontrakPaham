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

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] || "";
}

function extractCode(input) {
  if (!input) return "";
  if (!input.startsWith("http")) return input.trim();
  const url = new URL(input);
  return url.searchParams.get("code") || "";
}

loadDotenv();

const clientId = requiredEnv("GOOGLE_DRIVE_CLIENT_ID");
const clientSecret = requiredEnv("GOOGLE_DRIVE_CLIENT_SECRET");
const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI ||
  "http://localhost:3000/api/google-drive/oauth/callback";
const scope = process.env.GOOGLE_DRIVE_SCOPE ||
  "https://www.googleapis.com/auth/drive";

if (process.argv.includes("--auth-url")) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scope);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  console.log(url.toString());
  process.exit(0);
}

const code = extractCode(readArg("--code") || readArg("--callback"));
if (!code) {
  console.error("Usage:");
  console.error("  node scripts/google-drive-oauth.mjs --auth-url");
  console.error("  node scripts/google-drive-oauth.mjs --code \"PASTE_CODE_OR_CALLBACK_URL\"");
  process.exit(1);
}

const body = new URLSearchParams({
  client_id: clientId,
  client_secret: clientSecret,
  code,
  grant_type: "authorization_code",
  redirect_uri: redirectUri,
});

const res = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body,
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  throw new Error(`Token response was not JSON: ${text.slice(0, 240)}`);
}

if (!res.ok) {
  throw new Error(`Token exchange failed (${res.status}): ${JSON.stringify(json).slice(0, 400)}`);
}

if (!json.refresh_token) {
  console.log("Access token received, but no refresh_token was returned.");
  console.log("Re-run --auth-url and make sure the generated URL includes prompt=consent and access_type=offline.");
  process.exit(0);
}

console.log("Add this to .env and Koyeb:");
console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${json.refresh_token}`);
console.log(`GOOGLE_DRIVE_SCOPE=${scope}`);
