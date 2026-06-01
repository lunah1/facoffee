import {
  findAllUsers,
  findUserById,
  createUser
} from "../services/userService.js";

export function listUsers(request, response) {
  const users = findAllUsers();

  return response.json({
    items: users,
    total: users.length
  });
}

export function getUserById(request, response) {
  const { userId } = request.params;

  const user = findUserById(userId);

  if (!user) {
    return response.status(404).json({
      error: "user_not_found",
      message: "Usuário não encontrado."
    });
  }

  return response.json(user);
}

export function storeUser(request, response) {
  const { name, email, roles } = request.body;

  if (!name || !email) {
    return response.status(400).json({
      error: "invalid_request",
      message: "Nome e e-mail são obrigatórios."
    });
  }

  const result = createUser({ name, email, roles });

  if (result.error) {
    return response.status(409).json(result);
  }

  return response.status(201).json(result);
}