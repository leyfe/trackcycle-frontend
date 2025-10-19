// src/utils/importData.js
export function importAllData(file, onComplete) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.entries)   localStorage.setItem("timetracko.entries",   JSON.stringify(data.entries));
      if (data.projects)  localStorage.setItem("timetracko.projects",  JSON.stringify(data.projects));
      if (data.customers) localStorage.setItem("timetracko.customers", JSON.stringify(data.customers));
      if (data.settings)  localStorage.setItem("timetracko.settings",  JSON.stringify(data.settings));
      onComplete?.(data);
    } catch (err) {
      console.error("Import-Fehler:", err);
      alert("❌ Import fehlgeschlagen. Datei prüfen.");
    }
  };
  reader.readAsText(file);
}