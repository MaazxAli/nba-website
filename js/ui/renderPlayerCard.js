import { teamStyles } from "../config/teams.js";
import { formatValue, getInitials, getRoleLabel } from "../lib/format.js";
import { formatSampleSize, getPlayerStatus, hasPlayerStats } from "../lib/playerDataQuality.js";
import { getPrimaryRole, getStatClass } from "../lib/scoring.js";

function getTeamStyle(player) {
  return (
    teamStyles[player.team] || {
      primary: "#60a5fa",
      secondary: "#facc15"
    }
  );
}

function getBarWidth(player, otherPlayer, stat, statResult = null, activeMode) {
  let playerValue = Number(player[stat.key]);
  let otherValue = Number(otherPlayer[stat.key]);

  if (activeMode === "position" && statResult) {
    playerValue =
      statResult.playerOne.name === player.name
        ? statResult.playerOneImpact
        : statResult.playerTwoImpact;

    otherValue =
      statResult.playerOne.name === player.name
        ? statResult.playerTwoImpact
        : statResult.playerOneImpact;
  }

  if (playerValue === otherValue) {
    return 80;
  }

  const maxValue = Math.max(playerValue, otherValue);

  if (maxValue === 0) {
    return 18;
  }

  return Math.max(18, (playerValue / maxValue) * 100);
}

const statGroups = [
  {
    label: "Scoring",
    statKeys: ["points"]
  },
  {
    label: "Playmaking",
    statKeys: ["assists", "turnovers"]
  },
  {
    label: "Defense / Rebounding",
    statKeys: ["rebounds", "steals", "blocks"]
  },
  {
    label: "Efficiency",
    statKeys: ["fgPercent", "threePercent", "ftPercent"]
  }
];

export function getPlayerArchetype(player) {
  if (!hasPlayerStats(player)) {
    return "No Regular-Season Stats";
  }

  if (player.points >= 30 && player.assists >= 7) {
    return "Offensive Engine";
  }

  if (player.points >= 28 && player.fgPercent >= 55) {
    return "Interior Force";
  }

  if (player.threePercent >= 40 && player.ftPercent >= 88) {
    return "Elite Shooter";
  }

  if (player.assists >= 8.5) {
    return "Playmaking Hub";
  }

  if (player.blocks >= 1.5 || player.rebounds >= 12) {
    return "Defensive Anchor";
  }

  if (player.steals >= 1.6) {
    return "Two-Way Disruptor";
  }

  if (player.points >= 25) {
    return "Primary Scorer";
  }

  return "All-Around Contributor";
}

export function applyPlayerBranding(player, side, activeMode) {
  const card = document.getElementById(`player${side}Card`);
  const avatar = document.getElementById(`player${side}Avatar`);
  const archetype = document.getElementById(`player${side}Archetype`);
  const style = getTeamStyle(player);

  card.classList.remove("empty-card");
  card.style.setProperty("--card-primary", style.primary);
  card.style.setProperty("--card-secondary", style.secondary);

  avatar.textContent = getInitials(player.name);
  archetype.textContent =
    activeMode === "position"
      ? `${getRoleLabel(getPrimaryRole(player))} Lens • ${getPlayerArchetype(player)}`
      : getPlayerArchetype(player);
}

export function renderPlayerCard(player, otherPlayer, side, statResults, activeMode) {
  const nameElement = document.getElementById(`player${side}Name`);
  const metaElement = document.getElementById(`player${side}Meta`);
  const statsElement = document.getElementById(`player${side}Stats`);

  applyPlayerBranding(player, side, activeMode);

  nameElement.textContent = player.name;

  if (activeMode === "position") {
    metaElement.textContent = `${player.team} • ${player.position} • ${player.season} • ${formatSampleSize(player)} • ${getRoleLabel(
      getPrimaryRole(player)
    )}`;
  } else {
    metaElement.textContent = `${player.team} • ${player.position} • ${player.season} • ${formatSampleSize(player)} • ${getPlayerStatus(player)}`;
  }

  statsElement.innerHTML = "";
  statsElement.classList.remove("empty-state");

  const statResultsByKey = new Map(
    statResults.map((statResult) => {
      return [statResult.stat.key, statResult];
    })
  );

  statGroups.forEach((group) => {
    const visibleStatResults = group.statKeys
      .map((statKey) => statResultsByKey.get(statKey))
      .filter(Boolean);

    if (visibleStatResults.length === 0) {
      return;
    }

    const section = document.createElement("section");
    section.classList.add("stat-section");

    const header = document.createElement("h4");
    header.classList.add("stat-section-title");
    header.textContent = group.label;
    section.appendChild(header);

    const rows = document.createElement("div");
    rows.classList.add("stat-section-rows");

    visibleStatResults.forEach((statResult) => {
      const stat = statResult.stat;
      const playerSide = side === "One" ? 1 : 2;
      const statClass = getStatClass(playerSide, statResult.result);
      const barWidth = getBarWidth(player, otherPlayer, stat, statResult, activeMode);

      const statRow = document.createElement("div");
      statRow.classList.add("stat-row", statClass);

      const roleImpactText =
        activeMode === "position"
          ? `<small class="role-impact">Role impact: ${
              side === "One"
                ? statResult.playerOneImpact.toFixed(1)
                : statResult.playerTwoImpact.toFixed(1)
            }</small>`
          : "";

      statRow.innerHTML = `
        <div class="stat-line">
          <span>${stat.label}</span>
          <strong>${formatValue(player[stat.key], stat.suffix || "")}</strong>
        </div>

        ${roleImpactText}

        <div class="bar-track">
          <div class="bar-fill ${statClass}" style="width: ${barWidth}%"></div>
        </div>
      `;

      rows.appendChild(statRow);
    });

    section.appendChild(rows);
    statsElement.appendChild(section);
  });
}
