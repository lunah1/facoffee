const VALID_ROLES = ["MANAGER", "PARTICIPANT"];
const VALID_STATUS = ["ACTIVE", "INACTIVE"];

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

export function findAllUsers({ status, role, page = 0, size = 20 } = {}) {
  let filteredUsers = users;

  if (status) {
    filteredUsers = filteredUsers.filter((user) => user.status === status);
  }

  if (role) {
    filteredUsers = filteredUsers.filter((user) => user.roles.includes(role));
  }

  const pageNumber = Number(page);
  const pageSize = Number(size);

  const startIndex = pageNumber * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return {
    items: paginatedUsers,
    page: {
      page: pageNumber,
      size: pageSize,
      totalElements: filteredUsers.length,
      totalPages: Math.ceil(filteredUsers.length / pageSize)
    }
  };
}

export function findUserById(userId) {
  return users.find((user) => user.id === userId);
}

export function createUser({ name, email, roles }) {
  const emailAlreadyExists = users.some((user) => user.email === email);

  if (emailAlreadyExists) {
    return {
      error: "email_already_exists",
      message: "Já existe um usuário cadastrado com este e-mail."
    };
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

  return newUser;
}

export function updateUser(userId, { name }) {
  const user = findUserById(userId);

  if (!user) {
    return null;
  }

  if (name) {
    user.name = name;
  }

  user.updatedAt = new Date().toISOString();

  return user;
}

export function deactivateUser(userId) {
  const user = findUserById(userId);

  if (!user) {
    return null;
  }

  const now = new Date().toISOString();

  user.status = "INACTIVE";
  user.updatedAt = now;
  user.deactivatedAt = now;

  return user;
}

export function replaceUserRoles(userId, roles) {
  const user = findUserById(userId);

  if (!user) {
    return null;
  }

  user.roles = roles;
  user.updatedAt = new Date().toISOString();

  return user;
}