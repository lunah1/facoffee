import { randomUUID } from "node:crypto";

import {
  findAllUsers,
  findUserById,
  findUserByIdInternal,
  findUserByEmail,
  createUser,
  updateUser,
  deactivateUser,
  replaceUserRoles,
  areValidRoles
} from "../services/userService.js";

import { publishEvent } from "../events/eventPublisher.js";

import {
  createOrUpdateKeycloakUser,
  disableKeycloakUser,
  syncKeycloakUserProfile,
  syncKeycloakUserRoles
} from "../clients/keycloakClient.js";

export async function listUsers(request, response) {
  const { status, role, page, size } = request.query;
  const result = await findAllUsers({ status, role, page, size });
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
      message:
        "As roles devem ser uma lista contendo apenas MANAGER ou PARTICIPANT."
    });
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    return response.status(409).json({
      error: "email_already_exists",
      message: "Já existe um usuário cadastrado com este e-mail."
    });
  }

  const selectedRoles = roles && roles.length > 0 ? roles : ["PARTICIPANT"];

  let keycloakId = null;

  try {
    const keycloakResult = await createOrUpdateKeycloakUser({
      name,
      email,
      roles: selectedRoles
    });

    keycloakId = keycloakResult.keycloakId;
  } catch (error) {
    return response.status(502).json({
      error: "keycloak_sync_failed",
      message: "Não foi possível sincronizar o usuário com o Keycloak."
    });
  }

  const result = await createUser({
    name,
    email,
    roles: selectedRoles,
    keycloakId
  });

  if (result.error) {
    return response.status(409).json(result);
  }

  await publishEvent("user.created", {
    eventId: randomUUID(),
    eventType: "UserCreated",
    occurredAt: new Date().toISOString(),
    version: "1.0",
    payload: {
      userId: result.id,
      email: result.email,
      roles: result.roles
    }
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

  const currentUser = await findUserByIdInternal(userId);

  if (!currentUser) {
    return response.status(404).json({
      error: "user_not_found",
      message: "Usuário não encontrado."
    });
  }

  try {
    await syncKeycloakUserProfile({
      keycloakId: currentUser.keycloakId,
      email: currentUser.email,
      name,
      enabled: currentUser.status === "ACTIVE"
    });
  } catch (error) {
    return response.status(502).json({
      error: "keycloak_sync_failed",
      message: "Não foi possível atualizar o usuário no Keycloak."
    });
  }

  const user = await updateUser(userId, { name });

  return response.status(200).json(user);
}

export async function deactivateUserData(request, response) {
  const { userId } = request.params;
  const { reason } = request.body || {};

  if (!reason || reason.length < 3) {
    return response.status(400).json({
      error: "invalid_reason",
      message: "Informe o motivo da desativação com pelo menos 3 caracteres."
    });
  }

  const currentUser = await findUserByIdInternal(userId);

  if (!currentUser) {
    return response.status(404).json({
      error: "user_not_found",
      message: "Usuário não encontrado."
    });
  }

  try {
    await disableKeycloakUser({
      keycloakId: currentUser.keycloakId,
      email: currentUser.email
    });
  } catch (error) {
    return response.status(502).json({
      error: "keycloak_sync_failed",
      message: "Não foi possível desativar o usuário no Keycloak."
    });
  }

  const user = await deactivateUser(userId);

  await publishEvent("users.deactivated", {
    eventId: randomUUID(),
    eventType: "UserDeactivated",
    occurredAt: new Date().toISOString(),
    version: "1.0",
    payload: {
      userId: user.id,
      reason
    }
  });

  return response.status(200).json(user);
}

export async function replaceUserRolesData(request, response) {
  const { userId } = request.params;
  const { roles } = request.body;

  if (!areValidRoles(roles)) {
    return response.status(400).json({
      error: "invalid_roles",
      message:
        "As roles devem ser uma lista contendo apenas MANAGER ou PARTICIPANT."
    });
  }

  const currentUser = await findUserByIdInternal(userId);

  if (!currentUser) {
    return response.status(404).json({
      error: "user_not_found",
      message: "Usuário não encontrado."
    });
  }

  try {
    await syncKeycloakUserRoles({
      keycloakId: currentUser.keycloakId,
      email: currentUser.email,
      roles
    });
  } catch (error) {
    return response.status(502).json({
      error: "keycloak_sync_failed",
      message: "Não foi possível sincronizar os papéis do usuário no Keycloak."
    });
  }

  const user = await replaceUserRoles(userId, roles);

  await publishEvent("user.roles.updated", {
    eventId: randomUUID(),
    eventType: "UserRolesUpdated",
    occurredAt: new Date().toISOString(),
    version: "1.0",
    payload: {
      userId: user.id,
      roles: user.roles
    }
  });

  return response.status(200).json(user);
}