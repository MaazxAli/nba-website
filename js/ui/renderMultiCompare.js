import { formatValue, getRoleLabel } from "../lib/format.js";

function formatScore(value) {
  return Number(value).toFixed(1).replace(".0", "");
}

function getOverallLabel(activeMode) {
  return activeMode === "position" ? "Role Score" : "Category Wins";
}

function getOverallValue(row, activeMode) {
  if (activeMode === "position") {
    return row.roleScore.toFixed(1);
  }

  return formatScore(row.categoryWins);
}

function getTeamPositionContent(row, activeMode) {
  const roleText =
    activeMode === "position"
      ? `<small class="multi-role-label">${getRoleLabel(row.role)}</small>`
      : "";

  return `
    <span>${row.player.team}</span>
    <small>${row.player.position} • ${row.player.season}</small>
    ${roleText}
  `;
}

function getRankingSummaryContent(rows, activeMode) {
  const overallLabel = getOverallLabel(activeMode);

  return `
    <div class="multi-summary-header">
      <span>Ranking Summary</span>
      <strong>${overallLabel}</strong>
    </div>

    <ol class="multi-ranking-list">
      ${rows
        .map((row, index) => {
          return `
            <li>
              <span class="multi-summary-rank">${index + 1}</span>
              <span class="multi-summary-player">
                <strong>${row.player.name}</strong>
                <small>${row.player.team} • ${overallLabel}: ${getOverallValue(row, activeMode)}</small>
              </span>
            </li>
          `;
        })
        .join("")}
    </ol>
  `;
}

export function clearMultiCompareResults(elements) {
  const { multiResults, multiRankingSummary, multiTableHead, multiTableBody } = elements;

  multiResults.classList.add("hidden");
  multiRankingSummary.innerHTML = "";
  multiTableHead.innerHTML = "";
  multiTableBody.innerHTML = "";
}

export function renderMultiCompareResults({ rows, stats, activeMode, elements }) {
  const { multiResults, multiRankingSummary, multiTableHead, multiTableBody } = elements;

  multiResults.classList.remove("hidden");

  multiRankingSummary.innerHTML = getRankingSummaryContent(rows, activeMode);

  multiTableHead.innerHTML = `
    <tr>
      <th>Rank</th>
      <th>Player</th>
      <th>Team/Position</th>
      ${stats.map((stat) => `<th>${stat.label}</th>`).join("")}
      <th>${getOverallLabel(activeMode)}</th>
    </tr>
  `;

  multiTableBody.innerHTML = "";

  rows.forEach((row, index) => {
    const tableRow = document.createElement("tr");

    tableRow.innerHTML = `
      <td class="multi-rank-cell">
        <span>${index + 1}</span>
      </td>
      <td class="multi-player-cell">
        <strong>${row.player.name}</strong>
        <small>${getOverallLabel(activeMode)}: ${getOverallValue(row, activeMode)}</small>
      </td>
      <td class="multi-team-cell">
        ${getTeamPositionContent(row, activeMode)}
      </td>
      ${row.statCells
        .map((cell) => {
          return `
            <td class="multi-stat-cell ${cell.className}">
              ${formatValue(cell.value, cell.stat.suffix || "")}
            </td>
          `;
        })
        .join("")}
      <td class="multi-overall-cell">${getOverallValue(row, activeMode)}</td>
    `;

    multiTableBody.appendChild(tableRow);
  });
}
