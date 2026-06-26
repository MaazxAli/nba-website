import { seasons, statConfig } from "../data/players.js";
import { comparisonModes } from "./config/modes.js";
import { popularComparisons } from "./config/popularComparisons.js";
import { getPlayerMatches, findExactPlayerByName, findPlayer } from "./lib/search.js";
import { formatSampleSize, getPlayerStatus, hasPlayerStats } from "./lib/playerDataQuality.js";
import { validatePlayerData } from "./lib/validatePlayerData.js";
import {
  compareStat,
  getActiveStats,
  getPositionAdjustedScore,
  getRoleImpact
} from "./lib/scoring.js";
import { getMultiCompareRows } from "./lib/multiCompare.js";
import { renderPopularComparisons } from "./ui/renderPopularComparisons.js";
import { renderPlayerCard } from "./ui/renderPlayerCard.js";
import { updateScoreboard } from "./ui/renderScoreboard.js";
import { setInsightsExpanded, updateInsights } from "./ui/renderInsights.js";
import {
  clearMultiCompareResults,
  renderMultiCompareResults
} from "./ui/renderMultiCompare.js";
import {
  getFilteredPlayers,
  renderPlayerFinderResults,
  setPlayerFinderExpanded,
  setupPlayerFinderFilters
} from "./ui/renderPlayerFinder.js";

const playerOneInput = document.getElementById("playerOneInput");
const playerTwoInput = document.getElementById("playerTwoInput");
const playerOneSuggestions = document.getElementById("playerOneSuggestions");
const playerTwoSuggestions = document.getElementById("playerTwoSuggestions");
const compareBtn = document.getElementById("compareBtn");
const swapBtn = document.getElementById("swapBtn");
const clearBtn = document.getElementById("clearBtn");
const headToHeadSelectedChips = document.getElementById("headToHeadSelectedChips");
const resultSummary = document.getElementById("resultSummary");
const messageBox = document.getElementById("messageBox");
const statNote = document.getElementById("statNote");
const seasonSelect = document.getElementById("seasonSelect");
const seasonStatus = document.getElementById("seasonStatus");

const compareTypeButtons = document.querySelectorAll(".compare-type-button");
const headToHeadView = document.getElementById("headToHeadView");
const headToHeadResults = document.getElementById("headToHeadResults");
const multiCompareView = document.getElementById("multiCompareView");
const multiPlayerInputs = document.getElementById("multiPlayerInputs");
const addMultiPlayerBtn = document.getElementById("addMultiPlayerBtn");
const compareMultiBtn = document.getElementById("compareMultiBtn");
const clearMultiBtn = document.getElementById("clearMultiBtn");
const multiSelectedChips = document.getElementById("multiSelectedChips");
const multiEmptyState = document.getElementById("multiEmptyState");
const multiResults = document.getElementById("multiResults");
const multiRankingSummary = document.getElementById("multiRankingSummary");
const multiTableHead = document.getElementById("multiTableHead");
const multiTableBody = document.getElementById("multiTableBody");

const playerFinderPanel = document.getElementById("playerFinderPanel");
const playerFinderToggle = document.getElementById("playerFinderToggle");
const playerFinderContent = document.getElementById("playerFinderContent");
const playerFinderChevron = document.getElementById("playerFinderChevron");
const finderSearchInput = document.getElementById("finderSearchInput");
const finderTeamSelect = document.getElementById("finderTeamSelect");
const finderPositionSelect = document.getElementById("finderPositionSelect");
const finderRoleSelect = document.getElementById("finderRoleSelect");
const finderMinGamesInput = document.getElementById("finderMinGamesInput");
const finderMinMinutesInput = document.getElementById("finderMinMinutesInput");
const finderIncludeNoStatsInput = document.getElementById("finderIncludeNoStatsInput");
const resetFinderFiltersBtn = document.getElementById("resetFinderFiltersBtn");
const playerFinderCount = document.getElementById("playerFinderCount");
const playerFinderResults = document.getElementById("playerFinderResults");
const finderQuickButtons = document.querySelectorAll(".finder-filter-chip");

const playerOneScoreName = document.getElementById("playerOneScoreName");
const playerTwoScoreName = document.getElementById("playerTwoScoreName");
const playerOneScore = document.getElementById("playerOneScore");
const playerTwoScore = document.getElementById("playerTwoScore");
const tieScore = document.getElementById("tieScore");
const playerOneScoreCaption = document.getElementById("playerOneScoreCaption");
const playerTwoScoreCaption = document.getElementById("playerTwoScoreCaption");
const middleScoreLabel = document.getElementById("middleScoreLabel");
const middleScoreCaption = document.getElementById("middleScoreCaption");

const playerOneBadge = document.getElementById("playerOneBadge");
const playerTwoBadge = document.getElementById("playerTwoBadge");

const insightsPanel = document.getElementById("insightsPanel");
const insightsToggle = document.getElementById("insightsToggle");
const insightsContent = document.getElementById("insightsContent");
const insightsChevron = document.getElementById("insightsChevron");
const overallEdgeText = document.getElementById("overallEdgeText");
const styleTakeaway = document.getElementById("styleTakeaway");
const advantageList = document.getElementById("advantageList");
const profileInsight = document.getElementById("profileInsight");

