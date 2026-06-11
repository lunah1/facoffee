import { randomUUID } from "node:crypto";

import { pool } from "../database.js";

const VALID_ROLES = ["MANAGER", "PARTICIPANT"];
const VALID_STATUS = ["ACTIVE", "INACTIVE"];

function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    roles: row.roles,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deactivatedAt: row.deactivated_at
  };
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

  return roles.length > 0 && roles.every((role) => isValidRole(role));
}

export async function findAllUsers({ status, role, page = 0, size = 20 } = {}) {
  const pageNumber = Number(page);
  const pageSize = Number(size);
  const offset = pageNumber * pageSize;

  const conditions = [];
  const values = [];

  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  if (role) {
    values.push(JSON.stringify([role]));
    conditions.push(`roles @> $${values.length}::jsonb`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total FROM users ${whereClause}`,
    values
  );

  const totalElements = countResult.rows[0].total;

  values.push(pageSize);
  const limitPosition = values.length;

  values.push(offset);
  const offsetPosition = values.length;

  const result = await pool.query(
    `
    SELECT *
    FROM users
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${limitPosition}
    OFFSET $${offsetPosition}
    `,
    values
  );

  return {
    items: result.rows.map(mapUser),
    page: {
      page: pageNumber,
      size: pageSize,
      totalElements,
      totalPages: Math.ceil(totalElements / pageSize)
    }
  };
}

export async function findUserById(userId) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);

  if (result.rows.length === 0) {
    return null;
  }

  return mapUser(result.rows[0]);
}

export async function createUser({ name, email, roles }) {
  const selectedRoles = roles && roles.length > 0 ? roles : ["PARTICIPANT"];

  try {
    const result = await pool.query(
      `
      INSERT INTO users (
        id,
        name,
        email,
        status,
        roles,
        created_at,
        updated_at,
        deactivated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NULL, NULL)
      RETURNING *
      `,
      [randomUUID(), name, email, "ACTIVE", JSON.stringify(selectedRoles)]
    );

    return mapUser(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      return {
        error: "email_already_exists",
        message: "Já existe um usuário cadastrado com este e-mail."
      };
    }

    throw error;
  }
}

export async function updateUser(userId, { name }) {
  const result = await pool.query(
    `
    UPDATE users
    SET name = $1,
        updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [name, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapUser(result.rows[0]);
}

export async function deactivateUser(userId) {
  const result = await pool.query(
    `
    UPDATE users
    SET status = 'INACTIVE',
        updated_at = NOW(),
        deactivated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapUser(result.rows[0]);
}

export async function replaceUserRoles(userId, roles) {
  const result = await pool.query(
    `
    UPDATE users
    SET roles = $1,
        updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [JSON.stringify(roles), userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapUser(result.rows[0]);
}

export async function clearUsersForTests() {
  await pool.query("DELETE FROM users");
}