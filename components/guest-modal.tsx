"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Guest {
  name: string;
  expertise: string;
  reason: string;
}

interface GuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  guests: Guest[];
  onSave: (guests: Guest[]) => void;
}

export function GuestModal({
  isOpen,
  onClose,
  guests,
  onSave,
}: GuestModalProps) {
  const [currentGuest, setCurrentGuest] = useState<Guest>({
    name: "",
    expertise: "",
    reason: "",
  });
  const [tempGuests, setTempGuests] = useState<Guest[]>(guests);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCurrentGuest = () => {
    const newErrors: Record<string, string> = {};

    if (!currentGuest.name.trim()) {
      newErrors.name = "Guest name is required";
    }
    if (!currentGuest.expertise.trim()) {
      newErrors.expertise = "Area of expertise is required";
    }
    if (!currentGuest.reason.trim()) {
      newErrors.reason = "Reason for invitation is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddGuest = () => {
    if (validateCurrentGuest()) {
      const newGuest = {
        name: currentGuest.name.trim(),
        expertise: currentGuest.expertise.trim(),
        reason: currentGuest.reason.trim(),
      };

      setTempGuests([...tempGuests, newGuest]);
      setCurrentGuest({ name: "", expertise: "", reason: "" });
      setErrors({});
    }
  };

  const handleRemoveGuest = (index: number) => {
    setTempGuests(tempGuests.filter((_, i) => i !== index));
  };

  const handleSaveAndClose = () => {
    onSave(tempGuests);
    onClose();
  };

  const handleClose = () => {
    setTempGuests(guests);
    setCurrentGuest({ name: "", expertise: "", reason: "" });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Manage Guests">
      <div className="space-y-6">
        {/* Current Guest Form */}
        <div className="space-y-4 p-4 border border-border bg-muted/30">
          <h3 className="font-medium">Add New Guest</h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guest-name">Guest Name *</Label>
              <Input
                id="guest-name"
                placeholder="Dr. Jane Smith"
                value={currentGuest.name}
                onChange={(e) => {
                  setCurrentGuest({ ...currentGuest, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                className="rounded-none shadow-none focus-visible:ring-0"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-expertise">Area of Expertise *</Label>
              <Input
                id="guest-expertise"
                placeholder="e.g., Machine Learning, Finance"
                value={currentGuest.expertise}
                onChange={(e) => {
                  setCurrentGuest({
                    ...currentGuest,
                    expertise: e.target.value,
                  });
                  if (errors.expertise) setErrors({ ...errors, expertise: "" });
                }}
                className="rounded-none shadow-none focus-visible:ring-0"
              />
              {errors.expertise && (
                <p className="text-xs text-destructive">{errors.expertise}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-reason">Reason for Invitation *</Label>
              <Input
                id="guest-reason"
                placeholder="e.g., Keynote speaker on AI ethics"
                value={currentGuest.reason}
                onChange={(e) => {
                  setCurrentGuest({ ...currentGuest, reason: e.target.value });
                  if (errors.reason) setErrors({ ...errors, reason: "" });
                }}
                className="rounded-none shadow-none focus-visible:ring-0"
              />
              {errors.reason && (
                <p className="text-xs text-destructive">{errors.reason}</p>
              )}
            </div>
          </div>

          <Button
            type="button"
            onClick={handleAddGuest}
            className="w-full rounded-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Guest
          </Button>
        </div>

        {/* Added Guests Stack */}
        {tempGuests.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Added Guests ({tempGuests.length})</h3>
            <div className="space-y-3">
              {tempGuests.map((guest, index) => (
                <div
                  key={index}
                  className="p-4 border border-border bg-background space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{guest.name}</p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Expertise:</strong> {guest.expertise}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Reason:</strong> {guest.reason}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveGuest(index)}
                      className="rounded-none"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="rounded-none"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveAndClose}
            className="rounded-none"
          >
            Done ({tempGuests.length} guests)
          </Button>
        </div>
      </div>
    </Modal>
  );
}
