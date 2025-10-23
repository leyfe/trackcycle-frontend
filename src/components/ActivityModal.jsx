import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@nextui-org/react";

export default function ActivityModal({ isOpen, onClose, onSave }) {
  const [label, setLabel] = useState("");
  const [id, setId] = useState("");

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      id: id.trim() || crypto.randomUUID(),
      label: label.trim(),
      isDefault: false,
    });
    setLabel("");
    setId("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose}>
      <ModalContent>
        <ModalHeader>Neue Tätigkeit</ModalHeader>
        <ModalBody>
          <Input
            label="Tätigkeitsname"
            placeholder="z. B. Entwicklung, Testing..."
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Input
            label="Tätigkeits-ID (optional)"
            placeholder="z. B. DEV01"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={onClose}>Abbrechen</Button>
          <Button color="primary" onPress={handleSave}>Speichern</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}