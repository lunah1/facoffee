import express from "express";
import cors from "cors";

import userRoutes from "./routes/userRoutes.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (request, response) => {
  return response.json({
    status: "ok",
    service: "users-service"
  });
});

app.use(userRoutes);
app.use("/api", userRoutes);

app.use((request, response) => {
  return response.status(404).json({
    error: "route_not_found",
    message: "Rota não encontrada."
  });
});

app.listen(PORT, () => {
  console.log(`Users service running on port ${PORT}`);
});