import {
  DrawEvent,
  RoomInfoPayload,
  UserInfoPayload,
  UserPromotedPayload,
} from "@null-void/shared";
import { create } from "zustand";

interface RoomState {
  connected: boolean;
  serverReady: boolean;
  clientReady: boolean;
  reconnecting: boolean;
  roomInfo: RoomInfoPayload;
  userInfo: UserInfoPayload;
  drawEvents: DrawEvent[];
  connectedUsers: UserInfoPayload[];

  setConnected: (connected: boolean) => void;
  setServerReady: (serverReady: boolean) => void;
  setClientReady: (clientReady: boolean) => void;
  addDrawEvent: (event: DrawEvent) => void;
  removeDrawEvent: (drawId: string) => void;
  addConnectedUser: (user: UserInfoPayload) => void;
  removeConnectedUser: (userId: string) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setRoomInfo: (roomInfo: RoomInfoPayload) => void;
  setUserInfo: (userInfo: UserInfoPayload) => void;
  setDrawEvents: (drawEvents: DrawEvent[]) => void;
  setConnectedUsers: (connectedUsers: UserInfoPayload[]) => void;
  updateConnectedUserRole: (user: UserPromotedPayload) => void;
  reset: () => void;
}

const initialState = {
  connected: false,
  serverReady: false,
  clientReady: false,
  reconnecting: false,
  roomInfo: {} as RoomInfoPayload,
  userInfo: {} as UserInfoPayload,
  drawEvents: [],
  connectedUsers: [],
};

export const useRoomState = create<RoomState>((set) => ({
  ...initialState,

  setConnected: (connected: boolean) => set({ connected }),
  setServerReady: (serverReady: boolean) => set({ serverReady }),
  setClientReady: (clientReady: boolean) => set({ clientReady }),
  setReconnecting: (reconnecting: boolean) => set({ reconnecting }),
  setRoomInfo: (roomInfo: RoomInfoPayload) => set({ roomInfo }),
  setUserInfo: (userInfo: UserInfoPayload) => set({ userInfo }),
  setDrawEvents: (drawEvents: DrawEvent[]) => set({ drawEvents }),
  setConnectedUsers: (connectedUsers: UserInfoPayload[]) =>
    set({ connectedUsers }),

  updateConnectedUserRole: (user) => {
    set((state) => ({
      connectedUsers: state.connectedUsers.map((u) =>
        u.userId === user.userId ? { ...u, role: user.role } : u
      ),
    }));
  },

  removeDrawEvent: (id) => {
    set((state) => ({
      drawEvents: state.drawEvents.filter((event) => event.id !== id),
    }));
  },

  addDrawEvent: (event: DrawEvent) =>
    set((state) => ({
      drawEvents: [...state.drawEvents, event],
    })),

  addConnectedUser: (user: UserInfoPayload) =>
    set((state) => ({
      connectedUsers: [...state.connectedUsers, user],
    })),
  removeConnectedUser: (userId: string) =>
    set((state) => ({
      connectedUsers: state.connectedUsers.filter(
        (user) => user.userId !== userId
      ),
    })),

  reset: () => set(initialState),
}));
