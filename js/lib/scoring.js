import { comparisonModes, roleWeights, statBenchmarks } from "../config/modes.js";

export function getActiveStats(statConfig, activeMode) {
  const activeStatKeys = comparisonModes[activeMode].statKeys;

  return statConfig.filter((stat) => {
    return activeStatKeys.includes(stat.key);
  });
}

export function compareStat(playerOne, playerTwo, stat) {
  const playerOneValue = playerOne[stat.key];
  const playerTwoValue = playerTwo[stat.key];

  if (playerOneValue === playerTwoValue) {
    return 0;
  }

  if (stat.better === "higher") {
    return playerOneValue > playerTwoValue ? 1 : 2;
  }

  if (stat.better === "lower") {
    return playerOneValue < playerTwoValue ? 1 : 2;
  }

  return 0;
}

export function getStatClass(playerSide, comparisonResult) {
  if (comparisonResult === 0) {
    return "tie";
  }

  if (playerSide === comparisonResult) {
    return "winner";
  }

  return "loser";
}

export function getPrimaryRole(player) {
  const position = player.position.toLowerCase();
  const positionParts = position.split(/[/-]/).filter(Boolean);

  if (positionParts.includes("c") || position.includes("pf/c")) {
    return "big";
  }

  if (positionParts.some((part) => ["pg", "sg", "g"].includes(part))) {
    return "guard";
  }

  return "wing";
}

export function normalizeStatValue(player, stat) {
  const value = Number(player[stat.key]);

  if (stat.key === "turnovers") {
    const minTurnovers = statBenchmarks.turnovers.min;
    const maxTurnovers = statBenchmarks.turnovers.max;
    const clampedValue = Math.max(minTurnovers, Math.min(value, maxTurnovers));

    return ((maxTurnovers - clampedValue) / (maxTurnovers - minTurnovers)) * 100;
  }

  const benchmark = statBenchmarks[stat.key] || 100;

  return Math.min((value / benchmark) * 100, 110);
}

export function getRoleImpact(player, stat) {
  const role = getPrimaryRole(player);
  const weights = roleWeights[role];
  const weight = weights[stat.key] || 1;
  const normalizedValue = normalizeStatValue(player, stat);

  return normalizedValue * weight;
}

export function getPositionAdjustedScore(player, statConfig, activeMode) {
  const role = getPrimaryRole(player);
  const stats = getActiveStats(statConfig, activeMode);

  let weightedTotal = 0;
  let weightTotal = 0;

  stats.forEach((stat) => {
    const weight = roleWeights[role][stat.key] || 1;
    const normalizedValue = normalizeStatValue(player, stat);

    weightedTotal += normalizedValue * weight;
    weightTotal += weight;
  });

  if (weightTotal === 0) {
    return 0;
  }

  return weightedTotal / weightTotal;
}

export function getGapScore(statResult, activeMode) {
  if (activeMode === "position") {
    const maxImpact = Math.max(statResult.playerOneImpact, statResult.playerTwoImpact);

    if (maxImpact === 0) {
      return 0;
    }

    return Math.abs(statResult.playerOneImpact - statResult.playerTwoImpact) / maxImpact;
  }

  const playerOneValue = Number(statResult.playerOneValue);
  const playerTwoValue = Number(statResult.playerTwoValue);
  const maxValue = Math.max(playerOneValue, playerTwoValue);

  if (maxValue === 0) {
    return 0;
  }

  return Math.abs(playerOneValue - playerTwoValue) / maxValue;
}
