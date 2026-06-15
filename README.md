# Simulateur Prodecta

Application React/Vite pour composer une offre commerciale Prodecta multi-biens, calculer les frais de création, l'abonnement mensuel, le total de démarrage et générer des exports de devis.

## Scripts

- `npm run dev` : lance le simulateur en local.
- `npm run build` : compile la version de production.
- `npm run build:share` : compile une version statique partageable dans `dist/`.
- `npm run preview` : sert le build localement.

## Structure

- `src/data/pricingConfig.js` : secteurs, tranches historiques, modules commerciaux et presets d'abonnement.
- `src/lib/pricing.js` : moteur centralisé de calcul des prix, avec biens détaillés et modules par bien.
- `src/lib/quoteStorage.js` : persistance des devis dans `localStorage`.
- `src/lib/exportQuote.js` : exports PDF, JSON et CSV.
- `src/components/` : composants UI séparés pour la fiche devis, les modules, le résumé, les conditions et la bibliothèque.

L'export JSON est structuré pour faciliter une ressaisie dans Qonto ou une future intégration API, sans déclencher d'intégration automatique.

## Partage équipe

1. Lancer `npm run build:share`.
2. Envoyer le dossier `dist/` ou l'archive générée.
3. Pour tester la version compilée en local : `npm run preview`.

La version partagée fonctionne en statique et conserve les devis dans le `localStorage` du navigateur de chaque membre de l'équipe.
