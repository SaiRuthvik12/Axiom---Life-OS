# Progress Tab Design — The Chronicle

> "What did I actually do with my time?"

This is not a log. It is a record of lived effort.

---

## 1. Concept Overview

### Name: **The Chronicle**

The Progress Tab is called **The Chronicle** — a living archive of the user's journey through the Nexus. It sits alongside Dashboard, The Nexus, Requisitions, and System Core as a fifth primary view.

The Chronicle has three modes, accessible via a segmented control at the top:

| Mode | Metaphor | Purpose |
|------|----------|---------|
| **Day Log** | Mission debriefing | Review a single day's activity |
| **Overview** | Star chart | Scan weeks/months for patterns at a glance |
| **Timeline** | Ship's log | Scroll through major life events chronologically |

### Core Emotional Contract

The Chronicle answers three questions at three time scales:

- **Today**: "Did I show up?"
- **This Month**: "Am I building momentum?"
- **All Time**: "Look how far I've come."

It never asks: "Why did you fail?" It never shows red numbers without context. Every bad day is framed as recoverable. Every recovery is celebrated more than perfection.

---

## 2. Core User Experience Flow

### Entry Point

The user taps **Chronicle** (icon: `ScrollText`) in the sidebar navigation. It opens to **today's Day Log** by default.

### Navigation Model

```
┌─────────────────────────────────────────┐
│  [Day Log]   [Overview]   [Timeline]    │  ← Segmented control
├─────────────────────────────────────────┤
│                                         │
│         (Active mode content)           │
│                                         │
└─────────────────────────────────────────┘
```

### State Persistence

When the user navigates away and returns, the Chronicle remembers:
- Which mode was active
- Which date was selected in Day Log
- Scroll position in Timeline

### First-Time Experience

On first visit (< 3 days of data), the Chronicle shows a warm empty state:

> *"Your Chronicle is just beginning. Every day you show up here, a new page is written. Check back after a few days to see your story take shape."*

No empty tables. No zero-state dashboards. Just a sentence and a soft glow.

---

## 3. Data Architecture

### New Database Table: `daily_logs`

This is the persistence backbone. One row per user per day, written at end-of-day or on next login.

```sql
CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL,

  -- Quest activity
  quests_completed INTEGER DEFAULT 0,
  quests_pending INTEGER DEFAULT 0,
  quest_titles TEXT[] DEFAULT '{}',
  quest_types TEXT[] DEFAULT '{}',           -- ['DAILY', 'DAILY', 'WEEKLY']
  stats_touched TEXT[] DEFAULT '{}',         -- ['physical', 'cognitive']

  -- Economy
  xp_earned INTEGER DEFAULT 0,
  xp_lost INTEGER DEFAULT 0,                -- From penalties
  credits_earned INTEGER DEFAULT 0,
  credits_spent INTEGER DEFAULT 0,

  -- Player snapshot (end of day)
  player_level INTEGER,
  total_xp INTEGER,
  streak_count INTEGER,

  -- World snapshot (end of day)
  world_snapshot JSONB,                      -- Compact: { districts: [{id, vitality, condition}], era, structuresBuilt }

  -- Events that occurred this day
  world_events JSONB DEFAULT '[]',           -- Array of {type, title, districtId}

  -- AI-generated narrative (lazy-loaded, written by Gemini)
  narrative_summary TEXT,

  -- Classification (computed)
  day_rating TEXT DEFAULT 'neutral',         -- 'strong' | 'steady' | 'neutral' | 'light' | 'recovery' | 'absent'

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, log_date)
);

-- Index for fast calendar queries
CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, log_date DESC);

-- RLS
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own logs"
  ON daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own logs"
  ON daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own logs"
  ON daily_logs FOR UPDATE USING (auth.uid() = user_id);
```

### Day Rating Classification

Each day is classified by a simple heuristic (computed in the engine, stored for fast rendering):

| Rating | Condition | Visual |
|--------|-----------|--------|
| `strong` | 3+ quests completed, no penalties, positive world events | Bright violet pulse |
| `steady` | 1-2 quests completed, stable world | Soft violet |
| `neutral` | Some activity, no quests completed | Dim gray |
| `light` | Logged in but minimal activity | Faint dot |
| `recovery` | Completed quests after previous `absent`/`light` days | Amber glow |
| `absent` | No login or no activity | Empty (no mark) |

The `recovery` classification is key — it's the only system that explicitly rewards coming back after a lapse, which most habit trackers ignore entirely.

### Integration Points

**When a quest is completed** (`toggleQuestStatus` in App.tsx):
- Increment the current day's `daily_logs` row (upsert)
- Append quest title/type to arrays
- Update XP/credit deltas

**When decay runs** (`processDecay`):
- Snapshot world state into today's log
- Record any decay/recovery events

**On daily first login** (`fetchData`):
- Finalize yesterday's log if incomplete
- Create today's log row
- Trigger narrative generation for yesterday (background, via Gemini)

---

## 4. Daily View Design — "Mission Debrief"

### Layout

The Day Log fills the content area with a date selector at top and a vertically scrolling card-based layout below.

