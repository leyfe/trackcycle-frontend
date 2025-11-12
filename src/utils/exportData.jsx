// src/utils/exportData.js

export function exportAllData() {
  const safeParse = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
    catch { return fallback; }
  };

  // Alle Daten laden
  const entries   = safeParse("trackcycle.entries",   []);
  const projects  = safeParse("trackcycle.projects",  []);
  const customers = safeParse("trackcycle.customers", []);
  const settings  = safeParse("trackcycle.settings",  {
    showFavorites: true, manualMode: false, manualFavorites: [], customLabels: {}
  });

  // 🧹 Entries bereinigen (projectName entfernen)
  const cleanEntries = entries.map(({ projectName, ...rest }) => rest);

  const data = {
    entries:   cleanEntries,
    projects,
    customers,
    settings,
  };

  const pretty = JSON.stringify(data, null, 2);
  const blob = new Blob([pretty], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TrackCycle_Backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportEntriesCSV() {
  const entries   = JSON.parse(localStorage.getItem("trackcycle.entries")   || "[]");
  const projects  = JSON.parse(localStorage.getItem("trackcycle.projects")  || "[]");
  const customers = JSON.parse(localStorage.getItem("trackcycle.customers") || "[]");

  const projById = Object.fromEntries(projects.map(p => [p.id, p]));
  const custById = Object.fromEntries(customers.map(c => [c.id, c]));

  const header = [
    "entryId","date","start","end","duration_h",
    "projectId","projectName","customerName",
    "description"
  ];

  const rows = entries.map(e => {
    const p = projById[e.projectId];
    const c = custById[p?.customerId];
    const date = new Date(e.start).toLocaleDateString("de-DE");
    const start = new Date(e.start).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
    const end   = new Date(e.end  ).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});

    return [
      e.id,
      date,
      start,
      end,
      (Number(e.duration) || 0).toFixed(2),
      e.projectId || "",
      p?.name || "Unbekannt",
      c?.name || "–",
      (e.description || "").replace(/\r?\n/g, " ")
    ];
  });

  // … CSV export wie gehabt …
}

/* ────────────────────────────────────────────────
   📦 ConAktiv-kompatibler Export
   Gruppiert gleiche Tasks pro Tag (oder optional Woche)
──────────────────────────────────────────────── */

// 🔧 In src/utils/exportData.js
export function exportEntriesConaktiv({ mode = "day", startDate, endDate } = {}) {
  const entries = JSON.parse(localStorage.getItem("trackcycle.entries") || "[]");
  const projects = JSON.parse(localStorage.getItem("trackcycle.projects") || "[]");
  const customers = JSON.parse(localStorage.getItem("trackcycle.customers") || "[]");
  const settings = JSON.parse(localStorage.getItem("trackcycle.settings") || "{}");
  const activities = projects.flatMap(p =>
    (p.activities || []).map(a => ({ ...a, projectId: p.id }))
  );

  const projById = Object.fromEntries(projects.map(p => [p.id, p]));
  const custById = Object.fromEntries(customers.map(c => [c.id, c]));
  const activityById = Object.fromEntries(activities.map(a => [a.id, a]));

  // 🕒 15-Minuten-Rundung aktiv?
  const roundToQuarter = settings.roundToQuarter ?? false;
  const roundMinutes = (hours) => {
    const minutes = hours * 60;
    return roundToQuarter ? Math.ceil(minutes / 15) * 15 / 60 : hours;
  };

  // 📅 Zeitraum-Filter
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
    return true;
  };

  // ❌ "Pause"-Einträge ausschließen
  const filtered = entries.filter(e => e.projectId !== "PAUSE" && filterFn(e));

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
    const activity = activityById[first.activityId];

    // 🧹 Bereinigen: "Unbekannt" → leer
    const safe = (val) => (val === "Unbekannt" || val === undefined ? "" : val);

    return {
      date: new Date(first.start).toLocaleDateString("de-DE"),
      hours: totalHours.toFixed(2).replace(".", ","),
      customer: safe(customer?.name || project?.client || "Unbekannt"),
      project: safe(project?.id || first.projectName || "Unbekannt"),
      activity: safe(activity?.label || "Unbekannt"),
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