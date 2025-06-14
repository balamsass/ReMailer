import { User } from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      apiToken?: any;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}