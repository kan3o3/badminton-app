# バドミントン組み合わせ

PWA for managing badminton practice sessions — match generation, player queuing, scoring, and history.

## Commands

```bash
npm run dev      # Dev server (HMR)
npm run build    # tsc -b && vite build (type-check then bundle)
npm run lint     # ESLint flat config
npm run preview  # Preview production build
```

## Stack

React 19 · React Router v7 (HashRouter) · Zustand 5 · Tailwind CSS v4 · Vite 8 · TypeScript 6 · PWA (vite-plugin-pwa)

## Architecture

```
src/
  pages/          # Route targets: HomePage, PlayersPage, SettingsPage, HistoryPage
  components/
    courts/       # CourtCard (timer, scores, swap), ScoreInput, TimerDisplay
    players/      # PlayerCard, PlayerList, PlayerForm, PairSection, StatusBadge
    history/      # MatchHistoryCard, RankingTable
    common/       # Button, Modal, ConfirmDialog
    layout/       # BottomNav
  store/
    slices/       # playerSlice, courtSlice, matchSlice, historySlice, pairSlice
    useAppStore.ts  # Zustand composition, persisted to localStorage key "badminton-app-v1"
  utils/
    combinations.ts  # Match generation algorithm (50 attempts, penalty scoring)
    scoring.ts       # Player stats aggregation
  hooks/
    useTimer.ts   # RAF-based delta timer
    useStats.ts   # Player stats
  types/index.ts  # All domain interfaces
  constants/index.ts  # Penalty weights for match generation
```

## Match Generation Algorithm

`utils/combinations.ts` — `generateMatchAssignments()` runs 50 attempts per court and picks lowest-penalty assignment. Penalties: teammate repeat (100), opponent repeat (50), rank imbalance (80 × diff²), skip penalty (20 × avgIdx). Constants in `constants/index.ts`.

## Gotchas

- **HashRouter**: Routes are `/#/home`, `/#/players`, etc. — intentional for static hosting.
- **Zustand persist version 5**: Store key is `badminton-app-v1`. Version changes require migration logic or old localStorage data becomes stale.
- **`finalizeMatch()` side effect**: Returns both teams to `waitingQueue` — caller must invoke `generateMatches()` separately to start the next round.
- **Per-court format**: `courtFormats[]` overrides global `format` per court. `CourtCard` falls back to global format if slot is unset.
- **dnd-kit installed but unused**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` are in dependencies but not integrated yet.
- **Match auto-finalize**: Generating a new round while matches are active closes them with their current scores.
- **`initWaitingQueue()`**: Syncs queue from `active`-status players only; called on every player status change.
