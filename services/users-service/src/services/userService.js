import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const VALID_ROLES = ["MANAGER", "PARTICIPANT"];
const VALID_STATUS = ["ACTIVE", "INACTIVE"];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

const initialUsers = [
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

async function ensureDataFile() {
  await mkdir(DATA_DIR, { recursive: true });

  if (!existsSync(DATA_FILE)) {
    await writeFile(DATA_FILE, JSON.stringify(initialUsers, null, 2));
  }
}

async function readUsers() {
  await ensureDataFile();

  const content = await readFile(DATA_FILE, "utf-8");
  return JSON.parse(content);
}

async function writeUsers(users) {
  await ensureDataFile();
  await writeFile(DATA_FILE, JSON.stringify(users, null, 2));
}

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

export async function findAllUsers({ status, role, page = 0, size = 20 } = {}) {
  const users = await readUsers();

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

export async function findUserById(userId) {
  const users = await readUsers();

  return users.find((user) => user.id === userId) || null;
}

export async function createUser({ name, email, roles }) {
  const users = await readUsers();

  const emailAlreadyExists = users.some((user) => user.email === email);

  if (emailAlreadyExists) {
    return {
      error: "email_already_exists",
      message: "Já existe um usuário cadastrado com este e-mail."
    };
  }

  const newUser = {
    id: randomUUID(),
    name,
    email,
    status: "ACTIVE",
    roles: roles && roles.length > 0 ? roles : ["PARTICIPANT"],
    createdAt: new Date().toISOString(),
    updatedAt: null,
    deactivatedAt: null
  };

  users.push(newUser);
  await writeUsers(users);

  return newUser;
}

export async function updateUser(userId, { name }) {
  const users = await readUsers();

  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    return null;
  }

  users[userIndex].name = name;
  users[userIndex].updatedAt = new Date().toISOString();

  await writeUsers(users);

  return users[userIndex];
}

export async function deactivateUser(userId) {
  const users = await readUsers();

  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    return null;
  }

  const now = new Date().toISOString();

  users[userIndex].status = "INACTIVE";
  users[userIndex].updatedAt = now;
  users[userIndex].deactivatedAt = now;

  await writeUsers(users);

  return users[userIndex];
}

export async function replaceUserRoles(userId, roles) {
  const users = await readUsers();

  const userIndex = users.findIndex((user) => user.id === userId);

  if (userIndex === -1) {
    return null;
  }

  users[userIndex].roles = roles;
  users[userIndex].updatedAt = new Date().toISOString();

  await writeUsers(users);

  return users[userIndex];
}

export async function clearUsersForTests() {
  await writeUsers([]);
}