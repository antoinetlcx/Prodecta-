# 🏡 Oulia - Assistant IA pour Hébergements Touristiques

**Oulia** est une application universelle et intelligente pour les hôtes Airbnb, hôtels, chambres d'hôtes et locations saisonnières. Elle remplace le livret d'accueil traditionnel par un assistant IA multimodal, accessible via QR code ou lien.

---

## ✨ Fonctionnalités

### 🧑‍💼 Espace Hôte (Admin)

- **Gestion de logements** : Créez et gérez plusieurs propriétés
- **Base de connaissances** : Uploadez documents, photos, vidéos
- **Prompt Builder** : Personnalisez le ton et la personnalité de l'IA
- **Services payants/inclus** : Configurez petit-déjeuner, spa, activités, etc.
- **Check-in intelligent** : Créez des guides d'arrivée interactifs
- **Tableau de bord analytique** : Questions fréquentes, langues, satisfaction
- **Alertes automatiques** : Notifications des problèmes signalés
- **QR Code généré** : Un QR code unique par logement

### 🏡 Espace Voyageur (Client)

- **Chatbot Oulia multimodal** : Comprend texte, voix et images
- **Check-in guidé** : Guidage vocal jusqu'à l'entrée
- **Conciergerie intégrée** : Réservation de services et recommandations locales
- **Déclaration de problèmes** : Signalement instantané à l'hôte
- **Traduction en temps réel** : Support multilingue automatique
- **Interaction naturelle** : Conversation fluide 24/7

---

## 🛠️ Stack Technique

### Backend
- **Node.js** + **Express**
- **Prisma ORM** (SQLite en dev, PostgreSQL en prod)
- **Google Gemini API** (IA multimodale)
- **JWT** pour l'authentification
- **QRCode** pour la génération de codes

### Frontend
- **React** + **Vite**
- **TailwindCSS** pour le style
- **React Router** pour la navigation
- **Axios** pour les appels API
- **Web Speech API** pour la reconnaissance vocale

---

## 🚀 Installation

### Prérequis

- Node.js 18+ et npm
- Une clé API Google Gemini ([obtenir ici](https://ai.google.dev/))

### 1. Cloner le dépôt

\`\`\`bash
git clone https://github.com/votre-repo/oulia.git
cd oulia
\`\`\`

### 2. Installer les dépendances

\`\`\`bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
\`\`\`

### 3. Configurer l'environnement

\`\`\`bash
cp backend/.env.example backend/.env
\`\`\`

Modifiez `backend/.env` et ajoutez votre clé API Gemini :

\`\`\`env
GEMINI_API_KEY=votre_cle_api_ici
JWT_SECRET=votre_secret_jwt
\`\`\`

### 4. Initialiser la base de données

\`\`\`bash
cd backend
npx prisma migrate dev
npx prisma generate
cd ..
\`\`\`

### 5. Lancer l'application

**Mode développement** (backend + frontend) :

\`\`\`bash
npm run dev
\`\`\`

**OU séparément** :

\`\`\`bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
\`\`\`

L'application sera accessible à :
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3001

---

## 📖 Utilisation

### Créer un compte hôte

1. Accédez à http://localhost:5173/admin/login
2. Cliquez sur "Créer un compte"
3. Remplissez vos informations

### Créer un logement

1. Connectez-vous à votre dashboard
2. Cliquez sur "Nouveau logement"
3. Remplissez les informations (nom, adresse, etc.)
4. Personnalisez l'assistant IA (ton, personnalité)

### Accès voyageur

1. Scannez le QR code généré OU
2. Ouvrez le lien d'accès direct
3. Entrez votre prénom
4. Commencez à discuter avec Oulia !

---

## 🧪 Développement

### Structure du projet

\`\`\`
oulia/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration (DB, Gemini)
│   │   ├── controllers/     # Logique métier
│   │   ├── routes/          # Routes API
│   │   ├── services/        # Services (Gemini, etc.)
│   │   ├── middleware/      # Auth, etc.
│   │   └── server.js        # Point d'entrée
│   ├── prisma/
│   │   └── schema.prisma    # Schéma de base de données
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Composants réutilisables
│   │   ├── pages/           # Pages (Admin + Client)
│   │   ├── services/        # Appels API
│   │   └── App.jsx          # Router principal
│   └── package.json
└── package.json             # Workspace racine
\`\`\`

### Scripts disponibles

\`\`\`bash
# Lancer en développement
npm run dev

# Build pour production
npm run build

# Lancer en production
npm start

# Accéder à Prisma Studio (GUI DB)
npm run prisma:studio
\`\`\`

---

## 🔑 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Profil utilisateur (protégé)

### Logements
- `POST /api/properties` - Créer un logement (protégé)
- `GET /api/properties` - Liste des logements (protégé)
- `GET /api/properties/:id` - Détails d'un logement (protégé)
- `PUT /api/properties/:id` - Modifier un logement (protégé)
- `DELETE /api/properties/:id` - Supprimer un logement (protégé)
- `GET /api/properties/public/:propertyId` - Info publique (voyageurs)

### Chat
- `POST /api/chat/conversations/:propertyId` - Créer une conversation
- `POST /api/chat/conversations/:conversationId/messages` - Envoyer un message
- `GET /api/chat/conversations/:conversationId` - Historique
- `POST /api/chat/translate` - Traduire un texte
- `POST /api/chat/issues/:propertyId` - Signaler un problème

---

## 🌐 Déploiement

### Backend (Railway, Render, Heroku)

1. Créer un projet sur la plateforme
2. Connecter votre dépôt Git
3. Configurer les variables d'environnement :
   - `GEMINI_API_KEY`
   - `JWT_SECRET`
   - `DATABASE_URL` (si PostgreSQL)
4. Déployer

### Frontend (Vercel, Netlify)

1. Connecter votre dépôt
2. Dossier racine : `frontend`
3. Build command : `npm run build`
4. Output directory : `dist`
5. Variable d'environnement : `VITE_API_URL`

---

## 🤝 Contribuer

Les contributions sont les bienvenues ! Ouvrez une issue ou une pull request.

---

## 📝 Licence

MIT License - Voir [LICENSE](LICENSE)

---

## 🙏 Crédits

- **IA** : Google Gemini
- **Framework** : React, Express, Prisma
- **UI** : TailwindCSS, Radix UI

---

**Développé avec ❤️ pour révolutionner l'accueil touristique**
