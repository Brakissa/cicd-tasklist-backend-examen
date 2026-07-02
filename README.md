# Tasklist Backend

Backend Node.js/TypeScript pour une application de gestion de tâches, avec Prisma, Express et une pipeline CI/CD Jenkins.

## Présentation

Ce projet expose une API REST pour gérer des tâches avec les opérations suivantes :
- lister les tâches
- créer une tâche
- mettre à jour une tâche
- supprimer une tâche

## Stack technique

- Node.js
- TypeScript
- Express
- Prisma ORM
- MySQL
- Vitest
- Jenkins
- SonarQube
- Docker
- Trivy

## Prérequis

Avant de lancer l’application, assurez-vous d’avoir :
- Node.js 18 ou plus
- npm
- une base MySQL accessible
- Docker (optionnel, pour l’image containerisée)

## Installation

1. Cloner le dépôt
   ```bash
   git clone <url-du-repo>
   cd cicd-tasklist-backend-examen
   ```

2. Installer les dépendances
   ```bash
   npm ci
   ```

3. Configurer la base de données
   Créez un fichier `.env` à la racine avec la variable suivante :
   ```env
   DATABASE_URL="mysql://user:password@localhost:3306/tasklist"
   ```

4. Générer le client Prisma
   ```bash
   npm run prisma:generate
   ```

5. Appliquer les migrations
   ```bash
   npm run prisma:migrate
   ```

## Lancer l’application

### Mode développement
```bash
npm run dev
```

L’API sera disponible sur :
- http://localhost:3000

### Mode production
```bash
npm run build
npm start
```

## Scripts disponibles

```bash
npm run dev
npm run build
npm run start
npm run test
npm run test:coverage
npm run test:e2e
npm run test:e2e:coverage
npm run prisma:migrate
npm run prisma:generate
```

## Structure du projet

```text
src/
  controllers/
  routes/
  services/
  lib/
  __tests__/
prisma/
  schema.prisma
```

## API

### Endpoints

- GET /tasks : lister les tâches
- POST /tasks : créer une tâche
- PUT /tasks/:id : modifier une tâche
- DELETE /tasks/:id : supprimer une tâche

## Tests

Exécuter les tests unitaires :
```bash
npm run test
```

Exécuter les tests e2e :
```bash
npm run test:e2e
```

Avec couverture :
```bash
npm run test:coverage
npm run test:e2e:coverage
```

## Pipeline CI/CD

Le projet est intégré à une pipeline Jenkins qui exécute :
- installation des dépendances
- génération du client Prisma
- tests unitaires et e2e
- build TypeScript
- analyse SonarQube
- scan Docker avec Trivy
- publication de l’image

## Dépannage

### Erreur Prisma
Si le client Prisma n’est pas généré, exécuter :
```bash
npm run prisma:generate
```

### Erreur de connexion à la base
Vérifier que la variable `DATABASE_URL` est correcte et que la base MySQL est démarrée.

### Erreur de dépendances
Si une installation échoue, nettoyer puis réinstaller :
```bash
rm -rf node_modules package-lock.json
npm install
```
