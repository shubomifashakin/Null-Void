import {
  DrawEvent,
  RoomInfoPayload,
  UserInfoPayload,
  UserPromotedPayload,
} from "@null-void/shared";
import { create } from "zustand";

export type UserInfoWithRef = UserInfoPayload & {
  ref: React.RefObject<HTMLDivElement | null>;
};

interface RoomState {
  connected: boolean;
  serverReady: boolean;
  clientReady: boolean;
  reconnecting: boolean;
  roomInfo: RoomInfoPayload;
  userInfo: UserInfoPayload;
  drawEvents: DrawEvent[];
  connectedUsers: Record<string, UserInfoWithRef>;

  setConnected: (connected: boolean) => void;
  setServerReady: (serverReady: boolean) => void;
  setClientReady: (clientReady: boolean) => void;
  addDrawEvent: (event: DrawEvent) => void;
  removeDrawEvent: (drawId: string) => void;
  addConnectedUser: (user: UserInfoWithRef) => void;
  removeConnectedUser: (userId: string) => void;
  setReconnecting: (reconnecting: boolean) => void;
  setRoomInfo: (roomInfo: RoomInfoPayload) => void;
  setUserInfo: (userInfo: UserInfoPayload) => void;
  setDrawEvents: (drawEvents: DrawEvent[]) => void;
  setConnectedUsers: (connectedUsers: UserInfoWithRef[]) => void;
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
  connectedUsers: {} as Record<string, UserInfoWithRef>,
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

  setConnectedUsers: (connectedUsers) =>
    set({
      connectedUsers: connectedUsers.reduce(
        (acc, user) => {
          acc[user.userId] = user;
          return acc;
        },
        {} as Record<string, UserInfoWithRef>
      ),
    }),

  updateConnectedUserRole: (user) => {
    set((state) => ({
      connectedUsers: Object.fromEntries(
        Object.entries(state.connectedUsers).map(([userId, userObj]) => {
          if (userId === user.userId) {
            return [userId, { ...userObj, role: user.role }];
          }
          return [userId, userObj];
        })
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

  addConnectedUser: (user) =>
    set((state) => ({
      connectedUsers: { ...state.connectedUsers, [user.userId]: user },
    })),

  removeConnectedUser: (userId: string) =>
    set((state) => ({
      connectedUsers: Object.fromEntries(
        Object.entries(state.connectedUsers).filter(([key]) => key !== userId)
      ),
    })),

  reset: () => set(initialState),
}));
