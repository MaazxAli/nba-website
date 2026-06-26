export function renderPopularComparisons({
  popularComparisonsElement,
  popularComparisons,
  findExactPlayerByName,
  playerOneInput,
  playerTwoInput,
  comparePlayers
}) {
  popularComparisonsElement.innerHTML = "";

  popularComparisons.forEach((matchup) => {
    const playerOne = findExactPlayerByName(matchup.playerOne);
    const playerTwo = findExactPlayerByName(matchup.playerTwo);

    if (!playerOne || !playerTwo) {
      return;
    }

    const button = document.createElement("button");
    button.classList.add("matchup-chip");
    button.type = "button";

    button.innerHTML = `
      <span>${matchup.tag}</span>
      <strong>${matchup.display.replace(" vs ", " <em>vs</em> ")}</strong>
    `;

    button.addEventListener("click", () => {
      playerOneInput.value = matchup.playerOne;
      playerTwoInput.value = matchup.playerTwo;
      comparePlayers();
    });

    popularComparisonsElement.appendChild(button);
  });
}
