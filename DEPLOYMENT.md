# 🚀 Guide de Déploiement - Oulia

## 🌐 Obtenir un lien de preview public

Voici comment déployer Oulia pour obtenir un lien public à partager.

---

## Option 1️⃣ : Déploiement Complet (Recommandé)

### **Frontend sur Vercel** (Gratuit)

1. **Créer un compte sur Vercel** : https://vercel.com
2. **Connecter votre dépôt GitHub**
3. **Configurer le projet** :
   - Framework Preset : `Vite`
   - Root Directory : `frontend`
   - Build Command : `npm run build`
   - Output Directory : `dist`
4. **Variables d'environnement** :
   ```
   VITE_API_URL=https://votre-backend.railway.app/api
   ```
5. **Déployer** → Vous obtenez un lien : `https://oulia.vercel.app`

### **Backend sur Railway** (Gratuit pour commencer)

1. **Créer un compte sur Railway** : https://railway.app
2. **New Project → Deploy from GitHub**
3. **Sélectionner votre repo**
4. **Configurer** :
   - Root Directory : `backend`
   - Start Command : `npm start`
5. **Variables d'environnement** :
   ```env
   NODE_ENV=production
   PORT=3001
   GEMINI_API_KEY=votre_cle_api
   JWT_SECRET=votre_secret_production
   FRONTEND_URL=https://oulia.vercel.app
   DATABASE_URL=postgresql://... (fourni par Railway)
   ```
6. **Ajouter une base PostgreSQL** (depuis Railway)
7. **Déployer** → Vous obtenez : `https://oulia-backend.railway.app`

---

## Option 2️⃣ : Preview Rapide avec Tunnel (Temporaire)

Pour partager rapidement votre version locale :

### Avec **Cloudflare Tunnel** (Gratuit)

```bash
# Installer cloudflared
# Sur Mac :
brew install cloudflare/cloudflare/cloudflared

# Sur Linux :
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Lancer l'application localement
npm run dev

# Dans un autre terminal, créer un tunnel
cloudflared tunnel --url http://localhost:5173
```

Vous obtenez un lien temporaire : `https://random-name.trycloudflare.com`

### Avec **ngrok** (Gratuit)

```bash
# Télécharger ngrok : https://ngrok.com/download

# Lancer l'app
npm run dev

# Créer un tunnel
ngrok http 5173
```

Lien temporaire : `https://abc123.ngrok.io`

⚠️ **Attention** : Ces liens sont temporaires et disparaissent quand vous arrêtez le tunnel.

---

## Option 3️⃣ : Déploiement Tout-en-un sur Render (Gratuit)

Render permet de déployer backend + frontend ensemble :

1. **Créer un compte** : https://render.com
2. **New → Web Service**
3. **Connecter GitHub**
4. **Configuration Backend** :
   - Build Command : `cd backend && npm install && npx prisma generate`
   - Start Command : `cd backend && npm start`
   - Variables d'env (voir ci-dessus)
5. **Configuration Frontend** :
   - Build Command : `cd frontend && npm install && npm run build`
   - Publish Directory : `frontend/dist`

---

## 🎯 Résumé des options

| Option | Coût | Temps | Permanent | Performances |
|--------|------|-------|-----------|--------------|
| **Vercel + Railway** | Gratuit | 10 min | ✅ Oui | ⭐⭐⭐⭐⭐ |
| **Cloudflare Tunnel** | Gratuit | 2 min | ❌ Non | ⭐⭐⭐ |
| **ngrok** | Gratuit | 2 min | ❌ Non | ⭐⭐⭐ |
| **Render** | Gratuit | 15 min | ✅ Oui | ⭐⭐⭐⭐ |

---

## 📝 Checklist avant déploiement

- [ ] Clé Gemini API configurée
- [ ] Variables d'environnement définies
- [ ] Base de données migrée (PostgreSQL en production)
- [ ] Code poussé sur GitHub
- [ ] CORS configuré correctement (FRONTEND_URL dans backend/.env)

---

## 🆘 Problèmes courants

### "Cannot connect to backend"
→ Vérifiez que `VITE_API_URL` pointe vers votre backend déployé

### "Gemini API error"
→ Vérifiez que `GEMINI_API_KEY` est bien configuré dans les variables d'environnement

### "Database connection error"
→ Assurez-vous d'utiliser PostgreSQL en production, pas SQLite

---

**Besoin d'aide pour le déploiement ? Créez une issue sur GitHub !**
