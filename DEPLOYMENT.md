# Guide de déploiement - Netlify

Ce guide vous accompagne étape par étape pour déployer votre application sur Netlify avec déploiement continu via Git.

## Prérequis

- Un compte GitHub, GitLab ou Bitbucket
- Un compte Netlify (gratuit) sur [netlify.com](https://netlify.com)
- Git installé sur votre machine

## Étape 1 : Initialiser Git et créer votre dépôt

### 1.1 Initialiser Git localement

```bash
git init
git add .
git commit -m "Initial commit: Configuration pour déploiement Netlify"
```

### 1.2 Créer un dépôt distant

**Option A : GitHub**
1. Allez sur [github.com](https://github.com) et connectez-vous
2. Cliquez sur le bouton "New repository"
3. Donnez un nom à votre dépôt (ex: `cec-logistics`)
4. Choisissez "Private" ou "Public" selon vos besoins
5. **NE cochez PAS** "Initialize this repository with a README"
6. Cliquez sur "Create repository"

**Option B : GitLab**
1. Allez sur [gitlab.com](https://gitlab.com) et connectez-vous
2. Cliquez sur "New project" > "Create blank project"
3. Donnez un nom à votre projet
4. Choisissez le niveau de visibilité
5. **NE cochez PAS** "Initialize repository with a README"
6. Cliquez sur "Create project"

**Option C : Bitbucket**
1. Allez sur [bitbucket.org](https://bitbucket.org) et connectez-vous
2. Cliquez sur "Create" > "Repository"
3. Donnez un nom à votre dépôt
4. Choisissez "Private" ou "Public"
5. Cliquez sur "Create repository"

### 1.3 Lier votre dépôt local au dépôt distant

Après avoir créé votre dépôt, copiez les commandes affichées par la plateforme. Elles ressembleront à ceci :

**GitHub / GitLab :**
```bash
git remote add origin https://github.com/votre-username/votre-repo.git
git branch -M main
git push -u origin main
```

**Bitbucket :**
```bash
git remote add origin https://bitbucket.org/votre-username/votre-repo.git
git branch -M main
git push -u origin main
```

## Étape 2 : Configurer les variables d'environnement

Avant de déployer, assurez-vous d'avoir vos clés Supabase prêtes.

### 2.1 Récupérer vos clés Supabase

1. Connectez-vous à [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Allez dans "Settings" > "API"
4. Copiez :
   - **Project URL** (ex: `https://xxxxx.supabase.co`)
   - **anon public** key

### 2.2 Format des variables

Vous aurez besoin de ces deux variables :
- `VITE_SUPABASE_URL` : L'URL de votre projet Supabase
- `VITE_SUPABASE_ANON_KEY` : La clé publique anonyme

## Étape 3 : Déployer sur Netlify

### 3.1 Connecter votre dépôt à Netlify

1. Allez sur [netlify.com](https://netlify.com) et connectez-vous
2. Cliquez sur "Add new site" > "Import an existing project"
3. Choisissez votre plateforme Git (GitHub, GitLab ou Bitbucket)
4. Autorisez Netlify à accéder à vos dépôts
5. Sélectionnez le dépôt que vous venez de créer

### 3.2 Configuration du build

Netlify devrait détecter automatiquement les paramètres grâce au fichier `netlify.toml`. Vérifiez que :

- **Build command** : `npm run build`
- **Publish directory** : `dist`
- **Branch to deploy** : `main`

Si les paramètres ne sont pas détectés, entrez-les manuellement.

### 3.3 Ajouter les variables d'environnement

**IMPORTANT : Cette étape est cruciale pour que votre application fonctionne**

1. Avant de cliquer sur "Deploy site", cliquez sur "Show advanced"
2. Cliquez sur "New variable" et ajoutez :

   **Variable 1 :**
   - Key : `VITE_SUPABASE_URL`
   - Value : Votre URL Supabase (ex: `https://xxxxx.supabase.co`)

   **Variable 2 :**
   - Key : `VITE_SUPABASE_ANON_KEY`
   - Value : Votre clé publique Supabase

3. Cliquez sur "Deploy site"

### 3.4 Premier déploiement

Netlify va maintenant :
- Cloner votre dépôt
- Installer les dépendances (`npm install`)
- Construire votre application (`npm run build`)
- Publier le contenu du dossier `dist`

Le processus prend généralement 2-3 minutes. Vous pouvez suivre la progression dans les logs de déploiement.

## Étape 4 : Vérifier le déploiement

### 4.1 Accéder à votre site

Une fois le déploiement terminé :
1. Netlify génère automatiquement une URL (ex: `https://random-name-123456.netlify.app`)
2. Cliquez sur le lien pour ouvrir votre site
3. Testez les fonctionnalités principales :
   - Navigation entre les pages
   - Connexion avec un compte agent
   - Suivi de colis
   - Accès à la base de données

### 4.2 Si quelque chose ne fonctionne pas

**Erreurs de build :**
- Cliquez sur le déploiement échoué dans Netlify
- Consultez les logs pour identifier l'erreur
- Corrigez l'erreur localement
- Commitez et poussez les modifications : `git add . && git commit -m "Fix: correction erreur" && git push`

**Erreurs de connexion Supabase :**
- Vérifiez que les variables d'environnement sont correctement configurées dans Netlify
- Allez dans "Site settings" > "Environment variables"
- Vérifiez que `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont présentes et correctes
- Si vous modifiez les variables, redéployez : "Deploys" > "Trigger deploy" > "Deploy site"

## Étape 5 : Configurer le déploiement continu

Le déploiement continu est **déjà activé** par défaut ! Voici comment cela fonctionne :

### 5.1 Workflow automatique

Chaque fois que vous poussez du code sur la branche `main` :

```bash
git add .
git commit -m "Description de vos modifications"
git push
```

Netlify va automatiquement :
1. Détecter le nouveau commit
2. Lancer un nouveau build
3. Déployer la nouvelle version si le build réussit
4. Vous envoyer une notification (si configurée)

### 5.2 Prévisualisation des branches

Si vous travaillez sur une branche de développement :

```bash
git checkout -b feature/nouvelle-fonctionnalite
# ... faites vos modifications ...
git add .
git commit -m "Ajout nouvelle fonctionnalité"
git push -u origin feature/nouvelle-fonctionnalite
```

Netlify créera automatiquement une **preview deployment** avec une URL unique pour tester vos modifications avant de les fusionner dans `main`.

## Étape 6 : Configuration avancée (optionnel)

### 6.1 Nom de domaine personnalisé

1. Dans Netlify, allez dans "Site settings" > "Domain management"
2. Cliquez sur "Add custom domain"
3. Entrez votre nom de domaine (ex: `www.mon-site.com`)
4. Suivez les instructions pour configurer vos DNS
5. Netlify activera automatiquement HTTPS via Let's Encrypt

### 6.2 Notifications de déploiement

1. Allez dans "Site settings" > "Build & deploy" > "Deploy notifications"
2. Cliquez sur "Add notification"
3. Choisissez le type (Email, Slack, webhook, etc.)
4. Configurez selon vos préférences

### 6.3 Optimisations de performance

Dans "Site settings" > "Build & deploy" > "Post processing", activez :
- **Asset optimization** : Minification automatique du CSS et JS
- **Pretty URLs** : URLs sans `.html`
- **Bundle analysis** : Analyse de la taille des bundles

### 6.4 Protection par mot de passe (sites privés)

Si vous voulez protéger votre site avant le lancement officiel :
1. Allez dans "Site settings" > "Access control"
2. Activez "Visitor access" > "Password protection"
3. Définissez un mot de passe
4. Partagez le mot de passe avec vos testeurs

## Résolution de problèmes courants

### Le build échoue avec une erreur TypeScript

```bash
# Localement, vérifiez que le build fonctionne
npm run build

# Si des erreurs apparaissent, corrigez-les avant de pousser
```

### Les images ne s'affichent pas

Vérifiez que :
- Les images sont dans le dossier `public/`
- Les chemins d'accès sont corrects (ex: `/Logo.jpg` et non `./public/Logo.jpg`)
- Les noms de fichiers respectent la casse

### Les redirections ne fonctionnent pas

Le fichier `netlify.toml` inclut déjà les redirections nécessaires pour les Single Page Applications. Si vous rencontrez des problèmes :
1. Vérifiez que `netlify.toml` est bien à la racine du projet
2. Vérifiez la configuration dans Netlify : "Site settings" > "Build & deploy" > "Post processing" > "Asset optimization"

### Erreur 404 sur les routes React

C'est normal si les redirections ne sont pas configurées. Le fichier `netlify.toml` inclus dans ce projet résout ce problème en redirigeant toutes les routes vers `index.html`.

## Commandes Git utiles

```bash
# Voir l'état de votre dépôt
git status

# Voir l'historique des commits
git log --oneline

# Créer une nouvelle branche
git checkout -b nom-de-la-branche

# Revenir à la branche main
git checkout main

# Fusionner une branche dans main
git checkout main
git merge nom-de-la-branche

# Annuler les modifications non commitées
git checkout -- .

# Voir les différences avant de commiter
git diff
```

## Support

- **Documentation Netlify** : [docs.netlify.com](https://docs.netlify.com)
- **Documentation Supabase** : [supabase.com/docs](https://supabase.com/docs)
- **Documentation Vite** : [vitejs.dev](https://vitejs.dev)

---

**Félicitations !** Votre application est maintenant déployée sur Netlify avec déploiement continu. Chaque modification que vous pousserez sur Git sera automatiquement déployée en production.
