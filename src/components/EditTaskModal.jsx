import React, { useState, useEffect, useMemo, useContext } from "react";
import { CustomerContext } from "../context/CustomerContext";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  Button,
  Select,
  SelectItem,
  SelectSection,
} from "@nextui-org/react";

export default function EditTaskModal({ isOpen, onClose, task, onSave, projects }) {
  const { customers } = useContext(CustomerContext);
  const [editedTask, setEditedTask] = useState(task || {});
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // 🧭 Task → lokale Felder befüllen
  useEffect(() => {
    if (!task) return;

    const start = new Date(task.start);
    const end = new Date(task.end);

    setDate(start.toISOString().slice(0, 10)); // yyyy-MM-dd
    setStartTime(start.toTimeString().slice(0, 5)); // HH:mm
    setEndTime(end.toTimeString().slice(0, 5));
    setEditedTask(task);
  }, [task]);

  // ⏱ Live-Dauer-Anzeige
  const durationLabel = useMemo(() => {
    if (!date || !startTime || !endTime) return "";
    const startISO = new Date(`${date}T${startTime}`);
    const endISO = new Date(`${date}T${endTime}`);
    const diffMs = endISO - startISO;
    if (diffMs <= 0) return "⚠️ Ungültige Zeit";
    const h = Math.floor(diffMs / 1000 / 60 / 60);
    const m = Math.floor((diffMs / 1000 / 60) % 60);
    return `${h}h ${m}min`;
  }, [date, startTime, endTime]);

  const handleSave = () => {
    if (!editedTask.description || !editedTask.projectId) {
      alert("Bitte mindestens Beschreibung und Projekt angeben.");
      return;
    }
    if (!date || !startTime || !endTime) {
      alert("Bitte Datum, Start- und Endzeit angeben.");
      return;
    }

    const startISO = new Date(`${date}T${startTime}`).toISOString();
    const endISO = new Date(`${date}T${endTime}`).toISOString();
    const ms = new Date(endISO) - new Date(startISO);
    if (isNaN(ms) || ms <= 0) {
      alert("Bitte gültige Start- und Endzeit eingeben.");
      return;
    }

    const duration = (ms / 1000 / 60 / 60).toFixed(2);

    onSave({
      ...editedTask,
      start: startISO,
      end: endISO,
      duration,
    });
    onClose();
  };

  // ✅ Gruppierung: nach customerId statt client
  const groupedProjects = customers.map((cust) => ({
    customer: cust.name,
    projects: projects.filter((p) => p.customerId === cust.id),
  }));


  return (
    <Modal
      scrollBehavior="outside"
      isOpen={isOpen}
      onClose={onClose}
      backdrop="blur"
      placement="center"
    >
      <ModalContent className="py-6">
        <ModalHeader>Eintrag bearbeiten</ModalHeader>
        <ModalBody>
          {editedTask && (
            <>
              <Input
                label="Beschreibung"
                value={editedTask.description || ""}
                onChange={(e) =>
                  setEditedTask({ ...editedTask, description: e.target.value })
                }
              />

              <Select
                label="Projekt"
                selectedKeys={editedTask.projectId ? [editedTask.projectId] : []}
                onSelectionChange={(keys) => {
                  const id = Array.from(keys)[0];
                  const proj = projects.find((p) => p.id === id);
                  setEditedTask((prev) => ({
                    ...prev,
                    projectId: id,
                    projectName: proj?.name ?? "",
                    clientName: proj?.client ?? "",
                  }));
                }}
              >
                {groupedProjects.map((group) => (
                  <SelectSection key={group.customer} title={group.customer}>
                    {group.projects.map((p) => (
                      <SelectItem key={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectSection>
                ))}
              </Select>

              {/* 📅 Datum + Zeiten nebeneinander */}
              <div className="flex flex-col gap-3 mt-2">
                <Input
                  label="Datum"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  classNames={{ input: "text-white" }}
                />

                <div className="flex gap-3">
                  <Input
                    label="Start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    classNames={{ input: "text-white" }}
                  />
                  <Input
                    label="Ende"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    classNames={{ input: "text-white" }}
                  />
                </div>
              </div>

              {/* ⏱ Live-Daueranzeige */}
              {durationLabel && (
                <div className="text-center text-slate-400 mt-2 text-sm">
                  ⏱ Dauer: <span className="text-slate-200">{durationLabel}</span>
                </div>
              )}

              <Button color="primary" className="mt-5" onPress={handleSave}>
                Speichern
              </Button>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}