import { Router } from "express";

import {
  listUsers,
  getUserById,
  storeUser,
  updateUserData,
  deactivateUserData,
  replaceUserRolesData
} from "../controllers/userController.js";

import {
  authenticate,
  requireManager,
  requireManagerOrSelf
} from "../middlewares/authMiddleware.js";

const routes = Router();

routes.post("/users", storeUser);

routes.get("/users", authenticate, requireManager, listUsers);

routes.get(
  "/users/:userId",
  authenticate,
  requireManagerOrSelf,
  getUserById
);

routes.patch(
  "/users/:userId",
  authenticate,
  requireManagerOrSelf,
  updateUserData
);

routes.delete(
  "/users/:userId",
  authenticate,
  requireManagerOrSelf,
  deactivateUserData
);

routes.put(
  "/users/:userId/roles",
  authenticate,
  requireManager,
  replaceUserRolesData
);

export default routes;