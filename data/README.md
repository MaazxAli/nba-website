# NBA Player Data Schema

This folder contains season-ready NBA player data used by the comparison app. Keep player objects consistent with this schema so Head-to-Head, Multi-Compare, Player Finder, comparison lenses, and season switching can read the same fields safely.

## Season Structure

Each season should be stored in the exported `seasons` object from `players.js`.

```js
export const seasons = {
  "2023-24": {
    label: "2023-24",
    players: [
      // Player objects for this season
    ]
  }
};
```

The `player.season` value must match the season key that contains the player. For example, every player inside `seasons["2023-24"].players` should have `season: "2023-24"`.

## Required Player Fields

Every player object must include:

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | Player display name. Must not be empty. |
| `team` | string | Team display name. Must not be empty. |
| `position` | string | Position or position group, such as `"PG"` or `"SF/PF"`. Must not be empty. |
| `season` | string | Season label. Must match the season key. |
| `gamesPlayed` | number | Games played in the selected regular season. Optional for older sample data. |
| `minutes` | number or null | Minutes per game. Use `null` when the player has no regular-season stats. Optional for older sample data. |
| `fieldGoalsMade` | number or null | Field goals made per game. Used for eFG%. Optional for older generated data. |
| `fieldGoalAttempts` | number or null | Field goal attempts per game. Used for TS% and eFG%. Optional for older generated data. |
| `threePointersMade` | number or null | Three-pointers made per game. Used for eFG%. Optional for older generated data. |
| `freeThrowAttempts` | number or null | Free throw attempts per game. Used for TS%. Optional for older generated data. |
| `points` | number | Points per game. |
| `rebounds` | number | Rebounds per game. |
| `assists` | number | Assists per game. |
| `steals` | number | Steals per game. |
| `blocks` | number | Blocks per game. |
| `turnovers` | number | Turnovers per game. Lower is better in comparisons. |
| `fgPercent` | number | Field goal percentage as a number, not a string. |
| `threePercent` | number | Three-point percentage as a number, not a string. |
| `ftPercent` | number | Free throw percentage as a number, not a string. |
| `hasStats` | boolean | `true` when regular-season stat fields are available; `false` for searchable players with no regular-season stats. Optional for older sample data. |
| `status` | string | Display status such as `"Active stats available"` or `"No regular-season stats"`. Optional for older sample data. |

## Type Rules

- `name`, `team`, `position`, and `season` should be strings.
- Stat fields should be numbers.
- Percentage fields should be numbers like `41.0`, not strings like `"41%"`.
- Do not use `null`, `undefined`, empty strings, or formatted strings for numeric stats.
- `gamesPlayed` should be a number when present.
- `minutes` should be a number or `null` when present.
- `fieldGoalsMade`, `fieldGoalAttempts`, `threePointersMade`, and `freeThrowAttempts` should be numbers or `null` when present.
- `hasStats` should be a boolean when present.
- `status` should be a string when present.
- For `hasStats: true`, all stat fields should be numeric.
- For `hasStats: false`, stat fields may be `null` or omitted if the app handles the player as unavailable for comparison.

## Basic Valid Ranges

- Counting stats should not be negative.
- `turnovers` should not be negative.
- `gamesPlayed` and `minutes` should not be negative.
- Percentage stats should generally be between `0` and `100`.
- Season labels should match the key in the `seasons` object.
- Player names should be unique within the same season.
- A season should have a non-empty `players` array before being made selectable.

## Example Player

```js
{
  name: "Stephen Curry",
  team: "Golden State Warriors",
  position: "PG",
  season: "2023-24",
  gamesPlayed: 74,
  minutes: 32.7,
  fieldGoalsMade: 8.8,
  fieldGoalAttempts: 19.5,
  threePointersMade: 4.8,
  freeThrowAttempts: 4.4,
  points: 26.4,
  rebounds: 4.5,
  assists: 5.1,
  steals: 0.7,
  blocks: 0.4,
  turnovers: 2.8,
  fgPercent: 45.0,
  threePercent: 40.8,
  ftPercent: 92.3,
  hasStats: true,
  status: "Active stats available"
}
```

