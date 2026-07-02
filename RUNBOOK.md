# Runbook — Chute critique de la couverture de code dans le projet tasklist-backend

**Sujet**

Chute critique de la couverture de code dans le projet tasklist-backend, détectée lors de l'exécution du rapport de couverture.

Le pipeline CI/CD génère un rapport de couverture de code via `npm run test:coverage`. Si la couverture globale tombe en dessous d'un seuil acceptable (ici 9.28%), cela signifie que la majorité du code applicatif n'est pas testée, ce qui expose le projet à des régressions non détectées en production.

Le rapport Vitest affiche une couverture globale inférieure à 10% sur les statements, fonctions, lignes et branches.

Les fichiers `app.ts`, `task.routes.ts`, `prisma.ts` affichent 0% de couverture.

`task.controller.ts` couvre seulement 8.53% des lignes.

`task.service.ts` couvre seulement 15.78% des lignes.

Seuls 2 tests passent sur l'ensemble du projet.

**Public cible**

Le développeur en charge du projet ou le responsable qualité de la pipeline CI/CD, dès qu'un rapport de couverture anormalement bas est détecté.

**Moment d'application**

Les tests de coverage se lancent dans la phase CI, après les tests unitaires et avant tout déploiement.

Immédiatement, dès la détection du rapport de couverture insuffisant, avant tout merge sur la branche principale ou tout déploiement.

**Quand ne pas appliquer**

Une faible couverture de tests peut être acceptable lorsqu'elle est volontairement justifiée et documentée (par exemple, pour des fichiers de configuration exclus du périmètre des tests), lorsque le projet est encore en phase de bootstrap et qu'aucune stratégie de test n'est attendue à ce stade, ou encore lorsque le rapport concerne une branche de fonctionnalité isolée qui n'est pas destinée à être fusionnée dans la branche principale.

Si une partie du code est explicitement exclue du calcul de couverture selon les règles du projet et autre.

---

## Étapes à suivre

### Étape 1 - Identifier les fichiers non couverts

```bash
npm run test:coverage
```

Lire le tableau de couverture et noter les fichiers à 0% ou proche de 0%.

### Étape 2 - Distinguer tests unitaires et e2e

```bash
npm run test:coverage

npm run test:e2e:coverage
```

Les fichiers `app.ts` et `task.routes.ts` sont naturellement couverts par les tests e2e, pas les tests unitaires.

### Étape 3 - Compléter les tests unitaires manquants

Pour `task.service.ts` : ajouter les cas d'erreur (`throw "Task not found"`) dans `update()` et `remove()` quand `findUnique` retourne `null`.

Pour `task.controller.ts` : ajouter les cas `400`, `404` et `500` pour chaque handler (`getAllTasks`, `getTaskById`, `createTask`, `updateTask`, `deleteTask`).

### Étape 4 - Compléter les tests e2e manquants

Ajouter les cas nominaux manquants dans `task.e2e.test.ts` :

- `GET /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Étape 5 - Vérifier la progression

```bash
npm run test:coverage
npm run test:e2e:coverage
```

Objectif : dépasser 80% de couverture globale sur branch.

### Étape 6(optionel) - Ajouter un seuil dans `vitest.config.ts` pour éviter la régression :

```ts
typescriptcoverage: {
  thresholds: {
    branch: 80
  }
}
```