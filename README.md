# HostelLink Kanban

A single shared, no-auth Kanban board for the HostelLink dev team.
Four columns — **Backlog → Pending → QA → UAT** — with drag-and-drop task cards
persisted to MongoDB Atlas.

Each card holds: **title**, short **description**, **assignee**, and **deadline**.

## Setup

```bash
npm install
cp .env.example .env      # then fill in MONGODB_URI
npm run dev               # http://localhost:3100
```

### Environment

Only one variable is required — put it in `.env`:

```
MONGODB_URI=mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/hostellink_kanban
```

Include the **database name** in the path (e.g. `/hostellink_kanban`). The app
uses a single `tasks` collection, created automatically on first write.

## Usage

- **Add a task:** click the **+** on any column.
- **Edit / delete:** click a card to open it.
- **Move:** drag cards within a column to reorder, or across columns to change
  status. Changes save automatically (optimistic — reverts on error).

The board is shared and has no accounts. It doesn't live-sync between browsers —
refresh to pull other people's changes.

## Adding team members

Edit `src/config/members.js`:

```js
export const MEMBERS = ["Rehan", "Ali", "Sara", "NewPerson"];
```

The assignee dropdown reads from this list.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3100 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

## Tech

Next.js 15 (App Router, JavaScript) · React 19 · Tailwind CSS 3 · @dnd-kit ·
MongoDB native driver.
