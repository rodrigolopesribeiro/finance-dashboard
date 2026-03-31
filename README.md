# Finance Dashboard (Full Stack)

Aplicação de controle financeiro pessoal com backend NestJS + Prisma + PostgreSQL e frontend React/Vite.

## Stack
- **Backend:** Node.js + TypeScript + NestJS
- **ORM:** Prisma
- **Banco:** PostgreSQL
- **Frontend:** React + Vite + TypeScript
- **Auth:** JWT + Refresh Token
- **Docs:** Swagger (opcional)

## Funcionalidades
- Autenticação (cadastro/login/refresh)
- Sessão persistente com refresh token
- Perfil com edição e troca de senha
- CRUD de contas, categorias, transações, cartões, faturas e metas
- Dashboard com resumo financeiro
- Filtros avançados, favoritos e exportação CSV
- Seed com dados realistas

---

# 🚀 Como rodar localmente

## Backend
```bash
npm install
```

Suba o banco (opcional via Docker):
```bash
docker-compose up -d
```

Crie `.env` baseado em `.env.example`.

Prisma:
```bash
npm run prisma:generate
npm run prisma:migrate
```

Seed:
```bash
npm run seed
```

Suba o backend:
```bash
npm run start:dev
```
API: `http://localhost:3000/api`

## Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend: `http://localhost:5173`

---

# 🔐 Seed padrão
- Email: `lucas@email.com`
- Senha: `Juliana21!`

---

# 📦 Deploy (Hostinger VPS + Vercel)

## Estratégia final
- **Frontend:** Vercel
- **Backend:** Hostinger VPS (Node + PM2)
- **Banco:** PostgreSQL na VPS

---

# 1. Subir o código para o GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

---

# 2. Preparar a VPS (Hostinger)

### 2.1 Atualizar sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Instalar Node.js (recomendado Node 20)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verifique:
```bash
node -v
npm -v
```

### 2.3 Instalar PM2
```bash
sudo npm i -g pm2
```

### 2.4 Instalar PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
```

Criar usuário e banco:
```bash
sudo -u postgres psql
```
```sql
CREATE USER finance_user WITH PASSWORD 'SUA_SENHA_FORTE';
CREATE DATABASE finance_dashboard OWNER finance_user;
GRANT ALL PRIVILEGES ON DATABASE finance_dashboard TO finance_user;
```
Saia:
```sql
\q
```

---

# 3. Deploy do backend na VPS

### 3.1 Clonar o repositório
```bash
git clone https://github.com/SEU_USUARIO/SEU_REPO.git
cd SEU_REPO
```

### 3.2 Instalar dependências
```bash
npm install
```

### 3.3 Criar `.env`
Crie um `.env` na raiz com os valores de produção:
```
NODE_ENV=production
PORT=3000
APP_URL=https://api.seudominio.com

DATABASE_URL="postgresql://finance_user:SUA_SENHA_FORTE@localhost:5432/finance_dashboard?schema=public"

JWT_SECRET=SEU_SEGREDO_FORTE
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=SEU_REFRESH_FORTE
JWT_REFRESH_EXPIRES_IN=30d
BCRYPT_SALT_ROUNDS=10

ENABLE_SWAGGER=false
CORS_ORIGIN=https://app.seudominio.com
```

### 3.4 Prisma
```bash
npm run prisma:generate
npm run prisma:migrate:deploy
```

(Seed apenas se quiser dados iniciais):
```bash
npm run seed
```

### 3.5 Build do backend
```bash
npm run build
```

### 3.6 Subir com PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Backend ficará rodando em:
```
http://localhost:3000/api
```

---

# 4. Configurar Nginx (Recomendado)

```bash
sudo apt install -y nginx
```
Crie um arquivo:
```bash
sudo nano /etc/nginx/sites-available/finance-api
```

Conteúdo:
```nginx
server {
  server_name api.seudominio.com;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Ativar:
```bash
sudo ln -s /etc/nginx/sites-available/finance-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

(Opcional) HTTPS com Let’s Encrypt:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.seudominio.com
```

---

# 5. Deploy do frontend na Vercel

1. Acesse Vercel → New Project
2. Selecione o repo
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Output Directory: `dist`

### Variável de ambiente na Vercel
```
VITE_API_URL=https://api.seudominio.com/api
```

Frontend ficará disponível em:
```
https://app.seudominio.com
```

---

# 6. Validar produção

- Backend responde?
```
https://api.seudominio.com/api
```

- Frontend carrega e faz login?
```
https://app.seudominio.com
```

---

# 7. Atualizar com novos commits

No seu PC:
```bash
git add .
git commit -m "Atualização"
git push
```

Na VPS:
```bash
cd SEU_REPO
git pull
npm install
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build
pm2 restart ecosystem.config.js
```

---

# 📝 Endpoints principais
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `PATCH /api/users/me/password`
- `GET /api/dashboard/summary`
- `GET /api/transactions`

---

Se quiser, posso adicionar healthcheck ou logs mais avançados.
