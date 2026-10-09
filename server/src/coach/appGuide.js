/**
 * The in-app how-to guide (quality-of-life wave, ruling 4).
 * Read once at load. A missing or empty file yields "" so help mode
 * still runs on the persona alone.
 */

const fs = require("fs");
const path = require("path");

const GUIDE_PATH = path.join(__dirname, "..", "..", "data", "app-guide.md");

function readGuide() {
  try {
    const text = fs.readFileSync(GUIDE_PATH, "utf8");
    if (typeof text !== "string") return "";
    const trimmed = text.trim();
    return trimmed ? text : "";
  } catch {
    return "";
  }
}

const APP_GUIDE = readGuide();

function getAppGuide() {
  return APP_GUIDE;
}

module.exports = { getAppGuide };
