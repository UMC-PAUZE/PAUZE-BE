import type { Role } from "../generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        role: Role;
      };
    }

    interface Response {
      error: (params: {
        code?: string | null;
        message?: string | null;
        result?: unknown;
      }) => Response;
    }
  }
}

export {};
