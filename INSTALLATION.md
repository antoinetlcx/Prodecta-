# 📋 Guide d'Installation - Oulia

## Étapes d'installation rapide

### 1. Installer les dépendances

\`\`\`bash
# Installer toutes les dépendances (racine + backend + frontend)
npm install

# OU installer séparément
cd backend && npm install
cd ../frontend && npm install
\`\`\`

### 2. Configurer la clé API Gemini

1. Obtenez une clé API Google Gemini gratuitement : https://ai.google.dev/
2. Ouvrez `backend/.env`
3. Ajoutez votre clé :

\`\`\`env
GEMINI_API_KEY=votre_cle_api_ici
\`\`\`

### 3. Initialiser la base de données

\`\`\`bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
cd ..
\`\`\`

### 4. Lancer l'application

\`\`\`bash
# Lancer backend + frontend simultanément
npm run dev
\`\`\`

**L'application sera disponible à :**
- Frontend : http://localhost:5173
- Backend API : http://localhost:3001

### 5. Créer votre premier logement

1. Accédez à http://localhost:5173
2. Cliquez sur "Connexion Hôte"
3. Créez un compte
4. Ajoutez votre premier logement
5. Scannez le QR code généré avec votre téléphone !

---

## ⚠️ Problèmes courants

### "Cannot find module '@prisma/client'"

\`\`\`bash
cd backend
npx prisma generate
\`\`\`

### "Port 3001 already in use"

Changez le port dans `backend/.env` :
\`\`\`env
PORT=3002
\`\`\`

### Gemini API ne fonctionne pas

Vérifiez que :
1. Vous avez bien ajouté votre clé API dans `backend/.env`
2. La clé est valide et active
3. Vous avez activé l'API Gemini dans Google Cloud Console

---

## 🔧 Configuration avancée

### Utiliser PostgreSQL au lieu de SQLite

1. Modifiez `backend/prisma/schema.prisma` :

\`\`\`prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
\`\`\`

2. Ajoutez l'URL de votre base dans `backend/.env` :

\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/oulia"
\`\`\`

3. Relancez les migrations :

\`\`\`bash
cd backend
npx prisma migrate dev
\`\`\`

---

Besoin d'aide ? Ouvrez une issue sur GitHub !
