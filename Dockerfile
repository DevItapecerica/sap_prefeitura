FROM node:22-alpine AS builder

WORKDIR /app

# Copia package.json primeiro (melhora cache)
COPY package*.json ./

# Instala TODAS dependências (incluindo dev)
RUN npm ci

# Copia resto do projeto
COPY . .

# Compila TypeScript
RUN npm run build

FROM node:22-alpine

WORKDIR /app

# Copia apenas dependências de produção
COPY package*.json ./
COPY .sequelizerc ./

RUN npm ci --omit=dev

# Copia build já compilado
COPY --from=builder /app/dist ./dist

RUN mkdir -p /var/lib/sap/ft-reports && chown -R node:node /var/lib/sap

# Expõe porta
EXPOSE 3000

USER node

# Sobe aplicação
CMD ["sh", "-c", "npx --no-install sequelize-cli db:migrate && npm start"]
