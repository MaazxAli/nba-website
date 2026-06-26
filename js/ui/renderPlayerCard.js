import { teamStyles } from "../config/teams.js";
import {
  advancedStatDefinitions,
  formatAdvancedStatValue,
  getAdvancedStatValue
} from "../lib/advancedStats.js";
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

function getAdvancedStatResult(player, otherPlayer, stat) {
  const playerValue = getAdvancedStatValue(player, stat.key);
  const otherValue = getAdvancedStatValue(otherPlayer, stat.key);

  if (playerValue === null || otherValue === null || playerValue === otherValue) {
    return 0;
  }

  return playerValue > otherValue ? 1 : 2;
}

function getAdvancedBarWidth(playerValue, otherValue) {
  if (playerValue === null || otherValue === null) {
    return 18;
  }

  if (playerValue === otherValue) {
    return 80;
  }

  const maxValue = Math.max(playerValue, otherValue);

  if (maxValue <= 0) {
    return 18;
  }

  return Math.max(18, (playerValue / maxValue) * 100);
}

const statGroups = [
  {
    id: "scoring",
    label: "Scoring",
    statKeys: ["points"]
  },
  {
    id: "playmaking",
    label: "Playmaking",
    statKeys: ["assists", "turnovers"]
  },
  {
    id: "defense",
    label: "Defense / Rebounding",
    statKeys: ["rebounds", "steals", "blocks"]
  },
  {
    id: "efficiency",
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

export function renderPlayerCard(player, otherPlayer, side, statResults, activeMode, onOpenProfile = null) {
  const card = document.getElementById(`player${side}Card`);
  const headerElement = card.querySelector(".player-card-header");
  const nameElement = document.getElementById(`player${side}Name`);
  const metaElement = document.getElementById(`player${side}Meta`);
  const statsElement = document.getElementById(`player${side}Stats`);
  const previousProfileButton = card.querySelector(".profile-open-button");

  if (previousProfileButton) {
    previousProfileButton.remove();
  }

  applyPlayerBranding(player, side, activeMode);

  nameElement.textContent = player.name;

  if (activeMode === "position") {
    metaElement.textContent = `${player.team} • ${player.position} • ${player.season} • ${formatSampleSize(player)} • ${getRoleLabel(
      getPrimaryRole(player)
    )}`;
  } else {
    metaElement.textContent = `${player.team} • ${player.position} • ${player.season} • ${formatSampleSize(player)} • ${getPlayerStatus(player)}`;
  }

  if (onOpenProfile) {
    const profileButton = document.createElement("button");

    profileButton.classList.add("ghost-button", "profile-open-button");
    profileButton.type = "button";
    profileButton.textContent = "Profile";
    profileButton.addEventListener("click", () => {
      onOpenProfile(player);
    });
    headerElement.appendChild(profileButton);
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
    section.classList.add("stat-section", `stat-section-${group.id}`);

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

  const advancedSection = document.createElement("details");
  advancedSection.classList.add("stat-section", "advanced-stat-section");

  const advancedHeader = document.createElement("summary");
  advancedHeader.classList.add("stat-section-title", "advanced-stat-summary");
  advancedHeader.innerHTML = `
    <span>Advanced stats</span>
    <span class="accordion-icon-button" aria-hidden="true"></span>
  `;
  advancedSection.appendChild(advancedHeader);

  const advancedRows = document.createElement("div");
  advancedRows.classList.add("stat-section-rows");

  advancedStatDefinitions.forEach((stat) => {
    const playerValue = getAdvancedStatValue(player, stat.key);
    const otherValue = getAdvancedStatValue(otherPlayer, stat.key);
    const result = getAdvancedStatResult(player, otherPlayer, stat);
    const playerSide = side === "One" ? 1 : 2;
    const statClass = getStatClass(playerSide, result);
    const barWidth = getAdvancedBarWidth(playerValue, otherValue);
    const statRow = document.createElement("div");

    statRow.classList.add("stat-row", statClass);
    statRow.innerHTML = `
      <div class="stat-line">
        <span>${stat.label}</span>
        <strong>${formatAdvancedStatValue(playerValue, stat.suffix)}</strong>
      </div>

      <div class="bar-track">
        <div class="bar-fill ${statClass}" style="width: ${barWidth}%"></div>
      </div>
    `;

    advancedRows.appendChild(statRow);
  });

  advancedSection.appendChild(advancedRows);
  statsElement.appendChild(advancedSection);
}
