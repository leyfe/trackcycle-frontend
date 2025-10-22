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
export function exportEntriesConaktiv({ mode = "day", startDate, endDate } = {}) {
  const entries = JSON.parse(localStorage.getItem("timetracko.entries") || "[]");
  const projects = JSON.parse(localStorage.getItem("timetracko.projects") || "[]");
  const customers = JSON.parse(localStorage.getItem("timetracko.customers") || "[]");
  const settings = JSON.parse(localStorage.getItem("timetracko.settings") || "{}");

  const projById = Object.fromEntries(projects.map((p) => [p.id, p]));
  const custById = Object.fromEntries(customers.map((c) => [c.id, c]));

  // 🕒 15-Minuten-Rundung aktiv?
  const roundToQuarter = settings.roundToQuarter ?? false;

  const roundMinutes = (hours) => {
    const minutes = hours * 60;
    return roundToQuarter ? Math.ceil(minutes / 15) * 15 / 60 : hours;
  };

  // 📅 Filter Zeitraum
  const filterFn = (e) => {
    const d = new Date(e.start);
    if (mode === "day") {
      const dayISO = startDate.split("T")[0];
      return d.toISOString().startsWith(dayISO);
    }
    if (mode === "week") {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return d >= start && d <= end;
    }
    return true; // alles
  };

  const filtered = entries.filter(filterFn);

  // 🧩 Gruppierte Tasks (Projekt + Beschreibung)
  const grouped = {};
  for (const e of filtered) {
    const key = `${e.projectId || ""}__${e.description || ""}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(e);
  }

  const exportData = Object.entries(grouped).map(([key, list]) => {
    const first = list[0];
    const totalHours = roundMinutes(
      list.reduce((sum, e) => sum + (parseFloat(e.duration) || 0), 0)
    );

    const project = projById[first.projectId];
    const customer = custById[project?.customerId];

    return {
      date: new Date(first.start).toLocaleDateString("de-DE"),
      hours: totalHours.toFixed(2).replace(".", ","),
      customer: customer?.name || project?.client || "Unbekannt",
      project: project?.name || first.projectName || "Unbekannt",
      description: first.description || "",
    };
  });

  // 💾 Export-Datei erstellen
  const pretty = JSON.stringify(exportData, null, 2);
  const blob = new Blob([pretty], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ConAktiv_Export_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);

  return exportData;
}