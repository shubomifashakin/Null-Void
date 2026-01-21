export const WS_EVENTS = {
  USER_JOINED: 'user:joined',
  USER_DRAW: 'user:draw',
  USER_MOVE: 'user:move',
  USER_REMOVE: 'user:remove',
  USER_DISCONNECTED: 'user:disconnected',
  USER_LIST: 'user:list',
  USER_PROMOTED: 'user:promoted',
  USER_INFO: 'user:info',

  CANVAS_STATE: 'canvas:state',
  ROOM_INFO: 'room:info',
  ROOM_LEAVE: 'room:leave',
  ROOM_NOTIFICATION: 'room:notification',
  ROOM_ERROR: 'room:error',
  ROOM_UNDO_DRAW: 'room:undo:draw',
  ROOM_READY: 'room:ready',
} as const;

export const WS_ERROR_CODES = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,

  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const MAX_NUMBER_OF_DRAW_EVENTS = 10;

export const IDLE_SNAPSHOT_QUEUE = 'idle-snapshots';
