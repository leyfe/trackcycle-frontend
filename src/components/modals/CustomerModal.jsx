//BRAUCH ICH NICHT MEHR?
// 
import React, { useState, useContext } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, Input, Button } from "@nextui-org/react";
import { CustomerContext } from "../../context/CustomerContext";
import { Trash2, Plus } from "lucide-react";


export default function CustomerModal({ isOpen, onClose }) {
  const { customers, addCustomer, editCustomer, deleteCustomer } = useContext(CustomerContext);
  const [ customerId, setCustomerId] = useState("");
  const [ customerName, setCustomerName] = useState("");

  const handleAdd = () => {
    if (!customerId.trim() || !customerName.trim()) return;
    addCustomer(customerId.trim(), customerName.trim());
    setCustomerId("");
    setCustomerName("");
  };

  return (
    <Modal scrollBehavior="outside" isOpen={isOpen} onClose={onClose} backdrop="blur">
      <ModalContent className="py-6">
        <ModalHeader>Kunden verwalten</ModalHeader>
        <ModalBody>
          <Input
            label="Kunden-ID"
            placeholder="z. B. C-001"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />
          <Input
            label="Kundenname"
            placeholder="z. B. Commerzbank"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <Button color="primary" onPress={handleAdd}>
            <Plus className="w-5 h-5 text-slate-100" /> Kunde anlegen</Button>

          <div className="mt-4 space-y-2 max-h-[40vh] overflow-auto">
            {customers.map((c) => (
              <div key={c.id} className="flex justify-between items-center bg-slate-800/10 px-3 py-2 rounded-lg">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-slate-400">{c.id}</div>
                </div>
                <Button variant="light" size="sm" onPress={() => deleteCustomer(c.id)}>
                    <Trash2 className="w-5 h-5 text-slate-500" />
                </Button>
              </div>
            ))}
            {customers.length === 0 && (
              <div className="text-slate-400 text-sm">Noch keine Kunden angelegt.</div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="flat" onPress={onClose}>Schließen</Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}