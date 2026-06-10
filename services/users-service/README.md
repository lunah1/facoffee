# Users Service

Serviço responsável pelo domínio de usuários da aplicação FACOFFEE.

## Escopo implementado

Este serviço implementa as principais rotas de usuários previstas no contrato da API:

* `GET /api/users`
* `GET /api/users/:userId`
* `POST /api/users`
* `PATCH /api/users/:userId`
* `DELETE /api/users/:userId`
* `PUT /api/users/:userId/roles`

A implementação atual utiliza armazenamento em memória. Portanto, os dados cadastrados ou alterados são perdidos quando o serviço é reiniciado.

## Como executar localmente

Acesse a pasta do serviço:

```cmd
cd services\users-service
```

Instale as dependências:

```cmd
npm.cmd install
```

Execute o serviço em modo desenvolvimento:

```cmd
npm.cmd run dev
```

O serviço ficará disponível, por padrão, em:

```text
http://localhost:3001
```

Para verificar se o serviço está ativo:

```text
http://localhost:3001/health
```

## Variáveis de ambiente

No estágio atual, o serviço não exige variáveis de ambiente obrigatórias para execução local.

## Testes manuais

Os testes abaixo podem ser executados com `curl.exe` no CMD do Windows.

### Listar usuários

```cmd
curl.exe -i http://localhost:3001/api/users
```

Resultado esperado: resposta `200 OK` com os campos `items` e `page`.

### Criar usuário

```cmd
curl.exe -i -X POST http://localhost:3001/api/users -H "Content-Type: application/json" -d "{\"name\":\"Ana Teste\",\"email\":\"ana.teste@facoffee.com\",\"roles\":[\"PARTICIPANT\"]}"
```

Resultado esperado: resposta `201 Created`.

### Validar nome inválido

```cmd
curl.exe -i -X POST http://localhost:3001/api/users -H "Content-Type: application/json" -d "{\"name\":\"An\",\"email\":\"ana.invalida@facoffee.com\",\"roles\":[\"PARTICIPANT\"]}"
```

Resultado esperado: resposta `400 Bad Request`.

### Validar e-mail duplicado

Execute duas vezes o cadastro com o mesmo e-mail:

```cmd
curl.exe -i -X POST http://localhost:3001/api/users -H "Content-Type: application/json" -d "{\"name\":\"Ana Teste\",\"email\":\"ana.teste@facoffee.com\",\"roles\":[\"PARTICIPANT\"]}"
```

Resultado esperado na segunda execução: resposta `409 Conflict`.

### Atualizar usuário

```cmd
curl.exe -i -X PATCH http://localhost:3001/api/users/usr_001 -H "Content-Type: application/json" -d "{\"name\":\"Maria Silva Atualizada\"}"
```

Resultado esperado: resposta `200 OK` com o nome atualizado e `updatedAt` preenchido.

### Desativar usuário logicamente

```cmd
curl.exe -i -X DELETE http://localhost:3001/api/users/usr_001 -H "Content-Type: application/json" -d "{\"reason\":\"Teste de desativacao\"}"
```

Resultado esperado: resposta `200 OK` com `status` igual a `INACTIVE` e `deactivatedAt` preenchido.

### Substituir roles do usuário

```cmd
curl.exe -i -X PUT http://localhost:3001/api/users/usr_001/roles -H "Content-Type: application/json" -d "{\"roles\":[\"MANAGER\"]}"
```

Resultado esperado: resposta `200 OK` com `roles` igual a `["MANAGER"]`.

### Validar role inválida

```cmd
curl.exe -i -X PUT http://localhost:3001/api/users/usr_001/roles -H "Content-Type: application/json" -d "{\"roles\":[\"ADMIN\"]}"
```

Resultado esperado: resposta `400 Bad Request`.
