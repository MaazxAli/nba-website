export function getPlayerMatches(players, inputValue) {
  const searchValue = inputValue.trim().toLowerCase();

  if (searchValue === "") {
    return [];
  }

  return players.filter((player) => {
    return (
      player.name.toLowerCase().includes(searchValue) ||
      player.team.toLowerCase().includes(searchValue) ||
      player.position.toLowerCase().includes(searchValue)
    );
  });
}

export function findExactPlayerByName(players, inputValue) {
  const searchValue = inputValue.trim().toLowerCase();

  return players.find((player) => {
    return player.name.toLowerCase() === searchValue;
  });
}

export function findPlayer(players, inputValue) {
  const searchValue = inputValue.trim().toLowerCase();

  if (searchValue === "") {
    return {
      player: null,
      status: "empty"
    };
  }

  const exactMatch = findExactPlayerByName(players, inputValue);

  if (exactMatch) {
    return {
      player: exactMatch,
      status: "exact"
    };
  }

  const matches = getPlayerMatches(players, inputValue);

  if (matches.length === 1) {
    return {
      player: matches[0],
      status: "single"
    };
  }

  if (matches.length > 1) {
    return {
      player: null,
      status: "multiple"
    };
  }

  return {
    player: null,
    status: "none"
  };
}
