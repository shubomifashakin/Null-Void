"use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import { io } from "socket.io-client";

import { toast } from "sonner";

import {
  RoomErrorPayload,
  RoomInfoPayload,
  RoomNotificationPayload,
  RoomReadyPayload,
  UndoDrawPayload,
  UserDisconnectedPayload,
  UserInfoPayload,
  UserJoinedPayload,
  UserListPayload,
  UserMovePayload,
  UserPromotedPayload,
  WS_EVENTS,
} from "@null-void/shared";

const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

export default function Page() {
  const { roomId } = useParams<{ roomId: string }>();

  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [drawEvents, setDrawEvents] = useState([]);
  const [userInfo, setUserInfo] = useState<UserInfoPayload>();
  const [roomInfo, setRoomInfo] = useState({});
  const [serverReady, setServerReady] = useState(false);
  const [clientReady, setClientReady] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<UserInfoPayload[]>([]);

  useEffect(
    function () {
      const socket = io(`${websocketUrl}/rooms`, {
        query: { roomId },
        retries: 3,
        ackTimeout: 10000,
        withCredentials: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

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

      socket.on(WS_EVENTS.CANVAS_STATE, (event) => {
        console.log(event, "canvas state");
        //loop through each event and draw on canvas
        setDrawEvents(event.state);
      });

      socket.on(WS_EVENTS.ROOM_UNDO_DRAW, (event: UndoDrawPayload) => {
        //when message is received remove the draw event from
        console.log(event);
      });

      socket.on(WS_EVENTS.ROOM_READY, (event: RoomReadyPayload) => {
        console.log(event);
        setServerReady(true);
      });

      socket.on(WS_EVENTS.ROOM_INFO, (event: RoomInfoPayload) => {
        console.log(event, "room info");
        setRoomInfo(event);
      });

      socket.on(WS_EVENTS.ROOM_ERROR, (event: RoomErrorPayload) => {
        toast.error(event.message);
      });

      socket.on(
        WS_EVENTS.ROOM_NOTIFICATION,
        (event: RoomNotificationPayload) => {
          toast.info(event.message);
        }
      );

      socket.on(WS_EVENTS.USER_INFO, (event: UserInfoPayload) => {
        console.log(event, "user info");
        setUserInfo(event);
      });

      socket.on(
        WS_EVENTS.USER_DISCONNECTED,
        (event: UserDisconnectedPayload) => {
          //remove the user from the list
          console.log(event);
          setConnectedUsers(
            connectedUsers.filter((user) => user.userId !== event.userId)
          );
        }
      );

      socket.on(WS_EVENTS.USER_MOVE, (event: UserMovePayload) => {
        //move the mouse to the new position
        console.log(event);
      });

      socket.on(WS_EVENTS.USER_JOINED, (event: UserJoinedPayload) => {
        //add the user to the list
        console.log(event);
        setConnectedUsers([...connectedUsers, event]);
      });

      socket.on(WS_EVENTS.USER_LIST, (event: UserListPayload) => {
        //update the user list
        console.log(event);
        setConnectedUsers(event.users);
      });

      socket.on(WS_EVENTS.USER_DRAW, (event) => {
        //append the drawing to the list, needs acknowledgment
        console.log(event);
        setDrawEvents([...drawEvents, event]);
      });

      socket.on(WS_EVENTS.USER_PROMOTED, (event: UserPromotedPayload) => {
        //update the users role
        console.log(event);
        setConnectedUsers(
          connectedUsers.map((user) =>
            user.userId === event.userId ? { ...user, role: event.role } : user
          )
        );
      });
    },
    [roomId, connectedUsers, drawEvents]
  );

  return <div></div>;
}
