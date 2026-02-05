"use client";

import {
  Activity,
  createRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useParams, useRouter } from "next/navigation";

import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import {
  DrawEvent,
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

import { useRoomState } from "@/stores/room-state";

import RoomCanvas from "@/components/room-canvas";
import InvitePanel from "@/components/invite-panel";
import RoomLoading from "@/components/rooms-loading";
import ToolbarPanel from "@/components/toolbar-panel";
import MembersPanel from "@/components/members-panel";
import RoomInfoPanel from "@/components/room-info-panel";
import CurrentUserPanel from "@/components/current-user-panel";

import { useSockets } from "@/hooks/useSockets";
import { Role } from "@/types/room";

type Panels = "invites" | "info";

export default function Page() {
  const router = useRouter();
  const { socket } = useSockets();
  const { roomId } = useParams<{ roomId: string }>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    userInfo,
    connectedUsers,
    roomInfo,
    drawEvents,
    reconnecting,
    clientReady,
    serverReady,
    setConnected,
    setDrawEvents,
    setServerReady,
    setClientReady,
    setRoomInfo,
    setUserInfo,
    setReconnecting,
    setConnectedUsers,
    addConnectedUser,
    addDrawEvent,
    removeDrawEvent,
    removeConnectedUser,
    updateConnectedUserRole,
  } = useRoomState();

  const [activeTab, setActiveTab] = useState<Panels>("info");

  function handleRemoveMember(userId: string) {
    if (userInfo?.role !== "ADMIN" || !socket) {
      return toast.error("Unauthorized");
    }

    socket.emit(WS_EVENTS.USER_REMOVE, { userId });
  }

  function handleGoBack() {
    router.back();
  }

  const handleConnect = useCallback(() => {
    setConnected(true);
  }, [setConnected]);

  function handleLeaveRoom() {
    if (!socket || !userInfo?.userId) return;

    socket.emit(WS_EVENTS.ROOM_LEAVE, { userId: userInfo.userId });
  }

  function handleUpdateRoom(name: string, description: string) {
    if (userInfo?.role !== "ADMIN" || !socket) {
      return toast.error("Unauthorized");
    }

    socket.emit(WS_EVENTS.ROOM_INFO, {
      name,
      description,
    } satisfies RoomInfoPayload);
  }

  const handleCanvasState = useCallback(
    (event: { state: DrawEvent[] }) => {
      setDrawEvents(event.state);

      setClientReady(true);
    },
    [setClientReady, setDrawEvents],
  );

  const handleUndoDraw = useCallback(
    (event: UndoDrawPayload) => {
      removeDrawEvent(event.id);
    },
    [removeDrawEvent],
  );

  const handleRoomReady = useCallback(() => {
    setServerReady(true);
  }, [setServerReady]);

  const handleRoomInfo = useCallback(
    (event: RoomInfoPayload) => {
      setRoomInfo(event);
    },
    [setRoomInfo],
  );

  function handleRoomError(event: RoomErrorPayload) {
    toast.error(event.message);
  }

  const handleUserInfo = useCallback(
    (event: UserInfoPayload) => {
      setUserInfo(event);
    },
    [setUserInfo],
  );

  const handleUserMove = useCallback(
    (event: UserMovePayload) => {
      const foundUser = Object.values(connectedUsers).find(
        (user) => user.userId === event.userId,
      );

      if (!foundUser?.ref?.current) return;

      foundUser.ref.current.style.visibility = "visible";

      foundUser.ref.current.style.setProperty("--x", `${event.x}px`);
      foundUser.ref.current.style.setProperty("--y", `${event.y}px`);
    },
    [connectedUsers],
  );

  const handleUserJoined = useCallback(
    (event: UserJoinedPayload) => {
      addConnectedUser({ ...event, ref: createRef<HTMLDivElement>() });
    },
    [addConnectedUser],
  );

  const handleUserList = useCallback(
    (event: UserListPayload) => {
      setConnectedUsers(
        event.users.map((user) => ({
          ...user,
          ref: createRef<HTMLDivElement>()!,
        })),
      );
    },
    [setConnectedUsers],
  );

  const handleDrawEvent = useCallback(
    (event: DrawEvent) => {
      addDrawEvent(event);
    },
    [addDrawEvent],
  );

  const handleDraw = useCallback(
    (event: DrawEvent) => {
      if (!socket) return;

      addDrawEvent(event);
      socket.volatile.emit(WS_EVENTS.USER_DRAW, event);
    },
    [addDrawEvent, socket],
  );

  const handleUserPromoted = useCallback(
    (event: UserPromotedPayload) => {
      if (event.userId === userInfo.userId) return;
      updateConnectedUserRole(event);
    },
    [updateConnectedUserRole, userInfo],
  );

  const handlePromoteUser = useCallback(
    (userId: string, role: Role) => {
      if (!socket) return;

      socket.emit(WS_EVENTS.USER_PROMOTED, {
        userId,
        role,
      } as UserPromotedPayload);
    },
    [socket],
  );

  const handleRoomNotification = useCallback(
    (event: RoomNotificationPayload) => {
      toast.info(event.message);
    },
    [],
  );

  const handleRoomMemberDisconnected = useCallback(
    (event: UserDisconnectedPayload) => {
      removeConnectedUser(event.userId);
    },
    [removeConnectedUser],
  );

  const handleCanvasMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!socket || !canvasRef.current) return;

      const now = Date.now();
      const rect = canvasRef.current.getBoundingClientRect();

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const payload = {
        x,
        y,
        isPenDown: false,
        timestamp: now.toString(),
      } as UserMovePayload;

      socket.volatile.emit(WS_EVENTS.USER_MOVE, payload);
    },
    [socket, canvasRef],
  );

  const handleConnectError = useCallback(() => {
    if (!socket) return;

    if (socket.active) {
      setReconnecting(true);
    } else {
      setConnected(false);
      setReconnecting(false);
    }
  }, [socket, setReconnecting, setConnected]);

  const handleCurrentUserDisconnected = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  useEffect(
    function () {
      if (!socket) return;

      socket.on("connect_error", handleConnectError);

      socket.on("connect", handleConnect);

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
        socket.off("connect", handleConnect);
        socket.off("disconnect", handleCurrentUserDisconnected);
        socket.off(WS_EVENTS.ROOM_INFO, handleRoomInfo);
        socket.off(WS_EVENTS.ROOM_ERROR, handleRoomError);
        socket.off(WS_EVENTS.ROOM_NOTIFICATION, handleRoomNotification);
        socket.off(WS_EVENTS.USER_INFO, handleUserInfo);
        socket.off(WS_EVENTS.USER_DISCONNECTED, handleRoomMemberDisconnected);
        socket.off(WS_EVENTS.USER_MOVE, handleUserMove);
        socket.off(WS_EVENTS.USER_JOINED, handleUserJoined);
        socket.off(WS_EVENTS.USER_LIST, handleUserList);
        socket.off(WS_EVENTS.USER_DRAW, handleDrawEvent);
        socket.off(WS_EVENTS.USER_PROMOTED, handleUserPromoted);
      };
    },
    [
      socket,
      handleCurrentUserDisconnected,
      handleDraw,
      handleDrawEvent,
      handleRoomMemberDisconnected,
      handleUserJoined,
      handleRoomNotification,
      handleUserPromoted,
      handleConnect,
      handleUserList,
      handleCanvasState,
      handleRoomInfo,
      handleRoomReady,
      handleUserInfo,
      handleConnectError,
      handleUndoDraw,
      handleUserMove,
    ],
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
        <ToolbarPanel role={userInfo.role} />

        <RoomCanvas
          canvasRef={canvasRef}
          handleDraw={handleDraw}
          drawEvents={drawEvents}
          handleMouseMove={handleCanvasMouseMove}
          connectedUsers={Object.values(connectedUsers)}
        />
      </div>

      <div className="w-64 border-l border-border bg-card flex flex-col">
        <CurrentUserPanel user={userInfo!} onLeaveRoom={handleLeaveRoom} />

        <PanelControls activeTab={activeTab} setActiveTab={setActiveTab} />

        <div className="flex-1 overflow-y-auto">
          <Activity mode={activeTab === "info" ? "visible" : "hidden"}>
            <div className="space-y-4 p-4">
              <RoomInfoPanel
                room={roomInfo!}
                onUpdate={handleUpdateRoom}
                isAdmin={userInfo!.role! === "ADMIN"}
              />

              <MembersPanel
                onPromoteMember={handlePromoteUser}
                members={Object.values(connectedUsers)}
                isAdmin={userInfo!.role === "ADMIN"}
                onRemoveMember={handleRemoveMember}
                totalConnectedUsers={Object.keys(connectedUsers).length}
              />
            </div>
          </Activity>

          <Activity mode={activeTab === "invites" ? "visible" : "hidden"}>
            <InvitePanel roomId={roomId} isAdmin={userInfo!.role === "ADMIN"} />
          </Activity>
        </div>
      </div>
    </div>
  );
}

function PanelControls({
  activeTab,
  setActiveTab,
}: {
  activeTab: Panels;
  setActiveTab: (val: Panels) => void;
}) {
  return (
    <div className="px-4 py-3 border-b border-border flex gap-2">
      <button
        title="Info"
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
        title="Invites"
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
  );
}
