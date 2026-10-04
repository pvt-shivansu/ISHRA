# ISHRA — Personalized AI-Based Student Learning Platform

Tagline: **Your Learning. Your Pace. Your AI.**

## What is included
- Smooth animated Login → Academic Profile → Welcome → Dashboard transitions.
- Animated language and upload modals.
- B-10 CSE-AI weekly timetable based on the supplied college timetable.
- Dashboard cards for **Last Class / Current Class / Upcoming Class** with live time-based updates.
- Calendar button opens the complete day-wise weekly planner.
- 5th Saturday follows Monday's timetable, as specified by the college timetable.
- Subjects → Units → Topics flow from Supabase.
- Every topic has an **Ask ISHRA** logo action before **Mark Complete**.
- Topic mode locks Subject → Unit → Topic context into the AI conversation.
- AI receives recent chat history, so follow-up questions retain context.
- Quick topic actions: Explain Topic, Important Points, Give Questions, Start Quiz.
- Markdown-like AI formatting with headings, bullets, bold text and code styling.
- Class Materials section for board photos, notes, PDFs and documents.
- Uploaded material metadata is stored locally and file blobs use IndexedDB for persistence in the browser.
- Material can be opened/downloaded or sent to ISHRA with its subject/topic context.
- Student topic progress and overall/subject progress remain connected to Supabase.
- Dark/light theme support and responsive mobile layout.

## Run

### Frontend
```bash
npm install
npm run dev
```

### AI server
```bash
node server.js
```

The frontend expects the AI server at:
`http://localhost:3001`

## Environment
Copy `.env.example` to `.env` and add your existing Supabase/Gemini/Groq/ElevenLabs keys. Never publish `.env`.

## Note
The college timetable used in this version is the supplied B-10 (CSE-AI) Odd Semester 2026-27 timetable. Room information is intentionally not shown in the dashboard/planner UI.
