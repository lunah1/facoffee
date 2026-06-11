import * as userRepository from "../repositories/userRepository.js";

const VALID_ROLES = ["MANAGER", "PARTICIPANT"];
const VALID_STATUS = ["ACTIVE", "INACTIVE"];

export function isValidRole(role) {
  return VALID_ROLES.includes(role);
}

export function isValidStatus(status) {
  return VALID_STATUS.includes(status);
}

export function areValidRoles(roles) {
  if (!Array.isArray(roles)) {
    return false;
  }

  return roles.every((role) => isValidRole(role));
}

export async function findAllUsers(filters = {}) {
  return await userRepository.findAll(filters);
}

export async function findUserById(userId) {
  return await userRepository.findById(userId);
}

export async function createUser({ name, email, roles }) {
  const existingUser = await userRepository.findByEmail(email);

  if (existingUser) {
    return {
      error: "email_already_exists",
      message: "Já existe um usuário cadastrado com este e-mail."
    };
  }

<<<<<<< Updated upstream
  const newUser = {
    id: `usr_${Date.now()}_${users.length + 1}`,
=======
  return await userRepository.create({
>>>>>>> Stashed changes
    name,
    email,
    status: "ACTIVE",
    roles: roles?.length ? roles : ["PARTICIPANT"]
  });
}

export async function updateUser(userId, { name }) {
  const user = await userRepository.findById(userId);

  if (!user) {
    return null;
  }

  return await userRepository.update(userId, {
    name,
    updatedAt: new Date().toISOString()
  });
}

export async function deactivateUser(userId) {
  const user = await userRepository.findById(userId);

  if (!user) {
    return null;
  }

  const now = new Date().toISOString();

  return await userRepository.update(userId, {
    status: "INACTIVE",
    updatedAt: now,
    deactivatedAt: now
  });
}

export async function replaceUserRoles(userId, roles) {
  const user = await userRepository.findById(userId);

  if (!user) {
    return null;
  }

  return await userRepository.updateRoles(userId, roles);
}