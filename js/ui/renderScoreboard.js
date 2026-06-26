export function updateScoreboard({
  playerOne,
  playerTwo,
  playerOneWins,
  playerTwoWins,
  ties,
  roleScores = null,
  activeMode,
  elements
}) {
  const {
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
  } = elements;

  playerOneScoreName.textContent = playerOne.name;
  playerTwoScoreName.textContent = playerTwo.name;

  playerOneBadge.className = "player-badge";
  playerTwoBadge.className = "player-badge";

  if (activeMode === "position" && roleScores) {
    playerOneScore.textContent = roleScores.playerOneScore.toFixed(1);
    playerTwoScore.textContent = roleScores.playerTwoScore.toFixed(1);
    tieScore.textContent = Math.abs(roleScores.playerOneScore - roleScores.playerTwoScore).toFixed(1);

    playerOneScoreCaption.textContent = "role score";
    playerTwoScoreCaption.textContent = "role score";
    middleScoreLabel.textContent = "Edge";
    middleScoreCaption.textContent = "score gap";

    if (roleScores.playerOneScore > roleScores.playerTwoScore) {
      playerOneBadge.textContent = "Leading";
      playerTwoBadge.textContent = "Trailing";
      playerOneBadge.classList.add("leading");
      playerTwoBadge.classList.add("trailing");
    } else if (roleScores.playerTwoScore > roleScores.playerOneScore) {
      playerTwoBadge.textContent = "Leading";
      playerOneBadge.textContent = "Trailing";
      playerTwoBadge.classList.add("leading");
      playerOneBadge.classList.add("trailing");
    } else {
      playerOneBadge.textContent = "Even";
      playerTwoBadge.textContent = "Even";
      playerOneBadge.classList.add("even");
      playerTwoBadge.classList.add("even");
    }

    return;
  }

  playerOneScore.textContent = playerOneWins;
  playerTwoScore.textContent = playerTwoWins;
  tieScore.textContent = ties;

  playerOneScoreCaption.textContent = "category wins";
  playerTwoScoreCaption.textContent = "category wins";
  middleScoreLabel.textContent = "Tied";
  middleScoreCaption.textContent = "categories";

  if (playerOneWins > playerTwoWins) {
    playerOneBadge.textContent = "Leading";
    playerTwoBadge.textContent = "Trailing";
    playerOneBadge.classList.add("leading");
    playerTwoBadge.classList.add("trailing");
  } else if (playerTwoWins > playerOneWins) {
    playerTwoBadge.textContent = "Leading";
    playerOneBadge.textContent = "Trailing";
    playerTwoBadge.classList.add("leading");
    playerOneBadge.classList.add("trailing");
  } else {
    playerOneBadge.textContent = "Even";
    playerTwoBadge.textContent = "Even";
    playerOneBadge.classList.add("even");
    playerTwoBadge.classList.add("even");
  }
}