const popularComparisonsElement = document.getElementById("popularComparisons");
const modeButtons = document.querySelectorAll(".mode-button");
const themeButtons = document.querySelectorAll(".theme-button");

const scoreboardElements = {
  playerOneScoreName,
  playerTwoScoreName,
  playerOneScore,
  playerTwoScore,
  tieScore,
  playerOneScoreCaption,
  playerTwoScoreCaption,
  middleScoreLabel,
  middleScoreCaption,
  playerOneBadge,
  playerTwoBadge
};

const insightElements = {
  insightsPanel,
  insightsToggle,
  insightsContent,
  insightsChevron,
  overallEdgeText,
  styleTakeaway,
  advantageList,
  profileInsight
};

const multiElements = {
  multiResults,
  multiRankingSummary,
  multiTableHead,
  multiTableBody
};

const playerFinderElements = {
  playerFinderPanel,
  playerFinderToggle,
  playerFinderContent,
  playerFinderChevron,
  finderTeamSelect,
  finderPositionSelect,
  playerFinderCount,
  playerFinderResults
};

const defaultFinderSampleFilters = {
  minGames: 10,
  minMinutes: 10,
  includeNoStats: false
};

let activeMode = "all";
let activeCompareView = "headToHead";
let activeSeason = "2025-26";
let activePlayers = getPlayersForSeason(activeSeason);
let multiPlayerValues = ["", "", ""];
let multiHasResults = false;
let activeFinderQuickFilter = "";

validatePlayerData(seasons);

function getSeasonEntries() {
  return Object.entries(seasons);
}

function getPlayersForSeason(seasonKey) {
  return seasons[seasonKey]?.players || [];
}

function populateSeasonSelector() {
  seasonSelect.innerHTML = "";

  getSeasonEntries().forEach(([seasonKey, season]) => {
    const option = document.createElement("option");

    option.value = seasonKey;
    option.textContent = season.label || seasonKey;
    seasonSelect.appendChild(option);
  });

  seasonSelect.value = activeSeason;
}

function updateSeasonStatus() {
  const season = seasons[activeSeason];
  const seasonLabel = season?.label || activeSeason;

  seasonStatus.textContent = `Current dataset: ${seasonLabel} NBA season`;
}

function refreshSeasonDependentViews() {
  activePlayers = getPlayersForSeason(activeSeason);

  setupPlayerFinderFilters(activePlayers, playerFinderElements);
  updatePlayerFinderResults();
  renderSelectedPlayerChips();
  renderPopularComparisons({
    popularComparisonsElement,
    popularComparisons,
    findExactPlayerByName: (inputValue) => {
      const player = getExactPlayer(inputValue);

      return player && hasPlayerStats(player) ? player : null;
    },
    playerOneInput,
    playerTwoInput,
    comparePlayers
  });
  updateSeasonStatus();
}

function handleSeasonChange(seasonKey) {
  if (!seasons[seasonKey]) {
    showMessage("That season is not available yet.");
    seasonSelect.value = activeSeason;
    return;
  }

  if (seasonKey === activeSeason) {
    updateSeasonStatus();
    return;
  }

  activeSeason = seasonKey;
  playerOneInput.value = "";
  playerTwoInput.value = "";
  multiPlayerValues = ["", "", ""];
  multiHasResults = false;
  activeFinderQuickFilter = "";

  clearComparison();
  renderMultiPlayerInputs();
  clearMultiCompareResults(multiElements);
  updateMultiResultsVisibility();
  resetPlayerFinderFilters({ useDefaultSampleSize: true });
  refreshSeasonDependentViews();
  showMessage(`${seasons[activeSeason].label || activeSeason} season loaded.`, "info");
}

