import dotenv from "dotenv";
import express from "express";
import type { Express, NextFunction, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import path from "path";
import fs from "fs";
import { RegisterRoutes } from "./generated/routes.js";
import { AppError } from "./common/errors/app.error.js";
import { authenticate } from "./common/middlewares/auth.middleware.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use((req: Request, res: Response, next: NextFunction) => {
  res.error = function ({ errorCode = null, message = null, data = null }) {
    return this.json({
      resultType: "FAILED",
      error: { errorCode, message, data },
      data: null,
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

const router = express.Router();
router.use((req, res, next) => {
  if (req.path === "/health") {
    return next();
  }
  authenticate(req, res, next);
});
RegisterRoutes(router);
app.use("/api", router);

app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  res.status(err.statusCode || 500).error({
    errorCode: err.errorCode || "unknown",
    message: err.message || null,
    data: err.data || null,
  });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at <http://localhost>:${port}`);
});
