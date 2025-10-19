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