function applyTheme(theme) {
  const normalizedTheme = theme === "light" ? "light" : "dark";

  document.documentElement.dataset.theme = normalizedTheme;

  themeButtons.forEach((button) => {
    const isActive = button.dataset.themeOption === normalizedTheme;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  try {
    localStorage.setItem("nbaCompareTheme", normalizedTheme);
  } catch (error) {
    // Theme still applies for this page view if browser storage is unavailable.
  }
}

function initializeTheme() {
  let savedTheme = document.documentElement.dataset.theme;

  try {
    savedTheme = localStorage.getItem("nbaCompareTheme") || savedTheme;
  } catch (error) {
    savedTheme = savedTheme || "dark";
  }

  applyTheme(savedTheme);
}

function getExactPlayer(inputValue) {
  return findExactPlayerByName(activePlayers, inputValue);
}

function showMessage(message, type = "error") {
  messageBox.textContent = message;
  messageBox.className = `message-box ${type}`;
}

function clearMessage() {
  messageBox.textContent = "";
  messageBox.className = "message-box hidden";
}

function setResultSummary(message, badgeText = "Ready", badgeTone = "neutral") {
  resultSummary.innerHTML = "";

  const badge = document.createElement("span");
  badge.classList.add("result-badge", `result-badge-${badgeTone}`);
  badge.textContent = badgeText;

  const copy = document.createElement("span");
  copy.textContent = message;

  resultSummary.appendChild(badge);
  resultSummary.appendChild(copy);
}

function hideSuggestions(suggestionsBox) {
  suggestionsBox.classList.remove("show");
}

function showSuggestions(input, suggestionsBox, onSelect = selectPlayer) {
  const matches = getPlayerMatches(activePlayers, input.value).slice(0, 6);

  suggestionsBox.innerHTML = "";

  if (matches.length === 0) {
    hideSuggestions(suggestionsBox);
    return;
  }

  matches.forEach((player) => {
    const item = document.createElement("div");
    item.classList.add("suggestion-item");

    item.innerHTML = `
      <span class="suggestion-name">${player.name}</span>
      <span class="suggestion-meta">
        ${player.team} • ${player.position} • ${player.season} • ${getPlayerStatus(player)} • ${formatSampleSize(player)}
      </span>
    `;

    item.addEventListener("mousedown", (event) => {
      event.preventDefault();
      onSelect(input, suggestionsBox, player);
    });

    suggestionsBox.appendChild(item);
  });

  suggestionsBox.classList.add("show");
}

function selectPlayer(input, suggestionsBox, player) {
  input.value = player.name;
  hideSuggestions(suggestionsBox);
  clearMessage();
  renderSelectedPlayerChips();
}

function clearInputForNewSearch(input, suggestionsBox) {
  const selectedPlayer = getExactPlayer(input.value);

  if (selectedPlayer) {
    input.value = "";
  }

  showSuggestions(input, suggestionsBox);
}

function hideSuggestionsLater(suggestionsBox) {
  setTimeout(() => {
    hideSuggestions(suggestionsBox);
  }, 150);
}

function handleSearchEnter(event, input, suggestionsBox, nextInput) {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();

  const exactPlayer = getExactPlayer(input.value);

  if (exactPlayer) {
    selectPlayer(input, suggestionsBox, exactPlayer);

    const playerOne = getExactPlayer(playerOneInput.value);
    const playerTwo = getExactPlayer(playerTwoInput.value);

    if (playerOne && playerTwo) {
      comparePlayers();
    } else if (nextInput) {
      nextInput.focus();
    }

    return;
  }

  const matches = getPlayerMatches(activePlayers, input.value).slice(0, 6);

  if (matches.length > 0) {
    selectPlayer(input, suggestionsBox, matches[0]);

    if (nextInput) {
      nextInput.focus();
    } else {
      const playerOne = getExactPlayer(playerOneInput.value);
      const playerTwo = getExactPlayer(playerTwoInput.value);

      if (playerOne && playerTwo) {
        comparePlayers();
      }
    }

    return;
  }

  comparePlayers();
}

function createSelectedChip(label, player, onRemove) {
  const chip = document.createElement("span");
  chip.classList.add("selected-player-chip");

  const copy = document.createElement("span");
  copy.innerHTML = `<small>${label}</small><strong>${player.name}</strong>`;

  const removeButton = document.createElement("button");
  removeButton.classList.add("selected-chip-remove");
  removeButton.type = "button";
  removeButton.setAttribute("aria-label", `Remove ${player.name}`);
  removeButton.textContent = "×";
  removeButton.addEventListener("click", onRemove);

  chip.appendChild(copy);
  chip.appendChild(removeButton);

  return chip;
}

function renderChipHint(container, message) {
  container.innerHTML = "";

  const hint = document.createElement("span");
  hint.classList.add("selected-player-hint");
  hint.textContent = message;

  container.appendChild(hint);
}

function removeMultiPlayerAtIndex(index) {
  multiPlayerValues[index] = "";
  clearStaleMultiResults();
  renderMultiPlayerInputs();
}

function renderSelectedPlayerChips() {
  headToHeadSelectedChips.innerHTML = "";

  const playerOne = getExactPlayer(playerOneInput.value);
  const playerTwo = getExactPlayer(playerTwoInput.value);

  if (!playerOne && !playerTwo) {
    renderChipHint(headToHeadSelectedChips, "Select two players to unlock the scoreboard.");
  } else {
    if (playerOne) {
      headToHeadSelectedChips.appendChild(
        createSelectedChip("Player 1", playerOne, () => {
          playerOneInput.value = "";
          renderSelectedPlayerChips();
          clearMessage();
        })
      );
    }

    if (playerTwo) {
      headToHeadSelectedChips.appendChild(
        createSelectedChip("Player 2", playerTwo, () => {
          playerTwoInput.value = "";
          renderSelectedPlayerChips();
          clearMessage();
        })
      );
    }
  }

  multiSelectedChips.innerHTML = "";

  const selectedMultiPlayers = multiPlayerValues
    .map((value, index) => {
      return {
        index,
        player: getExactPlayer(value)
      };
    })
    .filter((entry) => entry.player);

  if (selectedMultiPlayers.length === 0) {
    renderChipHint(multiSelectedChips, "Add 3-4 players to build a ranking table.");
    return;
  }

  selectedMultiPlayers.forEach((entry) => {
    multiSelectedChips.appendChild(
      createSelectedChip(`P${entry.index + 1}`, entry.player, () => {
        removeMultiPlayerAtIndex(entry.index);
      })
    );
  });
}

function updateMultiResultsVisibility() {
  const isMultiView = activeCompareView === "multi";

  multiResults.classList.toggle("hidden", !isMultiView || !multiHasResults);
  multiEmptyState.classList.toggle("hidden", !isMultiView || multiHasResults);
}

function getMultiInputElements() {
  return Array.from(multiPlayerInputs.querySelectorAll(".multi-player-input"));
}

function getMultiSuggestionBoxes() {
  return Array.from(multiPlayerInputs.querySelectorAll(".multi-suggestions"));
}

function syncMultiPlayerValues() {
  multiPlayerValues = getMultiInputElements().map((input) => input.value);
}

function hideMultiSuggestions() {
  getMultiSuggestionBoxes().forEach((suggestionsBox) => {
    hideSuggestions(suggestionsBox);
  });
}

function clearStaleMultiResults() {
  if (!multiHasResults) {
    return;
  }

  multiHasResults = false;
  clearMultiCompareResults(multiElements);
  updateMultiResultsVisibility();
}

function selectMultiPlayer(index, input, suggestionsBox, player) {
  selectPlayer(input, suggestionsBox, player);
  multiPlayerValues[index] = player.name;
  renderSelectedPlayerChips();
}

function renderMultiPlayerInputs() {
  multiPlayerInputs.innerHTML = "";

  multiPlayerValues.forEach((value, index) => {
    const row = document.createElement("div");
    row.classList.add("multi-player-row");

    const searchWrapper = document.createElement("div");
    searchWrapper.classList.add("search-wrapper");

    const input = document.createElement("input");
    input.classList.add("multi-player-input");
    input.type = "text";
    input.placeholder = `Search Player ${index + 1}`;
    input.autocomplete = "off";
    input.value = value;

    const suggestionsBox = document.createElement("div");
    suggestionsBox.classList.add("suggestions", "multi-suggestions");

    input.addEventListener("input", () => {
      multiPlayerValues[index] = input.value;
      clearMessage();
      clearStaleMultiResults();
      renderSelectedPlayerChips();
      showSuggestions(input, suggestionsBox, (selectedInput, selectedSuggestionsBox, player) => {
        selectMultiPlayer(index, selectedInput, selectedSuggestionsBox, player);
      });
    });

    input.addEventListener("focus", () => {
      const previousValue = input.value;

      clearInputForNewSearch(input, suggestionsBox);
      multiPlayerValues[index] = input.value;

      if (input.value !== previousValue) {
        clearStaleMultiResults();
      }

      renderSelectedPlayerChips();
    });

    input.addEventListener("blur", () => {
      hideSuggestionsLater(suggestionsBox);
    });

    input.addEventListener("keydown", (event) => {
      handleMultiSearchEnter(event, index, input, suggestionsBox);
    });

    searchWrapper.appendChild(input);
    searchWrapper.appendChild(suggestionsBox);
    row.appendChild(searchWrapper);

    if (index >= 3) {
      const removeButton = document.createElement("button");
      removeButton.classList.add("ghost-button", "remove-multi-player");
      removeButton.type = "button";
      removeButton.textContent = "Remove";

      removeButton.addEventListener("click", () => {
        syncMultiPlayerValues();
        multiPlayerValues.splice(index, 1);
        renderMultiPlayerInputs();

        if (multiHasResults) {
          compareMultiPlayers();
        }
      });

      row.appendChild(removeButton);
    }

    multiPlayerInputs.appendChild(row);
  });

  addMultiPlayerBtn.disabled = multiPlayerValues.length >= 4;
  renderSelectedPlayerChips();
}

function handleMultiSearchEnter(event, index, input, suggestionsBox) {
  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();

  const exactPlayer = getExactPlayer(input.value);

  if (exactPlayer) {
    selectMultiPlayer(index, input, suggestionsBox, exactPlayer);
  } else {
    const matches = getPlayerMatches(activePlayers, input.value).slice(0, 6);

    if (matches.length > 0) {
      selectMultiPlayer(index, input, suggestionsBox, matches[0]);
    } else {
      compareMultiPlayers();
      return;
    }
  }

  const nextInput = getMultiInputElements()[index + 1];

  if (nextInput) {
    nextInput.focus();
    return;
  }

  compareMultiPlayers();
}

function getValidatedMultiPlayers() {
  const inputElements = getMultiInputElements();
  const selectedEntries = [];

  for (const [index, input] of inputElements.entries()) {
    const inputValue = input.value.trim();

    if (inputValue === "") {
      continue;
    }

    const result = findPlayer(activePlayers, inputValue);
    const inputLabel = `Player ${index + 1}`;

    if (!validateSearchResult(result, inputLabel)) {
      return null;
    }

    if (!hasPlayerStats(result.player)) {
      showMessage(`${result.player.name} has no regular-season stats for ${activeSeason} and cannot be ranked in Multi-Compare.`);
      return null;
    }

    selectedEntries.push({
      index,
      player: result.player
    });
  }

  if (selectedEntries.length < 3) {
    showMessage("Please select at least 3 valid players for Multi-Compare.");
    return null;
  }

  const uniqueNames = new Set(
    selectedEntries.map((entry) => {
      return entry.player.name.toLowerCase();
    })
  );

  if (uniqueNames.size !== selectedEntries.length) {
    showMessage("Please choose each player only once.");
    return null;
  }

  selectedEntries.forEach((entry) => {
    inputElements[entry.index].value = entry.player.name;
  });

  syncMultiPlayerValues();

  return selectedEntries.map((entry) => {
    return entry.player;
  });
}

function hasValidMultiSelection() {
  const playersByName = getMultiInputElements()
    .map((input) => getExactPlayer(input.value))
    .filter((player) => player && hasPlayerStats(player));
  const uniqueNames = new Set(
    playersByName.map((player) => {
      return player.name.toLowerCase();
    })
  );

  return playersByName.length >= 3 && uniqueNames.size === playersByName.length;
}

function compareMultiPlayers() {
  const selectedPlayers = getValidatedMultiPlayers();

  if (!selectedPlayers) {
    return;
  }

  const stats = getActiveStats(statConfig, activeMode);
  const rows = getMultiCompareRows(selectedPlayers, stats, statConfig, activeMode);

  renderMultiCompareResults({
    rows,
    stats,
    activeMode,
    elements: multiElements
  });

  multiHasResults = true;
  updateMultiResultsVisibility();
  statNote.textContent = comparisonModes[activeMode].note;
  clearMessage();
  hideMultiSuggestions();
}

function clearMultiComparison() {
  multiPlayerValues = ["", "", ""];
  multiHasResults = false;

  renderMultiPlayerInputs();
  clearMultiCompareResults(multiElements);
  updateMultiResultsVisibility();
  clearMessage();
  statNote.textContent = comparisonModes[activeMode].note;

  const firstInput = getMultiInputElements()[0];

  if (firstInput) {
    firstInput.focus();
  }
}

function getFinderFilters() {
  return {
    searchText: finderSearchInput.value,
    team: finderTeamSelect.value,
    position: finderPositionSelect.value,
    role: finderRoleSelect.value,
    quickFilter: activeFinderQuickFilter,
    minGames: finderMinGamesInput.value,
    minMinutes: finderMinMinutesInput.value,
    includeNoStats: finderIncludeNoStatsInput.checked
  };
}

function updateFinderQuickButtons() {
  finderQuickButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.finderFilter === activeFinderQuickFilter);
  });
}

