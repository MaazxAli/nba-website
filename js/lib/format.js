export function formatValue(value, suffix = "") {
  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  if (suffix === "%") {
    return `${Number(value).toFixed(1)}%`;
  }

  if (typeof value === "number") {
    return Number(value).toFixed(1).replace(".0", "");
  }

  return value;
}

export function getInitials(name) {
  return name
    .split(" ")
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function getRoleLabel(role) {
  const labels = {
    guard: "Guard",
    wing: "Wing",
    big: "Big"
  };

  return labels[role] || "Player";
}

export function getStrengthLabel(statKey) {
  const labels = {
    points: "scoring volume",
    rebounds: "rebounding",
    assists: "playmaking",
    steals: "defensive activity",
    blocks: "rim protection",
    turnovers: "ball security",
    fgPercent: "overall efficiency",
    threePercent: "three-point shooting",
    ftPercent: "free-throw shooting"
  };

  return labels[statKey] || statKey;
}
