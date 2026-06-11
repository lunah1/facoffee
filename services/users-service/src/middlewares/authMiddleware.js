import { createRemoteJWKSet, jwtVerify } from "jose";

import { findUserById } from "../services/userService.js";

const KEYCLOAK_REALM_URL =
  process.env.KEYCLOAK_REALM_URL || "http://localhost:8080/realms/facoffee";

const JWKS = createRemoteJWKSet(
  new URL(`${KEYCLOAK_REALM_URL}/protocol/openid-connect/certs`)
);

function extractRoles(payload) {
  const directRoles = Array.isArray(payload.roles) ? payload.roles : [];

  const realmRoles = Array.isArray(payload.realm_access?.roles)
    ? payload.realm_access.roles
    : [];

  const resourceRoles = payload.resource_access
    ? Object.values(payload.resource_access).flatMap((resource) =>
        Array.isArray(resource.roles) ? resource.roles : []
      )
    : [];

  return [...new Set([...directRoles, ...realmRoles, ...resourceRoles])];
}

function isManager(auth) {
  return auth?.roles?.includes("MANAGER");
}

export async function authenticate(request, response, next) {
  const authorization = request.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return response.status(401).json({
      error: "missing_token",
      message: "Token de autenticação não informado."
    });
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: KEYCLOAK_REALM_URL
    });

    request.auth = {
      subject: payload.sub,
      email: payload.email,
      name: payload.name,
      roles: extractRoles(payload).map((role) => role.toUpperCase())
    };

    return next();
  } catch (error) {
    return response.status(401).json({
      error: "invalid_token",
      message: "Token de autenticação inválido ou expirado."
    });
  }
}

export function requireManager(request, response, next) {
  if (!isManager(request.auth)) {
    return response.status(403).json({
      error: "access_denied",
      message: "Apenas usuários com papel MANAGER podem executar esta operação."
    });
  }

  return next();
}

export async function requireManagerOrSelf(request, response, next) {
  if (isManager(request.auth)) {
    return next();
  }

  const { userId } = request.params;
  const targetUser = await findUserById(userId);

  if (!targetUser) {
    return response.status(404).json({
      error: "user_not_found",
      message: "Usuário não encontrado."
    });
  }

  if (targetUser.email === request.auth?.email) {
    return next();
  }

  return response.status(403).json({
    error: "access_denied",
    message: "Participantes só podem acessar ou alterar o próprio usuário."
  });
}