function setFinderQuickFilter(filterValue) {
  activeFinderQuickFilter = filterValue;

  if (["guard", "wing", "big"].includes(activeFinderQuickFilter)) {
    finderRoleSelect.value = activeFinderQuickFilter;
  } else if (activeFinderQuickFilter !== "") {
    finderRoleSelect.value = "";
  }

  updateFinderQuickButtons();
  updatePlayerFinderResults();
  clearMessage();
}

function updatePlayerFinderResults() {
  const filteredPlayers = getFilteredPlayers(activePlayers, getFinderFilters());

  renderPlayerFinderResults({
    players: filteredPlayers,
    elements: playerFinderElements,
    onSetPlayerOne: setFinderPlayerOne,
    onSetPlayerTwo: setFinderPlayerTwo,
    onAddToMulti: addFinderPlayerToMultiCompare
  });
}

function setFinderSampleFilters({ minGames, minMinutes, includeNoStats }) {
  finderMinGamesInput.value = String(minGames);
  finderMinMinutesInput.value = String(minMinutes);
  finderIncludeNoStatsInput.checked = includeNoStats;
}

function resetPlayerFinderFilters(options = {}) {
  finderSearchInput.value = "";
  finderTeamSelect.value = "";
  finderPositionSelect.value = "";
  finderRoleSelect.value = "";
  setFinderSampleFilters(
    options.useDefaultSampleSize
      ? defaultFinderSampleFilters
      : {
          minGames: 0,
          minMinutes: 0,
          includeNoStats: true
        }
  );
  activeFinderQuickFilter = "";
  updateFinderQuickButtons();

  updatePlayerFinderResults();
  showMessage("Player Finder filters reset.", "info");
}

