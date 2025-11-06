// src/utils/uuid.js

export function safeUUID() {
  try {
    // ✅ Modern browsers & Node >=19
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch (_) {
    // Ignorieren, falls crypto nicht verfügbar ist
  }

  // 🧩 Fallback – UUIDv4 per Math.random()
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}