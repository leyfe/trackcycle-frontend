import { useEffect, useState, useContext } from "react";
import { ProjectContext } from "../context/ProjectContext";

export default function useSuggestions(entries) {
  const { projects } = useContext(ProjectContext); // 🔹 Zugriff auf aktuelle Projekte
  const [suggestions, setSuggestions] = useState(() => {
    return JSON.parse(localStorage.getItem("timetracko.suggestions")) || [];
  });

  useEffect(() => {
    const counts = {};
    for (const e of entries) {
      if (!e.projectId || !e.description) continue;
      const key = `${e.projectId}::${e.description}`;
      counts[key] = (counts[key] || 0) + 1;
    }

    // 🔧 Nur Aufgaben vorschlagen, die mindestens 2x vorkommen
    const newSuggestions = Object.entries(counts)
      .filter(([_, count]) => count >= 2)
      .map(([key]) => {
        const [projectId, description] = key.split("::");

        // 🔹 Projektnamen direkt hier ergänzen (Lookup)
        const project = projects.find((p) => p.id === projectId);
        return {
          projectId,
          projectName: project?.name || "Unbekanntes Projekt", // ✅ Fallback
          description: description.trim(),
        };
      });

    setSuggestions(newSuggestions);
    localStorage.setItem(
      "timetracko.suggestions",
      JSON.stringify(newSuggestions)
    );
  }, [entries, projects]); // 🔹 reagiert auch auf Projektänderungen

  return suggestions;
}