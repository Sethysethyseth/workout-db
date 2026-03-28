import { http } from "./http.js";

export function createTemplate({ name, description, isPublic, exercises, useRIR, useRPE }) {
  return http("/templates", {
    method: "POST",
    body: { name, description, isPublic, exercises, useRIR, useRPE },
  });
}

export function getMyTemplates() {
  return http("/templates/mine");
}

export function getPublicTemplates() {
  return http("/templates/public");
}

export function getTemplate(id) {
  return http(`/templates/${id}`);
}

export function updateTemplate(id, body) {
  return http(`/templates/${id}`, {
    method: "PATCH",
    body,
  });
}

export function deleteTemplate(id) {
  return http(`/templates/${id}`, { method: "DELETE" });
}

export function cloneTemplate(id) {
  return http(`/templates/${id}/clone`, { method: "POST" });
}
