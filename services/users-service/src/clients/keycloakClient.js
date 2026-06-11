const KEYCLOAK_BASE_URL =
  process.env.KEYCLOAK_BASE_URL || "http://localhost:8080";

const KEYCLOAK_REALM =
  process.env.KEYCLOAK_REALM || "facoffee";

const KEYCLOAK_ADMIN_REALM =
  process.env.KEYCLOAK_ADMIN_REALM || "master";

const KEYCLOAK_ADMIN_CLIENT_ID =
  process.env.KEYCLOAK_ADMIN_CLIENT_ID || "admin-cli";

const KEYCLOAK_ADMIN_USERNAME =
  process.env.KEYCLOAK_ADMIN_USERNAME || "facoffee";

const KEYCLOAK_ADMIN_PASSWORD =
  process.env.KEYCLOAK_ADMIN_PASSWORD || "facoffee";

const DOMAIN_ROLES = ["MANAGER", "PARTICIPANT"];

async function getAdminToken() {
  const response = await fetch(
    `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_ADMIN_REALM}/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "password",
        client_id: KEYCLOAK_ADMIN_CLIENT_ID,
        username: KEYCLOAK_ADMIN_USERNAME,
        password: KEYCLOAK_ADMIN_PASSWORD
      })
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();

    throw new Error(
      `Falha ao obter token administrativo do Keycloak: ${response.status} ${errorBody}`
    );
  }

  const data = await response.json();

  return data.access_token;
}

async function adminFetch(path, { method = "GET", body } = {}) {
  const token = await getAdminToken();

  const response = await fetch(`${KEYCLOAK_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  return response;
}

async function parseJsonOrNull(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

async function assertExpectedResponse(response, expectedStatuses, action) {
  if (expectedStatuses.includes(response.status)) {
    return;
  }

  const errorBody = await response.text();

  throw new Error(
    `Falha ao ${action} no Keycloak: ${response.status} ${errorBody}`
  );
}

async function findKeycloakUserByEmail(email) {
  const response = await adminFetch(
    `/admin/realms/${KEYCLOAK_REALM}/users?email=${encodeURIComponent(
      email
    )}&exact=true`
  );

  await assertExpectedResponse(response, [200], "buscar usuário");

  const users = await parseJsonOrNull(response);

  if (!Array.isArray(users) || users.length === 0) {
    return null;
  }

  return (
    users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    ) || users[0]
  );
}

async function createKeycloakUser({ name, email }) {
  const response = await adminFetch(`/admin/realms/${KEYCLOAK_REALM}/users`, {
    method: "POST",
    body: {
      username: email,
      email,
      firstName: name,
      enabled: true,
      emailVerified: true
    }
  });

  if (response.status === 409) {
    return findKeycloakUserByEmail(email);
  }

  await assertExpectedResponse(response, [201], "criar usuário");

  const location = response.headers.get("location");

  if (location) {
    const id = location.split("/").pop();
    return { id };
  }

  return findKeycloakUserByEmail(email);
}

async function updateKeycloakUser(keycloakId, { name, email, enabled = true }) {
  const response = await adminFetch(
    `/admin/realms/${KEYCLOAK_REALM}/users/${keycloakId}`,
    {
      method: "PUT",
      body: {
        username: email,
        email,
        firstName: name,
        enabled,
        emailVerified: true
      }
    }
  );

  await assertExpectedResponse(response, [204], "atualizar usuário");
}

async function ensureRealmRole(roleName) {
  const getResponse = await adminFetch(
    `/admin/realms/${KEYCLOAK_REALM}/roles/${roleName}`
  );

  if (getResponse.status === 200) {
    return parseJsonOrNull(getResponse);
  }

  if (getResponse.status !== 404) {
    await assertExpectedResponse(getResponse, [200, 404], "buscar role");
  }

  const createResponse = await adminFetch(
    `/admin/realms/${KEYCLOAK_REALM}/roles`,
    {
      method: "POST",
      body: {
        name: roleName
      }
    }
  );

  await assertExpectedResponse(createResponse, [201, 204], "criar role");

  const retryResponse = await adminFetch(
    `/admin/realms/${KEYCLOAK_REALM}/roles/${roleName}`
  );

  await assertExpectedResponse(retryResponse, [200], "buscar role criada");

  return parseJsonOrNull(retryResponse);
}

export async function syncKeycloakUserRoles({ keycloakId, email, roles }) {
  let resolvedKeycloakId = keycloakId;

  if (!resolvedKeycloakId && email) {
    const user = await findKeycloakUserByEmail(email);
    resolvedKeycloakId = user?.id;
  }

  if (!resolvedKeycloakId) {
    throw new Error("Usuário não encontrado no Keycloak para sincronizar roles.");
  }

  const currentRolesResponse = await adminFetch(
    `/admin/realms/${KEYCLOAK_REALM}/users/${resolvedKeycloakId}/role-mappings/realm`
  );

  await assertExpectedResponse(
    currentRolesResponse,
    [200],
    "buscar roles atuais"
  );

  const currentRoles = (await parseJsonOrNull(currentRolesResponse)) || [];

  const rolesToRemove = currentRoles.filter((role) =>
    DOMAIN_ROLES.includes(role.name)
  );

  if (rolesToRemove.length > 0) {
    const removeResponse = await adminFetch(
      `/admin/realms/${KEYCLOAK_REALM}/users/${resolvedKeycloakId}/role-mappings/realm`,
      {
        method: "DELETE",
        body: rolesToRemove
      }
    );

    await assertExpectedResponse(removeResponse, [204], "remover roles antigas");
  }

  const desiredRoles = [];

  for (const role of roles) {
    desiredRoles.push(await ensureRealmRole(role));
  }

  if (desiredRoles.length > 0) {
    const addResponse = await adminFetch(
      `/admin/realms/${KEYCLOAK_REALM}/users/${resolvedKeycloakId}/role-mappings/realm`,
      {
        method: "POST",
        body: desiredRoles
      }
    );

    await assertExpectedResponse(addResponse, [204], "adicionar roles novas");
  }

  return resolvedKeycloakId;
}

export async function createOrUpdateKeycloakUser({ name, email, roles }) {
  let keycloakUser = await findKeycloakUserByEmail(email);

  if (!keycloakUser) {
    keycloakUser = await createKeycloakUser({ name, email });
  } else {
    await updateKeycloakUser(keycloakUser.id, {
      name,
      email,
      enabled: true
    });
  }

  const keycloakId = keycloakUser.id;

  await syncKeycloakUserRoles({
    keycloakId,
    email,
    roles
  });

  return {
    keycloakId
  };
}

export async function disableKeycloakUser({ keycloakId, email }) {
  let resolvedKeycloakId = keycloakId;

  if (!resolvedKeycloakId && email) {
    const user = await findKeycloakUserByEmail(email);
    resolvedKeycloakId = user?.id;
  }

  if (!resolvedKeycloakId) {
    throw new Error("Usuário não encontrado no Keycloak para desativação.");
  }

  const response = await adminFetch(
    `/admin/realms/${KEYCLOAK_REALM}/users/${resolvedKeycloakId}`,
    {
      method: "PUT",
      body: {
        enabled: false
      }
    }
  );

  await assertExpectedResponse(response, [204], "desativar usuário");

  return resolvedKeycloakId;
}