## No-Stats Player Example

Players who are present in a season/player index but have no regular-season stat row can still be searchable. Do not invent stat values for them.

```js
{
  name: "Example Player",
  team: "Unknown",
  position: "Unknown",
  season: "2025-26",
  gamesPlayed: 0,
  minutes: null,
  points: null,
  rebounds: null,
  assists: null,
  steals: null,
  blocks: null,
  turnovers: null,
  fgPercent: null,
  threePercent: null,
  ftPercent: null,
  hasStats: false,
  status: "No regular-season stats"
}
```

## Adding Future Data

When adding larger datasets later:

- Add new seasons without changing existing player stat values.
- Keep all required fields present on every player.
- Store percentages as plain numbers.
- Include `gamesPlayed`, `minutes`, `hasStats`, and `status` for newly imported data.
- Run the app and check the browser console for validation warnings or errors.
- Fix validation output before relying on a new season in comparisons.

## Local NBA Import Workflow

The app does not call NBA APIs from the browser. Real NBA data should be imported locally with the Python script in `scripts/import_nba_season.py`, reviewed, and then connected to `data/players.js`.

### Install Dependencies on Windows

From the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r scripts/requirements.txt
```

If your Windows Python launcher is installed, `py` can be used in place of `python`.

If PowerShell blocks activation, either allow local scripts for your user or run the script through the virtual environment's Python executable:

```powershell
.\.venv\Scripts\python.exe -m pip install -r scripts/requirements.txt
```

### Run the Import

The importer defaults to the current project season (`2023-24`) so it does not guess which future season is complete. Pass `--season` when importing a different completed season.

```powershell
python scripts/import_nba_season.py --season 2023-24
```

To target a later season:

```powershell
python scripts/import_nba_season.py --season 2025-26
```

By default, the script writes an ES module file:

```text
data/generated/players-2023-24.js
```

The generated file exports season-specific values such as:

```js
export const players202324 = [/* imported players */];
export const season202324 = {
  label: "2023-24",
  players: players202324
};
```

You can generate JSON instead if needed:

```powershell
python scripts/import_nba_season.py --season 2023-24 --format json
```

### Import Safety

The script:

- Pulls regular-season per-game data with `nba_api`.
- Joins NBA player index data for position and team display names.
- Includes `gamesPlayed`, `minutes`, `hasStats`, and `status` in newly generated files.
- Includes raw shooting volume fields needed for TS% and eFG% in newly generated files.
- Adds searchable no-stats players from the season/player index when they are absent from the regular-season per-game stat response.
- Converts NBA percentage decimals such as `0.408` into schema percentages such as `40.8`.
- Validates the generated players before writing the output file.
- Refuses to overwrite an existing generated file unless `--force` is provided.
- Does not replace `data/players.js` automatically.

Generated files created before these quality fields were added will continue to work, but validation will warn that `gamesPlayed`, `minutes`, `hasStats`, and `status` are missing. Re-run the importer to produce a quality-field-ready dataset.

If the NBA player index does not include a position for a player, the script fails by default. You can allow an explicit `"Unknown"` position fallback with:

```powershell
python scripts/import_nba_season.py --season 2023-24 --allow-unknown-position
```

Use that option only after reviewing the output.

### Connect a Generated Season

After the generated data validates and you review it, import it into `data/players.js` and add it to the `seasons` object. The season key must match every generated player's `season` value.

```js
import { season202526 } from "./generated/players-2025-26.js";

export const seasons = {
  "2023-24": {
    label: "2023-24",
    players
  },
  "2025-26": season202526
};
```

Keep the existing sample season until you are ready to replace it intentionally. The app's startup validator will log console errors or warnings if connected data does not match the schema.

### Change the Target Season Later

Run the same script with a new `--season` value:

```powershell
python scripts/import_nba_season.py --season 2026-27
```

The season must use NBA's `YYYY-YY` label format. Only connect completed or trusted datasets to the app's `seasons` object.