function setFinderPlayerOne(player) {
  playerOneInput.value = player.name;
  hideSuggestions(playerOneSuggestions);
  renderSelectedPlayerChips();

  const playerTwo = getExactPlayer(playerTwoInput.value);
  const readyText =
    playerTwo && hasPlayerStats(player) && hasPlayerStats(playerTwo)
      ? " Head-to-Head is ready to compare."
      : "";
  const statusText = hasPlayerStats(player) ? "" : " This player has no regular-season stats.";

  showMessage(`${player.name} set as Player 1.${statusText}${readyText}`, "info");
}

function setFinderPlayerTwo(player) {
  playerTwoInput.value = player.name;
  hideSuggestions(playerTwoSuggestions);
  renderSelectedPlayerChips();

  const playerOne = getExactPlayer(playerOneInput.value);
  const readyText =
    playerOne && hasPlayerStats(player) && hasPlayerStats(playerOne)
      ? " Head-to-Head is ready to compare."
      : "";
  const statusText = hasPlayerStats(player) ? "" : " This player has no regular-season stats.";

  showMessage(`${player.name} set as Player 2.${statusText}${readyText}`, "info");
}

function addFinderPlayerToMultiCompare(player) {
  if (!hasPlayerStats(player)) {
    showMessage(`${player.name} has no regular-season stats for ${activeSeason} and cannot be ranked in Multi-Compare.`);
    return;
  }

  syncMultiPlayerValues();

  const existingPlayers = multiPlayerValues
    .map((value) => getExactPlayer(value))
    .filter(Boolean);
  const alreadySelected = existingPlayers.some((selectedPlayer) => {
    return selectedPlayer.name === player.name;
  });

  if (alreadySelected) {
    showMessage(`${player.name} is already in Multi-Compare.`);
    return;
  }

  const emptyIndex = multiPlayerValues.findIndex((value) => value.trim() === "");

  if (emptyIndex !== -1) {
    multiPlayerValues[emptyIndex] = player.name;
  } else if (multiPlayerValues.length < 4) {
    multiPlayerValues.push(player.name);
  } else {
    showMessage("Multi-Compare already has 4 players. Remove one before adding another.");
    return;
  }

  clearStaleMultiResults();
  renderMultiPlayerInputs();

  const selectedCount = multiPlayerValues.filter((value) => getExactPlayer(value)).length;
  const readyText = selectedCount >= 3 ? " Multi-Compare is ready." : "";

  showMessage(`${player.name} added to Multi-Compare.${readyText}`, "info");
}