```
┌─────────────────────────────────────────────┐
│  ◀  February 13, 2026  ▶    [Today]        │  ← Date nav
├─────────────────────────────────────────────┤
│                                             │
│  ┌─ NARRATIVE CARD ──────────────────────┐  │
│  │  "A steady day at the Nexus. You      │  │
│  │   kept the Forge burning and pushed   │  │
│  │   the Archive forward. Kael noticed." │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─ DIRECTIVES ──────────────────────────┐  │
│  │  ✓ Morning Run Protocol     +80 XP    │  │
│  │  ✓ Deep Work: Chapter 5     +120 XP   │  │
│  │  ○ Budget Review            (missed)  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─ ECONOMY ─────────────────────────────┐  │
│  │  XP: +200  ◆  Credits: +60           │  │
│  │  Level: 7   ◆  Streak: 12 days       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─ NEXUS IMPACT ────────────────────────┐  │
│  │  The Forge    ████████░░  78%  (+5)   │  │
│  │  The Archive  ██████████  92%  (+8)   │  │
│  │  The Sanctum  ████░░░░░░  38%  (-3)   │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌─ WORLD EVENTS ────────────────────────┐  │
│  │  ◇ Kael nods approvingly             │  │
│  │  ◇ Archive vitality recovered        │  │
│  └───────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Date Navigator
- Left/right chevrons to move between days
- "Today" pill button to jump back
- Day-of-week label (e.g., "Thursday")
- Day rating badge shown next to date (colored dot)
- Cannot navigate to future dates
- Swipe gesture support on mobile

#### 2. Narrative Card (Top Priority)
This is the emotional anchor of the Day Log. A 2-3 sentence AI-generated summary in the voice of the Game Master.

**Examples:**

*Strong day:*
> "A formidable showing, Operative. Three protocols executed without hesitation. The Forge burns bright, and Kael's respect deepens. This is the kind of day that builds empires."

*Recovery day:*
> "You returned. That matters more than you think. The Archive's lights flickered back on today — fragile, but alive. Lyra was waiting."

*Light day:*
> "A quiet day in the Nexus. Sometimes the frontier needs rest. The structures hold steady."

*Absent day (viewed retroactively):*
> "The Nexus waited. Dust gathered on the Forge floor. But the foundations held. They're still here."

**Key rule:** The narrative NEVER shames. Even for absent days, the tone is melancholic, not accusatory. It frames absence as a pause, not a failure.

**Generation:** Narratives are generated lazily — when the user first views a past day that doesn't have one yet. Uses the existing `geminiService.ts` pattern. Cached in `daily_logs.narrative_summary`.

#### 3. Directives Summary
- Shows quest titles with completion status
- Completed quests show XP earned in green
- Missed quests show "(missed)" in muted gray — NOT red
- Quest type badges (DAILY/WEEKLY/EPIC) inline
- Tapping a quest shows its full details (reuse existing Quest Details modal)

#### 4. Economy Bar
- Horizontal bar showing XP earned, credits earned, level, streak
- Uses existing stat badge visual language
- If XP was lost to penalties, shows net: "+200 XP (−30 penalty)" in muted text
- If the user leveled up this day: special "LEVEL UP" badge with accent glow

#### 5. Nexus Impact
- Mini vitality bars for each unlocked district
- Shows delta from previous day: (+5), (-3), (=)
- Color-coded by district (existing `color` field from DistrictDefinition)
- Districts that improved glow softly; districts that decayed are muted (NOT red)
- Tapping a district opens the full District Card (reuse from WorldView)

#### 6. World Events
- Chronological list of events from that day (from `world_events` in the log)
- Uses the existing event type icons: UNLOCK → key, DECAY → wind, RECOVERY → sun, etc.
- Compact format: icon + one-line title
- No "isRead" tracking needed here (it's historical)

### Visual Identity

The Day Log uses a distinct visual treatment to feel like a "page" rather than a dashboard:

- Subtle parchment-like background: `bg-axiom-900/80` with a soft top-to-bottom gradient
- Each card has extra padding and breathing room
- Font for narrative: slightly larger, `text-sm leading-relaxed` (compared to normal `text-xs`)
- Cards have a soft inner shadow rather than a hard border
- The overall feel: calm, spacious, reflective

### Empty State (For Days with No Data)

For days before the user started, or days with no data:

> *"No records for this date. Your Chronicle begins on [foundedAt date]."*

---

## 5. Calendar Overview Design — "Star Chart"

### Purpose

The calendar is for scanning. The user should understand their month in under 5 seconds — not by reading numbers, but by seeing patterns of color and intensity.

### Layout

```
┌─────────────────────────────────────────────┐
│       ◀   February 2026   ▶                 │
├─────────────────────────────────────────────┤
│  Mon  Tue  Wed  Thu  Fri  Sat  Sun          │
│                                             │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐       │
│  │▓▓│ │▓▓│ │▓▓│ │░░│ │▓▓│ │▓▓│ │  │       │
│  │ 2│ │ 3│ │ 4│ │ 5│ │ 6│ │ 7│ │ 8│       │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘       │
│                                             │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐       │
│  │▓▓│ │▓▓│ │██│ │██│ │██│ │░░│ │  │       │
│  │ 9│ │10│ │11│ │12│ │13│ │14│ │15│       │
│  └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘       │
│                                             │
│  (... more weeks ...)                       │
│                                             │
├─────────────────────────────────────────────┤
│  MONTH PULSE                                │
│  ┌───────────────────────────────────────┐  │
│  │  22 active days  •  4 strong days     │  │
│  │  3 recoveries    •  Avg +180 XP/day   │  │
│  │  Best streak: 9 days (Feb 2-10)       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  STREAK CLUSTERS                            │
│  ┌───────────────────────────────────────┐  │
│  │  ████████████░░░░████████░░████████   │  │
│  │  Feb 2-10       Feb 14-20   Feb 23+   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### Day Cell Design

