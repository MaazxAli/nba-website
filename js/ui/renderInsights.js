import { comparisonModes } from "../config/modes.js";
import { formatValue, getRoleLabel, getStrengthLabel } from "../lib/format.js";
import { getGapScore, getPrimaryRole } from "../lib/scoring.js";

export function setInsightsExpanded(elements, isExpanded) {
  const { insightsToggle, insightsContent, insightsPanel, insightsChevron } = elements;

  insightsToggle.setAttribute("aria-expanded", String(isExpanded));
  insightsContent.classList.toggle("hidden", !isExpanded);
  insightsPanel.classList.toggle("expanded", isExpanded);
  insightsChevron.textContent = "";
}

export function getPlayerStrengths(statResults, playerNumber) {
  const strengths = statResults
    .filter((result) => result.result === playerNumber)
    .map((result) => getStrengthLabel(result.stat.key));

  return [...new Set(strengths)];
}

export function buildStrengthText(player, strengths) {
  if (strengths.length === 0) {
    return `${player.name} does not have a clear statistical edge in this lens.`;
  }

  if (strengths.length === 1) {
    return `${player.name} stands out most in ${strengths[0]}.`;
  }

  const firstStrengths = strengths.slice(0, -1).join(", ");
  const lastStrength = strengths[strengths.length - 1];

  return `${player.name} stands out in ${firstStrengths}, and ${lastStrength}.`;
}

export function updateInsights({
  playerOne,
  playerTwo,
  playerOneWins,
  playerTwoWins,
  ties,
  statResults,
  roleScores = null,
  activeMode,
  elements
}) {
  const { insightsPanel, advantageList, overallEdgeText, styleTakeaway, profileInsight } = elements;

  insightsPanel.classList.remove("hidden");
  setInsightsExpanded(elements, false);
  advantageList.innerHTML = "";

  const modeLabel = comparisonModes[activeMode].label;

  if (activeMode === "position" && roleScores) {
    if (roleScores.playerOneScore > roleScores.playerTwoScore) {
      overallEdgeText.textContent = `${playerOne.name} has the position-adjusted edge`;
      styleTakeaway.textContent = `${playerOne.name} grades higher when judged through a ${getRoleLabel(
        getPrimaryRole(playerOne)
      ).toLowerCase()} role, while ${playerTwo.name} is judged through a ${getRoleLabel(
        getPrimaryRole(playerTwo)
      ).toLowerCase()} role.`;
    } else if (roleScores.playerTwoScore > roleScores.playerOneScore) {
      overallEdgeText.textContent = `${playerTwo.name} has the position-adjusted edge`;
      styleTakeaway.textContent = `${playerTwo.name} grades higher when judged through a ${getRoleLabel(
        getPrimaryRole(playerTwo)
      ).toLowerCase()} role, while ${playerOne.name} is judged through a ${getRoleLabel(
        getPrimaryRole(playerOne)
      ).toLowerCase()} role.`;
    } else {
      overallEdgeText.textContent = "This position-adjusted comparison is even";
      styleTakeaway.textContent = "Both players grade almost the same after role-based weighting.";
    }
  } else if (playerOneWins > playerTwoWins) {
    overallEdgeText.textContent = `${playerOne.name} has the ${modeLabel.toLowerCase()} edge`;
    styleTakeaway.textContent = `${playerOne.name} wins more categories in the ${modeLabel} lens. Expand for the biggest advantages.`;
  } else if (playerTwoWins > playerOneWins) {
    overallEdgeText.textContent = `${playerTwo.name} has the ${modeLabel.toLowerCase()} edge`;
    styleTakeaway.textContent = `${playerTwo.name} wins more categories in the ${modeLabel} lens. Expand for the biggest advantages.`;
  } else {
    overallEdgeText.textContent = `This ${modeLabel.toLowerCase()} comparison is close`;
    styleTakeaway.textContent = `Both players split this lens evenly, with ${ties} tied category or categories.`;
  }

  const biggestAdvantages = statResults
    .filter((result) => result.result !== 0)
    .sort((a, b) => getGapScore(b, activeMode) - getGapScore(a, activeMode))
    .slice(0, 3);

  biggestAdvantages.forEach((result) => {
    const winner = result.result === 1 ? playerOne : playerTwo;
    const winnerValue = result.result === 1 ? result.playerOneValue : result.playerTwoValue;
    const loserValue = result.result === 1 ? result.playerTwoValue : result.playerOneValue;
    const note = result.stat.better === "lower" ? "lower is better here" : "higher is better here";

    const positionNote =
      activeMode === "position"
        ? ` Role impact: ${
            result.result === 1 ? result.playerOneImpact.toFixed(1) : result.playerTwoImpact.toFixed(1)
          } vs ${
            result.result === 1 ? result.playerTwoImpact.toFixed(1) : result.playerOneImpact.toFixed(1)
          }.`
        : "";

    const listItem = document.createElement("li");

    listItem.textContent = `${winner.name} has the edge in ${result.stat.label} (${formatValue(
      winnerValue,
      result.stat.suffix || ""
    )} vs ${formatValue(loserValue, result.stat.suffix || "")}; ${note}).${positionNote}`;

    advantageList.appendChild(listItem);
  });

  if (biggestAdvantages.length === 0) {
    const listItem = document.createElement("li");
    listItem.textContent = "No major statistical advantages found in this lens.";
    advantageList.appendChild(listItem);
  }

  const playerOneStrengths = getPlayerStrengths(statResults, 1);
  const playerTwoStrengths = getPlayerStrengths(statResults, 2);

  if (activeMode === "position") {
    profileInsight.textContent = `${playerOne.name} is being evaluated as a ${getRoleLabel(
      getPrimaryRole(playerOne)
    ).toLowerCase()}, so the model emphasizes the stats expected from that role. ${playerTwo.name} is being evaluated as a ${getRoleLabel(
      getPrimaryRole(playerTwo)
    ).toLowerCase()}, so their role expectations are different.`;
  } else {
    profileInsight.textContent = `${buildStrengthText(playerOne, playerOneStrengths)} ${buildStrengthText(
      playerTwo,
      playerTwoStrengths
    )}`;
  }
}
