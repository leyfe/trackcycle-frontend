// src/utils/importData.js
export function importAllData(file, onSuccess) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const projects = data.projects || [];
      const customers = data.customers || [];

      // 🧹 Einträge bereinigen
      const cleanedEntries = (data.entries || []).map((entry) => {
        const project = projects.find(p => p.id === entry.projectId);
        return {
          ...entry,
          projectName: undefined,
          projectId: project?.id || entry.projectId || null,
        };
      });

      localStorage.setItem("trackcycle.entries", JSON.stringify(cleanedEntries));
      localStorage.setItem("trackcycle.projects", JSON.stringify(projects));
      localStorage.setItem("trackcycle.customers", JSON.stringify(customers));
      localStorage.setItem("trackcycle.settings", JSON.stringify(data.settings || {}));

      onSuccess?.();
    } catch (err) {
      console.error("❌ Import-Fehler:", err);
    }
  };
  reader.readAsText(file);
}