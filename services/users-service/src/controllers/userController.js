import * as userRepository from "../repositories/userRepository.js";

export async function listUsers(request, response) {
  try {
    const users = await userRepository.findAll();

    return response.json(users);
  } catch (error) {
    return response.status(500).json({
      error: "internal_error",
      message: error.message
    });
  }
}

export async function getUserById(request, response) {
  try {
    const { userId } = request.params;

    const user = await userRepository.findById(userId);

    if (!user) {
      return response.status(404).json({
        error: "user_not_found",
        message: "Usuário não encontrado."
      });
    }

    return response.json(user);
  } catch (error) {
    return response.status(500).json({
      error: "internal_error",
      message: error.message
    });
  }
}

export async function storeUser(request, response) {
  try {
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
        message: "O nome deve possuir pelo menos 3 caracteres."
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return response.status(400).json({
        error: "invalid_email",
        message: "Formato de e-mail inválido."
      });
    }

    const now = new Date();

    const createdUser = await userRepository.createUser({
      name,
      email,
      status: "ACTIVE",
      roles: roles || ["PARTICIPANT"],
      createdAt: now,
      updatedAt: now,
      deactivatedAt: null
    });

    return response.status(201).json(createdUser);
  } catch (error) {
    if (error.code === "23505") {
      return response.status(409).json({
        error: "email_already_exists",
        message: "Já existe um usuário com este e-mail."
      });
    }

    return response.status(500).json({
      error: "internal_error",
      message: error.message
    });
  }
}

export async function updateUserData(request, response) {
  try {
    const { userId } = request.params;
    const { name, email, status, roles } = request.body;

    const user = await userRepository.findById(userId);

    if (!user) {
      return response.status(404).json({
        error: "user_not_found",
        message: "Usuário não encontrado."
      });
    }

    const updatedUser = await userRepository.update(userId, {
      name: name ?? user.name,
      email: email ?? user.email,
      status: status ?? user.status,
      roles: roles ?? user.roles,
      deactivatedAt: user.deactivated_at
    });

    return response.status(200).json(updatedUser);
  } catch (error) {
    return response.status(500).json({
      error: "internal_error",
      message: error.message
    });
  }
}

export async function deactivateUserData(request, response) {
  try {
    const { userId } = request.params;

    const user = await userRepository.findById(userId);

    if (!user) {
      return response.status(404).json({
        error: "user_not_found",
        message: "Usuário não encontrado."
      });
    }

    const updatedUser = await userRepository.update(userId, {
      name: user.name,
      email: user.email,
      status: "INACTIVE",
      roles: user.roles,
      deactivatedAt: new Date()
    });

    return response.status(200).json(updatedUser);
  } catch (error) {
    return response.status(500).json({
      error: "internal_error",
      message: error.message
    });
  }
}

export async function replaceUserRolesData(request, response) {
  try {
    const { userId } = request.params;
    const { roles } = request.body;

    if (!Array.isArray(roles)) {
      return response.status(400).json({
        error: "invalid_roles",
        message: "Roles deve ser uma lista."
      });
    }

    const user = await userRepository.findById(userId);

    if (!user) {
      return response.status(404).json({
        error: "user_not_found",
        message: "Usuário não encontrado."
      });
    }

    const updatedUser = await userRepository.update(userId, {
      name: user.name,
      email: user.email,
      status: user.status,
      roles,
      deactivatedAt: user.deactivated_at
    });

    return response.status(200).json(updatedUser);
  } catch (error) {
    return response.status(500).json({
      error: "internal_error",
      message: error.message
    });
  }
}