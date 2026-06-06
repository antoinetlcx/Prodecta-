# Design QA - Prodecta Sales Pilot

final result: passed

## Reference

- Selected concept: Timeline Commerciale.
- Reference image: `reference-timeline-commerciale.png`.
- Implemented app URL during QA: `http://localhost:3000`.

## Checks

- Desktop viewport `1440 x 1024`: passed.
- Mobile viewport `390 x 844`: passed.
- Console errors: none.
- Horizontal overflow: none on desktop and mobile.
- Core first-screen content: Timeline Commerciale, Call Copilot, Objections & signaux, Biais psychologiques, Ecoute active.
- Basic interactions: selecting a signal and moving to the next step both work.
- Local data controls: export/delete implemented on Accueil.
- Compliance controls: consent status, mode without recording, audio not retained after transcription.

## Screenshots

- Desktop: `qa-desktop.png`.
- Mobile: `qa-mobile.png`.

## Notes

- The build intentionally sets `experimental.cpus = 1` and `staticGenerationMaxConcurrency = 1` because this local machine hit an `EAGAIN` worker-spawn limit during `next build`.
- The V1 implements live coaching as a manual cockpit with active listening markers. Real microphone streaming is prepared as the next phase through the Realtime API, not enabled in this prototype.
- Remaining P3 polish: the desktop implementation is slightly more spacious than the generated concept, but it preserves the selected hierarchy and improves readability for the added psychological coaching panel.