Each day cell is a 40x40px square (mobile) or 48x48px (desktop). The cell communicates status through:

1. **Fill intensity** (background opacity of `axiom-accent`):
   - `strong` → `bg-violet-500/80` — vivid, full
   - `steady` → `bg-violet-500/40` — solid, clear
   - `neutral` → `bg-violet-500/15` — present but dim
   - `light` → `bg-gray-700/30` — barely there
   - `recovery` → `bg-amber-500/50` — warm amber glow
   - `absent` → transparent — nothing

2. **Border treatment**:
   - Today: `ring-2 ring-axiom-accent`
   - Selected: `ring-1 ring-white`
   - Recovery days: `ring-1 ring-amber-500/50`

3. **Icons (optional, for key events)**:
   - Level up: tiny `↑` in corner
   - Structure built: tiny `⬡` in corner
   - Companion event: tiny `♦` in corner
   - These are 8px marks, barely noticeable individually, but they create texture when scanning the month

4. **No numbers on cells.** No XP counts, no quest counts. Just color and optional micro-icons. Numbers live in the Day Log when you tap a cell.

### Tapping a Day Cell

Tapping a cell switches to the Day Log for that date. Smooth transition — the cell appears to "expand" into the full Day Log view.

### Streak Clusters

Below the calendar grid, a horizontal bar visualizes streak continuity:

```
██████████░░░░░░████████░░░░████████████
```

- Filled segments = consecutive active days
- Gaps = absent days
- Longer bars are more satisfying
- Each cluster is labeled with date range
- Recovery days that start a new cluster get an amber leading edge

This is crucial because "streak numbers" lose meaning fast ("12 days" is abstract), but a visual bar showing dense activity with small gaps is immediately legible and encouraging.

### Month Pulse (Summary)

A compact 2x2 grid of key metrics for the month:

| Metric | Why |
|--------|-----|
| Active days | Shows up rate |
| Strong days | Quality signal |
| Recoveries | Resilience signal |
| Avg XP/day | Growth rate |

These are presented as facts, not judgments. "22 active days" — not "78% adherence rate."

---

## 6. Timeline Mode Design — "Ship's Log"

### Purpose

The Timeline is for long-term identity. It answers: "What have I actually built?" It surfaces major events, not daily minutiae. It should feel like reading a personal history book.

### Visual Design

A vertical timeline with a central spine. Events branch left and right alternately (on desktop). On mobile, all events are on the right with the spine on the left.

```
                    ╔══════════════════════╗
                    ║  YOUR CHRONICLE      ║
                    ║  Founded: Jan 15     ║
                    ║  127 days            ║
                    ╚══════════════════════╝
                              │
              ┌───────────────┤
              │ ERA: EXPANSION│
              │ Level 5+      │
              └───────────────┘
                              │
         ┌────────────────────┤
         │ 🔓 The Sanctum     │
         │ Discovered          │
         │ Jan 28              │
         └─────────────────────┘
                              │
                              ├────────────────────┐
                              │ ⬡ Training Grounds │
                              │ Constructed         │
                              │ Feb 1               │
                              └─────────────────────┘
                              │
         ┌────────────────────┤
         │ 🔥 Phoenix Rising  │
         │ Recovered from     │
         │ critical Forge     │
         │ Feb 8              │
         └─────────────────────┘
                              │
                              ├────────────────────┐
                              │ 📈 7-Day Streak     │
                              │ "Steadfast"          │
                              │ Feb 14               │
                              └─────────────────────┘
                              │
              ┌───────────────┤
              │ ERA: PROSPERITY│
              │ Level 15+      │
              └────────────────┘
                              │
                             ···
```

### Event Categories & Visual Treatment

Each timeline event has a distinct visual identity:

| Category | Icon | Color | Border |
|----------|------|-------|--------|
| Era Transition | `Crown` | Gold | Gold glow, wider card |
| District Unlock | `MapPin` | District color | District-colored left edge |
| Structure Built | `Hammer` | Violet | Standard |
| Companion Joined | `Heart` | Rose | Warm glow |
| Companion Left | `HeartOff` | Muted gray | Dashed border |
| Companion Returned | `HeartHandshake` | Amber | Amber pulse |
| Recovery (district) | `Sunrise` | Amber | Amber left edge |
| Milestone Earned | `Award` | Rarity color | Rarity border |
| Expedition Completed | `Compass` | Cyan | Cyan shimmer |
| Decay Collapse | `Wind` | Gray | Muted, thin |
| Level Up | `ArrowUpCircle` | Violet | Violet glow |
| Streak Milestone | `Zap` | Yellow | Yellow pulse |

### Card Design

Each timeline card contains:
- **Icon** (category-specific)
- **Title** (1 line, bold)
- **Description** (1-2 lines, muted)
- **Date** (relative: "3 weeks ago" + absolute: "Feb 8")
- **Optional: world snapshot thumbnail** (for major events like era transitions)

### Filtering

A horizontal filter bar at the top of the Timeline:

```
[All] [Milestones] [World] [Companions] [Recoveries]
```

Tapping a filter grays out non-matching events but doesn't remove them — maintaining visual continuity while highlighting the selected category.

### Clustering

Events that happened on the same day are grouped into a single node:

```
         ┌────────────────────────┤
         │ February 8 (3 events)  │
         │                        │
         │ ⬡ Sparring Arena Built │
         │ 🔥 Forge Recovered     │
         │ ♦ Kael mood: CONTENT   │
         └─────────────────────────┘
```

### Data Source

Timeline events come from two sources:
1. **World events** (`world_states.state.events`) — already tracked, but capped at 50
2. **Daily logs** (`daily_logs.world_events`) — persistent, uncapped

On Timeline load, events are fetched from `daily_logs` in reverse chronological order, with pagination (load 30 at a time, load more on scroll).

### Era Markers

Era transitions are the most visually prominent events. They span the full width of the timeline and include:
- Era name and description (from `ERA_NAMES`, `ERA_DESCRIPTIONS`)
- A mini world snapshot: number of districts, structures, average vitality
- The player's level at the time

These act as "chapter markers" in the user's story.

---

## 7. World Snapshot Archive — "Then & Now"

### Purpose

The most powerful retention tool in the Chronicle. Users can see their Nexus at any point in time and compare it to now. This answers: "Look what I built."

### Access Point

Two entry points:
1. **From the Day Log**: a "View Nexus Snapshot" button at the bottom of any day's log
2. **From the Timeline**: era transition cards have a "View Nexus at this point" link

### Snapshot Data Model

World snapshots are embedded in `daily_logs.world_snapshot` as compact JSONB:

```typescript
interface CompactWorldSnapshot {
  era: number;
  totalStructuresBuilt: number;
  districts: Array<{
    id: string;
    vitality: number;
    condition: DistrictCondition;
    structuresBuilt: number;    // count of built structures in this district
  }>;
  companionMoods: Record<string, CompanionMood>;
  worldTitle: string;           // "Growing Colony", "Thriving Nexus", etc.
}
```

### Snapshot Viewer

When the user opens a snapshot, they see a simplified version of the WorldView:

```
┌─────────────────────────────────────────────┐
│  NEXUS SNAPSHOT — February 1, 2026          │
│  "Fledgling Settlement" • Era: Foundation   │
│  2 Districts • 3 Structures                 │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─ The Forge ─────────┐ ┌─ The Archive ──┐│
│  │  ████████░░  78%     │ │  ██████░░░░ 55%││
│  │  THRIVING            │ │  STABLE        ││
│  │  1/5 structures      │ │  2/5 structures││
│  │  Kael: CONTENT       │ │  Lyra: NEUTRAL ││
│  └──────────────────────┘ └────────────────┘│
│                                             │
│  ┌─ The Sanctum ───────┐                    │
│  │  [LOCKED - Level 2] │                    │
│  └──────────────────────┘                    │
│                                             │
└─────────────────────────────────────────────┘
```

### Comparison Mode: "Then & Now"

The crown jewel. The user selects two dates and sees them side-by-side (desktop) or stacked (mobile):

```
┌──────────────────┬──────────────────────────┐
│   DAY 1          │   DAY 45                 │
│   Jan 15, 2026   │   Feb 28, 2026           │
│                  │                          │
│   "Uncharted     │   "Thriving Nexus"       │
│    Territory"    │                          │
│                  │                          │
│   Era 1          │   Era 3                  │
│   0 structures   │   14 structures          │
│   2 districts    │   5 districts            │
│                  │                          │
│   Forge: 50%     │   Forge: 92% (+42)       │
│   Archive: 50%   │   Archive: 85% (+35)     │
│                  │   Sanctum: 71%           │
│                  │   Command: 63%           │
│                  │   Vault: 58%             │
│                  │                          │
│   Companions: 2  │   Companions: 5          │
│   Kael, Lyra     │   Kael, Lyra, Sage,      │
│                  │   Vex, Nyx               │
└──────────────────┴──────────────────────────┘
```

**Deltas are shown in green** — every number that's higher than the earlier snapshot. This creates a powerful visual: everything is green. Growth is visible, undeniable, tangible.

### Default Comparison

