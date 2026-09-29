import { http } from "./http.js";

export function createBlockTemplate(body) {
  return http("/block-templates", {
    method: "POST",
    body,
  });
}

export function getMyBlockTemplates() {
  return http("/block-templates/mine");
}

export function getPublicBlockTemplates() {
  return http("/block-templates/public");
}

export function getBlockTemplate(id) {
  return http(`/block-templates/${id}`);
}

export function updateBlockTemplate(id, body) {
  return http(`/block-templates/${id}`, {
    method: "PATCH",
    body,
  });
}

export function deleteBlockTemplate(id) {
  return http(`/block-templates/${id}`, { method: "DELETE" });
}

export function cloneBlockTemplate(id) {
  return http(`/block-templates/${id}/clone`, { method: "POST" });
}

export function acceptBlockTemplate(id) {
  return http(`/block-templates/${id}/accept`, { method: "POST" });
}

/** GET /block-templates/format - AI instructions + example + schema. */
export function getBlockFormat() {
  return http("/block-templates/format");
}

/**
 * POST /block-templates/import/preview
 * @param {{ text: string, kind?: string, options?: object }} body
 */
export function previewBlockImport(body) {
  return http("/block-templates/import/preview", {
    method: "POST",
    body,
  });
}

/**
 * POST /block-templates/import
 * @param {{ block: object, renames?: Record<string, string> }} body
 */
export function importBlock(body) {
  return http("/block-templates/import", {
    method: "POST",
    body,
  });
}

/**
 * GET /block-templates/:id/export?unit=lb|kg
 * @param {number|string} id
 * @param {"lb"|"kg"} unit
 */
export function exportBlock(id, unit) {
  const u = unit === "kg" ? "kg" : "lb";
  return http(`/block-templates/${id}/export?unit=${u}`);
}
