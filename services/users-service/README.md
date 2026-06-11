# Users Service

Serviço responsável pelo domínio de usuários da aplicação FACOFFEE.

Este serviço implementa o cadastro, consulta, atualização, desativação lógica e gerenciamento de papéis de usuários, com persistência em PostgreSQL, integração com Keycloak para autenticação/autorização e publicação de eventos de domínio via RabbitMQ.

## 1. Escopo implementado

O serviço implementa as principais rotas de usuários previstas no contrato da API:

```text
POST   /api/users
GET    /api/users
GET    /api/users/:userId
PATCH  /api/users/:userId
DELETE /api/users/:userId
PUT    /api/users/:userId/roles
```

Também há documentação local via Swagger UI em:

```text
http://localhost:3001/docs
```

## 2. Funcionalidades

O serviço implementa:

* Criação de usuário no domínio e no Keycloak.
* Listagem de usuários com filtros e paginação.
* Busca de usuário por identificador.
* Atualização de dados básicos do usuário.
* Desativação lógica do usuário.
* Substituição integral de papéis (`roles`).
* Validação de e-mail único.
* Papel padrão `PARTICIPANT` quando nenhum papel é informado.
* Usuário criado inicialmente com status `ACTIVE`.
* Autenticação por JWT emitido pelo Keycloak.
* Autorização por papéis de domínio: `MANAGER` e `PARTICIPANT`.
* Sincronização de roles com o Keycloak.
* Atualização de perfil no Keycloak.
* Desativação do usuário no Keycloak.
* Publicação de eventos de domínio no RabbitMQ.

## 3. Regras de autorização

O endpoint de criação de usuário é público:

```text
POST /api/users
```

Os demais endpoints exigem token JWT do Keycloak.

### MANAGER

Usuários com papel `MANAGER` podem:

* Listar todos os usuários.
* Consultar qualquer usuário.
* Atualizar qualquer usuário.
* Desativar qualquer usuário.
* Substituir roles de qualquer usuário.

### PARTICIPANT

Usuários com papel `PARTICIPANT` podem:

* Consultar o próprio usuário.
* Atualizar o próprio usuário.

Usuários `PARTICIPANT` não podem:

* Listar todos os usuários.
* Consultar usuários de terceiros.
* Alterar roles.
* Executar ações administrativas fora da própria conta.

## 4. Modelo de dados

Cada usuário possui, ao menos, os seguintes campos:

```json
{
  "id": "uuid",
  "name": "Nome do usuário",
  "email": "usuario@facoffee.com",
  "status": "ACTIVE",
  "roles": ["PARTICIPANT"],
  "createdAt": "2026-06-11T10:00:00.000Z",
  "updatedAt": null,
  "deactivatedAt": null
}
```

Internamente, o serviço também armazena o identificador do usuário no Keycloak (`keycloak_id`) para sincronização de perfil, roles e desativação.

## 5. Dependências externas

Para execução completa, o serviço depende de:

* PostgreSQL, usado como banco próprio do serviço de usuários.
* Keycloak, usado para autenticação, autorização e gestão da conta.
* RabbitMQ, usado para publicação de eventos de domínio.

Essas dependências são iniciadas pelo `docker-compose.yml` da raiz do projeto.

## 6. Como executar localmente

Na raiz do projeto, suba as dependências:

```powershell
cd C:\Users\Luciana\Desktop\tas\facoffee
docker compose up -d users-db rabbitmq keycloak
```

Confira se os containers estão em execução:

```powershell
docker compose ps
```

Depois acesse a pasta do serviço:

```powershell
cd services\users-service
```

Instale as dependências:

```powershell
npm.cmd install
```

Execute o serviço em modo desenvolvimento:

```powershell
npm.cmd run dev
```

O serviço ficará disponível em:

```text
http://localhost:3001
```

Para verificar se o serviço está ativo:

```text
http://localhost:3001/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "service": "users-service"
}
```

## 7. Variáveis de ambiente

Crie um arquivo `.env` local na pasta `services/users-service`.

Exemplo:

```env
PORT=3001
DATABASE_URL=postgres://users_user:users_password@localhost:5433/users_db

RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=facoffee.events

KEYCLOAK_REALM_URL=http://localhost:8080/realms/facoffee
KEYCLOAK_BASE_URL=http://localhost:8080
KEYCLOAK_REALM=facoffee
KEYCLOAK_ADMIN_REALM=master
KEYCLOAK_ADMIN_CLIENT_ID=admin-cli
KEYCLOAK_ADMIN_USERNAME=facoffee
KEYCLOAK_ADMIN_PASSWORD=facoffee
```

O arquivo `.env` não deve ser enviado ao GitHub.

O arquivo `.env.example` pode ser versionado para indicar quais variáveis são necessárias.

## 8. Swagger UI

A documentação local da API fica disponível em:

```text
http://localhost:3001/docs
```

No Swagger é possível testar:

