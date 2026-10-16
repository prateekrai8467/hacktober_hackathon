# SENTINEL Team Collaboration Guide 🚀

Welcome to the SENTINEL repository! Since we are building a dual-sided platform (a public/civilian interface and an internal command/organization interface) in the same React codebase, we need to stay out of each other's way to avoid Git merge conflicts.

This document outlines our strategy. **Please read this before touching any code.**

---

## 1. The Folder Split (How to Avoid Clashing)

We are both working inside the `terra/frontend/` folder. We are using **React Router** to serve two different experiences from the exact same app.

I have scaffolded dedicated folders for each of us inside `frontend/src/`. 

### Developer A (Civilian / Public Interface)
Your designated workspace:
*   `frontend/src/pages/Civilian/` -> Build your full-page layouts here (e.g. `CivilianDashboard.jsx`, `LandingPage.jsx`).
*   `frontend/src/components/Civilian/` -> Build custom components that only the public uses here.

### Developer B (Organization / Command Interface)
My designated workspace:
*   `frontend/src/pages/Organization/` -> Build the heavy intel dashboards here (e.g. `CommandCenter.jsx`).
*   `frontend/src/components/Organization/` -> Build custom components that only orgs use here.

### Shared Resources (Touch Carefully!)
We both have access to the heavy lifting we already built. If you need a map, a chart, or the AI report panel, *do not rebuild it*. Import it from:
*   `frontend/src/modules/` -> The 13 complex SENTINEL widgets (DamageMap, EventSidebar, AssessMyArea, etc).
*   `frontend/src/store.js` -> Our shared Zustand state.
*   `frontend/src/index.css` -> The global "Vapor Clinic" Tailwind CSS tokens.

---

## 2. The Git Workflow (Crucial!)

We are working in a **Monorepo**. If we both edit `App.jsx` at the exact same time without talking, we will get a merge conflict.

Follow these rules:

1.  **Never push directly to `main`.**
2.  When you want to build a feature, create a new branch: 
    *   `git checkout -b feature/civilian-landing-page`
3.  Do your work inside your designated folder (`src/pages/Civilian/`).
4.  Commit your work: `git commit -m "added civilian landing page"`
5.  Push your branch: `git push origin feature/civilian-landing-page`
6.  Open a **Pull Request (PR)** on GitHub and ask me to review it.

### If you need to edit `App.jsx`
`App.jsx` is the only file we will both need to touch (to add new `<Route />` paths for our pages). 
*   Before you edit `App.jsx`, run `git pull origin main` to make sure you have the latest code.
*   Add your route.
*   Commit and push immediately to avoid clashing. 

---

## 3. The Backend (Python)

All the API endpoints, database connections, and AI integrations (Groq/Gemini) live in `terra/backend/`.

**You do not need to touch the backend code.** 
When you need to fetch data (like the live events or to submit a ground truth photo), just run the backend locally while you test:
```bash
cd terra/backend
python -m uvicorn main:app --reload --port 8000
```
Then your React components can hit `http://localhost:8000/api/...` without issue.

---

## Next Steps for You:
1.  Clone this repository to your machine.
2.  Run `npm install` inside `frontend/`.
3.  Check out a new branch (`git checkout -b feature/civilian-init`).
4.  Navigate to `frontend/src/pages/Civilian/` and create your first page!