When opening comparison mode, the default is: **Day 1 vs Today**. This is the most emotionally impactful view. The user can then adjust either date picker.

### Quick Comparisons

Pre-built comparison links:
- "Day 1 vs Today" (default)
- "Last Week vs This Week"
- "30 Days Ago vs Today"
- "My Best Day vs Today"

---

## 8. Identity & Milestone Layer — "Marks of Resilience"

### Philosophy

Milestones in Axiom are not achievements for hitting numbers. They are **markers of behavioral identity**. The existing `MILESTONES` in `world/constants.ts` are good (First Foundation, Phoenix Rising, Steadfast, etc.) but they're structural milestones. The Chronicle adds a new category: **Behavioral Milestones**.

### New Milestone Categories

#### Consistency Milestones
| ID | Name | Description | Condition |
|----|------|-------------|-----------|
| `bm-week-1` | First Week | "Showed up for 7 days." | 7 active days total |
| `bm-week-streak` | Full Week | "7 consecutive active days." | 7-day streak |
| `bm-month-1` | First Month | "One month in the Nexus." | 30 days since founding |
| `bm-month-streak` | Iron Month | "30 consecutive active days." | 30-day streak |

#### Recovery Milestones
| ID | Name | Description | Condition |
|----|------|-------------|-----------|
| `bm-comeback-1` | Second Wind | "Returned after 2+ absent days." | Active after 2+ absent days |
| `bm-comeback-3` | Resilient | "Returned after a week away." | Active after 7+ absent days |
| `bm-recovery-chain` | Unbreakable | "Recovered 5 times. You always come back." | 5 recovery classifications |

#### Balance Milestones
| ID | Name | Description | Condition |
|----|------|-------------|-----------|
| `bm-all-stats` | Renaissance | "Touched all 6 stat categories in one day." | 6 unique stats in one day's quests |
| `bm-balanced-week` | Equilibrium | "Active in 4+ stat areas this week." | 4+ unique stats in a week |

#### Effort-Under-Pressure Milestones
| ID | Name | Description | Condition |
|----|------|-------------|-----------|
| `bm-hard-quest` | Crucible | "Completed your first HARD or EXTREME quest." | Any HARD/EXTREME quest completed |
| `bm-epic-complete` | Saga Writer | "Completed a long-term objective." | First EPIC quest completed |

### Milestone Display

Milestones appear in three places:

1. **Day Log**: When a milestone is earned on a specific day, it appears as a special card with a glow effect at the top of the events section.

2. **Timeline**: Milestones are prominent timeline events with rarity-colored borders.

3. **Milestone Gallery**: A dedicated sub-section accessible from the Chronicle header. Shows all milestones in a grid:
   - Earned milestones: full color with icon and date earned
   - Unearned milestones: silhouetted (grayed out icon, no description, just "???")
   - Rarity border: COMMON (gray), UNCOMMON (green), RARE (violet), LEGENDARY (gold)

### Milestone Gallery Layout

```
┌─────────────────────────────────────────────┐
│  MARKS OF RESILIENCE          12/24 earned  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ 🔨  │ │ 📍  │ │ 🔥  │ │ ⚡  │          │
│  │First│ │Pion-│ │Phoe-│ │Stead│          │
│  │Found│ │eer  │ │nix  │ │fast │          │
│  │Jan15│ │Feb3 │ │Feb8 │ │Feb14│          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
│                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │
│  │ ?   │ │ ?   │ │ ?   │ │ 🌟  │          │
│  │ ??? │ │ ??? │ │ ??? │ │2nd  │          │
│  │     │ │     │ │     │ │Wind │          │
│  │     │ │     │ │     │ │Feb20│          │
│  └─────┘ └─────┘ └─────┘ └─────┘          │
└─────────────────────────────────────────────┘
```

---

## 9. Insight & Pattern System — "Signal Analysis"

### Philosophy

Insights are offered gently, like an advisor whispering observations. They are never demands, never judgments. The UI section header is **"Signal Analysis"** — fitting the sci-fi aesthetic.

### Placement

Signal Analysis lives as a collapsible section at the bottom of the Calendar Overview. It's collapsed by default with a soft prompt: "View Signal Analysis →"

### Insight Cards

Each insight is a small card with an icon, a one-line observation, and an optional one-line detail.

#### Pattern Insights (Always Shown)

```
┌─────────────────────────────────────────────┐
│  SIGNAL ANALYSIS                            │
├─────────────────────────────────────────────┤
│                                             │
│  ◈ Strongest District: The Archive          │
│    Highest avg vitality this month (87%)    │
│                                             │
│  ◈ Growth Area: The Sanctum                 │
│    Least consistent engagement              │
│    (not a judgment — just a signal)         │
│                                             │
│  ◈ Average Pace: +185 XP/day               │
│    Trending up from last month (+22%)       │
│                                             │
│  ◈ Recovery Strength: Strong                │
│    You've bounced back 3 times this month   │
│    Average recovery time: 1.5 days          │
│                                             │
│  ◈ Best Day of Week: Tuesday                │
│    Highest avg quest completion             │
│                                             │
└─────────────────────────────────────────────┘
```

