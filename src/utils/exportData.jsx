// src/utils/exportData.js

export function exportAllData() {
  const safeParse = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
    catch { return fallback; }
  };

  const data = {
    entries:   safeParse("timetracko.entries",   []),
    projects:  safeParse("timetracko.projects",  []),
    customers: safeParse("timetracko.customers", []),
    settings:  safeParse("timetracko.settings",  {
      showFavorites: true, manualMode: false, manualFavorites: [], customLabels: {}
    }),
  };

  const pretty = JSON.stringify(data, null, 2);
  const blob = new Blob([pretty], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TimeTracko_Backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportEntriesCSV() {
  const entries   = JSON.parse(localStorage.getItem("timetracko.entries")   || "[]");
  const projects  = JSON.parse(localStorage.getItem("timetracko.projects")  || "[]");
  const customers = JSON.parse(localStorage.getItem("timetracko.customers") || "[]");

  const projById = Object.fromEntries(projects.map(p => [p.id, p]));
  const header = [
    "entryId","date","start","end","duration_h",
    "projectId","projectName","clientName",
    "description"
  ];

  const rows = entries.map(e => {
    const p = projById[e.projectId];
    const clientName = p?.client ?? e.clientName ?? "";
    const projectName = p?.name ?? e.projectName ?? "";
    const d = new Date(e.start);
    const date = d.toLocaleDateString("de-DE");
    const start = new Date(e.start).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
    const end   = new Date(e.end  ).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
    const dur   = (Number(e.duration)||0).toFixed(2);

    return [
      e.id, date, start, end, dur,
      e.projectId || "", projectName, clientName,
      (e.description || "").replace(/\r?\n/g, " ")
    ];
  });

  const csv = [header, ...rows]
    .map(cols => cols.map(v => {
      const s = String(v ?? "");
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    }).join(";"))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TimeTracko_Entries_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ────────────────────────────────────────────────
   📦 ConAktiv-kompatibler Export
   Gruppiert gleiche Tasks pro Tag (oder optional Woche)
──────────────────────────────────────────────── */

// 🔧 In src/utils/exportData.js
export function exportEntriesConaktiv({ mode = "day", startDate, endDate }) {
  const entries   = JSON.parse(localStorage.getItem("timetracko.entries")   || "[]");
  const projects  = JSON.parse(localStorage.getItem("timetracko.projects")  || "[]");
  const customers = JSON.parse(localStorage.getItem("timetracko.customers") || "[]");

  const projById = Object.fromEntries(projects.map(p => [p.id, p]));
  const custByName = Object.fromEntries(customers.map(c => [c.name, c]));

  // 🧠 Helfer: Nur Datum (ohne Zeit) vergleichen
  const normalizeDate = (isoString) => new Date(isoString).toISOString().split("T")[0];

  const today = new Date().toISOString().split("T")[0];

  // 🗓️ Filter Logik
  let filtered = entries.filter(e => e.end && e.start);

  if (mode === "day" && startDate) {
    filtered = filtered.filter(e => normalizeDate(e.start) === startDate);
  }

  if (mode === "week" && startDate && endDate) {
    filtered = filtered.filter(e => {
      const d = normalizeDate(e.start);
      return d >= startDate && d <= endDate;
    });
  }

  // 🧩 Gruppieren nach (Datum + Projekt + Beschreibung)
  const grouped = {};
  for (const e of filtered) {
    const key = `${normalizeDate(e.start)}::${e.projectId}::${e.description}`;
    if (!grouped[key]) {
      grouped[key] = {
        date: normalizeDate(e.start).split("-").reverse().join("."), // → 20.10.2025
        hours: 0,
        customer: "",
        project: "",
        description: e.description || "",
      };
    }

    grouped[key].hours += parseFloat(e.duration || 0);
    const proj = projById[e.projectId];
    if (proj) {
      grouped[key].project = proj.name || proj.id;
      grouped[key].customer = proj.client
        ? custByName[proj.client]?.number || proj.client
        : "";
    }
  }

  // 📦 Format für ConAktiv
  const result = Object.values(grouped).map(g => ({
    date: g.date,
    hours: g.hours.toFixed(2).replace(".", ","),
    customer: g.customer || "",
    project: g.project || "",
    description: g.description || "",
  }));

  // 🪣 Download JSON-Datei
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const filename = `ConAktiv_Export_${mode}_${today}.json`;
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  console.log(`📤 Export (${mode}) abgeschlossen → ${filename}`, result);
}