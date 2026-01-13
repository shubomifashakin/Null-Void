export const WS_EVENTS = {
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  USER_DRAW: 'user:draw',
  USER_MOVE: 'user:move',
  USER_REMOVE: 'user:remove',
  USER_LIST: 'user:list',
  CANVAS_STATE: 'canvas:state',
  ROOM_INFO: 'room:info',
  ROOM_LEAVE: 'room:leave',
  USER_INFO: 'user:info',
  ROOM_NOTIFICATION: 'room:notification',
  ROOM_ERROR: 'room:error',
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
