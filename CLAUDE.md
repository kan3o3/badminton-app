# バドミントン組み合わせ

PWA for managing badminton practice sessions — match generation, player queuing, scoring, and history.

## Commands

```bash
npm run dev      # Dev server (HMR)
npm run dev -- --host  # LAN公開（スマホからアクセス可能、デフォルトポート5173）
npm run build    # tsc -b && vite build (type-check then bundle)
npm run lint     # ESLint flat config
npm run preview  # Preview production build
```

## Deployment

GitHub Pages: https://kan3o3.github.io/badminton-app/
`master` ブランチへの push で GitHub Actions が自動ビルド・デプロイする（`.github/workflows/deploy.yml`）。
`vite.config.ts` の `base: '/badminton-app/'` が必須。

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
    matches/      # WaitingList
    common/       # Button, Modal, ConfirmDialog
    layout/       # BottomNav
  store/
    slices/       # playerSlice, courtSlice, matchSlice, historySlice, pairSlice
    useAppStore.ts  # Zustand composition, persisted to localStorage key "badminton-app-v1"
  utils/
    combinations.ts  # Match generation algorithm (50 attempts, penalty scoring)
    scoring.ts       # Player stats aggregation
    id.ts            # UUID生成（非セキュアコンテキスト対応フォールバック付き）
    sharing.ts       # 試合結果・ランキングのテキスト共有生成
  hooks/
    useTimer.ts   # RAF-based delta timer
    useStats.ts   # Player stats
  types/index.ts  # All domain interfaces
  constants/index.ts  # Penalty weights for match generation
```

## Match Generation Algorithm

`utils/combinations.ts` — `generateMatchAssignments()` runs 50 attempts per court and picks lowest-penalty assignment. Penalties: teammate repeat (100), opponent repeat (50), rank imbalance (80 × diff²), skip penalty (20 × avgIdx). Constants in `constants/index.ts`.

## Gotchas

- **`crypto.randomUUID()` はHTTPで動作しない**: スマホから `http://` LAN IPでアクセスする場合、非セキュアコンテキストとして拒否される。`src/utils/id.ts` の `generateId()` が `Math.random()` フォールバックで対応。
- **HashRouter**: Routes are `/#/home`, `/#/players`, etc. — intentional for static hosting.
- **Zustand persist version 5**: Store key is `badminton-app-v1`. Version changes require migration logic or old localStorage data becomes stale.
- **`finalizeMatch()` side effect**: Returns both teams to `waitingQueue` — caller must invoke `generateMatches()` separately to start the next round.
- **Per-court format**: `courtFormats[]` overrides global `format` per court. `CourtCard` falls back to global format if slot is unset.
- **dnd-kit installed but unused**: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` are in dependencies but not integrated yet.
- **Match auto-finalize**: Generating a new round while matches are active closes them with their current scores.
- **`initWaitingQueue()`**: Syncs queue from `active`-status players only; called on every player status change.
- **固定ペア制約の動作**: `constrainedSplitDoubles()` はペアの両メンバーが候補プールに存在する場合のみ同サイドに固定する。`generateMatchAssignments()` の試みループでは、固定ペアが検出された場合に両メンバーを全50回の試みに強制包含することで確実に同サイド配置を保証する。
