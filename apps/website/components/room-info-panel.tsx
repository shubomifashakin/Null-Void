"use client";

import { RoomInfoPayload } from "@null-void/shared";
import { useState } from "react";

interface RoomInfoPanelProps {
  isAdmin: boolean;
  room: RoomInfoPayload;
  onUpdate: (name: string, description: string) => void;
}

export default function RoomInfoPanel({
  room,
  isAdmin,
  onUpdate,
}: RoomInfoPanelProps) {
  const [name, setName] = useState(room.name);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(room.description);

  function handleSave() {
    onUpdate(name.trim(), description.trim());
    setIsEditing(false);
  }

  function handleCancel() {
    setName(room.name);
    setDescription(room.description);
    setIsEditing(false);
  }

  if (isEditing && isAdmin) {
    return (
      <div className="border border-border rounded p-4 bg-background space-y-3">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-2">
            Room Name
          </label>

          <input
            type="text"
            value={name}
            minLength={3}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-card border border-border rounded focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-2">
            Description
          </label>

          <textarea
            rows={3}
            minLength={5}
            maxLength={100}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-card border border-border rounded focus:outline-none focus:border-primary resize-none"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
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
      </div>
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
