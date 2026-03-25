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
