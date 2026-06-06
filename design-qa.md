# Design QA - Prodecta Sales Pilot

## Cible Produit

Dashboard commercial connecté pour Prodecta : Google Calendar, Google Tasks, Gmail, Airtable, bibliothèque commerciale et conseils locaux.

## Checklist QA

- Desktop et mobile sans débordement horizontal.
- Navigation : Dashboard, RDV, Relances, Prospects, Gmail, Tâches, Bibliothèque, Connexions.
- Dashboard comme écran par défaut.
- Connexions avec états connecté, non configuré, permissions insuffisantes et OpenAI optionnel.
- Aucun bouton micro, live, WebRTC, transcription ou capture audio.
- Création de brouillon Gmail uniquement, sans envoi automatique.
- Tokens et secrets stockés côté serveur local ou variables d'environnement, jamais en `localStorage`.
- L'application reste utilisable sans `OPENAI_API_KEY`.