function getStatResults(playerOne, playerTwo) {
  const stats = getActiveStats(statConfig, activeMode);

  return stats.map((stat) => {
    if (activeMode === "position") {
      const playerOneImpact = getRoleImpact(playerOne, stat);
      const playerTwoImpact = getRoleImpact(playerTwo, stat);

      let result = 0;

      if (playerOneImpact > playerTwoImpact) {
        result = 1;
      } else if (playerTwoImpact > playerOneImpact) {
        result = 2;
      }

      return {
        stat,
        result,
        playerOne,
        playerTwo,
        playerOneValue: playerOne[stat.key],
        playerTwoValue: playerTwo[stat.key],
        playerOneImpact,
        playerTwoImpact
      };
    }

    const result = compareStat(playerOne, playerTwo, stat);

    return {
      stat,
      result,
      playerOne,
      playerTwo,
      playerOneValue: playerOne[stat.key],
      playerTwoValue: playerTwo[stat.key],
      playerOneImpact: null,
      playerTwoImpact: null
    };
  });
}

function validateSearchResult(result, inputLabel) {
  if (result.status === "empty") {
    showMessage(`Please search for ${inputLabel}.`);
    return false;
  }

  if (result.status === "none") {
    showMessage(`No player found for ${inputLabel}. Try typing part of a name, team, or position.`);
    return false;
  }

  if (result.status === "multiple") {
    showMessage(`Multiple players match ${inputLabel}. Please click a specific player from the suggestions.`);
    return false;
  }

  return true;
}

function showNoStatsMessage(player) {
  showMessage(`${player.name} has no regular-season stats for ${activeSeason}. Choose a player with available stats to compare.`);
}

