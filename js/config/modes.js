export const comparisonModes = {
  all: {
    label: "All Stats",
    statKeys: [
      "points",
      "rebounds",
      "assists",
      "steals",
      "blocks",
      "turnovers",
      "fgPercent",
      "threePercent",
      "ftPercent"
    ],
    note: "Green = better stat. Grey = weaker stat. For turnovers, lower is better."
  },
  position: {
    label: "Position Adjusted",
    statKeys: [
      "points",
      "rebounds",
      "assists",
      "steals",
      "blocks",
      "turnovers",
      "fgPercent",
      "threePercent",
      "ftPercent"
    ],
    note: "Position Adjusted uses role-weighted scoring. Guards, wings, and bigs are judged by different expectations."
  },
  scoring: {
    label: "Scoring",
    statKeys: ["points", "fgPercent", "threePercent", "ftPercent", "turnovers"],
    note: "Scoring lens values points, shooting efficiency, free throws, and ball security."
  },
  shooting: {
    label: "Shooting",
    statKeys: ["fgPercent", "threePercent", "ftPercent"],
    note: "Shooting lens focuses on field goal percentage, three-point percentage, and free-throw percentage."
  },
  playmaking: {
    label: "Playmaking",
    statKeys: ["assists", "turnovers", "points"],
    note: "Playmaking lens values assists, scoring pressure, and taking care of the ball."
  },
  defense: {
    label: "Defense",
    statKeys: ["rebounds", "steals", "blocks"],
    note: "Defense lens focuses on rebounds, steals, and blocks."
  },
  efficiency: {
    label: "Efficiency",
    statKeys: ["fgPercent", "threePercent", "ftPercent", "turnovers"],
    note: "Efficiency lens values clean shooting and lower turnovers."
  }
};

export const roleWeights = {
  guard: {
    points: 1.15,
    rebounds: 0.45,
    assists: 1.35,
    steals: 1.0,
    blocks: 0.3,
    turnovers: 1.2,
    fgPercent: 0.8,
    threePercent: 1.25,
    ftPercent: 0.9
  },
  wing: {
    points: 1.2,
    rebounds: 0.8,
    assists: 0.8,
    steals: 1.1,
    blocks: 0.85,
    turnovers: 1.0,
    fgPercent: 1.0,
    threePercent: 1.0,
    ftPercent: 0.85
  },
  big: {
    points: 1.0,
    rebounds: 1.35,
    assists: 0.75,
    steals: 0.75,
    blocks: 1.35,
    turnovers: 0.9,
    fgPercent: 1.25,
    threePercent: 0.45,
    ftPercent: 0.65
  }
};

export const statBenchmarks = {
  points: 35,
  rebounds: 13,
  assists: 11,
  steals: 2.2,
  blocks: 2.5,
  turnovers: {
    min: 1.5,
    max: 4.5
  },
  fgPercent: 65,
  threePercent: 45,
  ftPercent: 93
};
