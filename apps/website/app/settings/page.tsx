"use client";

import { useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const router = useRouter();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setHasChanges(e.target.value !== "");
  };

  function handleGoBack() {
    router.back();
  }

  const handleSave = async () => {
    setIsSaving(true);
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsSaving(false);
    setHasChanges(false);
    // Show success message
    alert("Changes saved successfully!");
  };

  const handleDeleteAccount = () => {
    // Mock delete account
    alert("Account deleted");
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="border-border text-foreground hover:bg-background bg-transparent"
              >
                ← Back
              </Button>
              <h1 className="text-lg font-bold text-foreground">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Settings Tab */}
        <div className="space-y-6">
          {/* Profile Section */}
          <Card className="p-6 bg-card border border-border">
            <h2 className="text-lg font-semibold text-foreground mb-6">
              Account Information
            </h2>

            <div className="space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <Image src={""} alt={""} className="w-16 h-16 rounded-full" />
                </div>
              </div>

              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Email Field (Read-only) */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  disabled
                  value={""}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
              </div>

              {/* Save Button */}
              {hasChanges && (
                <div className="flex gap-2 justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setName(name);
                      setHasChanges(false);
                    }}
                    className="border-border text-foreground hover:bg-background"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 bg-destructive/5 border border-destructive/20 gap-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              Danger Zone
            </h2>

            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This
              action cannot be undone.
            </p>

            {!showDeleteConfirm ? (
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete Account
              </Button>
            ) : (
              <div className="space-y-4 p-4 bg-background border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium text-foreground">
                  Are you sure you want to delete your account?
                </p>
                <p className="text-xs text-muted-foreground">
                  This will permanently delete your account and all your data.
                  This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="border-border text-foreground hover:bg-background"
                  >
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteAccount}>
                    Delete Account
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