function comparePlayers() {
  const playerOneResult = findPlayer(activePlayers, playerOneInput.value);
  const playerTwoResult = findPlayer(activePlayers, playerTwoInput.value);

  if (!validateSearchResult(playerOneResult, "Player 1")) {
    return;
  }

  if (!validateSearchResult(playerTwoResult, "Player 2")) {
    return;
  }

  const playerOne = playerOneResult.player;
  const playerTwo = playerTwoResult.player;

  if (playerOne.name === playerTwo.name) {
    showMessage("Please select two different players.");
    return;
  }

  if (!hasPlayerStats(playerOne)) {
    showNoStatsMessage(playerOne);
    return;
  }

  if (!hasPlayerStats(playerTwo)) {
    showNoStatsMessage(playerTwo);
    return;
  }

  clearMessage();

  let playerOneWins = 0;
  let playerTwoWins = 0;
  let ties = 0;

  const statResults = getStatResults(playerOne, playerTwo);

  statResults.forEach((statResult) => {
    if (statResult.result === 1) {
      playerOneWins++;
    } else if (statResult.result === 2) {
      playerTwoWins++;
    } else {
      ties++;
    }
  });

  const roleScores =
    activeMode === "position"
      ? {
          playerOneScore: getPositionAdjustedScore(playerOne, statConfig, activeMode),
          playerTwoScore: getPositionAdjustedScore(playerTwo, statConfig, activeMode)
        }
      : null;

  renderPlayerCard(playerOne, playerTwo, "One", statResults, activeMode);
  renderPlayerCard(playerTwo, playerOne, "Two", statResults, activeMode);
  updateScoreboard({
    playerOne,
    playerTwo,
    playerOneWins,
    playerTwoWins,
    ties,
    roleScores,
    activeMode,
    elements: scoreboardElements
  });
  updateInsights({
    playerOne,
    playerTwo,
    playerOneWins,
    playerTwoWins,
    ties,
    statResults,
    roleScores,
    activeMode,
    elements: insightElements
  });

  playerOneInput.value = playerOne.name;
  playerTwoInput.value = playerTwo.name;
  renderSelectedPlayerChips();

  if (activeMode === "position" && roleScores) {
    if (roleScores.playerOneScore > roleScores.playerTwoScore) {
      setResultSummary(
        `${playerOne.name} has the position-adjusted edge, scoring ${roleScores.playerOneScore.toFixed(
          1
        )} to ${roleScores.playerTwoScore.toFixed(1)} using role-weighted expectations.`,
        `${playerOne.name} leads`,
        "winner"
      );
    } else if (roleScores.playerTwoScore > roleScores.playerOneScore) {
      setResultSummary(
        `${playerTwo.name} has the position-adjusted edge, scoring ${roleScores.playerTwoScore.toFixed(
          1
        )} to ${roleScores.playerOneScore.toFixed(1)} using role-weighted expectations.`,
        `${playerTwo.name} leads`,
        "winner"
      );
    } else {
      setResultSummary(
        `This position-adjusted comparison is even at ${roleScores.playerOneScore.toFixed(
          1
        )}-${roleScores.playerTwoScore.toFixed(1)}.`,
        "Even",
        "tie"
      );
    }
  } else if (playerOneWins > playerTwoWins) {
    setResultSummary(
      `${playerOne.name} has the ${comparisonModes[
        activeMode
      ].label.toLowerCase()} edge, winning ${playerOneWins}-${playerTwoWins} across this lens.`,
      `${playerOne.name} leads`,
      "winner"
    );
  } else if (playerTwoWins > playerOneWins) {
    setResultSummary(
      `${playerTwo.name} has the ${comparisonModes[
        activeMode
      ].label.toLowerCase()} edge, winning ${playerTwoWins}-${playerOneWins} across this lens.`,
      `${playerTwo.name} leads`,
      "winner"
    );
  } else {
    setResultSummary(
      `This ${comparisonModes[
        activeMode
      ].label.toLowerCase()} comparison is even at ${playerOneWins}-${playerTwoWins}, with ${ties} tied categories.`,
      "Even",
      "tie"
    );
  }

  statNote.textContent = comparisonModes[activeMode].note;

  hideSuggestions(playerOneSuggestions);
  hideSuggestions(playerTwoSuggestions);
}

function swapPlayers() {
  const playerOne = getExactPlayer(playerOneInput.value);
  const playerTwo = getExactPlayer(playerTwoInput.value);

  if (!playerOne || !playerTwo) {
    showMessage("Please compare two valid players before swapping.");
    return;
  }

  playerOneInput.value = playerTwo.name;
  playerTwoInput.value = playerOne.name;

  comparePlayers();
}

function resetCard(side) {
  const card = document.getElementById(`player${side}Card`);
  const avatar = document.getElementById(`player${side}Avatar`);
  const archetype = document.getElementById(`player${side}Archetype`);
  const stats = document.getElementById(`player${side}Stats`);

  card.classList.add("empty-card");
  card.style.removeProperty("--card-primary");
  card.style.removeProperty("--card-secondary");

  avatar.textContent = side === "One" ? "P1" : "P2";
  archetype.textContent = "Choose a player";

  stats.classList.add("empty-state");
  stats.innerHTML =
    side === "One"
      ? "<p>Search a player to see their profile, strengths, and stat comparison.</p>"
      : "<p>Search a second player to compare strengths side by side.</p>";
}

function clearComparison() {
  playerOneInput.value = "";
  playerTwoInput.value = "";

  document.getElementById("playerOneName").textContent = "Player 1";
  document.getElementById("playerTwoName").textContent = "Player 2";
  document.getElementById("playerOneMeta").textContent = "Team • Position • Season";
  document.getElementById("playerTwoMeta").textContent = "Team • Position • Season";

  resetCard("One");
  resetCard("Two");

  playerOneScoreName.textContent = "Player 1";
  playerTwoScoreName.textContent = "Player 2";
  playerOneScore.textContent = "0";
  playerTwoScore.textContent = "0";
  tieScore.textContent = "0";

  playerOneScoreCaption.textContent = "category wins";
  playerTwoScoreCaption.textContent = "category wins";
  middleScoreLabel.textContent = "Tied";
  middleScoreCaption.textContent = "categories";

  playerOneBadge.className = "player-badge";
  playerTwoBadge.className = "player-badge";
  playerOneBadge.textContent = "Waiting";
  playerTwoBadge.textContent = "Waiting";

  setResultSummary("Search two players to begin.", "Ready", "neutral");
  statNote.textContent = comparisonModes[activeMode].note;

  setInsightsExpanded(insightElements, false);
  insightsPanel.classList.add("hidden");
  clearMessage();

  hideSuggestions(playerOneSuggestions);
  hideSuggestions(playerTwoSuggestions);
  renderSelectedPlayerChips();

  playerOneInput.focus();
}

