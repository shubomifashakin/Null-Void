import pino from "pino";
import { logLevel, NODE_ENV } from "./config";

const logger = pino({
  level: logLevel,
  name: "idle-snapshots-worker",
  base: {
    service: "idle-snapshots-worker",
  },
  messageKey: "message",
  errorKey: "error",
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: {
    targets:
      NODE_ENV === "production"
        ? [
            {
              target: "pino-roll",
              level: "info",
              options: {
                file: "./logs/combined.log",
                mkdir: true,
                size: "2m",
                frequency: "daily",
                limit: { count: 2 },
                dateFormat: "dd-MM-yyyy",
              },
            },
            {
              target: "pino-roll",
              level: "error",
              options: {
                file: "./logs/errors.log",
                mkdir: true,
                size: "2m",
                frequency: "daily",
                limit: { count: 2 },
                dateFormat: "dd-MM-yyyy",
              },
            },
          ]
        : [{ target: "pino-pretty" }],
  },
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
