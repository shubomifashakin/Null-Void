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
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not Found',
  INTERNAL_SERVER_ERROR: 'Internal Server Error',
} as const;
