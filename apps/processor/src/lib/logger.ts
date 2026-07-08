import pino from "pino";
import { logLevel, NODE_ENV } from "./config";

const logger = pino({
  level: logLevel,
  mixin(_context, level, logger) {
    return { level_label: logger.levels.labels[level] };
  },
  name: "null-void-worker",
  base: {
    service: "null-void-worker",
  },
  messageKey: "message",
  errorKey: "error",
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(NODE_ENV !== "production" && {
    transport: {
      targets: [{ target: "pino-pretty" }],
    },
  }),
  redact: {
    paths: [
      "req.headers",
      "req.header",
      "res.headers",
      "res.header",
      "header",
      "req.query.token",
      "req.query",
      "req.params",
      "req.params.*",
      "req.cookies",
      "req.cookies.*",
      "req.body",
      "res.body",
      "res.data",
      "password",
      "*.*.password",
      "*.password",
      "email",
      "**.email",
      "**[*].email",
      "**[*].*email",
      "**.password",
      "**[*].password",
      "**[*].*password",
      "secret",
      "apiKey",
    ],
    remove: true,
  },
});

export default logger;
