# 🚨 DÉPLOIEMENT URGENT - Instructions rapides

## Ce qui a été corrigé

✅ Configuration Vite optimisée pour la production
✅ Redirections serveur renforcées
✅ Gestion d'erreurs améliorée avec logs de diagnostic
✅ Corrections des couleurs purple/indigo → conformes au projet
✅ Build testé et validé localement

## ÉTAPE 1 : Vérifier les variables d'environnement dans Netlify

**⚠️ CRITIQUE - Sans cette étape, le site ne fonctionnera pas!**

1. Allez sur https://app.netlify.com
2. Sélectionnez votre site (cec-mg.com)
3. **Site settings** → **Environment variables**
4. Vérifiez que ces 2 variables existent:

```
VITE_SUPABASE_URL = https://itnfvpngrboezmfalmhy.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bmZ2cG5ncmJvZXptZmFsbWh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTkwNDgsImV4cCI6MjA2OTM5NTA0OH0.jBqy9G7Oo8LAaji8XdR2Xj7EsuyV2k4KJsIlJK7vUrg
```

**Si elles sont absentes:**
- Cliquez sur **Add a variable**
- Ajoutez les deux variables ci-dessus
- Passez à l'Étape 2 puis redéployez (Étape 3)

## ÉTAPE 2 : Pousser les modifications

```bash
# Ajoutez tous les fichiers
git add .

# Créez un commit
git commit -m "Fix: Correction page blanche en production"

# Poussez vers Git
git push origin main
```

Netlify va automatiquement détecter le push et relancer le déploiement.

## ÉTAPE 3 : Forcer un nouveau déploiement (si nécessaire)

Si vous avez modifié les variables d'environnement:

1. Allez dans **Deploys**
2. Cliquez sur **Trigger deploy**
3. Sélectionnez **Clear cache and deploy site**

Attendez 2-3 minutes que le déploiement se termine.

## ÉTAPE 4 : Tester le site

1. **Videz le cache du navigateur:**
   - Windows: `Ctrl+Shift+Delete`
   - Mac: `Cmd+Option+E`

2. **Hard refresh:**
   - Windows: `Ctrl+Shift+R`
   - Mac: `Cmd+Shift+R`

3. **Ouvrez la console (F12):**
   Vous devriez voir:
   ```
   🚀 Application starting...
   Environment: production
   Supabase URL: ✅ Configured
   Supabase Key: ✅ Configured
   ✅ Root element found, initializing React...
   ✅ React application rendered successfully!
   ```

4. **Testez la navigation:**
   - Accueil ✅
   - À propos ✅
   - Services ✅
   - FAQ ✅
   - Suivi de colis ✅

## ❌ Si ça ne fonctionne toujours pas

### Vous voyez "❌ Missing" dans la console?
→ Les variables d'environnement ne sont pas configurées
→ Retournez à l'**ÉTAPE 1**

### Vous voyez des erreurs 404 dans Network?
→ Vérifiez que `netlify.toml` est à la racine
→ Forcez un rebuild complet (ÉTAPE 3)

### Page toujours blanche sans erreurs?
→ Testez en navigation privée
→ Testez depuis un autre appareil
→ Videz le cache CDN Netlify (ÉTAPE 3)

## 📝 Fichiers de documentation créés

- **SOLUTION_PAGE_BLANCHE.md** - Explication complète du problème et de la solution
- **TROUBLESHOOTING.md** - Guide de résolution des problèmes
- **DEPLOIEMENT_URGENT.md** - Ce fichier (instructions rapides)

## ✅ Checklist de validation

- [ ] Variables d'environnement configurées dans Netlify
- [ ] Code poussé sur Git
- [ ] Déploiement terminé sans erreur
- [ ] Cache navigateur vidé
- [ ] Logs de console positifs (🚀, ✅)
- [ ] Navigation fonctionnelle entre les pages
- [ ] Images chargées correctement
- [ ] Aucune erreur dans la console

## 🆘 Besoin d'aide?

Consultez **TROUBLESHOOTING.md** pour plus de détails sur chaque étape et scénario.