```text
POST   /users
GET    /users
GET    /users/{userId}
PATCH  /users/{userId}
DELETE /users/{userId}
PUT    /users/{userId}/roles
```

O Swagger usa como servidor local:

```text
http://localhost:3001/api
```

Portanto, ao executar `POST /users` no Swagger, a chamada real é feita para:

```text
http://localhost:3001/api/users
```

### Usando token no Swagger

Para testar endpoints protegidos, gere um token do usuário `MANAGER`:

```powershell
$tokenResponse = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/realms/facoffee/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body "grant_type=password&client_id=facoffee-public&username=facoffee%40facom.ufms.br&password=facoffee"

$token = $tokenResponse.access_token
$token | Set-Clipboard
$token.Length
```

Depois, no Swagger:

1. Clique em `Authorize`.
2. Cole apenas o token, sem escrever `Bearer`.
3. Clique em `Authorize`.
4. Feche a janela.
5. Execute os endpoints protegidos.

## 9. Endpoints

### 9.1 Criar usuário

```text
POST /api/users
```

Endpoint público.

Body:

```json
{
  "name": "Usuario Demo",
  "email": "usuario.demo@facoffee.com",
  "roles": ["PARTICIPANT"]
}
```

Resposta esperada:

```text
201 Created
```

Observações:

* Se `roles` não for informado, o papel padrão será `PARTICIPANT`.
* O usuário é criado no PostgreSQL e sincronizado com o Keycloak.
* Se o e-mail já existir, retorna `409 Conflict`.

### 9.2 Listar usuários

```text
GET /api/users
```

Endpoint protegido. Requer `MANAGER`.

Filtros opcionais:

```text
status=ACTIVE
status=INACTIVE
role=MANAGER
role=PARTICIPANT
page=0
size=20
```

Exemplo:

```text
GET /api/users?status=ACTIVE&role=PARTICIPANT&page=0&size=20
```

Resposta esperada:

```json
{
  "items": [],
  "page": {
    "page": 0,
    "size": 20,
    "totalElements": 0,
    "totalPages": 0
  }
}
```

### 9.3 Buscar usuário por ID

```text
GET /api/users/:userId
```

Endpoint protegido.

Regras:

* `MANAGER` pode consultar qualquer usuário.
* `PARTICIPANT` só pode consultar o próprio usuário.

### 9.4 Atualizar usuário

```text
PATCH /api/users/:userId
```

Endpoint protegido.

Regras:

* `MANAGER` pode atualizar qualquer usuário.
* `PARTICIPANT` só pode atualizar o próprio usuário.

Body:

```json
{
  "name": "Usuario Atualizado"
}
```

A atualização também é sincronizada com o Keycloak.

### 9.5 Desativar usuário

```text
DELETE /api/users/:userId
```

Endpoint protegido.

Body:

```json
{
  "reason": "Usuario nao participa mais da copa"
}
```

A desativação:

* Altera o status do usuário para `INACTIVE`.
* Preenche `deactivatedAt`.
* Desativa o usuário no Keycloak.
* Publica evento de domínio no RabbitMQ.

### 9.6 Substituir roles

```text
PUT /api/users/:userId/roles
```

Endpoint protegido. Requer `MANAGER`.

Body:

```json
{
  "roles": ["MANAGER"]
}
```

A alteração substitui integralmente os papéis atuais do usuário e sincroniza as roles com o Keycloak.

## 10. Eventos de domínio

O serviço publica eventos no RabbitMQ usando a exchange:

```text
facoffee.events
```

Eventos publicados:

```text
user.created
user.roles.updated
users.deactivated
```

### UserCreated

Publicado quando um usuário é criado.

Estrutura geral:

```json
{
  "eventId": "uuid",
  "eventType": "UserCreated",
  "occurredAt": "2026-06-11T10:00:00.000Z",
  "version": "1.0",
  "payload": {
    "userId": "uuid",
    "email": "usuario@facoffee.com",
    "roles": ["PARTICIPANT"]
  }
}
```

### UserRolesUpdated

Publicado quando as roles do usuário são substituídas.

```json
{
  "eventId": "uuid",
  "eventType": "UserRolesUpdated",
  "occurredAt": "2026-06-11T10:00:00.000Z",
  "version": "1.0",
  "payload": {
    "userId": "uuid",
    "roles": ["MANAGER"]
  }
}
```

### UserDeactivated

Publicado quando o usuário é desativado.

```json
{
  "eventId": "uuid",
  "eventType": "UserDeactivated",
  "occurredAt": "2026-06-11T10:00:00.000Z",
  "version": "1.0",
  "payload": {
    "userId": "uuid",
    "reason": "Usuario nao participa mais da copa"
  }
}
```

## 11. RabbitMQ Management

Com o RabbitMQ rodando, acesse:

```text
http://localhost:15672
```

Credenciais padrão:

```text
guest
guest
```

Na aba `Exchanges`, verifique a exchange:

```text
facoffee.events
```

