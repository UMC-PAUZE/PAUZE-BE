import dotenv from "dotenv";
import express from "express";
import type { Express, NextFunction, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { MulterError } from "multer";
import swaggerUi from "swagger-ui-express";
import path from "path";
import fs from "fs";
import { RegisterRoutes } from "./generated/routes.js";
import { AppError } from "./common/errors/app.error.js";
import { authenticate } from "./common/middlewares/auth.middleware.js";
import {
  USER_CODES,
  USER_MESSAGES,
} from "./modules/users/errors/user.errors.js";
import {
  AUDIO_CODES,
  AUDIO_MESSAGES,
} from "./modules/audio/errors/audio.errors.js";
import {
  VISUAL_CODES,
  VISUAL_MESSAGES,
} from "./modules/visual/errors/visual.errors.js";

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

const optionalBearerSecurity = [{ bearer: [] }, {}];
for (const path of ["/audio-guides", "/audio-guides/categories"]) {
  if (swaggerFile.paths?.[path]?.get) {
    swaggerFile.paths[path].get.security = optionalBearerSecurity;
  }
}

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerFile));

const router = express.Router();
router.use(authenticate);
RegisterRoutes(router);
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
});
