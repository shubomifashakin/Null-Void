import { FnResult, makeError } from "../../types/fnResult";
import { DrawEvent, DrawEventList } from "../lib/draw_event";

export function makeRoomCacheKey(roomId: string): string {
  return `room:${roomId}`;
}

export function makeRoomsUsersCacheKey(roomId: string): string {
  return `room:${roomId}:users`;
}

export function makeRoomUsersIdCacheKey(
  roomId: string,
  userId: string
): string {
  return `room:${roomId}:users:${userId}`;
}

export function makeRoomCanvasStateCacheKey(roomId: string): string {
  return `room:${roomId}:canvas:state`;
}

export function makeRoomSnapshotCacheKey(roomId: string) {
  return `room:${roomId}:snapshots`;
}

export function makeRoomDrawEventsCacheKey(roomId: string): string {
  return `room:${roomId}:draw_events`;
}

export function makeLockKey(key: string) {
  return `lock:${key}`;
}

export async function decodeFromBinary(
  payload: Buffer
): Promise<FnResult<DrawEventList>> {
  try {
    const decoded = DrawEventList.fromBinary(payload);
    return { success: true, data: decoded, error: null };
  } catch (error) {
    return { success: false, data: null, error: makeError(error) };
  }
}

export async function encodeToBinary(
  payload: DrawEvent[],
  timestamp: number
): Promise<FnResult<Buffer>> {
  try {
    const messages = DrawEventList.create({
      events: payload,
      timestamp: String(timestamp),
    });

    const encoded = DrawEventList.toBinary(messages);
    return { success: true, data: Buffer.from(encoded), error: null };
  } catch (error) {
    return { success: false, data: null, error: makeError(error) };
  }
}

export function mergeSnapshotsWithPendingEvents(
  last: DrawEvent[] | null,
  pending: DrawEvent[]
) {
  const dedupeById = (events: DrawEvent[]) => {
    const seen = new Set<string>();
    return events.filter((ev) => {
      if (seen.has(ev.id)) return false;
      seen.add(ev.id);
      return true;
    });
  };

  const allEvents = dedupeById([...(last || []), ...pending]).sort((a, b) => {
    return Number(a.timestamp) - Number(b.timestamp);
  });

  return allEvents;
}
