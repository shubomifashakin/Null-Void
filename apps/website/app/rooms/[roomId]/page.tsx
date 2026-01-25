"use client";

import { Activity, useCallback, useEffect, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import {
  DrawEvent,
  Role,
  RoomErrorPayload,
  RoomInfoPayload,
  RoomNotificationPayload,
  UndoDrawPayload,
  UserDisconnectedPayload,
  UserInfoPayload,
  UserJoinedPayload,
  UserListPayload,
  UserMovePayload,
  UserPromotedPayload,
  WS_EVENTS,
} from "@null-void/shared";

import RoomCanvas from "@/components/room-canvas";
import RoomLoading from "@/components/rooms-loading";
import ToolbarPanel from "@/components/toolbar-panel";
import MembersPanel from "@/components/members-panel";
import RoomInfoPanel from "@/components/room-info-panel";
import CurrentUserPanel from "@/components/current-user-panel";

import { useSockets } from "@/hooks/useSockets";

export default function Page() {
  const router = useRouter();
  const { roomId } = useParams<{ roomId: string }>();

  const { socket } = useSockets();

  const [connected, setConnected] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const [clientReady, setClientReady] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);
  const [roomInfo, setRoomInfo] = useState<RoomInfoPayload>();
  const [userInfo, setUserInfo] = useState<UserInfoPayload>();
  const [drawEvents, setDrawEvents] = useState<DrawEvent[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<UserInfoPayload[]>([]);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>();

  const [selectedTool, setSelectedTool] = useState<
    "cursor" | "circle" | "polygon" | "line"
  >("cursor");

  const [activeTab, setActiveTab] = useState<"info" | "invites">("info");

  const pendingInvites = [
    {
      id: "1",
      email: "john@example.com",
      role: "editor" as const,
      sentAt: "2 hours ago",
    },
    {
      id: "2",
      email: "jane@example.com",
      role: "viewer" as const,
      sentAt: "1 day ago",
    },
  ];

  function handleRemoveMember(userId: string) {
    if (userInfo?.role !== "ADMIN") return;

    console.log("Remove member:", userId);
  }

  function handleGoBack() {
    router.back();
  }

  function handleRevokeInvite(inviteId: string) {
    if (userInfo?.role !== "ADMIN") return;
    console.log("Revoke invite:", inviteId);
  }

  function handleSendInvite() {
    if (userInfo?.role !== "ADMIN") return;

    console.log("Send invite to:", inviteEmail, "with role:", inviteRole);
  }

  function handleLeaveRoom() {
    //emit the leave event
  }

  function handleUpdateRoom(name: string, description: string) {
    if (userInfo?.role !== "ADMIN") return;

    console.log("Update room:", name, description);
  }

  function handleCanvasState(event) {
    console.log(event, "canvas state");
    //loop through each event and draw on canvas
    setDrawEvents(event.state);

    //FIXME: AFTEr looping through all events, set the client state to ready
  }

  function handleUndoDraw(event: UndoDrawPayload) {
    //when message is received remove the draw event from
    console.log(event);
  }

  function handleRoomReady() {
    setServerReady(true);
  }

  function handleRoomInfo(event: RoomInfoPayload) {
    setRoomInfo(event);
  }

  function handleRoomError(event: RoomErrorPayload) {
    toast.error(event.message);
  }

  function handleUserInfo(event: UserInfoPayload) {
    setUserInfo(event);
  }

  function handleUserMove(event: UserMovePayload) {
    //FIXME: move the mouse to the new position
    console.log(event);
  }

  const handleUserJoined = useCallback(
    (event: UserJoinedPayload) => {
      setConnectedUsers([...connectedUsers, event]);
    },
    [connectedUsers]
  );

  const handleUserList = useCallback((event: UserListPayload) => {
    setConnectedUsers(event.users);
  }, []);

  const handleDrawEvent = useCallback(
    (event: DrawEvent) => {
      //FIXME: append the drawing to the list, needs acknowledgment
      console.log("draw event", event);

      setDrawEvents([...drawEvents, event]);
      //FIXME: DRAW ON THE CANVAS
    },
    [drawEvents]
  );

  const handleUserPromoted = useCallback(
    (event: UserPromotedPayload) => {
      setConnectedUsers(
        connectedUsers.map((user) =>
          user.userId === event.userId ? { ...user, role: event.role } : user
        )
      );
    },
    [connectedUsers]
  );

  const handleRoomNotification = useCallback(
    (event: RoomNotificationPayload) => {
      toast.info(event.message);
    },
    []
  );

  const handleRoomMemberDisconnected = useCallback(
    (event: UserDisconnectedPayload) => {
      setConnectedUsers(
        connectedUsers.filter((user) => user.userId !== event.userId)
      );
    },
    [connectedUsers]
  );

  const handleCurrentUserDisconnected = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  useEffect(
    function () {
      if (!socket) return;

      socket.on("connect_error", (error) => {
        if (socket.active) {
          setReconnecting(true);
        } else {
          setConnected(false);
          setReconnecting(false);
        }
      });

      socket.on("connect", () => {
        console.log("connected");
      });

      socket.on(WS_EVENTS.CANVAS_STATE, handleCanvasState);

      socket.on(WS_EVENTS.ROOM_UNDO_DRAW, handleUndoDraw);

      socket.on(WS_EVENTS.ROOM_READY, handleRoomReady);

      socket.on(WS_EVENTS.ROOM_INFO, handleRoomInfo);

      socket.on(WS_EVENTS.ROOM_ERROR, handleRoomError);

      socket.on(WS_EVENTS.ROOM_NOTIFICATION, handleRoomNotification);

      socket.on(WS_EVENTS.USER_INFO, handleUserInfo);

      socket.on(WS_EVENTS.USER_DISCONNECTED, handleRoomMemberDisconnected);

      socket.on(WS_EVENTS.USER_MOVE, handleUserMove);

      socket.on(WS_EVENTS.USER_JOINED, handleUserJoined);

      socket.on(WS_EVENTS.USER_LIST, handleUserList);

      socket.on(WS_EVENTS.USER_DRAW, handleDrawEvent);

      socket.on(WS_EVENTS.USER_PROMOTED, handleUserPromoted);

      socket.on("disconnect", handleCurrentUserDisconnected);

      return () => {
        socket.off("connect_error");
        socket.off("connect");
        socket.off("disconnect");
        socket.off(WS_EVENTS.ROOM_INFO, handleRoomInfo);
        socket.off(WS_EVENTS.ROOM_ERROR, handleRoomError);
        socket.off(WS_EVENTS.ROOM_NOTIFICATION, handleRoomNotification);
        socket.off(WS_EVENTS.USER_INFO, handleUserInfo);
        socket.off(WS_EVENTS.USER_DISCONNECTED, handleRoomMemberDisconnected);
        socket.off(WS_EVENTS.USER_MOVE, handleUserMove);
        socket.off(WS_EVENTS.USER_JOINED, handleUserJoined);
        socket.off(WS_EVENTS.USER_LIST, handleUserList);
        socket.off(WS_EVENTS.USER_DRAW, handleUndoDraw);
        socket.off(WS_EVENTS.USER_PROMOTED, handleUserPromoted);
      };
    },
    [
      socket,
      handleCurrentUserDisconnected,
      handleDrawEvent,
      handleRoomMemberDisconnected,
      handleUserJoined,
      handleRoomNotification,
      handleUserPromoted,
      handleUserList,
    ]
  );

  if (!clientReady || !serverReady) return <RoomLoading />;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="w-16 border-r border-border bg-card flex flex-col items-center justify-start pt-4">
        <button
          onClick={handleGoBack}
          title="Back to Dashboard"
          className="p-3 text-foreground cursor-pointer hover:bg-background rounded transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
      </div>

      <div className="flex-1 flex flex-col">
        <ToolbarPanel
          selectedTool={selectedTool}
          onToolChange={setSelectedTool}
        />

        <RoomCanvas tool={selectedTool} roomId={roomId} />
      </div>

      <div className="w-64 border-l border-border bg-card flex flex-col">
        <CurrentUserPanel user={userInfo!} onLeaveRoom={handleGoBack} />

        <div className="px-4 py-3 border-b border-border flex gap-2">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 px-3 py-2 text-xs cursor-pointer font-medium rounded transition-colors ${
              activeTab === "info"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Info
          </button>

          <button
            onClick={() => setActiveTab("invites")}
            className={`flex-1 px-3 py-2 text-xs cursor-pointer font-medium rounded transition-colors ${
              activeTab === "invites"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Invites
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <Activity mode={activeTab === "info" ? "visible" : "hidden"}>
            <div className="space-y-4 p-4">
              <RoomInfoPanel
                room={roomInfo!}
                onUpdate={handleUpdateRoom}
                isAdmin={userInfo!.role! === "ADMIN"}
              />

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Members ({connectedUsers.length})
                </h3>

                <MembersPanel
                  members={connectedUsers}
                  isAdmin={userInfo!.role === "ADMIN"}
                  onRemoveMember={handleRemoveMember}
                />
              </div>
            </div>
          </Activity>

          <Activity mode={activeTab === "invites" ? "visible" : "hidden"}>
            <div className="p-4">
              <div className="space-y-4">
                {userInfo!.role === "ADMIN" && (
                  <div className="border border-border rounded p-3 bg-background">
                    <input
                      type="email"
                      value={inviteEmail}
                      placeholder="Enter email to invite..."
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-card border border-border rounded focus:outline-none focus:border-primary mb-2"
                    />

                    <select className="w-full px-3 py-2 text-xs bg-card border border-border rounded focus:outline-none focus:border-primary mb-2">
                      <option value={"VIEWER"}>Viewer</option>

                      <option value={"EDITOR"}>Editor</option>

                      <option value={"ADMIN"}>Admin</option>
                    </select>

                    <button
                      onClick={handleSendInvite}
                      className="w-full px-3 py-2 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                    >
                      Send Invite
                    </button>
                  </div>
                )}

                {pendingInvites.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">
                      Pending
                    </h4>

                    {pendingInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between gap-2 p-3 bg-background rounded mb-2 border border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {invite.email}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {invite.role}
                          </p>
                        </div>

                        {userInfo!.role === "ADMIN" && (
                          <button
                            onClick={() => handleRevokeInvite(invite.id)}
                            className="text-xs px-2 py-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Activity>
        </div>
      </div>
    </div>
  );
}
