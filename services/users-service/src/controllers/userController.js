import {
  findAllUsers,
  findUserById,
  createUser,
  updateUser,
  deactivateUser,
  replaceUserRoles,
  areValidRoles
} from "../services/userService.js";

import { publishEvent } from "../events/eventPublisher.js";

export async function listUsers(request, response) {
  const { status, role, page, size } = request.query;

  const result = await findAllUsers({
    status,
    role,
    page,
    size
  });

  return response.json(result);
}

export async function getUserById(request, response) {
  const { userId } = request.params;

  const user = await findUserById(userId);

  if (!user) {
    return response.status(404).json({
      error: "user_not_found",
      message: "Usuário não encontrado."
    });
  }

  return response.json(user);
}

export async function storeUser(request, response) {
  const { name, email, roles } = request.body;

  if (!name || !email) {
    return response.status(400).json({
      error: "invalid_request",
      message: "Nome e e-mail são obrigatórios."
    });
  }

  if (name.length < 3) {
    return response.status(400).json({
      error: "invalid_name",
      message: "O nome deve ter pelo menos 3 caracteres."
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return response.status(400).json({
      error: "invalid_email",
      message: "O e-mail informado não possui um formato válido."
    });
  }

  if (roles !== undefined && !areValidRoles(roles)) {
    return response.status(400).json({
      error: "invalid_roles",
      message: "As roles devem ser uma lista contendo apenas MANAGER ou PARTICIPANT."
    });
  }

  const result = await createUser({ name, email, roles });

  if (result.error) {
    return response.status(409).json(result);
  }

  await publishEvent("user.created", {
    type: "UserCreated",
    occurredAt: new Date().toISOString(),
    data: result
});

  return response.status(201).json(result);
}

export async function updateUserData(request, response) {
  const { userId } = request.params;
  const { name } = request.body;

  if (!name) {
    return response.status(400).json({
      error: "invalid_request",
      message: "Informe ao menos o nome para atualização."
    });
  }

  if (name.length < 3) {
    return response.status(400).json({
      error: "invalid_name",
      message: "O nome deve ter pelo menos 3 caracteres."
    });
  }

  const user = await updateUser(userId, { name });

  if (!user) {
    return response.status(404).json({
      error: "user_not_found",
      message: "Usuário não encontrado."
    });
  }

  return response.status(200).json(user);
}

export async function deactivateUserData(request, response) {
  const { userId } = request.params;

  const user = await deactivateUser(userId);

  if (!user) {
    return response.status(404).json({
      error: "user_not_found",
      message: "Usuário não encontrado."
    });
  }

  await publishEvent("user.deactivated", {
    type: "UserDeactivated",
    occurredAt: new Date().toISOString(),
    data: user
});

  return response.status(200).json(user);
}

export async function replaceUserRolesData(request, response) {
  const { userId } = request.params;
  const { roles } = request.body;

  if (!areValidRoles(roles)) {
    return response.status(400).json({
      error: "invalid_roles",
      message: "As roles devem ser uma lista contendo apenas MANAGER ou PARTICIPANT."
    });
  }

  const user = await replaceUserRoles(userId, roles);

  if (!user) {
    return response.status(404).json({
      error: "user_not_found",
      message: "Usuário não encontrado."
    });
  }

  await publishEvent("user.roles.updated", {
    type: "UserRolesUpdated",
    occurredAt: new Date().toISOString(),
    data: user
});

  return response.status(200).json(user);
}