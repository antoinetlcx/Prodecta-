# Prodecta Sales Pilot

Prodecta Sales Pilot est un dashboard commercial connecté à Google Calendar, Google Tasks, Gmail et Airtable.
Il aide à préparer les rendez-vous, prioriser les relances, structurer les actions commerciales et accéder à une bibliothèque de vente spécialisée Prodecta.

L'application reste locale, mono-utilisateur et utilisable sans `OPENAI_API_KEY`.

## Installation

```bash
npm install
cp .env.example .env.local
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## Variables D'environnement

Les secrets restent dans `.env.local`, hors Git.

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` : OAuth local Google.
- `GOOGLE_ACCESS_TOKEN`, `GOOGLE_REFRESH_TOKEN` : optionnels pour tester sans OAuth.
- `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_BASE_NAME` : connexion CRM Airtable Prodecta.
- `OPENAI_API_KEY`, `OPENAI_TEXT_MODEL` : optionnels pour les générations avancées.

Le scope OAuth Google inclut Calendar, Gmail compose/read et Google Tasks.

## Modules

- Dashboard : RDV, tâches, relances, prospects chauds, échanges Gmail et conseils rule-based.
- RDV : import Calendar, fiche de préparation, création de RDV de relance.
- Relances : templates locaux, brouillons Gmail, copie/export.
- Prospects : vue CRM Airtable, prochaines actions, tâches liées.
- Gmail : recherche d'échanges et création de brouillons uniquement.
- Tâches : lecture, création et clôture Google Tasks avec fallback démo.
- Bibliothèque : méthodes, scripts Prodecta, secteurs, objections et exercices.
- Connexions : statut Calendar, Gmail, Google Tasks, Airtable et OpenAI optionnel.

## OpenAI Optionnel

Sans OpenAI, l'app utilise des templates locaux et un moteur de conseils rule-based.
Avec OpenAI configuré, les routes texte existantes peuvent enrichir les préparations, relances et stratégies.

## Hors Scope V1

Cette version ne contient pas d'écoute active, d'audio, de micro, de WebRTC, de transcription, de coaching live ou de talk ratio automatique.

## Vérification

```bash
npm run lint
npm run test
npm run build
```
