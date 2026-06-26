const stringFields = ["name", "team", "position", "season"];
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
const percentageFields = ["fgPercent", "threePercent", "ftPercent"];
const requiredFields = [...stringFields, ...statFields];
const qualityFields = ["gamesPlayed", "minutes", "hasStats", "status"];

function getPlayerLabel(player, index) {
  if (player && typeof player.name === "string" && player.name.trim() !== "") {
    return player.name;
  }

  return `Player ${index + 1}`;
}

function addIssue(issues, severity, seasonKey, message) {
  issues[severity].push(`${seasonKey}: ${message}`);
}

function validatePlayer(player, seasonKey, index, issues) {
  const playerLabel = getPlayerLabel(player, index);

  if (!player || typeof player !== "object" || Array.isArray(player)) {
    addIssue(issues, "errors", seasonKey, `Player ${index + 1} is not a valid player object`);
    return;
  }

  const hasStats = player.hasStats === false ? false : true;

  requiredFields.forEach((field) => {
    if (!(field in player)) {
      if (!hasStats && statFields.includes(field)) {
        return;
      }

      addIssue(issues, "errors", seasonKey, `${playerLabel} is missing ${field}`);
    }
  });

  stringFields.forEach((field) => {
    if (!(field in player)) {
      return;
    }

    if (typeof player[field] !== "string") {
      addIssue(issues, "errors", seasonKey, `${playerLabel} has invalid ${field}; expected string`);
      return;
    }

    if (player[field].trim() === "") {
      addIssue(issues, "errors", seasonKey, `${playerLabel} has empty ${field}`);
    }
  });

  statFields.forEach((field) => {
    if (!(field in player)) {
      return;
    }

    const value = player[field];

    if (!hasStats && (value === null || value === undefined)) {
      return;
    }

    if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
      addIssue(issues, "errors", seasonKey, `${playerLabel} has non-numeric ${field}`);
      return;
    }

    if (value < 0) {
      addIssue(issues, "errors", seasonKey, `${playerLabel} has negative ${field}`);
    }
  });

  percentageFields.forEach((field) => {
    if (!(field in player) || typeof player[field] !== "number" || !Number.isFinite(player[field])) {
      return;
    }

    if (player[field] < 0 || player[field] > 100) {
      addIssue(issues, "warnings", seasonKey, `${playerLabel} has invalid percentage ${field}: ${player[field]}`);
    }
  });

  if (typeof player.season === "string" && player.season !== seasonKey) {
    addIssue(
      issues,
      "errors",
      seasonKey,
      `${playerLabel} has season ${player.season}, expected ${seasonKey}`
    );
  }

  if ("gamesPlayed" in player) {
    const gamesPlayed = player.gamesPlayed;

    if (typeof gamesPlayed !== "number" || Number.isNaN(gamesPlayed) || !Number.isFinite(gamesPlayed)) {
      addIssue(issues, "errors", seasonKey, `${playerLabel} has invalid gamesPlayed; expected number`);
    } else if (gamesPlayed < 0) {
      addIssue(issues, "errors", seasonKey, `${playerLabel} has negative gamesPlayed`);
    }
  }

  if ("minutes" in player) {
    const minutes = player.minutes;

    if (minutes !== null && (typeof minutes !== "number" || Number.isNaN(minutes) || !Number.isFinite(minutes))) {
      addIssue(issues, "errors", seasonKey, `${playerLabel} has invalid minutes; expected number or null`);
    } else if (typeof minutes === "number" && minutes < 0) {
      addIssue(issues, "errors", seasonKey, `${playerLabel} has negative minutes`);
    }
  }

  if ("hasStats" in player && typeof player.hasStats !== "boolean") {
    addIssue(issues, "errors", seasonKey, `${playerLabel} has invalid hasStats; expected boolean`);
  }

  if ("status" in player && typeof player.status !== "string") {
    addIssue(issues, "errors", seasonKey, `${playerLabel} has invalid status; expected string`);
  }
}

function validateSeason(seasonKey, season, issues) {
  if (!season || typeof season !== "object" || Array.isArray(season)) {
    addIssue(issues, "errors", seasonKey, "season entry is not a valid object");
    return;
  }

  if (!Array.isArray(season.players)) {
    addIssue(issues, "errors", seasonKey, "players is missing or is not an array");
    return;
  }

  if (season.players.length === 0) {
    addIssue(issues, "errors", seasonKey, "season player array is empty");
    return;
  }

  const names = new Set();
  const missingQualityCounts = {
    gamesPlayed: 0,
    minutes: 0,
    hasStats: 0,
    status: 0
  };
  let noStatsCount = 0;

  season.players.forEach((player, index) => {
    validatePlayer(player, seasonKey, index, issues);

    if (player && typeof player === "object" && !Array.isArray(player)) {
      qualityFields.forEach((field) => {
        if (!(field in player)) {
          missingQualityCounts[field]++;
        }
      });

      if (player.hasStats === false) {
        noStatsCount++;
      }
    }

    if (!player || typeof player.name !== "string") {
      return;
    }

    const normalizedName = player.name.trim().toLowerCase();

    if (normalizedName === "") {
      return;
    }

    if (names.has(normalizedName)) {
      addIssue(issues, "errors", seasonKey, `duplicate player name found: ${player.name}`);
      return;
    }

    names.add(normalizedName);
  });

  Object.entries(missingQualityCounts).forEach(([field, count]) => {
    if (count > 0) {
      addIssue(issues, "warnings", seasonKey, `${count} players are missing optional ${field}`);
    }
  });

  if (noStatsCount > 0) {
    addIssue(issues, "warnings", seasonKey, `${noStatsCount} players are marked with no regular-season stats`);
  }
}

function logValidationIssues(issues) {
  if (issues.errors.length > 0) {
    console.groupCollapsed(`NBA player data validation errors (${issues.errors.length})`);
    issues.errors.forEach((issue) => console.error(issue));
    console.groupEnd();
  }

  if (issues.warnings.length > 0) {
    console.groupCollapsed(`NBA player data validation warnings (${issues.warnings.length})`);
    issues.warnings.forEach((issue) => console.warn(issue));
    console.groupEnd();
  }
}

export function validatePlayerData(seasons) {
  const issues = {
    errors: [],
    warnings: []
  };

  if (!seasons || typeof seasons !== "object" || Array.isArray(seasons)) {
    addIssue(issues, "errors", "seasons", "season data is missing or is not an object");
    logValidationIssues(issues);

    return {
      isValid: false,
      isUsable: false,
      errors: issues.errors,
      warnings: issues.warnings
    };
  }

  const seasonEntries = Object.entries(seasons);

  if (seasonEntries.length === 0) {
    addIssue(issues, "errors", "seasons", "no seasons are available");
  }

  seasonEntries.forEach(([seasonKey, season]) => {
    validateSeason(seasonKey, season, issues);
  });

  logValidationIssues(issues);

  return {
    isValid: issues.errors.length === 0 && issues.warnings.length === 0,
    isUsable: seasonEntries.some(([, season]) => {
      return season && Array.isArray(season.players) && season.players.length > 0;
    }),
    errors: issues.errors,
    warnings: issues.warnings
  };
}
