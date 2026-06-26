const missingValue = "—";

const fieldAliases = {
  fieldGoalsMade: ["fieldGoalsMade", "fgMade", "fgm"],
  fieldGoalAttempts: ["fieldGoalAttempts", "fgAttempts", "fga"],
  threePointersMade: ["threePointersMade", "threeMade", "threePM", "fg3m"],
  freeThrowAttempts: ["freeThrowAttempts", "ftAttempts", "fta"]
};

export const advancedStatDefinitions = [
  {
    key: "trueShootingPercent",
    label: "TS%",
    suffix: "%",
    description: "True shooting percentage",
    category: "efficiency"
  },
  {
    key: "effectiveFieldGoalPercent",
    label: "eFG%",
    suffix: "%",
    description: "Effective field goal percentage",
    category: "efficiency"
  },
  {
    key: "assistTurnoverRatio",
    label: "AST/TO",
    suffix: "",
    description: "Assist-to-turnover ratio",
    category: "playmaking"
  },
  {
    key: "pointsPer36",
    label: "PTS/36",
    suffix: "",
    description: "Points per 36 minutes",
    category: "per36"
  },
  {
    key: "reboundsPer36",
    label: "REB/36",
    suffix: "",
    description: "Rebounds per 36 minutes",
    category: "per36"
  },
  {
    key: "assistsPer36",
    label: "AST/36",
    suffix: "",
    description: "Assists per 36 minutes",
    category: "per36"
  }
];

function getNumber(player, key) {
  const value = player?.[key];

  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getAliasNumber(player, aliasKey) {
  const aliases = fieldAliases[aliasKey] || [];

  for (const key of aliases) {
    const value = getNumber(player, key);

    if (value !== null) {
      return value;
    }
  }

  return null;
}

function roundStat(value) {
  return Math.round(value * 10) / 10;
}

function calculateTrueShootingPercent(player) {
  const points = getNumber(player, "points");
  const fieldGoalAttempts = getAliasNumber(player, "fieldGoalAttempts");
  const freeThrowAttempts = getAliasNumber(player, "freeThrowAttempts");

  if (points === null || fieldGoalAttempts === null || freeThrowAttempts === null) {
    return null;
  }

  const shootingPossessions = 2 * (fieldGoalAttempts + 0.44 * freeThrowAttempts);

  if (shootingPossessions <= 0) {
    return null;
  }

  return roundStat((points / shootingPossessions) * 100);
}

function calculateEffectiveFieldGoalPercent(player) {
  const fieldGoalsMade = getAliasNumber(player, "fieldGoalsMade");
  const fieldGoalAttempts = getAliasNumber(player, "fieldGoalAttempts");
  const threePointersMade = getAliasNumber(player, "threePointersMade");

  if (fieldGoalsMade === null || fieldGoalAttempts === null || threePointersMade === null) {
    return null;
  }

  if (fieldGoalAttempts <= 0) {
    return null;
  }

  return roundStat(((fieldGoalsMade + 0.5 * threePointersMade) / fieldGoalAttempts) * 100);
}

function calculateAssistTurnoverRatio(player) {
  const assists = getNumber(player, "assists");
  const turnovers = getNumber(player, "turnovers");

  if (assists === null || turnovers === null || turnovers <= 0) {
    return null;
  }

  return roundStat(assists / turnovers);
}

function calculatePer36(player, statKey) {
  const value = getNumber(player, statKey);
  const minutes = getNumber(player, "minutes");

  if (value === null || minutes === null || minutes <= 0) {
    return null;
  }

  return roundStat((value / minutes) * 36);
}

export function getAdvancedStatValue(player, statKey) {
  if (player?.hasStats === false) {
    return null;
  }

  switch (statKey) {
    case "trueShootingPercent":
      return calculateTrueShootingPercent(player);
    case "effectiveFieldGoalPercent":
      return calculateEffectiveFieldGoalPercent(player);
    case "assistTurnoverRatio":
      return calculateAssistTurnoverRatio(player);
    case "pointsPer36":
      return calculatePer36(player, "points");
    case "reboundsPer36":
      return calculatePer36(player, "rebounds");
    case "assistsPer36":
      return calculatePer36(player, "assists");
    default:
      return null;
  }
}

export function formatAdvancedStatValue(value, suffix = "") {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return missingValue;
  }

  return `${value.toFixed(1).replace(".0", "")}${suffix}`;
}

export function getAdvancedStatRows(player) {
  return advancedStatDefinitions.map((stat) => {
    const value = getAdvancedStatValue(player, stat.key);

    return {
      ...stat,
      value,
      formattedValue: formatAdvancedStatValue(value, stat.suffix)
    };
  });
}