#### Insight Tone Rules

- "Growth Area" — NOT "Weakest stat" or "Neglected area"
- "Trending up" — NOT "You improved by X%"
- "Average recovery time: 1.5 days" — frames recovery as normal, expected
- "Not a judgment — just a signal" — explicit de-escalation for any metric that could feel negative
- Never use red for insight cards
- Never use exclamation marks
- Never compare to other users

#### Weekly AI Summary

Generated by Gemini on Sunday night (or Monday morning on first login). Stored in a new `weekly_summaries` table or appended to the most recent daily_log.

**Format:**

> **Week of Feb 10-16**
>
> "A week of quiet determination. You held the line on physical training — Kael noticed three consecutive Forge days. The Archive had a brief dip mid-week but recovered by Friday. Your strongest pattern: morning sessions completed before noon. The Nexus grew by one structure this week. Steady progress."

**Tone:** Observational, warm, narrative. References companions and districts by name. Highlights positive patterns. Mentions dips only in the context of recovery.

**Generation prompt context:**
- This week's daily_logs
- Previous week's summary (for comparison)
- Current world state
- Companion moods
- Milestone progress

---

## 10. AI Game Master Integration

### Context Injection

The existing `getWorldContextForGM()` function in `world/engine.ts` is extended to include Chronicle data:

```typescript
export function getChronicleContextForGM(
  recentLogs: DailyLog[],
  worldState: WorldState
): string {
  const lines: string[] = [];

  // Recent activity pattern
  const last7 = recentLogs.slice(0, 7);
  const activeCount = last7.filter(l => l.day_rating !== 'absent').length;
  lines.push(`[RECENT ACTIVITY: ${activeCount}/7 days active]`);

  // Streak info
  const currentStreak = last7[0]?.streak_count ?? 0;
  lines.push(`Current streak: ${currentStreak} days`);

  // This week's focus areas
  const statsCounts: Record<string, number> = {};
  for (const log of last7) {
    for (const stat of log.stats_touched) {
      statsCounts[stat] = (statsCounts[stat] || 0) + 1;
    }
  }
  const sorted = Object.entries(statsCounts).sort((a, b) => b[1] - a[1]);
  if (sorted.length > 0) {
    lines.push(`Focus areas: ${sorted.map(([s, c]) => `${s}(${c})`).join(', ')}`);
  }

  // Recovery events
  const recoveries = last7.filter(l => l.day_rating === 'recovery');
  if (recoveries.length > 0) {
    lines.push(`Recoveries this week: ${recoveries.length}`);
  }

  // Comparison to previous week
  const prev7 = recentLogs.slice(7, 14);
  if (prev7.length > 0) {
    const prevActive = prev7.filter(l => l.day_rating !== 'absent').length;
    const prevXP = prev7.reduce((sum, l) => sum + (l.xp_earned || 0), 0);
    const thisXP = last7.reduce((sum, l) => sum + (l.xp_earned || 0), 0);
    lines.push(`vs last week: ${activeCount} vs ${prevActive} active days, ${thisXP} vs ${prevXP} XP`);
  }

  return lines.join('\n');
}
```

### GM Behaviors

The AI Game Master uses Chronicle data to:

1. **Reference past events**: "Remember when the Forge collapsed three weeks ago? You rebuilt it stronger."
2. **Highlight growth arcs**: "You've gained 2,400 XP since the start of the month. That's your best month yet."
3. **Note behavioral patterns**: "I've noticed you're most consistent on mornings. Your archive sessions tend to cluster around Tuesday and Thursday."
4. **Gently observe decline**: "The Sanctum's been quiet for a few days. Sage doesn't mind waiting — but she does notice."
5. **Celebrate recovery**: "You came back after four days away. That's what the Phoenix Rising milestone is about — you've earned that name."

### What the GM Never Does

- Never says "you failed"
- Never uses percentage decline rates
- Never compares to other users
- Never uses urgency language ("you need to", "you must", "it's critical that")
- Never stacks multiple negative observations in one message

---

## 11. Emotional Design Principles

### The Three Emotional Zones

Every screen in the Chronicle operates in one of three emotional zones:

| Zone | Emotion | Colors | Typography |
|------|---------|--------|------------|
| **Growth** | Pride, motivation | Violet, gold accents | Bold, slightly larger |
| **Steady** | Calm, continuity | Muted violet, gray | Regular, well-spaced |
| **Restoration** | Hope, resilience | Amber, warm gray | Gentle, italicized |

There is no **Failure** zone. Absent days are simply empty — no color, no icon, no mark. The absence speaks for itself without needing to be highlighted.

### Color Psychology

- **Violet** (existing accent): Achievement, progress, power
- **Amber/Gold**: Recovery, warmth, resilience — used for comeback days
- **Muted Gray**: Rest, pause — used for light/neutral days
- **NO RED ANYWHERE** in the Chronicle. Red is reserved for the Active Penalties section of the Dashboard, where its urgency is contextually appropriate. In the Chronicle, where the user is reflecting, red would feel like being graded.

