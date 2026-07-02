# Dockerfile - Build et production pour tasklist-backend
# Multi-stage build pour optimiser la taille de l'image

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY tsconfig.json ./

# Installer les dépendances (incluant les devDependencies pour la compilation)
RUN npm ci

# Copier le code source
COPY src ./src
COPY prisma ./prisma

# Générer le client Prisma
RUN npm run prisma:generate

# Compiler TypeScript en JavaScript
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Installer dumb-init pour gérer les signaux correctement
RUN apk add --no-cache dumb-init

# Copier package.json pour les informations de version
COPY package*.json ./

# Installer uniquement les dépendances de production
RUN npm ci --only=production

# Copier le schéma Prisma
COPY prisma ./prisma

# Copier les fichiers compilés depuis le builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma


# Créer un utilisateur non-root pour la sécurité
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Exposer le port (par défaut 3000 pour Express)
EXPOSE 3000

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Utiliser dumb-init pour démarrer l'application
ENTRYPOINT ["dumb-init", "--"]

# Commande de démarrage
CMD ["node", "dist/server.js"]

# Healthcheck (optionnel)
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1
