#!/usr/bin/env python
"""Import NBA regular-season player stats into the app's player schema."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "data" / "generated"
DEFAULT_SEASON = "2023-24"

STRING_FIELDS = ["name", "team", "position", "season"]
STAT_FIELDS = [
    "points",
    "rebounds",
    "assists",
    "steals",
    "blocks",
    "turnovers",
    "fgPercent",
    "threePercent",
    "ftPercent",
]
PERCENTAGE_FIELDS = ["fgPercent", "threePercent", "ftPercent"]
REQUIRED_FIELDS = STRING_FIELDS + STAT_FIELDS
QUALITY_FIELDS = ["gamesPlayed", "minutes", "hasStats", "status"]


class ImportErrorWithHelp(RuntimeError):
    """Raised when the import cannot continue and the user needs a clear fix."""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Pull NBA regular-season per-game player stats and write app-ready data."
    )
    parser.add_argument(
        "--season",
        default=DEFAULT_SEASON,
        help="NBA season label in YYYY-YY format. Defaults to the current project season: 2023-24.",
    )
    parser.add_argument(
        "--output-dir",
        default=str(DEFAULT_OUTPUT_DIR),
        help="Directory for generated data files. Defaults to data/generated.",
    )
    parser.add_argument(
        "--format",
        choices=["js", "json"],
        default="js",
        help="Generated file format. Defaults to js for direct ES module imports.",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=45,
        help="Request timeout in seconds for nba_api calls.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite an existing generated file after validation succeeds.",
    )
    parser.add_argument(
        "--allow-unknown-position",
        action="store_true",
        help="Deprecated compatibility flag. Missing positions are handled as 'Unknown'.",
    )
    return parser.parse_args()


def validate_season_label(season: str) -> None:
    if not re.fullmatch(r"\d{4}-\d{2}", season):
        raise ImportErrorWithHelp(
            f"Invalid season '{season}'. Use NBA season format like 2023-24."
        )


def import_nba_api():
    try:
        from nba_api.stats.endpoints.leaguedashplayerstats import LeagueDashPlayerStats
        from nba_api.stats.endpoints.playerindex import PlayerIndex
    except ImportError as exc:
        raise ImportErrorWithHelp(
            "nba_api is not installed. Run: python -m pip install -r scripts/requirements.txt"
        ) from exc

    return LeagueDashPlayerStats, PlayerIndex


def get_data_frame(response: Any, label: str):
    frames = response.get_data_frames()

    if not frames:
        raise ImportErrorWithHelp(f"{label} returned no data frames.")

    frame = frames[0]

    if frame.empty:
        raise ImportErrorWithHelp(f"{label} returned an empty data frame.")

    return frame


def require_columns(frame: Any, required_columns: list[str], label: str) -> None:
    missing = [column for column in required_columns if column not in frame.columns]

    if missing:
        raise ImportErrorWithHelp(
            f"{label} response is missing expected columns: {', '.join(missing)}"
        )


def get_first_value(row: Any, columns: list[str], default: str = "") -> str:
    for column in columns:
        if column not in row:
            continue

        value = row[column]

        if value is None:
            continue

        text = str(value).strip()

        if text and text.lower() != "nan":
            return text

    return default


def make_team_name(row: Any) -> str:
    full_name = get_first_value(row, ["TEAM_NAME"])

    if full_name:
        city = get_first_value(row, ["TEAM_CITY"])

        if city and not full_name.lower().startswith(city.lower()):
            return f"{city} {full_name}"

        return full_name

    abbreviation = get_first_value(row, ["TEAM_ABBREVIATION", "TEAM_ABBREVIATION_1"])
    return abbreviation


def make_player_name(row: Any) -> str:
    full_name = get_first_value(row, ["PLAYER_NAME", "DISPLAY_FIRST_LAST", "PLAYER"])

    if full_name:
        return full_name

    first_name = get_first_value(row, ["PLAYER_FIRST_NAME", "FIRST_NAME"])
    last_name = get_first_value(row, ["PLAYER_LAST_NAME", "LAST_NAME"])
    name = f"{first_name} {last_name}".strip()

    return name


def round_stat(value: Any, field_name: str) -> float:
    try:
        return round(float(value), 1)
    except (TypeError, ValueError) as exc:
        raise ImportErrorWithHelp(f"Could not convert {field_name} value '{value}' to a number.") from exc


def round_percent(value: Any, field_name: str) -> float:
    try:
        return round(float(value) * 100, 1)
    except (TypeError, ValueError) as exc:
        raise ImportErrorWithHelp(f"Could not convert {field_name} value '{value}' to a percentage.") from exc


def normalize_player_id(value: Any) -> str:
    try:
        return str(int(value))
    except (TypeError, ValueError):
        return str(value).strip()


def fetch_nba_frames(season: str, timeout: int) -> tuple[Any, Any]:
    LeagueDashPlayerStats, PlayerIndex = import_nba_api()

    try:
        stats_response = LeagueDashPlayerStats(
            season=season,
            season_type_all_star="Regular Season",
            per_mode_detailed="PerGame",
            measure_type_detailed_defense="Base",
            timeout=timeout,
        )
        index_response = PlayerIndex(season=season, timeout=timeout)
    except Exception as exc:
        raise ImportErrorWithHelp(
            f"nba_api request failed for {season}. Check your connection and try again. Details: {exc}"
        ) from exc

    stats_frame = get_data_frame(stats_response, "LeagueDashPlayerStats")
    index_frame = get_data_frame(index_response, "PlayerIndex")

    require_columns(
        stats_frame,
        [
            "PLAYER_ID",
            "PLAYER_NAME",
            "GP",
            "MIN",
            "PTS",
            "REB",
            "AST",
            "STL",
            "BLK",
            "TOV",
            "FG_PCT",
            "FG3_PCT",
            "FT_PCT",
        ],
        "LeagueDashPlayerStats",
    )
    require_columns(index_frame, ["PERSON_ID", "POSITION"], "PlayerIndex")

    return stats_frame, index_frame


def build_player_index(index_frame: Any) -> dict[str, dict[str, str]]:
    player_index: dict[str, dict[str, str]] = {}

    for _, row in index_frame.iterrows():
        player_id = normalize_player_id(row["PERSON_ID"])
        player_index[player_id] = {
            "name": make_player_name(row),
            "position": get_first_value(row, ["POSITION"]),
            "team": make_team_name(row),
        }

    return player_index


def map_players(
    stats_frame: Any,
    player_index: dict[str, dict[str, str]],
    season: str,
    allow_unknown_position: bool,
) -> list[dict[str, Any]]:
    players: list[dict[str, Any]] = []
    player_ids_with_stats: set[str] = set()

    for _, row in stats_frame.iterrows():
        player_id = normalize_player_id(row["PLAYER_ID"])
        player_ids_with_stats.add(player_id)
        index_entry = player_index.get(player_id, {})
        position = index_entry.get("position", "")

        if not position:
            position = "Unknown"

        team = index_entry.get("team", "") or get_first_value(row, ["TEAM_ABBREVIATION"])

        players.append(
            {
                "name": str(row["PLAYER_NAME"]).strip(),
                "team": team,
                "position": position,
                "season": season,
                "gamesPlayed": round_stat(row["GP"], "GP"),
                "minutes": round_stat(row["MIN"], "MIN"),
                "points": round_stat(row["PTS"], "PTS"),
                "rebounds": round_stat(row["REB"], "REB"),
                "assists": round_stat(row["AST"], "AST"),
                "steals": round_stat(row["STL"], "STL"),
                "blocks": round_stat(row["BLK"], "BLK"),
                "turnovers": round_stat(row["TOV"], "TOV"),
                "fgPercent": round_percent(row["FG_PCT"], "FG_PCT"),
                "threePercent": round_percent(row["FG3_PCT"], "FG3_PCT"),
                "ftPercent": round_percent(row["FT_PCT"], "FT_PCT"),
                "hasStats": True,
                "status": "Active stats available",
            }
        )

    for player_id, index_entry in player_index.items():
        if player_id in player_ids_with_stats:
            continue

        name = index_entry.get("name", "").strip()

        if not name:
            continue

        players.append(
            {
                "name": name,
                "team": index_entry.get("team", "") or "Unknown",
                "position": index_entry.get("position", "") or "Unknown",
                "season": season,
                "gamesPlayed": 0,
                "minutes": None,
                "points": None,
                "rebounds": None,
                "assists": None,
                "steals": None,
                "blocks": None,
                "turnovers": None,
                "fgPercent": None,
                "threePercent": None,
                "ftPercent": None,
                "hasStats": False,
                "status": "No regular-season stats",
            }
        )

    return players


def add_issue(issues: dict[str, list[str]], severity: str, season: str, message: str) -> None:
    issues[severity].append(f"{season}: {message}")


def validate_generated_players(players: list[dict[str, Any]], season: str) -> dict[str, list[str]]:
    issues = {"errors": [], "warnings": []}

    if not players:
        add_issue(issues, "errors", season, "season player array is empty")
        return issues

    names: set[str] = set()

    for index, player in enumerate(players):
        player_label = player.get("name") or f"Player {index + 1}"
        has_stats = player.get("hasStats") is not False

        for field in REQUIRED_FIELDS:
            if field not in player:
                if not has_stats and field in STAT_FIELDS:
                    continue

                add_issue(issues, "errors", season, f"{player_label} is missing {field}")

        for field in STRING_FIELDS:
            if field in player and (not isinstance(player[field], str) or not player[field].strip()):
                add_issue(issues, "errors", season, f"{player_label} has invalid {field}; expected string")

        for field in STAT_FIELDS:
            if field not in player:
                continue

            value = player[field]

            if not has_stats and value is None:
                continue

            if not isinstance(value, (int, float)):
                add_issue(issues, "errors", season, f"{player_label} has non-numeric {field}")
                continue

            if value < 0:
                add_issue(issues, "errors", season, f"{player_label} has negative {field}")

        for field in PERCENTAGE_FIELDS:
            if field in player and isinstance(player[field], (int, float)):
                if player[field] < 0 or player[field] > 100:
                    add_issue(
                        issues,
                        "warnings",
                        season,
                        f"{player_label} has invalid percentage {field}: {player[field]}",
                    )

        if player.get("season") != season:
            add_issue(
                issues,
                "errors",
                season,
                f"{player_label} has season {player.get('season')}, expected {season}",
            )

        if "gamesPlayed" not in player:
            add_issue(issues, "warnings", season, f"{player_label} is missing gamesPlayed")
        elif not isinstance(player["gamesPlayed"], (int, float)):
            add_issue(issues, "errors", season, f"{player_label} has invalid gamesPlayed; expected number")
        elif player["gamesPlayed"] < 0:
            add_issue(issues, "errors", season, f"{player_label} has negative gamesPlayed")

        if "minutes" not in player:
            add_issue(issues, "warnings", season, f"{player_label} is missing minutes")
        elif player["minutes"] is not None and not isinstance(player["minutes"], (int, float)):
            add_issue(issues, "errors", season, f"{player_label} has invalid minutes; expected number or null")
        elif isinstance(player["minutes"], (int, float)) and player["minutes"] < 0:
            add_issue(issues, "errors", season, f"{player_label} has negative minutes")

        if "hasStats" not in player:
            add_issue(issues, "warnings", season, f"{player_label} is missing hasStats")
        elif not isinstance(player["hasStats"], bool):
            add_issue(issues, "errors", season, f"{player_label} has invalid hasStats; expected boolean")

        if "status" not in player:
            add_issue(issues, "warnings", season, f"{player_label} is missing status")
        elif not isinstance(player["status"], str):
            add_issue(issues, "errors", season, f"{player_label} has invalid status; expected string")

        normalized_name = str(player.get("name", "")).strip().lower()

        if normalized_name:
            if normalized_name in names:
                add_issue(issues, "errors", season, f"duplicate player name found: {player['name']}")
            names.add(normalized_name)

    return issues


def format_export_name(prefix: str, season: str) -> str:
    return f"{prefix}{season.replace('-', '')}"


def get_output_path(output_dir: Path, season: str, output_format: str) -> Path:
    return output_dir / f"players-{season}.{output_format}"


def write_json_file(output_path: Path, players: list[dict[str, Any]], season: str) -> None:
    payload = {
        "label": season,
        "players": players,
    }
    output_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def write_js_file(output_path: Path, players: list[dict[str, Any]], season: str) -> None:
    players_name = format_export_name("players", season)
    season_name = format_export_name("season", season)
    players_json = json.dumps(players, indent=2)
    content = (
        "// Generated by scripts/import_nba_season.py. Do not edit by hand.\n"
        f"export const {players_name} = {players_json};\n\n"
        f"export const {season_name} = {{\n"
        f'  label: "{season}",\n'
        f"  players: {players_name}\n"
        "};\n"
    )
    output_path.write_text(content, encoding="utf-8")


def write_generated_file(
    output_dir: Path,
    players: list[dict[str, Any]],
    season: str,
    output_format: str,
    force: bool,
) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = get_output_path(output_dir, season, output_format)

    if output_path.exists() and not force:
        raise ImportErrorWithHelp(
            f"{output_path} already exists. Re-run with --force to overwrite after validation."
        )

    if output_format == "json":
        write_json_file(output_path, players, season)
    else:
        write_js_file(output_path, players, season)

    return output_path


def main() -> int:
    args = parse_args()
    season = args.season.strip()

    try:
        validate_season_label(season)
        stats_frame, index_frame = fetch_nba_frames(season, args.timeout)
        player_index = build_player_index(index_frame)
        players = map_players(
            stats_frame,
            player_index,
            season,
            allow_unknown_position=args.allow_unknown_position,
        )
        issues = validate_generated_players(players, season)

        if issues["errors"] or issues["warnings"]:
            for issue in issues["errors"]:
                print(f"ERROR: {issue}", file=sys.stderr)
            for issue in issues["warnings"]:
                print(f"WARNING: {issue}", file=sys.stderr)

            raise ImportErrorWithHelp("Generated data did not pass validation; no file was written.")

        output_path = write_generated_file(
            Path(args.output_dir),
            players,
            season,
            args.format,
            args.force,
        )
    except ImportErrorWithHelp as exc:
        print(f"Import failed: {exc}", file=sys.stderr)
        return 1

    print(f"Imported {len(players)} players for {season}.")
    print(f"Generated: {output_path}")
    print("Review the file, then import it into data/players.js when ready.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
