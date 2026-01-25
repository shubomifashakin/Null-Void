"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";

import { RoomInfoPayload } from "@null-void/shared";

interface RoomInfoPanelProps {
  isAdmin: boolean;
  room: RoomInfoPayload;
  onUpdate: (name: string, description: string) => void;
}

interface Inputs {
  name: string;
  description: string;
}

export default function RoomInfoPanel({
  room,
  isAdmin,
  onUpdate,
}: RoomInfoPanelProps) {
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Inputs>({ defaultValues: room });

  function onSubmit(data: Inputs) {
    onUpdate(data.name.trim(), data.description.trim());
    setIsEditing(false);
  }

  function handleCancel() {
    reset();
    setIsEditing(false);
  }

  if (isEditing && isAdmin) {
    return (
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border border-border rounded p-4 bg-background space-y-3"
      >
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-foreground">
            Room Name
          </label>

          {errors.name?.message && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}

          <input
            type="text"
            {...register("name", {
              required: { value: true, message: "Name is required" },
              minLength: {
                value: 3,
                message: "Must be at least 3 characters long",
              },
              maxLength: {
                value: 20,
                message: "Must be at most 20 characters long",
              },
            })}
            className="w-full px-3 py-2 text-sm bg-card border border-border rounded focus:outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-semibold text-foreground ">
            Description
          </label>

          {errors.description?.message && (
            <p className="text-xs text-destructive">
              {errors.description.message}
            </p>
          )}

          <textarea
            rows={3}
            {...register("description", {
              required: { value: true, message: "Description is required" },
              minLength: {
                value: 5,
                message: "Description must be at least 5 characters long",
              },
              maxLength: {
                value: 100,
                message: "Description must be at most 100 characters long",
              },
            })}
            className="w-full px-3 py-2 text-sm bg-card border border-border rounded focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 px-3 cursor-pointer py-2 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            Save
          </button>

          <button
            onClick={handleCancel}
            className="flex-1 px-3 cursor-pointer py-2 text-xs font-medium text-foreground bg-background border border-border rounded hover:bg-card transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="border border-border rounded p-4 bg-background space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <h2 className="text-sm font-semibold text-foreground">{room.name}</h2>

          <p className="text-xs text-muted-foreground line-clamp-2">
            {room.description}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs px-2 py-1 cursor-pointer text-primary hover:bg-primary/10 rounded transition-colors whitespace-nowrap"
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}
