# Entrega Parcial — FACOFFEE

## Status atual

Nesta entrega parcial, o grupo organizou o repositório do projeto FACOFFEE, validou a infraestrutura base com Docker e iniciou o desenvolvimento do microsserviço responsável pelo domínio de usuários.

A entrega ainda não representa o sistema completo, mas demonstra progresso inicial no desenvolvimento, com estrutura de serviço, endpoints básicos e testes locais.

## Infraestrutura validada

Foi executado o ambiente local com Docker Compose a partir do comando:

```bash
docker compose up -d
```

A execução iniciou os seguintes serviços de apoio:

* API Gateway com Nginx;
* RabbitMQ para mensageria;
* Keycloak para autenticação e autorização;
* Mailpit para captura de e-mails em ambiente de desenvolvimento.

## Serviço de usuários

Foi criado o serviço inicial de usuários em:

```text
services/users-service
```

O serviço foi implementado com Node.js e Express, utilizando dados em memória nesta primeira versão.

Até o momento, o serviço possui os seguintes endpoints:

```text
GET /health
GET /users
GET /users/:userId
POST /users
GET /api/users
GET /api/users/:userId
POST /api/users
```

## Testes realizados

O endpoint de saúde foi testado localmente em:

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

Também foi testado o cadastro de usuário através do API Gateway:

```text
POST http://localhost:8000/api/users
```

Esse teste confirmou que o API Gateway conseguiu encaminhar a requisição para o serviço de usuários.

## Como executar o serviço de usuários

A partir da raiz do repositório, acessar a pasta do serviço:

```bash
cd services/users-service
```

Instalar as dependências:

```bash
npm install
```

Executar em modo de desenvolvimento:

```bash
npm run dev
```

O serviço fica disponível em:

```text
http://localhost:3001
```

## Andamento do grupo

Até o momento, o grupo realizou:

* criação e organização do repositório no GitHub;
* execução do ambiente com Docker Compose;
* validação inicial dos containers da infraestrutura;
* criação da estrutura inicial do serviço de usuários;
* implementação de endpoints básicos de usuários;
* teste do endpoint `/health`;
* teste de criação de usuário via API Gateway.

## Próximos passos

Os próximos passos do grupo são:

1. Ajustar os endpoints conforme o contrato definido em `api-docs.yaml`.
2. Integrar o serviço de usuários com banco de dados.
3. Criar testes automatizados para os endpoints.
4. Registrar evidências de execução.
5. Evoluir autenticação/autorização conforme o padrão definido para o projeto.
6. Expandir a integração com os demais microsserviços.
