"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborators: string[];
  onSave: (collaborators: string[]) => void;
}

export function CollaboratorModal({
  isOpen,
  onClose,
  collaborators,
  onSave,
}: CollaboratorModalProps) {
  const [currentCollaborator, setCurrentCollaborator] = useState("");
  const [error, setError] = useState("");

  const validateCurrentCollaborator = () => {
    if (!currentCollaborator.trim()) {
      setError("Collaborator name is required");
      return false;
    }

    if (collaborators.includes(currentCollaborator.trim())) {
      setError("This collaborator has already been added");
      return false;
    }

    setError("");
    return true;
  };

  const handleAddCollaborator = () => {
    if (validateCurrentCollaborator()) {
      onSave([...collaborators, currentCollaborator.trim()]);
      setCurrentCollaborator("");
      setError("");
    }
  };

  const handleRemoveCollaborator = (index: number) => {
    onSave(collaborators.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setCurrentCollaborator("");
    setError("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Manage Collaborators">
      <div className="space-y-6">
        {/* Current Collaborator Form */}
        <div className="space-y-4 p-4 border border-border bg-muted/30">
          <h3 className="font-medium">Add New Collaborator</h3>
          <div className="space-y-2">
            <Label htmlFor="collaborator-name">
              Organization/Department Name *
            </Label>
            <Input
              id="collaborator-name"
              placeholder="e.g., Engineering Department"
              value={currentCollaborator}
              onChange={(e) => {
                setCurrentCollaborator(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCollaborator();
                }
              }}
              className="rounded-none shadow-none focus-visible:ring-0"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <Button
            type="button"
            onClick={handleAddCollaborator}
            className="w-full rounded-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Collaborator
          </Button>
        </div>

        {/* Added Collaborators Stack */}
        {collaborators.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">
              Added Collaborators ({collaborators.length})
            </h3>
            <div className="space-y-3">
              {collaborators.map((collaborator, index) => (
                <div
                  key={index}
                  className="p-4 border border-border bg-background"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{collaborator}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveCollaborator(index)}
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

        {/* Empty State */}
        {collaborators.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground italic">
              No collaborators added yet. Add your first collaborating
              organization above.
            </p>
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
        </div>
      </div>
    </Modal>
  );
}
