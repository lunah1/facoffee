import { Router } from "express";

import {
  listUsers,
  getUserById,
  storeUser,
  updateUserData,
  deactivateUserData,
  replaceUserRolesData
} from "../controllers/userController.js";

const userRoutes = Router();

userRoutes.get("/users", listUsers);
userRoutes.get("/users/:userId", getUserById);
userRoutes.post("/users", storeUser);
userRoutes.patch("/users/:userId", updateUserData);
userRoutes.delete("/users/:userId", deactivateUserData);
userRoutes.put("/users/:userId/roles", replaceUserRolesData);
export default userRoutes;