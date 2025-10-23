import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Card,
  CardBody,
  Select,
  SelectItem
} from "@nextui-org/react";
import {
  Plus,
  Save,
  Trash2,
  Star,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import ActivityModal from "../components/ActivityModal";

export default function SettingsProjects({ onBack, settings }) {
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [expandedProjects, setExpandedProjects] = useState([]);

  useEffect(() => {
    const storedProjects = JSON.parse(localStorage.getItem("timetracko.projects") || "[]");
    // jedem Projekt einen stabilen UI-Key geben (falls noch keiner existiert)
    const projectsWithKeys = storedProjects.map(p => ({
      ...p,
      tempKey: p.tempKey || crypto.randomUUID(),
    }));
    setProjects(projectsWithKeys);

    setCustomers(JSON.parse(localStorage.getItem("timetracko.customers") || "[]"));
  }, []);

  const saveToLocalStorage = (data) => {
    localStorage.setItem("timetracko.projects", JSON.stringify(data));
  };

  const handleSaveAll = () => {
    const cleanProjects = projects.map(({ tempKey, ...rest }) => rest);
    localStorage.setItem("timetracko.projects", JSON.stringify(cleanProjects));
    onBack?.();
  };

  const handleSaveProject = (projectId) => {
    saveToLocalStorage(projects);
    setExpandedProjects((prev) => prev.filter((id) => id !== projectId));
  };

  const handleAddProject = () => {
    const newProject = {
      tempKey: crypto.randomUUID(),
      id: "",
      name: "",
      projectId: "",
      customerId: "",
      description: "",
      maxHours: "",
      activities: [],
    };
    setProjects((prev) => [...prev, newProject]);
    setExpandedProjects((prev) => [...prev, newProject.tempKey]);
  };

  const handleDeleteProject = (id) => {
    const confirmDelete = window.confirm("Möchtest du dieses Projekt wirklich löschen?");
    if (!confirmDelete) return;
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    setExpandedProjects((prev) => prev.filter((pid) => pid !== id));
    saveToLocalStorage(updated);
  };

  const handleAddActivity = (projectId, newActivity) => {
    const updated = projects.map((p) =>
      p.id === projectId
        ? { ...p, activities: [...(p.activities || []), newActivity] }
        : p
    );
    setProjects(updated);
    saveToLocalStorage(updated);
  };

  const handleToggleDefault = (projectId, activityId) => {
    const updated = projects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        activities: (p.activities || []).map((a) => ({
          ...a,
          isDefault: a.id === activityId ? !a.isDefault : false,
        })),
      };
    });
    setProjects(updated);
    saveToLocalStorage(updated);
  };

  const handleDeleteActivity = (projectId, activityId) => {
    const updated = projects.map((p) =>
      p.id === projectId
        ? { ...p, activities: p.activities.filter((a) => a.id !== activityId) }
        : p
    );
    setProjects(updated);
    saveToLocalStorage(updated);
  };

  const toggleExpand = (tempKey) => {
    setExpandedProjects((prev) =>
      prev.includes(tempKey)
        ? prev.filter((pid) => pid !== tempKey)
        : [...prev, tempKey]
    );
  };

  // 🔹 Projekte gruppieren nach Kundenname
  const groupedProjects = [...customers]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((cust) => ({
      customer: cust.name,
      projects: projects.filter((p) => p.customerId === cust.id),
    }));

  // 🔹 Projekte ohne Kunde
  const unassigned = projects.filter((p) => !p.customerId);
  if (unassigned.length > 0) {
    groupedProjects.push({ customer: "— Ohne Kunden —", projects: unassigned });
  }

  return (
    <div className="space-y-6 mt-6 pb-20">
      <PageHeader title="Projekte verwalten" onBack={onBack} />

      {groupedProjects.map((group) => (
        <div key={group.customer}>
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wide mb-2 mt-6">
            {group.customer}
          </h3>

          {group.projects.length === 0 && (
            <p className="text-slate-600 text-sm italic">Keine Projekte</p>
          )}

          {group.projects.map((p) => {
            const expanded = expandedProjects.includes(p.tempKey);
            const customerName =
              customers.find((c) => c.id === p.customerId)?.name || "Kein Kunde";

            return (
              <Card
                key={p.tempKey}
                className="bg-slate-900/70 border border-slate-700 shadow-lg overflow-hidden transition-all mb-3"
              >
                <CardBody className="space-y-3">
                  {/* 🔹 Header-Zeile */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleExpand(p.tempKey)}
                  >
                    <div>
                      <div className="text-slate-100 font-medium">
                        {p.name || "Unbenanntes Projekt"}
                      </div>
                      <div className="text-xs text-slate-400">
                        {p.id || "—"} · {customerName}
                      </div>
                    </div>

                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      color="default"
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleExpand(p.id);
                      }}
                    >
                      {expanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-300" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      )}
                    </Button>
                  </div>

                  {/* 🔻 Expanded Content */}
                  {expanded && (
                    <div className="border-t border-slate-700 mt-3 pt-3 space-y-3 animate-fadeIn">
                      <Input
                        label="Projektname"
                        value={p.name}
                        onChange={(e) =>
                          setProjects((prev) =>
                            prev.map((proj) =>
                              proj.id === p.id
                                ? { ...proj, name: e.target.value }
                                : proj
                            )
                          )
                        }
                      />

                      <Input
                        label="Projekt-ID"
                        value={p.id || ""}
                        onChange={(e) =>
                          setProjects((prev) =>
                            prev.map((proj) =>
                              proj.id === p.id
                                ? { ...proj, id: e.target.value }
                                : proj
                            )
                          )
                        }
                      />

                      <Select
                        label="Kunde"
                        placeholder="— Kunde auswählen —"
                        selectedKeys={[p.customerId || ""]}
                        onChange={(e) =>
                          setProjects((prev) =>
                            prev.map((proj) =>
                              proj.id === p.id
                                ? { ...proj, customerId: e.target.value }
                                : proj
                            )
                          )
                        }
                        variant="flat"
                      >
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </Select>

                      <Input
                        label="Projektbeschreibung"
                        value={p.description || ""}
                        onChange={(e) =>
                          setProjects((prev) =>
                            prev.map((proj) =>
                              proj.id === p.id
                                ? { ...proj, description: e.target.value }
                                : proj
                            )
                          )
                        }
                      />

                      <Input
                        label="Maximalbuchbare Stunden"
                        type="number"
                        value={p.maxHours || ""}
                        onChange={(e) =>
                          setProjects((prev) =>
                            prev.map((proj) =>
                              proj.id === p.id
                                ? { ...proj, maxHours: e.target.value }
                                : proj
                            )
                          )
                        }
                      />

                      {/* 🧩 Tätigkeiten */}
                      <div className="border-t border-slate-700 mt-3 pt-3">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-slate-300 text-sm font-medium">Tätigkeiten</h3>
                          <Button
                            size="sm"
                            className={`bg-${settings?.accentColor}-600 hover:bg-${settings?.accentColor}-500 text-white`}
                            onPress={() => {
                              setActiveProjectId(p.id);
                              setShowActivityModal(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-1" /> Tätigkeit hinzufügen
                          </Button>
                        </div>

                        {p.activities?.length > 0 ? (
                          <ul className="space-y-2">
                            {p.activities.map((a) => (
                              <li
                                key={a.id}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-800/70 rounded-lg px-3 py-2 border border-slate-700"
                              >
                                {/* 🔸 Editierbares Feld */}
                                <div className="flex-1">
                                  <Input
                                    classNames={{
                                      inputWrapper: "bg-slate-700 hover:bg-slate-600 border border-slate-600",
                                      input: "w-full text-slate-200 text-sm",
                                    }}
                                    value={a.label}
                                    onChange={(e) => {
                                      const newLabel = e.target.value;
                                      setProjects((prev) =>
                                        prev.map((proj) =>
                                          proj.id === p.id
                                            ? {
                                                ...proj,
                                                activities: proj.activities.map((act) =>
                                                  act.id === a.id ? { ...act, label: newLabel } : act
                                                ),
                                              }
                                            : proj
                                        )
                                      );
                                    }}
                                  />
                                </div>

                                {/* 🔹 Buttons */}
                                <div className="flex gap-2 justify-end sm:justify-normal">
                                  {/* Standard setzen */}
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onPress={() => handleToggleDefault(p.id, a.id)}
                                    className="hover:bg-slate-700 transition-colors"
                                  >
                                    <Star
                                      className={`w-4 h-4 ${
                                        a.isDefault
                                          ? `fill-${settings?.accentColor}-400 text-${settings?.accentColor}-400`
                                          : "text-slate-500"
                                      }`}
                                    />
                                  </Button>

                                  {/* Löschen */}
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    color="danger"
                                    variant="light"
                                    onPress={() => handleDeleteActivity(p.id, a.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-slate-500 italic">Keine Tätigkeiten</p>
                        )}
                      </div>

                      {/* 💾 Save + 🗑 Delete Buttons */}
                      <div className="flex justify-end gap-2 pt-4 border-t border-slate-700 mt-4">
                        <Button
                          size="sm"
                          className={`bg-${settings?.accentColor || "indigo"}-600 hover:bg-${settings?.accentColor || "indigo"}-500 text-white`}
                          onPress={() => handleSaveProject(p.id)}
                        >
                          <Save className="w-4 h-4 mr-1" /> Speichern
                        </Button>
                        <Button
                          color="danger"
                          size="sm"
                          variant="flat"
                          onPress={() => handleDeleteProject(p.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" /> Löschen
                        </Button>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      ))}

      {/* ➕ Neues Projekt + Gesamtspeichern */}
      <div className="flex gap-2 pt-4">
        <Button
          className={`bg-${settings?.accentColor || "indigo"}-600 hover:bg-${settings?.accentColor || "indigo"}-500 text-white`}
          onPress={handleAddProject}
        >
          <Plus className="w-4 h-4 mr-1" /> Neues Projekt
        </Button>
        <Button
          className={`bg-${settings?.accentColor || "indigo"}-600 hover:bg-${settings?.accentColor || "indigo"}-500 text-white`}
          onPress={handleSaveAll}
        >
          <Save className="w-4 h-4 mr-1" /> Alle speichern
        </Button>
      </div>

      {/* ➕ Tätigkeitsmodal */}
      {showActivityModal && (
        <ActivityModal
          isOpen={showActivityModal}
          onClose={() => setShowActivityModal(false)}
          onSave={(activity) => handleAddActivity(activeProjectId, activity)}
        />
      )}
    </div>
  );
}