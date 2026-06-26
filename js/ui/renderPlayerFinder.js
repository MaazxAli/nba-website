import { getRoleLabel } from "../lib/format.js";
import {
  formatSampleSize,
  getPlayerStatus,
  hasPlayerStats,
  meetsSampleSize
} from "../lib/playerDataQuality.js";
import { getPrimaryRole } from "../lib/scoring.js";
import { getPlayerArchetype } from "./renderPlayerCard.js";

function getUniqueValues(players, key) {
  return [
    ...new Set(
      players
        .map((player) => player[key])
        .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
    )
  ].sort((a, b) => a.localeCompare(b));
}

function populateSelect(selectElement, options, defaultLabel) {
  selectElement.innerHTML = `<option value="">${defaultLabel}</option>`;

  options.forEach((option) => {
    const optionElement = document.createElement("option");

    optionElement.value = option;
    optionElement.textContent = option;
    selectElement.appendChild(optionElement);
  });
}

function matchesSearch(player, searchText) {
  if (searchText === "") {
    return true;
  }

  const searchableText = `${player.name} ${player.team} ${player.position} ${player.season}`.toLowerCase();

  return searchableText.includes(searchText);
}

function matchesQuickFilter(player, quickFilter) {
  if (quickFilter === "") {
    return true;
  }

  if (quickFilter === "guard" || quickFilter === "wing" || quickFilter === "big") {
    return getPrimaryRole(player) === quickFilter;
  }

  if (quickFilter === "shooters") {
    if (!hasPlayerStats(player)) {
      return false;
    }

    return player.threePercent >= 40 || player.ftPercent >= 88;
  }

  if (quickFilter === "playmakers") {
    if (!hasPlayerStats(player)) {
      return false;
    }

    return player.assists >= 7;
  }

  if (quickFilter === "defenders") {
    if (!hasPlayerStats(player)) {
      return false;
    }

    return player.rebounds >= 10 || player.steals >= 1.3 || player.blocks >= 1.2;
  }

  return true;
}

export function setupPlayerFinderFilters(players, elements) {
  const { finderTeamSelect, finderPositionSelect } = elements;

  populateSelect(finderTeamSelect, getUniqueValues(players, "team"), "All teams");
  populateSelect(finderPositionSelect, getUniqueValues(players, "position"), "All positions");
}

export function getFilteredPlayers(players, filters) {
  const searchText = filters.searchText.trim().toLowerCase();

  return players.filter((player) => {
    const playerRole = getPrimaryRole(player);

    return (
      matchesSearch(player, searchText) &&
      (filters.team === "" || player.team === filters.team) &&
      (filters.position === "" || player.position === filters.position) &&
      (filters.role === "" || playerRole === filters.role) &&
      matchesQuickFilter(player, filters.quickFilter || "") &&
      meetsSampleSize(player, filters)
    );
  });
}

export function setPlayerFinderExpanded(elements, isExpanded) {
  const { playerFinderToggle, playerFinderContent, playerFinderPanel, playerFinderChevron } = elements;

  playerFinderToggle.setAttribute("aria-expanded", String(isExpanded));
  playerFinderContent.classList.toggle("hidden", !isExpanded);
  playerFinderPanel.classList.toggle("expanded", isExpanded);
  playerFinderChevron.textContent = "";
}

export function renderPlayerFinderResults({
  players,
  elements,
  onSetPlayerOne,
  onSetPlayerTwo,
  onAddToMulti,
  onOpenProfile
}) {
  const { playerFinderCount, playerFinderResults } = elements;

  playerFinderCount.textContent =
    players.length === 1 ? "1 player found" : `${players.length} players found`;
  playerFinderResults.innerHTML = "";

  if (players.length === 0) {
    playerFinderResults.innerHTML = `
      <div class="finder-empty-state">
        <strong>No players match those filters.</strong>
        <span>Try a broader team, position, role, or search term.</span>
      </div>
    `;
    return;
  }

  players.forEach((player) => {
    const role = getPrimaryRole(player);
    const canCompare = hasPlayerStats(player);
    const card = document.createElement("article");

    card.classList.add("finder-player-card");
    card.classList.toggle("no-stats-player", !canCompare);
    card.innerHTML = `
      <div class="finder-player-main">
        <div>
          <h4>${player.name}</h4>
          <p>${player.team} • ${player.position} • ${player.season}</p>
        </div>
        <span class="finder-role-badge">${getRoleLabel(role)}</span>
      </div>

      <div class="finder-data-row">
        <span class="data-status-badge ${canCompare ? "available" : "unavailable"}">
          ${getPlayerStatus(player)}
        </span>
        <span class="sample-size-label">${formatSampleSize(player)}</span>
      </div>

      <div class="finder-archetype">${canCompare ? getPlayerArchetype(player) : "Unavailable for comparison"}</div>

      <div class="finder-actions">
        <button class="ghost-button finder-action" type="button" data-action="profile">
          View Profile
        </button>
        <button class="secondary-button finder-action" type="button" data-action="playerOne">
          Set as Player 1
        </button>
        <button class="secondary-button finder-action" type="button" data-action="playerTwo">
          Set as Player 2
        </button>
        <button class="ghost-button finder-action" type="button" data-action="multi">
          Add to Multi-Compare
        </button>
      </div>
    `;

    card.querySelector('[data-action="playerOne"]').addEventListener("click", () => {
      onSetPlayerOne(player);
    });
    card.querySelector('[data-action="profile"]').addEventListener("click", () => {
      onOpenProfile(player);
    });
    card.querySelector('[data-action="playerTwo"]').addEventListener("click", () => {
      onSetPlayerTwo(player);
    });
    card.querySelector('[data-action="multi"]').addEventListener("click", () => {
      onAddToMulti(player);
    });

    playerFinderResults.appendChild(card);
  });
}
