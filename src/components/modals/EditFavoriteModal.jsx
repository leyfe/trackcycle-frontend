import React, { useContext, useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from "@nextui-org/react";
import { CustomerContext } from "../../context/CustomerContext";
import { ProjectContext } from "../../context/ProjectContext";
import { Save } from "lucide-react";

export default function EditFavoriteModal({
  isOpen,
  onClose,
  favorite,
  onSave,
  accentColor = "sky",
}) {
  const { customers } = useContext(CustomerContext);
  const { projects } = useContext(ProjectContext);

  const [form, setForm] = useState({
    customerId: "",
    projectId: "",
    description: "",
    activityId: "",
    hours: "",
  });

  // 🔹 Prefill, wenn bestehender Favorit geöffnet wird
  useEffect(() => {
    if (favorite) {
      setForm({
        customerId: favorite.customerId || "",
        projectId: favorite.projectId || "",
        description: favorite.description || "",
        activityId: favorite.activityId || "",
        hours: favorite.hours || "",
      });
    }
  }, [favorite]);

  // 🔹 Helper für Formularänderungen
  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit() {
    onSave({
      ...favorite,
      ...form,
    });
    onClose();
  }

  // 🔹 Projekte nach Kunde filtern
  const filteredProjects = projects.filter(
    (p) => !form.customerId || p.customerId === form.customerId
  );

  // 🔹 Tätigkeiten nach Projekt
  const currentActivities =
    projects.find((p) => p.id === form.projectId)?.activities || [];

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="lg">
      <ModalContent>
        <ModalHeader className="text-slate-100">Favorit bearbeiten</ModalHeader>

        <ModalBody className="space-y-3 text-slate-300">
          {/* 🔸 Kunde */}
          <Select
            label="Kunde"
            placeholder="Kunde wählen"
            selectedKeys={[form.customerId]}
            onChange={(e) => handleChange("customerId", e.target.value)}
          >
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </Select>

          {/* 🔸 Projekt */}
          <Select
            label="Projekt"
            placeholder="Projekt wählen"
            selectedKeys={[form.projectId]}
            onChange={(e) => handleChange("projectId", e.target.value)}
          >
            {filteredProjects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </Select>

          {/* 🔸 Tätigkeit (abhängig vom Projekt) */}
          <Select
            label="Tätigkeit"
            placeholder={
              currentActivities.length > 0
                ? "Tätigkeit wählen"
                : "Keine Tätigkeiten vorhanden"
            }
            selectedKeys={[form.activityId]}
            onChange={(e) => handleChange("activityId", e.target.value)}
            isDisabled={currentActivities.length === 0}
          >
            {currentActivities.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.label}
              </SelectItem>
            ))}
          </Select>

          {/* 🔸 Beschreibung */}
          <Input
            label="Beschreibung"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            variant="bordered"
          />

          {/* 🔸 Stunden */}
          <Input
            label="Stunden (optional)"
            type="number"
            value={form.hours}
            onChange={(e) => handleChange("hours", e.target.value)}
            variant="bordered"
          />
        </ModalBody>

        <ModalFooter>
          <Button
            variant="light"
            onPress={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            Abbrechen
          </Button>
          <Button
            onPress={handleSubmit}
            className={`bg-${accentColor}-600 hover:bg-${accentColor}-500 text-white`}
            startContent={<Save className="w-4 h-4" />}
          >
            Speichern
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}