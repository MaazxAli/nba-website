const statFields = [
  "points",
  "rebounds",
  "assists",
  "steals",
  "blocks",
  "turnovers",
  "fgPercent",
  "threePercent",
  "ftPercent"
];

export function hasPlayerStats(player) {
  if (player?.hasStats === false) {
    return false;
  }

  return statFields.every((field) => {
    return typeof player?.[field] === "number" && Number.isFinite(player[field]);
  });
}

export function getPlayerStatus(player) {
  if (typeof player?.status === "string" && player.status.trim() !== "") {
    return player.status;
  }

  return hasPlayerStats(player) ? "Active stats available" : "No regular-season stats";
}

export function formatSampleSize(player) {
  const parts = [];

  if (typeof player?.gamesPlayed === "number" && Number.isFinite(player.gamesPlayed)) {
    parts.push(`${player.gamesPlayed} GP`);
  }

  if (typeof player?.minutes === "number" && Number.isFinite(player.minutes)) {
    parts.push(`${player.minutes.toFixed(1).replace(".0", "")} MPG`);
  }

  return parts.length > 0 ? parts.join(" • ") : "Sample size unavailable";
}

export function meetsSampleSize(player, filters) {
  if (!hasPlayerStats(player)) {
    return Boolean(filters.includeNoStats);
  }

  const minGames = Number(filters.minGames);
  const minMinutes = Number(filters.minMinutes);
  const hasMinGames = Number.isFinite(minGames) && minGames > 0;
  const hasMinMinutes = Number.isFinite(minMinutes) && minMinutes > 0;

  if (
    hasMinGames &&
    typeof player.gamesPlayed === "number" &&
    Number.isFinite(player.gamesPlayed) &&
    player.gamesPlayed < minGames
  ) {
    return false;
  }

  if (
    hasMinMinutes &&
    typeof player.minutes === "number" &&
    Number.isFinite(player.minutes) &&
    player.minutes < minMinutes
  ) {
    return false;
  }

  return true;
}
