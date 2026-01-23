"use client";

import { useState } from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { AlertTriangle, ArrowLeft } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  deleteAccount,
  getAccountInfo,
  updateAccountInfo,
} from "@/data-service/mutations";

import { type AccountInfo as UserInfo } from "@/types/accountInfo";

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, status, refetch } = useQuery({
    staleTime: Infinity,
    queryFn: getAccountInfo,
    queryKey: ["account-info"],
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { mutate: deleteMyAccount, isPending: isDeleting } = useMutation({
    mutationFn: deleteAccount,

    onSuccess: () => {
      router.push("/");
    },

    onError: (error) => {
      if (error.cause === 403) {
        toast.error("Unauthorized");

        return router.push("/");
      }

      if (error.cause === 429) {
        return toast.error("Too many requests. Please try again later.");
      }

      toast.error("Something went wrong. Please try again.");
    },
  });

  const { mutate: updateMyAccountInfo, isPending: isUpdating } = useMutation({
    mutationFn: updateAccountInfo,

    onSuccess: async () => {
      toast.success("Account updated successfully");
      await queryClient.invalidateQueries({ queryKey: ["account-info"] });
    },

    onError: (error) => {
      if (error.cause === 400) {
        return toast.error(error.message);
      }

      if (error.cause === 403) {
        toast.error("Unauthorized");

        return router.push("/");
      }

      if (error.cause === 429) {
        return toast.error("Too many requests. Please try again later.");
      }

      toast.error("Something went wrong. Please try again.");
    },
  });

  function handleGoBack() {
    router.back();
  }

  function handleDeleteAccount() {
    deleteMyAccount();
  }

  function handleUpdateAccountInfo({ name }: { name: string }) {
    updateMyAccountInfo({ name });
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={handleGoBack}
                className="border-border cursor-pointer text-foreground hover:bg-background bg-transparent"
              >
                <ArrowLeft size={10} /> Back
              </Button>
              <h1 className="text-lg font-bold text-foreground">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {status === "pending" && <LoadingState />}

        {status === "success" && (
          <AccountInfo
            data={data!}
            isDeleting={isDeleting}
            isUpdating={isUpdating}
            showDeleteConfirm={showDeleteConfirm}
            handleDeleteAccount={handleDeleteAccount}
            setShowDeleteConfirm={setShowDeleteConfirm}
            handleUpdateAccountInfo={handleUpdateAccountInfo}
          />
        )}

        {status === "error" && <ErrorState onRetry={() => refetch()} />}
      </main>
    </div>
  );
}

function AccountInfo({
  data,
  isUpdating,
  isDeleting,
  showDeleteConfirm,
  handleDeleteAccount,
  setShowDeleteConfirm,
  handleUpdateAccountInfo,
}: {
  data: UserInfo;
  isUpdating: boolean;
  isDeleting: boolean;
  showDeleteConfirm: boolean;
  handleDeleteAccount: () => void;
  setShowDeleteConfirm: (value: boolean) => void;
  handleUpdateAccountInfo: ({ name }: { name: string }) => void;
}) {
  const [name, setName] = useState(data.name);

  function handleCancelUpdate() {
    setName(data.name);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-card border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-6">
          Account Information
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Profile Picture
            </label>

            <div className="flex items-center gap-4">
              <div className="relative size-16 rounded-full overflow-hidden">
                <Image
                  fill
                  alt={"Profile Picture"}
                  src={
                    data?.picture ||
                    "https://avatars.githubusercontent.com/u/12345?v=4"
                  }
                />
              </div>
            </div>
          </div>

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
              minLength={3}
              maxLength={30}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

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
              value={data?.email}
              className="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Email cannot be changed
            </p>
          </div>

          {name !== data.name && (
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={handleCancelUpdate}
                className="border-border text-foreground hover:bg-background"
              >
                Cancel
              </Button>

              <Button
                disabled={isUpdating}
                onClick={() => handleUpdateAccountInfo({ name })}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-destructive/5 border border-destructive/20 gap-y-4">
        <h2 className="text-lg font-semibold text-foreground">Danger Zone</h2>

        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>

        {!showDeleteConfirm && (
          <Button
            variant="destructive"
            className="cursor-pointer"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete Account
          </Button>
        )}

        {showDeleteConfirm && (
          <div className="space-y-4 p-4 bg-background border border-destructive/20 rounded-lg">
            <p className="text-sm font-medium text-foreground">
              Are you sure you want to delete your account?
            </p>

            <p className="text-xs text-muted-foreground">
              This will permanently delete your account and all your data. This
              action cannot be undone.
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="border-border text-foreground cursor-pointer hover:bg-background"
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                disabled={isDeleting}
                className="cursor-pointer"
                onClick={handleDeleteAccount}
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function LoadingState() {
  return (
    <Card className="p-6 bg-card border border-border">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-muted rounded w-1/3 mb-6"></div>
        <div className="space-y-6">
          <div>
            <div className="h-4 bg-muted rounded w-1/4 mb-3"></div>
            <div className="h-16 w-16 rounded-full bg-muted"></div>
          </div>
          <div>
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
          <div>
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-muted/50 rounded"></div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="p-6 bg-card border border-border">
      <div className="text-center space-y-2">
        <AlertTriangle className="size-10 text-destructive mx-auto" />

        <h3 className="text-lg font-medium text-destructive">
          Failed to load account information
        </h3>

        <p className="text-muted-foreground">
          We couldn&apos;t load your account details. Please try again.
        </p>

        <Button variant="outline" onClick={onRetry} className="mt-4">
          Retry
        </Button>
      </div>
    </Card>
  );
}