### Typography Hierarchy

| Element | Style | Purpose |
|---------|-------|---------|
| Narrative text | `text-sm leading-relaxed text-gray-300` | Invites reading |
| Section headers | `text-xs font-mono uppercase tracking-wider text-gray-500` | Consistent with existing UI |
| Numbers/stats | `font-mono font-bold` | Clear, scannable |
| Dates | `text-xs text-gray-400` | Present but not dominant |
| Empty states | `text-sm italic text-gray-600` | Gentle, non-demanding |

### Micro-Interactions

- **Day cell hover** (Calendar): Slight scale-up (1.05x) with a soft glow
- **Day cell tap**: Pulse animation as it transitions to Day Log
- **Timeline scroll**: Events fade in as they enter viewport (intersection observer)
- **Milestone earned**: Gentle particle burst (CSS only, no canvas)
- **Comparison reveal**: Deltas animate from 0 to final value (count-up effect)
- **Narrative load**: Text appears with a typewriter-style fade-in (character by character)

### Sound Design (Optional, Future)

If the app adds sound:
- Opening Chronicle: soft ambient tone
- Scrolling through Timeline: faint page-turn sounds
- Milestone reveal: crystalline chime
- No sounds for negative events

---

## 12. Component Architecture

### New Files

```
components/
  Chronicle/
    Chronicle.tsx              -- Main container, mode switching
    DayLog.tsx                 -- Day view with narrative, quests, economy, nexus impact
    CalendarOverview.tsx       -- Monthly calendar grid with streak clusters
    CalendarCell.tsx           -- Individual day cell
    TimelineView.tsx           -- Scrollable timeline of major events
    TimelineEvent.tsx          -- Individual timeline event card
    WorldSnapshot.tsx          -- Historical world state viewer
    SnapshotComparison.tsx     -- Side-by-side "Then vs Now"
    MilestoneGallery.tsx       -- Grid of earned/unearned milestones
    SignalAnalysis.tsx         -- Pattern insights section
    WeeklySummary.tsx          -- AI-generated weekly narrative
    NarrativeCard.tsx          -- AI day narrative with typewriter effect

services/
  chronicleService.ts          -- CRUD for daily_logs, weekly_summaries
  insightService.ts            -- Pattern calculation (runs client-side)

lib/
  chronicleUtils.ts            -- Day rating classification, snapshot creation
```

### State Management

The Chronicle uses local component state (not global App state) for:
- Selected date
- Active mode (daylog/overview/timeline)
- Loaded daily_logs (paginated, cached)
- Timeline events (paginated)

