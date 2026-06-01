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

export function findAllUsers() {
  return users;
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