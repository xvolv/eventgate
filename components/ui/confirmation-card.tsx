"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ConfirmationCardProps {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export function ConfirmationCard({
  title,
  description,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmationCardProps) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onConfirm();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onConfirm, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle
            className={variant === "destructive" ? "text-destructive" : ""}
          >
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Hook for managing confirmation state
export function useConfirmation() {
  const [confirmation, setConfirmation] = React.useState<{
    title: string;
    description: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
  } | null>(null);

  const requestConfirmation = React.useCallback(
    (
      title: string,
      description: string,
      onConfirm: () => void,
      options?: {
        confirmText?: string;
        cancelText?: string;
        variant?: "default" | "destructive";
      }
    ) => {
      return new Promise<boolean>((resolve) => {
        setConfirmation({
          title,
          description,
          onConfirm: () => {
            onConfirm();
            setConfirmation(null);
            resolve(true);
          },
          onCancel: () => {
            setConfirmation(null);
            resolve(false);
          },
          ...options,
        });
      });
    },
    []
  );

  const ConfirmationComponent = React.useCallback(() => {
    if (!confirmation) return null;
    return <ConfirmationCard {...confirmation} />;
  }, [confirmation]);

  return {
    requestConfirmation,
    ConfirmationComponent,
    isOpen: !!confirmation,
  };
}