Global state (from App.tsx) consumed via props:
- `player` — current player state
- `worldState` — current world state
- `quests` — current quests (for today's live view)
- `session` — auth session for API calls

### Data Flow

```
App.tsx
  │
  ├── On quest completion: chronicleService.updateDailyLog(...)
  ├── On daily decay: chronicleService.snapshotWorld(...)
  │
  └── <Chronicle>
        ├── Fetches daily_logs on mount
        ├── Fetches timeline events on Timeline tab
        ├── Generates narratives lazily via geminiService
        │
        ├── <DayLog date={selectedDate}>
        │     ├── <NarrativeCard log={log} />
        │     ├── Quest list (from log.quest_titles)
        │     ├── Economy summary
        │     ├── <NexusImpact snapshot={log.world_snapshot} />
        │     └── World events list
        │
        ├── <CalendarOverview month={selectedMonth}>
        │     ├── <CalendarCell> × 28-31
        │     ├── <StreakCluster logs={monthLogs} />
        │     ├── <MonthPulse logs={monthLogs} />
        │     └── <SignalAnalysis logs={monthLogs} />
        │
        └── <TimelineView>
              ├── <TimelineEvent> × N (paginated)
              ├── Era markers
              └── Filter bar
```

### Integration into App.tsx

Minimal changes needed:

1. Add `'CHRONICLE'` to the view union type
2. Add sidebar navigation button (icon: `ScrollText`)
3. Render `<Chronicle>` component when `view === 'CHRONICLE'`
4. Add `chronicleService.updateDailyLog()` calls in `toggleQuestStatus` and `processDecay`

```typescript
// In the view type
const [view, setView] = useState<'DASHBOARD' | 'STORE' | 'SYSTEM' | 'WORLD' | 'CHRONICLE'>('DASHBOARD');

// In sidebar nav (between Requisitions and System Core)
<button onClick={() => { setView('CHRONICLE'); setSidebarOpen(false); }}
  className={`... ${view === 'CHRONICLE' ? 'active styles' : 'inactive styles'}`}>
  <ScrollText size={18} /> Chronicle
</button>

// In main content
{view === 'CHRONICLE' && (
  <Chronicle player={player} quests={quests} worldState={worldState} session={session} />
)}
```

---

## 13. Risks & Common Mistakes

### Risk 1: The Chronicle Becomes a Shame Machine

**How it happens:** Users open the Calendar, see empty days, feel bad, close the app.

**Mitigation:**
- Empty days have NO visual mark — they simply don't exist on the grid
- No "completion rate" percentage anywhere
- No red indicators
- Recovery days are visually warmer than strong days (amber > violet for emotional appeal)
- The narrative voice never uses shame language

### Risk 2: Data Overload

**How it happens:** Too many numbers, too many cards, the Day Log becomes a spreadsheet.

**Mitigation:**
- The narrative card is the primary element — it's the first thing the user sees
- Numbers are secondary, shown in compact badges
- The Calendar uses color, not text
- The Timeline filters aggressively — only major events
- Signal Analysis is collapsed by default

### Risk 3: Narrative Quality Degrades

**How it happens:** AI generates boring or repetitive summaries.

**Mitigation:**
- Provide rich context to the prompt: companion names, district states, specific quest titles, comparisons to previous days
- Include variety instructions in the prompt: "Vary your tone. Reference different companions. Sometimes be poetic, sometimes be direct."
- Cache narratives so bad generations can be regenerated
- Fallback to template-based narrative (like existing `narrative.ts`) if AI is unavailable

### Risk 4: Performance Issues

**How it happens:** Loading 6 months of daily_logs for the Calendar.

**Mitigation:**
- Calendar loads one month at a time (28-31 rows)
- Timeline paginates (30 events per page)
- Narratives are lazy-loaded (only generated when the user views that day)
- World snapshots are compact (< 1KB each)
- Index on (user_id, log_date DESC) ensures fast queries

### Risk 5: It Feels Like a Different App

**How it happens:** The Chronicle's calm, reflective aesthetic clashes with the Dashboard's high-energy sci-fi tone.

**Mitigation:**
- Use the same Tailwind classes, color palette, and font-mono aesthetic
- Keep the `axiom-accent` violet as primary
- Use the same card border treatments (`border-axiom-800`)
- The sci-fi vocabulary stays: "Signal Analysis" not "Insights", "Mission Debrief" not "Daily Summary"
- The Chronicle is simply the "quiet room" of the same ship — same aesthetic, lower intensity

### Risk 6: Users Don't Visit

**How it happens:** No pull mechanism. The Chronicle is passive.

**Mitigation:**
- Weekly summary notification: "Your weekly chronicle is ready"
- Milestone earned notification: "New mark of resilience unlocked"
- GM Terminal references Chronicle data: "Your Chronicle shows an interesting pattern this week..."
- The Dashboard streak widget links to the Chronicle for details
- Comparison mode ("Day 1 vs Now") is promoted during onboarding after day 7

### Risk 7: Recovery Isn't Celebrated Enough

**How it happens:** The system tracks recovery but treats it like a normal event.

**Mitigation:**
- Recovery days get amber glow (visually distinct from strong days)
- "Second Wind" and "Resilient" milestones specifically for comebacks
- The GM explicitly calls out recovery: "You came back. That's the hardest part."
- Recovery streak clusters on the Calendar have an amber leading edge
- The comparison view shows recovery count as a positive metric

---

## 14. Implementation Priority

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema: `daily_logs` table
- [ ] `chronicleService.ts`: CRUD operations
- [ ] `chronicleUtils.ts`: day rating classification
- [ ] Daily log creation/update hooked into App.tsx
- [ ] Basic `Chronicle.tsx` container with mode switching
- [ ] `DayLog.tsx` with quest list, economy summary (no narrative yet)

### Phase 2: Calendar (Week 2-3)
- [ ] `CalendarOverview.tsx` with day cells
- [ ] Day cell color mapping from day ratings
- [ ] Month navigation
- [ ] Streak cluster visualization
- [ ] Month pulse summary
- [ ] Tap-to-navigate from Calendar to Day Log

### Phase 3: Narrative & AI (Week 3-4)
- [ ] Narrative generation prompt design
- [ ] `NarrativeCard.tsx` with typewriter effect
- [ ] Lazy narrative generation on Day Log view
- [ ] Weekly summary generation
- [ ] GM context injection with Chronicle data

### Phase 4: Timeline (Week 4-5)
- [ ] `TimelineView.tsx` with infinite scroll
- [ ] Timeline event cards with category styling
- [ ] Era markers
- [ ] Event filtering
- [ ] Day clustering

### Phase 5: Identity & Snapshots (Week 5-6)
- [ ] Behavioral milestones system
- [ ] `MilestoneGallery.tsx`
- [ ] World snapshot compact serialization
- [ ] `WorldSnapshot.tsx` viewer
- [ ] `SnapshotComparison.tsx` with Then vs Now

### Phase 6: Polish (Week 6-7)
- [ ] `SignalAnalysis.tsx` pattern insights
- [ ] Micro-interactions and animations
- [ ] Mobile optimization
- [ ] Performance profiling and optimization
- [ ] Empty states and first-time experience

---

## Summary

The Chronicle is not analytics software. It's a personal archive — a place where someone can look back six months from now and see visible proof that they showed up, that they built something, that they recovered when they fell, and that their effort compounded into something real.

Every design decision serves one purpose: **make the user feel like their time mattered.**

The Chronicle makes that feeling visible.
