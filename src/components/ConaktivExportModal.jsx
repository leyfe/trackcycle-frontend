import React, { useState } from "react";
import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalContent,
  RadioGroup,
  Radio,
  Input,
} from "@nextui-org/react";
import { exportEntriesConaktiv } from "../utils/exportData";

export default function ConaktivExportModal({ isOpen, onClose }) {
  const [mode, setMode] = useState("day");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleExport = () => {
    exportEntriesConaktiv({ mode, startDate, endDate });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="center">
      <ModalContent>
        <ModalHeader className="text-lg font-semibold">
          ConAktiv Export
        </ModalHeader>

        <ModalBody className="flex flex-col gap-4">
          <RadioGroup
            label="Zeitraum wählen"
            value={mode}
            onValueChange={setMode}
            orientation="horizontal"
          >
            <Radio value="day">Tag</Radio>
            <Radio value="week">Woche</Radio>
            <Radio value="all">Alles</Radio>
          </RadioGroup>

          {mode !== "all" && (
            <div className="flex flex-col gap-3">
              <Input
                label="Startdatum"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {mode === "week" && (
                <Input
                  label="Enddatum"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Abbrechen
          </Button>
          <Button
            color="primary"
            className="bg-indigo-600"
            onPress={handleExport}
          >
            Export starten
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}