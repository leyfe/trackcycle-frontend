import React, { createContext, useState, useEffect, useRef } from "react";

export const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const isInitialMount = useRef(true);

  const [projects, setProjects] = useState(() => {
    // 🔹 Aus localStorage laden
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem("trackcycle.projects") || "[]");
    } catch {
      stored = [];
    }


    if (Array.isArray(stored) && stored.length > 0) {
      // Duplikate nach ID entfernen
      const unique = stored.filter(
        (p, i, self) => i === self.findIndex((x) => x.id === p.id)
      );
      return unique;
    }

    // 🔹 Standardwert, falls leer
    return [
      {
        id: "P-0001",
        name: "Salient",
        client: "Salient Doremus",
        customerId: "C-0001",
        description: "Interne Zeiterfassung",
      },
    ];
  });

  // 💾 Nur speichern, wenn sich Projekte **nach dem Mount** ändern
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return; // Verhindert den ersten automatischen Schreibvorgang
    }

    // Vor dem Speichern Duplikate rausfiltern
    const unique = projects.filter(
      (p, i, self) => i === self.findIndex((x) => x.id === p.id)
    );
    localStorage.setItem("trackcycle.projects", JSON.stringify(unique));
  }, [projects]);

  useEffect(() => {
    const projects = JSON.parse(localStorage.getItem("trackcycle.projects")) || [];
    if (!projects.find(p => p.id === "PAUSE")) {
      projects.push({
        id: "PAUSE",
        name: "Pause",
        client: "System",
        description: "Zeit, die nicht als Arbeit zählt",
      });
      localStorage.setItem("trackcycle.projects", JSON.stringify(projects));
    }
  }, []);

  // ➕ Neues Projekt hinzufügen
  const addProject = (project) => {
    if (!project.id || !project.name) return;

    setProjects((prev) => {
      const exists = prev.some((p) => p.id === project.id);
      if (exists) return prev;
      const newProject = { ...project, endDate: project.endDate || null }; // 🟢 neu
      const updated = [...prev, newProject];
      localStorage.setItem("trackcycle.projects", JSON.stringify(updated)); // speichern
      return updated;
    });
  };

  // 🗑️ Projekt löschen
  const deleteProject = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // ⛔ Projekt beenden
  const endProject = (id, date = new Date().toISOString().split("T")[0]) => {
    editProject(id, { endDate: date });
  };

  // 🔄 Projekt reaktivieren
  const reactivateProject = (id) => {
    editProject(id, { endDate: null });
  };

  // ✏️ Projekt bearbeiten
  const editProject = (id, updatedFields) => {
    setProjects((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, ...updatedFields } : p
      );
      localStorage.setItem("trackcycle.projects", JSON.stringify(updated)); // 🟢 speichern
      return updated;
    });
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        addProject,
        editProject,
        deleteProject,
        endProject,
        reactivateProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}