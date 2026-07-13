"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DeleteResumeButtonProps {
  id: string;
  filePath: string;
}

export default function DeleteResumeButton({ id, filePath }: DeleteResumeButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this resume? This will also remove the uploaded file from storage.")) {
      return;
    }

    setIsDeleting(true);
    const toastId = toast.loading("Deleting resume...");

    try {
      const response = await fetch("/api/delete-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resumeId: id, filePath }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete resume.");
      }

      toast.success("Resume deleted successfully.", { id: toastId });
      router.refresh();
    } catch (error: any) {
      console.error("Resume Delete Error:", error);
      toast.error(error.message || "An unexpected error occurred during deletion.", { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? "Deleting..." : "Delete"}
    </Button>
  );
}