## 12. Keycloak

Com o Keycloak rodando, acesse:

```text
http://localhost:8080
```

Realm usado:

```text
facoffee
```

Usuário de teste usado para token `MANAGER`:

```text
facoffee@facom.ufms.br
```

Senha:

```text
facoffee
```

Cliente público usado para obter token:

```text
facoffee-public
```

Endpoint de token:

```text
POST http://localhost:8080/realms/facoffee/protocol/openid-connect/token
```

Body `x-www-form-urlencoded`:

```text
grant_type=password
client_id=facoffee-public
username=facoffee@facom.ufms.br
password=facoffee
```

## 13. Testes automatizados

Para executar os testes:

```powershell
cd C:\Users\Luciana\Desktop\tas\facoffee\services\users-service
npm.cmd test
```

Resultado esperado:

```text
tests 10
pass 10
fail 0
```

Os testes verificam:

* Listagem paginada.
* Criação de usuário.
* Papel padrão `PARTICIPANT`.
* E-mail duplicado.
* Busca por ID.
* Atualização de usuário.
* Desativação lógica.
* Substituição de roles.
* Validação de roles.
* Filtros por status e role.

## 14. Testes manuais pelo Swagger

A forma recomendada de demonstrar manualmente o serviço é pelo Swagger UI:

```text
http://localhost:3001/docs
```

Fluxo recomendado:

1. Executar `POST /users` com e-mail novo.
2. Copiar o `id` retornado.
3. Gerar token `MANAGER` no PowerShell.
4. Clicar em `Authorize` no Swagger e colar o token.
5. Executar `GET /users`.
6. Executar `GET /users/{userId}` com o `id` criado.
7. Executar `PATCH /users/{userId}`.
8. Executar `PUT /users/{userId}/roles`.
9. Executar `DELETE /users/{userId}` com `reason`.

## 15. Testes manuais pelo PowerShell

### Criar usuário

```powershell
$random = Get-Random

$body = @{
  name = "Usuario PowerShell"
  email = "powershell$random@facoffee.com"
  roles = @("PARTICIPANT")
} | ConvertTo-Json -Compress

$user = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3001/api/users" `
  -ContentType "application/json" `
  -Body $body

$user
```

### Obter token MANAGER

```powershell
$tokenResponse = Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/realms/facoffee/protocol/openid-connect/token" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body "grant_type=password&client_id=facoffee-public&username=facoffee%40facom.ufms.br&password=facoffee"

$headers = @{
  Authorization = "Bearer $($tokenResponse.access_token)"
}
```

### Listar usuários

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3001/api/users" `
  -Headers $headers
```

### Buscar por ID

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://localhost:3001/api/users/$($user.id)" `
  -Headers $headers
```

### Atualizar usuário

```powershell
$body = @{
  name = "Usuario Atualizado"
} | ConvertTo-Json -Compress

Invoke-RestMethod `
  -Method Patch `
  -Uri "http://localhost:3001/api/users/$($user.id)" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

### Substituir roles

```powershell
$body = @{
  roles = @("MANAGER")
} | ConvertTo-Json -Compress

Invoke-RestMethod `
  -Method Put `
  -Uri "http://localhost:3001/api/users/$($user.id)/roles" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

### Desativar usuário

```powershell
$body = @{
  reason = "Usuario nao participa mais da copa"
} | ConvertTo-Json -Compress

Invoke-RestMethod `
  -Method Delete `
  -Uri "http://localhost:3001/api/users/$($user.id)" `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $body
```

## 16. Códigos de erro comuns

### Token ausente

```json
{
  "error": "missing_token",
  "message": "Token de autenticação não informado."
}
```

### Token inválido

```json
{
  "error": "invalid_token",
  "message": "Token de autenticação inválido ou expirado."
}
```

### Acesso negado

```json
{
  "error": "access_denied",
  "message": "Apenas usuários com papel MANAGER podem executar esta operação."
}
```

### E-mail duplicado

```json
{
  "error": "email_already_exists",
  "message": "Já existe um usuário cadastrado com este e-mail."
}
```

### Usuário não encontrado

```json
{
  "error": "user_not_found",
  "message": "Usuário não encontrado."
}
```

### Role inválida

```json
{
  "error": "invalid_roles",
  "message": "As roles devem ser uma lista contendo apenas MANAGER ou PARTICIPANT."
}
```

## 17. Observações importantes

* O serviço usa PostgreSQL como persistência principal.
* O banco do Users é próprio e não deve ser compartilhado com outros serviços.
* O arquivo `.env` não deve ser commitado.
* O arquivo `.env.example` deve ser mantido como referência.
* O Swagger UI em `/docs` é uma interface auxiliar de documentação e demonstração da API.
* Para executar endpoints protegidos no Swagger, é necessário informar token JWT do Keycloak.
* `POST /api/users` é público.
* `GET`, `PATCH`, `PUT` e `DELETE` são protegidos por autenticação e autorização.
