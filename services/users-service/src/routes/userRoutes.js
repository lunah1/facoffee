import { Router } from "express";

import {
  listUsers,
  getUserById,
  storeUser
} from "../controllers/userController.js";

const userRoutes = Router();

userRoutes.get("/users", listUsers);
userRoutes.get("/users/:userId", getUserById);
userRoutes.post("/users", storeUser);

export default userRoutes;