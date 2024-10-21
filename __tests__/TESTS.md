# Documentation des Tests

=====================================

## Table des Matières

1. [Types de Tests](#types-de-tests)
2. [Scénarios de Tests](#scénarios-de-tests)
   - [Inscription d'un Utilisateur](#inscription-dun-utilisateur)
   - [Connexion d'un Utilisateur](#connexion-dun-utilisateur)
   - [Récupération du Profil Utilisateur](#récupération-du-profil-utilisateur)
   - [Mise à Jour du Mot de Passe Utilisateur](#mise-à-jour-du-mot-de-passe-utilisateur)
3. [Exécution des Tests](#exécution-des-tests)

## Types de Tests

- **Tests d'Unités** : Vérifient le comportement des fonctions individuelles (ex : contrôleurs, modèles).
- **Tests d'Intégration** : Vérifient l'interaction entre plusieurs modules (ex : routes avec la base de données).
- **Tests de Fonctionnalité** : Vérifient que l'API répond correctement aux requêtes des utilisateurs.

## Scénarios de Tests

### Inscription d'un Utilisateur

- **Test** : Devrait enregistrer un nouvel utilisateur.

  - **Entrée** : `name`, `email`, `password`
  - **Attente** : Statut 201 et un token.

- **Test** : Devrait retourner 400 si tous les champs sont vides.
  - **Entrée** : `name`, `email`, `password` vides.
  - **Attente** : Statut 400 et message d'erreur.

### Connexion d'un Utilisateur

- **Test** : Devrait connecter l'utilisateur existant.

  - **Entrée** : `email`, `password`
  - **Attente** : Statut 200 et un token.

- **Test** : Devrait retourner 401 si l'email ou le mot de passe est incorrect.
  - **Entrée** : Email ou mot de passe incorrects.
  - **Attente** : Statut 401 et message d'erreur.

### Récupération du Profil Utilisateur

- **Test** : Devrait retourner le profil utilisateur avec un token valide.

  - **Entrée** : Token JWT valide.
  - **Attente** : Statut 200 et données de l'utilisateur.

- **Test** : Devrait retourner 401 si le token est manquant ou invalide.
  - **Entrée** : Token manquant ou invalide.
  - **Attente** : Statut 401 et message d'erreur.

### Mise à Jour du Mot de Passe Utilisateur

- **Test** : Devrait mettre à jour le mot de passe avec succès.

  - **Entrée** : `oldPassword`, `newPassword` (valide)
  - **Attente** : Statut 200 et message de succès.

- **Test** : Devrait retourner 400 si oldPassword ou newPassword ne sont pas fournis.

  - **Entrée** : `oldPassword` vide et `newPassword` valide.
  - **Attente** : Statut 400 et message d'erreur indiquant que les deux mots de passe sont requis.

- **Test** : Devrait retourner 401 si l'ancien mot de passe est incorrect.
  - **Entrée** : `oldPassword` incorrect et `newPassword` valide.
  - **Attente** : Statut 401 et message d'erreur indiquant que l'ancien mot de passe est incorrect.

## Exécution des Tests

Pour exécuter les tests, utilisez la commande suivante :
