# Speaking Practice

A local-first "Monkeytype for speaking" MVP. The app helps you generate a prompt, record a speaking rep, take notes while you respond, self-rate with Likert scales, watch the recording back, ask Gemini for coaching, and save sessions locally for review.

## Completed local-first spec

- Random prompts across warmup, storytelling, values, hypotheticals, improv, debate, explain-clearly, interview, YC/startup, current-event, and leadership categories.
- Custom topic/event prompts such as YC interview prep, date conversation practice, or a recent launch/event.
- Browser camera/microphone recording with watchback.
- Live notes while recording or reviewing.
- Likert self-ratings, including depth and substance so shallow answers can be flagged.
- Gemini analysis of delivery and substance when `GEMINI_API_KEY` is configured.
- Local fallback analysis when Gemini credentials are absent.
- IndexedDB storage for recordings, notes, ratings, and AI feedback.
- Saved-session playback, redo prompt, and "use as reference" comparison flow.

## Run locally

```bash
npm install
npm run dev
```

Create `.env` from `.env.example` and set `GEMINI_API_KEY` to enable Gemini analysis.

## Checks

```bash
npm run typecheck
npm run lint
npm run test:e2e
npm run build
```

## Current limitations

This is complete for the local-first MVP spec, but not a hosted multi-user product. Cloud auth, encrypted cloud storage, cross-device sync, team sharing, transcript timelines, and production privacy/compliance controls are intentionally outside this local MVP.
