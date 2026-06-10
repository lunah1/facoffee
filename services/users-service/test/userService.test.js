import test from "node:test";
import assert from "node:assert/strict";

import {
  findAllUsers,
  findUserById,
  createUser,
  updateUser,
  deactivateUser,
  replaceUserRoles,
  areValidRoles
} from "../src/services/userService.js";

test("deve listar usuários com estrutura paginada", () => {
  const result = findAllUsers();

  assert.ok(Array.isArray(result.items));
  assert.ok(result.page);
  assert.equal(typeof result.page.page, "number");
  assert.equal(typeof result.page.size, "number");
  assert.equal(typeof result.page.totalElements, "number");
  assert.equal(typeof result.page.totalPages, "number");
});

test("deve criar usuário com status ACTIVE e role padrão PARTICIPANT", () => {
  const user = createUser({
    name: "João Teste",
    email: "joao.teste@facoffee.com"
  });

  assert.equal(user.name, "João Teste");
  assert.equal(user.email, "joao.teste@facoffee.com");
  assert.equal(user.status, "ACTIVE");
  assert.deepEqual(user.roles, ["PARTICIPANT"]);
  assert.ok(user.id);
  assert.ok(user.createdAt);
});

test("deve impedir criação de usuário com e-mail duplicado", () => {
  createUser({
    name: "Usuário Duplicado",
    email: "duplicado@facoffee.com"
  });

  const result = createUser({
    name: "Usuário Duplicado Dois",
    email: "duplicado@facoffee.com"
  });

  assert.equal(result.error, "email_already_exists");
});

test("deve buscar usuário por ID", () => {
  const createdUser = createUser({
    name: "Busca Teste",
    email: "busca.teste@facoffee.com"
  });

  const foundUser = findUserById(createdUser.id);

  assert.equal(foundUser.id, createdUser.id);
  assert.equal(foundUser.email, "busca.teste@facoffee.com");
});

test("deve atualizar dados básicos do usuário", () => {
  const createdUser = createUser({
    name: "Nome Antigo",
    email: "atualizar.teste@facoffee.com"
  });

  const updatedUser = updateUser(createdUser.id, {
    name: "Nome Atualizado"
  });

  assert.equal(updatedUser.name, "Nome Atualizado");
  assert.ok(updatedUser.updatedAt);
});

test("deve desativar usuário logicamente", () => {
  const createdUser = createUser({
    name: "Desativar Teste",
    email: "desativar.teste@facoffee.com"
  });

  const deactivatedUser = deactivateUser(createdUser.id);

  assert.equal(deactivatedUser.status, "INACTIVE");
  assert.ok(deactivatedUser.deactivatedAt);
  assert.ok(deactivatedUser.updatedAt);
});

test("deve substituir integralmente as roles do usuário", () => {
  const createdUser = createUser({
    name: "Roles Teste",
    email: "roles.teste@facoffee.com",
    roles: ["PARTICIPANT"]
  });

  const updatedUser = replaceUserRoles(createdUser.id, ["MANAGER"]);

  assert.deepEqual(updatedUser.roles, ["MANAGER"]);
  assert.ok(updatedUser.updatedAt);
});

test("deve validar roles permitidas", () => {
  assert.equal(areValidRoles(["MANAGER"]), true);
  assert.equal(areValidRoles(["PARTICIPANT"]), true);
  assert.equal(areValidRoles(["MANAGER", "PARTICIPANT"]), true);
  assert.equal(areValidRoles(["ADMIN"]), false);
  assert.equal(areValidRoles("MANAGER"), false);
});

test("deve filtrar usuários por role", () => {
  const createdUser = createUser({
    name: "Filtro Role",
    email: "filtro.role@facoffee.com",
    roles: ["MANAGER"]
  });

  const result = findAllUsers({
    role: "MANAGER"
  });

  const foundUser = result.items.find((user) => user.id === createdUser.id);

  assert.ok(foundUser);
  assert.ok(foundUser.roles.includes("MANAGER"));
});

test("deve filtrar usuários por status", () => {
  const createdUser = createUser({
    name: "Filtro Status",
    email: "filtro.status@facoffee.com"
  });

  deactivateUser(createdUser.id);

  const result = findAllUsers({
    status: "INACTIVE"
  });

  const foundUser = result.items.find((user) => user.id === createdUser.id);

  assert.ok(foundUser);
  assert.equal(foundUser.status, "INACTIVE");
});