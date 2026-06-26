import {
  getPositionAdjustedScore,
  getPrimaryRole,
  normalizeStatValue
} from "./scoring.js";

function getBestValue(players, stat) {
  const values = players.map((player) => Number(player[stat.key]));

  if (stat.better === "lower") {
    return Math.min(...values);
  }

  return Math.max(...values);
}

function getStatCellClass(player, players, stat) {
  const value = Number(player[stat.key]);
  const bestValue = getBestValue(players, stat);

  if (value !== bestValue) {
    return "loser";
  }

  const tiedBestCount = players.filter((candidate) => {
    return Number(candidate[stat.key]) === bestValue;
  }).length;

  return tiedBestCount > 1 ? "tie" : "winner";
}

function getCategoryWins(player, players, stats) {
  return stats.reduce((wins, stat) => {
    const cellClass = getStatCellClass(player, players, stat);

    if (cellClass === "winner") {
      return wins + 1;
    }

    if (cellClass === "tie") {
      return wins + 0.5;
    }

    return wins;
  }, 0);
}

function getLensScore(player, stats) {
  if (stats.length === 0) {
    return 0;
  }

  const total = stats.reduce((sum, stat) => {
    return sum + normalizeStatValue(player, stat);
  }, 0);

  return total / stats.length;
}

export function getMultiCompareRows(players, stats, statConfig, activeMode) {
  const rows = players.map((player) => {
    const categoryWins = getCategoryWins(player, players, stats);
    const lensScore = getLensScore(player, stats);
    const roleScore =
      activeMode === "position"
        ? getPositionAdjustedScore(player, statConfig, activeMode)
        : null;

    return {
      player,
      role: getPrimaryRole(player),
      categoryWins,
      lensScore,
      roleScore,
      statCells: stats.map((stat) => {
        return {
          stat,
          value: player[stat.key],
          className: getStatCellClass(player, players, stat)
        };
      })
    };
  });

  return rows.sort((rowA, rowB) => {
    if (activeMode === "position") {
      return rowB.roleScore - rowA.roleScore || rowB.lensScore - rowA.lensScore;
    }

    return rowB.categoryWins - rowA.categoryWins || rowB.lensScore - rowA.lensScore;
  });
}