function setActiveCompareView(compareView) {
  activeCompareView = compareView;

  const isMultiView = activeCompareView === "multi";

  compareTypeButtons.forEach((button) => {
    const isActive = button.dataset.compareView === activeCompareView;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  headToHeadView.classList.toggle("hidden", isMultiView);
  headToHeadResults.classList.toggle("hidden", isMultiView);
  multiCompareView.classList.toggle("hidden", !isMultiView);
  updateMultiResultsVisibility();

  clearMessage();

  if (isMultiView) {
    hideSuggestions(playerOneSuggestions);
    hideSuggestions(playerTwoSuggestions);

    const firstInput = getMultiInputElements()[0];

    if (firstInput) {
      firstInput.focus();
    }

    return;
  }

  hideMultiSuggestions();
}

function setActiveMode(mode) {
  activeMode = mode;

  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === activeMode);
  });

  statNote.textContent = comparisonModes[activeMode].note;

  if (activeCompareView === "multi") {
    if (hasValidMultiSelection()) {
      compareMultiPlayers();
    }

    return;
  }

  const playerOne = getExactPlayer(playerOneInput.value);
  const playerTwo = getExactPlayer(playerTwoInput.value);

  if (playerOne && playerTwo) {
    comparePlayers();
  }
}

playerOneInput.addEventListener("input", () => {
  clearMessage();
  renderSelectedPlayerChips();
  showSuggestions(playerOneInput, playerOneSuggestions);
});

playerTwoInput.addEventListener("input", () => {
  clearMessage();
  renderSelectedPlayerChips();
  showSuggestions(playerTwoInput, playerTwoSuggestions);
});

playerOneInput.addEventListener("focus", () => {
  clearInputForNewSearch(playerOneInput, playerOneSuggestions);
  renderSelectedPlayerChips();
});

playerTwoInput.addEventListener("focus", () => {
  clearInputForNewSearch(playerTwoInput, playerTwoSuggestions);
  renderSelectedPlayerChips();
});

playerOneInput.addEventListener("blur", () => {
  hideSuggestionsLater(playerOneSuggestions);
});

playerTwoInput.addEventListener("blur", () => {
  hideSuggestionsLater(playerTwoSuggestions);
});

playerOneInput.addEventListener("keydown", (event) => {
  handleSearchEnter(event, playerOneInput, playerOneSuggestions, playerTwoInput);
});

playerTwoInput.addEventListener("keydown", (event) => {
  handleSearchEnter(event, playerTwoInput, playerTwoSuggestions, null);
});

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveMode(button.dataset.mode);
  });
});

compareTypeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveCompareView(button.dataset.compareView);
  });
});

themeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyTheme(button.dataset.themeOption);
  });
});

seasonSelect.addEventListener("change", () => {
  handleSeasonChange(seasonSelect.value);
});

playerFinderToggle.addEventListener("click", () => {
  const isExpanded = playerFinderToggle.getAttribute("aria-expanded") === "true";
  setPlayerFinderExpanded(playerFinderElements, !isExpanded);
});

finderSearchInput.addEventListener("input", () => {
  updatePlayerFinderResults();
  clearMessage();
});

[finderTeamSelect, finderPositionSelect, finderRoleSelect].forEach((selectElement) => {
  selectElement.addEventListener("change", () => {
    if (selectElement === finderRoleSelect) {
      activeFinderQuickFilter = "";
      updateFinderQuickButtons();
    }

    updatePlayerFinderResults();
    clearMessage();
  });
});

[finderMinGamesInput, finderMinMinutesInput].forEach((inputElement) => {
  inputElement.addEventListener("input", () => {
    updatePlayerFinderResults();
    clearMessage();
  });
});

finderIncludeNoStatsInput.addEventListener("change", () => {
  updatePlayerFinderResults();
  clearMessage();
});

finderQuickButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setFinderQuickFilter(button.dataset.finderFilter);
  });
});

resetFinderFiltersBtn.addEventListener("click", resetPlayerFinderFilters);

compareBtn.addEventListener("click", comparePlayers);
swapBtn.addEventListener("click", swapPlayers);
clearBtn.addEventListener("click", clearComparison);
addMultiPlayerBtn.addEventListener("click", () => {
  if (multiPlayerValues.length >= 4) {
    return;
  }

  syncMultiPlayerValues();
  multiPlayerValues.push("");
  renderMultiPlayerInputs();

  const inputElements = getMultiInputElements();
  const lastInput = inputElements[inputElements.length - 1];

  if (lastInput) {
    lastInput.focus();
  }
});
compareMultiBtn.addEventListener("click", compareMultiPlayers);
clearMultiBtn.addEventListener("click", clearMultiComparison);

insightsToggle.addEventListener("click", () => {
  const isExpanded = insightsToggle.getAttribute("aria-expanded") === "true";
  setInsightsExpanded(insightElements, !isExpanded);
});

initializeTheme();
populateSeasonSelector();
setResultSummary("Search two players to begin.", "Ready", "neutral");
statNote.textContent = comparisonModes[activeMode].note;
renderMultiPlayerInputs();
updateFinderQuickButtons();
updateMultiResultsVisibility();
refreshSeasonDependentViews();
