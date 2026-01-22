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
