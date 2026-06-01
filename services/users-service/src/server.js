import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

let users = [
  {
    id: "usr_001",
    name: "Maria Silva",
    email: "maria.silva@facoffee.com",
    status: "ACTIVE",
    roles: ["PARTICIPANT"],
    createdAt: new Date().toISOString(),
    updatedAt: null,
    deactivatedAt: null
  }
];

app.get("/health", (request, response) => {
  return response.json({
    status: "ok",
    service: "users-service"
  });
});

app.get("/users", (request, response) => {
  return response.json({
    items: users,
    total: users.length
  });
});

app.get("/users/:userId", (request, response) => {
  const { userId } = request.params;

  const user = users.find((item) => item.id === userId);

  if (!user) {
    return response.status(404).json({
      error: "user_not_found",
      message: "Usuário não encontrado."
    });
  }

  return response.json(user);
});

app.post("/users", (request, response) => {
  const { name, email, roles } = request.body;

  if (!name || !email) {
    return response.status(400).json({
      error: "invalid_request",
      message: "Nome e e-mail são obrigatórios."
    });
  }

  const newUser = {
    id: `usr_${Date.now()}`,
    name,
    email,
    status: "ACTIVE",
    roles: roles && roles.length > 0 ? roles : ["PARTICIPANT"],
    createdAt: new Date().toISOString(),
    updatedAt: null,
    deactivatedAt: null
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.listen(PORT, () => {
  console.log(`Users service running on port ${PORT}`);
});