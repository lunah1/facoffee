import pool from "../database/database.js";

export async function createUser(user) {
  const result = await pool.query(
    `
      INSERT INTO users
      (
        name,
        email,
        status,
        roles,
        created_at,
        updated_at,
        deactivated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `,
    [
      user.name,
      user.email,
      user.status,
      JSON.stringify(user.roles),
      user.createdAt,
      user.updatedAt,
      user.deactivatedAt
    ]
  );

  return result.rows[0];
}

export async function findAll() {
  const result = await pool.query(`
    SELECT *
    FROM users
    ORDER BY id
  `);

  return result.rows;
}

export async function findById(id) {
  const result = await pool.query(
    `
      SELECT *
      FROM users
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

export async function update(id, user) {
  const result = await pool.query(
    `
      UPDATE users
      SET
        name = $1,
        email = $2,
        status = $3,
        roles = $4,
        updated_at = $5,
        deactivated_at = $6
      WHERE id = $7
      RETURNING *
    `,
    [
      user.name,
      user.email,
      user.status,
      JSON.stringify(user.roles),
      new Date(),
      user.deactivatedAt,
      id
    ]
  );

  return result.rows[0] || null;
}

export async function deleteUser(id) {
  const result = await pool.query(
    `
      DELETE FROM users
      WHERE id = $1
    `,
    [id]
  );

  return result.rowCount;
}