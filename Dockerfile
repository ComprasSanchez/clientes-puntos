# Etapa de build ------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# 1) Instala deps (incluidas devDeps para compilar)
COPY package.json package-lock.json ./
RUN npm ci

# 2) Copia configs y código fuente
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src

# 3) Build de Nest/TypeScript
RUN npm run build

# Etapa de producción -------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# 1) Sólo prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 2) Trae el dist compilado
COPY --from=builder /app/dist ./dist

# 3) Expón puerto y arranca
EXPOSE 3000
CMD ["node", "dist/main.js"]
