import React, { useState, useContext } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  Button,
  Select,
  SelectItem,
  Textarea,
} from "@nextui-org/react";
import { ProjectContext } from "../context/ProjectContext";
import { CustomerContext } from "../context/CustomerContext";
import { Trash2, Plus, Edit3, Save, X } from "lucide-react";

export default function ProjectModal({ isOpen, onClose }) {
  const { projects, addProject, deleteProject, updateProject } = useContext(ProjectContext);
  const { customers } = useContext(CustomerContext);

  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [maxHours, setMaxHours] = useState("");

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    id: "",
    name: "",
    client: "",
    description: "",
    maxHours: "",
  });

  const handleAdd = () => {
    const id = projectId.trim();
    const name = projectName.trim();
    const desc = description.trim();
    const max = maxHours.trim();

    if (!id || !name || !selectedCustomer) {
      alert("Bitte Projekt-ID, Projektname und Kunde angeben.");
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomer);
    if (!customer) {
      alert("Ungültiger Kunde ausgewählt.");
      return;
    }

    addProject(id, name, customer.name);

    const stored = JSON.parse(localStorage.getItem("timetracko.projects")) || [];
    const updated = [
      ...stored,
      { id, name, client: customer.name, description: desc, maxHours: max },
    ];
    localStorage.setItem("timetracko.projects", JSON.stringify(updated));

    setProjectId("");
    setProjectName("");
    setDescription("");
    setSelectedCustomer("");
    setMaxHours("");
  };

  const handleEdit = (project) => {
    setEditId(project.id);
    setEditData({
      id: project.id,
      name: project.name,
      client: project.client,
      description: project.description || "",
      maxHours: project.maxHours || "",
    });
  };

  const handleSaveEdit = () => {
    if (!editData.name.trim()) {
      alert("Projektname darf nicht leer sein.");
      return;
    }

    if (updateProject) updateProject(editData.id, editData.name, editData.client);

    const stored = JSON.parse(localStorage.getItem("timetracko.projects")) || [];
    const updated = stored.map((p) => (p.id === editData.id ? editData : p));
    localStorage.setItem("timetracko.projects", JSON.stringify(updated));

    setEditId(null);
    setEditData({ id: "", name: "", client: "", description: "", maxHours: "" });
  };

  return (
    <Modal scrollBehavior="outside" isOpen={isOpen} onClose={onClose} backdrop="blur">
      <ModalContent className="py-6">
        <ModalHeader>Projekte verwalten</ModalHeader>
        <ModalBody>
          {/* Neues Projekt anlegen */}
          <Input
            label="Projekt-ID"
            placeholder="z. B. P-001"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />
          <Input
            label="Projektname"
            placeholder="z. B. PDF-Export Optimierung"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />

          <Select
            label="Kunde auswählen"
            selectedKeys={[selectedCustomer]}
            onSelectionChange={(keys) => setSelectedCustomer(Array.from(keys)[0])}
            placeholder="Kunde wählen"
          >
            {customers.map((c) => (
              <SelectItem key={c.id}>{c.name}</SelectItem>
            ))}
          </Select>

          <Textarea
            label="Projektbeschreibung (optional)"
            placeholder="Kurze Notiz oder Beschreibung zum Projekt..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Input
            type="number"
            label="Maximal buchbare Stunden (optional)"
            placeholder="z. B. 40"
            value={maxHours}
            onChange={(e) => setMaxHours(e.target.value)}
          />

          <Button color="primary" onPress={handleAdd}>
            <Plus className="w-5 h-5 text-slate-100" /> Projekt anlegen
          </Button>

          {/* Projektliste */}
          <div className="mt-4 space-y-2 max-h-[40vh] overflow-auto">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex flex-col bg-slate-800/10 px-3 py-2 rounded-lg border border-slate-800/50 hover:border-slate-700 transition-colors"
              >
                {editId === p.id ? (
                  <>
                    <Input
                      label="Projekt-ID"
                      value={editData.id}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, id: e.target.value }))
                      }
                      size="sm"
                      className="mb-2"
                    />
                    <Input
                      label="Projektname"
                      value={editData.name}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, name: e.target.value }))
                      }
                      size="sm"
                      className="mb-2"
                    />
                    <Input
                      label="Kunde"
                      value={editData.client}
                      onChange={(e) =>
                        setEditData((prev) => ({ ...prev, client: e.target.value }))
                      }
                      size="sm"
                      className="mb-2"
                    />
                    <Textarea
                      label="Beschreibung"
                      value={editData.description}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      size="sm"
                      className="mb-2"
                    />
                    <Input
                      type="number"
                      label="Maximal buchbare Stunden"
                      placeholder="z. B. 40"
                      value={editData.maxHours}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          maxHours: e.target.value,
                        }))
                      }
                      size="sm"
                      className="mb-2"
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        color="primary"
                        size="sm"
                        variant="flat"
                        onPress={handleSaveEdit}
                      >
                        <Save className="w-4 h-4 mr-1" /> Speichern
                      </Button>
                      <Button
                        size="sm"
                        variant="light"
                        onPress={() => setEditId(null)}
                      >
                        <X className="w-4 h-4 mr-1" /> Abbrechen
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-slate-400">
                        {p.client} • {p.id}
                      </div>
                      {p.description && (
                        <div className="text-xs text-slate-500 mt-1 italic">
                          {p.description}
                        </div>
                      )}
                      {p.maxHours && (
                        <div className="text-xs text-slate-400 mt-1">
                          ⏱ Maximal: {p.maxHours} h
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => handleEdit(p)}
                      >
                        <Edit3 className="w-5 h-5 text-slate-400" />
                      </Button>
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        onPress={() => deleteProject(p.id)}
                      >
                        <Trash2 className="w-5 h-5 text-slate-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {projects.length === 0 && (
              <div className="text-slate-400 text-sm">
                Noch keine Projekte angelegt.
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="flat" onPress={onClose}>
              Schließen
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}