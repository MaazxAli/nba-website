import { comparisonModes } from "../config/modes.js";
import { formatValue, getInitials, getRoleLabel } from "../lib/format.js";
import { formatSampleSize, getPlayerStatus, hasPlayerStats } from "../lib/playerDataQuality.js";
import {
  getActiveStats,
  getPositionAdjustedScore,
  getPrimaryRole,
  normalizeStatValue
} from "../lib/scoring.js";
import { getPlayerArchetype } from "./renderPlayerCard.js";

const mainStats = [
  { key: "points", label: "PTS" },
  { key: "rebounds", label: "REB" },
  { key: "assists", label: "AST" },
  { key: "steals", label: "STL" },
  { key: "blocks", label: "BLK" }
];

const shootingStats = [
  { key: "fgPercent", label: "FG%", suffix: "%" },
  { key: "threePercent", label: "3P%", suffix: "%" },
  { key: "ftPercent", label: "FT%", suffix: "%" }
];

function getLensScore(player, statConfig, activeMode) {
  if (!hasPlayerStats(player)) {
    return "N/A";
  }

  if (activeMode === "position") {
    return getPositionAdjustedScore(player, statConfig, activeMode).toFixed(1);
  }

  const stats = getActiveStats(statConfig, activeMode);

  if (stats.length === 0) {
    return "N/A";
  }

  const total = stats.reduce((sum, stat) => {
    return sum + normalizeStatValue(player, stat);
  }, 0);

  return (total / stats.length).toFixed(1);
}

function getStatTileContent(player, stat) {
  return `
    <div class="profile-stat-tile">
      <span>${stat.label}</span>
      <strong>${formatValue(player[stat.key], stat.suffix || "")}</strong>
    </div>
  `;
}

export function openPlayerProfileModal({
  player,
  activeMode,
  statConfig,
  elements,
  onComparePlayer,
  onAddToMulti
}) {
  const { modal, title, body, closeButton, compareButton, multiButton } = elements;
  const canCompare = hasPlayerStats(player);
  const role = getPrimaryRole(player);
  const lensLabel = comparisonModes[activeMode]?.label || "Current Lens";

  title.textContent = `${player.name} profile`;
  body.innerHTML = `
    <div class="profile-hero">
      <div class="profile-avatar">${getInitials(player.name)}</div>
      <div class="profile-heading">
        <h3>${player.name}</h3>
        <p>${player.team} • ${player.position} • ${player.season}</p>
        <div class="profile-badges">
          <span class="data-status-badge ${canCompare ? "available" : "unavailable"}">${getPlayerStatus(player)}</span>
          <span class="sample-size-label">${formatSampleSize(player)}</span>
          <span class="profile-role-badge">${getRoleLabel(role)}</span>
        </div>
      </div>
    </div>

    <div class="profile-summary-grid">
      <div class="profile-summary-card">
        <span>Archetype</span>
        <strong>${getPlayerArchetype(player)}</strong>
      </div>
      <div class="profile-summary-card">
        <span>${lensLabel} Score</span>
        <strong>${getLensScore(player, statConfig, activeMode)}</strong>
      </div>
      <div class="profile-summary-card">
        <span>Games</span>
        <strong>${formatValue(player.gamesPlayed)}</strong>
      </div>
      <div class="profile-summary-card">
        <span>Minutes</span>
        <strong>${formatValue(player.minutes)}</strong>
      </div>
    </div>

    <section class="profile-section">
      <h4>Box Score Profile</h4>
      <div class="profile-stat-grid">
        ${mainStats.map((stat) => getStatTileContent(player, stat)).join("")}
      </div>
    </section>

    <section class="profile-section">
      <h4>Shooting Splits</h4>
      <div class="profile-stat-grid">
        ${shootingStats.map((stat) => getStatTileContent(player, stat)).join("")}
      </div>
    </section>
  `;

  compareButton.onclick = () => {
    onComparePlayer(player);
  };
  multiButton.onclick = () => {
    onAddToMulti(player);
  };
  closeButton.onclick = () => {
    closePlayerProfileModal(elements);
  };

  multiButton.disabled = !canCompare;
  multiButton.title = canCompare ? "" : "No regular-season stats available";

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  closeButton.focus();
}

export function closePlayerProfileModal(elements) {
  const { modal, title, body, compareButton, multiButton } = elements;

  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  title.textContent = "Player profile";
  body.innerHTML = "";
  compareButton.onclick = null;
  multiButton.onclick = null;
  multiButton.disabled = false;
  multiButton.removeAttribute("title");
}
