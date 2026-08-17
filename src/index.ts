import dotenv from "dotenv";
import express from "express";
import type { Express, NextFunction, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import multer, { MulterError } from "multer";
import swaggerUi from "swagger-ui-express";
import { tmpdir } from "node:os";
import path from "path";
import fs from "fs";
import { RegisterRoutes } from "./generated/routes.js";
import { AppError } from "./common/errors/app.error.js";
import { authenticate } from "./common/middlewares/auth.middleware.js";
import {
  AUTH_CODES,
  AUTH_MESSAGES,
} from "./modules/auth/errors/auth.errors.js";
import {
  USER_CODES,
  USER_MESSAGES,
} from "./modules/users/errors/user.errors.js";
import {
  AUDIO_CODES,
  AUDIO_MESSAGES,
} from "./modules/audio/errors/audio.errors.js";
import { AUDIO_FILE_MAX_BYTES } from "./modules/audio/utils/audio-file.util.js";
import { removeTemporaryUploads } from "./common/utils/uploaded-file.util.js";
import {
  VISUAL_CODES,
  VISUAL_MESSAGES,
} from "./modules/visual/errors/visual.errors.js";
import { startS3CleanupWorker } from "./common/services/s3-cleanup.worker.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use((req: Request, res: Response, next: NextFunction) => {
  res.error = function ({ code = null, message = null, result = null }) {
    return this.json({
      isSuccess: false,
      code,
      message,
      result,
    });
  };
  next();
});

app.use(cors());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const swaggerFile = JSON.parse(
  fs.readFileSync(path.resolve("dist/swagger.json"), "utf8")
);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

const availabilityLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).error({
      code: AUTH_CODES.AVAILABILITY_RATE_LIMIT,
      message: AUTH_MESSAGES.AVAILABILITY_RATE_LIMIT,
      result: null,
    });
  },
});

const router = express.Router();
router.use(authenticate);
router.use((req, res, next) => {
  let cleanupStarted = false;
  const cleanup = () => {
    if (cleanupStarted) return;
    cleanupStarted = true;
    void removeTemporaryUploads(req);
  };
  res.once("finish", cleanup);
  res.once("close", cleanup);
  next();
});
router.get("/auth/email/availability", availabilityLimiter);
router.get("/auth/nickname/availability", availabilityLimiter);
RegisterRoutes(router, {
  multer: multer({
    dest: path.join(tmpdir(), "pauze-uploads"),
    limits: { fileSize: AUDIO_FILE_MAX_BYTES },
  }),
});
app.use("/api", router);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  const isMulterFileTooLarge =
    (err instanceof MulterError || err.name === "MulterError") &&
    (err as MulterError).code === "LIMIT_FILE_SIZE";

  const requestPath = req.originalUrl.split("?", 1)[0] ?? req.path;
  const isAudioUpload = requestPath === "/api/audio-guides/upload";
  const isVisualUpload = requestPath === "/api/visual-guides/upload";
  const appErr = isMulterFileTooLarge
    ? new AppError({
        code: isAudioUpload
          ? AUDIO_CODES.AUDIO_FILE_INVALID
          : isVisualUpload
            ? VISUAL_CODES.BAD_REQUEST
            : USER_CODES.PROFILE_INVALID,
        message: isAudioUpload
          ? AUDIO_MESSAGES.AUDIO_FILE_INVALID
          : isVisualUpload
            ? VISUAL_MESSAGES.BAD_REQUEST
            : USER_MESSAGES.PROFILE_INVALID,
        statusCode: 400,
      })
    : (err as AppError);

  res.status(appErr.statusCode || 500).error({
    code: appErr.code || "unknown",
    message: appErr.message || null,
    result: appErr.result ?? null,
  });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  startS3CleanupWorker();
});
