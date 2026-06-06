# Prodecta Sales Pilot

Prototype local d'aide commerciale IA pour preparer, piloter, analyser et relancer les rendez-vous Prodecta.

## Demarrage

```bash
npm install
cp .env.example .env.local
npm run dev
```

Puis ouvrir `http://localhost:3000`.

Sans `OPENAI_API_KEY`, l'application reste utilisable en mode demo local. Avec une cle OpenAI, les routes API utilisent les modeles configurables :

- `OPENAI_TEXT_MODEL`, defaut `gpt-5.5`
- `OPENAI_TRANSCRIBE_MODEL`, defaut `gpt-4o-transcribe-diarize`

## Modules

- Call Copilot : cockpit manuel pendant RDV, objections, signaux, biais psychologiques, ecoute active et talk ratio.
- Preparation RDV : angle commercial, questions, objections probables, leviers, opening et closing.
- Analyse RDV : audio/transcript/notes, rapport commercial en 15 sections, strategie prix, mail et relances.
- Relance Lab : diagnostic, canal, timing, email, SMS, LinkedIn et versions de pression.
- Objection & prix : traitement d'objection, negociation, regles de concession.
- Bibliotheque : SPIN, Sandler, Challenger, Cialdini, JTBD, HBR et questions par secteur.

## Verification

```bash
npm run lint
npm run test
npm run build
```

Les captures QA sont dans `qa-desktop.png` et `qa-mobile.png`. La reference visuelle choisie est `reference-timeline-commerciale.png`.
