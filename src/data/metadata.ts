import type { SkillCatalog, LevelCatalog, LocationCatalog, LevelRadiusConfig, OrbitalDistanceConfig } from "../types";

export const SKILL_DATA: SkillCatalog = {
  "1": {
    "skill": "Project Management",
    "color": "#FFBA08"
  },
  "2": {
    "skill": "HTML",
    "color": "#FCA311"
  },
  "3": {
    "skill": "JS",
    "color": "#A2AEBB"
  },
  "4": {
    "skill": "CSS",
    "color": "#3F88C5"
  },
  "5": {
    "skill": "Angular",
    "color": "#1C3144"
  },
  "6": {
    "skill": "React",
    "color": "#F5D0C5"
  },
  "7": {
    "skill": "Typescript",
    "color": "#D69F7E"
  },
  "8": {
    "skill": "Node.js",
    "color": "#774936"
  },
  "9": {
    "skill": "Build Tools",
    "color": "#3C0000"
  },
  "10": {
    "skill": "JAVA",
    "color": "#CBEAA6"
  },
  "11": {
    "skill": "Spring MVC",
    "color": "#C0D684"
  },
  "12": {
    "skill": "ES6",
    "color": "#F3F9D2"
  },
  "13": {
    "skill": "SQL",
    "color": "#3D0B37"
  },
  "14": {
    "skill": "MVC",
    "color": "#63264A"
  },
  "15": {
    "skill": "Singleton",
    "color": "#C7EDE4"
  },
  "16": {
    "skill": "RxJS",
    "color": "#AF9AB2"
  },
  "17": {
    "skill": "Agile",
    "color": "#820B8A"
  }
};

export const LEVEL_DATA: LevelCatalog = {
  "1": {
    "level": "Beginner",
    "color": "#672A4E"
  },
  "2": {
    "level": "Intermediate",
    "color": "#2D93AD"
  },
  "3": {
    "level": "Advanced",
    "color": "#507DBC"
  },
  "4": {
    "level": "Expert",
    "color": "#006992"
  }
};

export const LOCATION_DATA: LocationCatalog = {
  "1": {
    "location": "Noida Site 3 Unit 1",
    "color": "#14213D"
  },
  "2": {
    "location": "Noida Sec 64",
    "color": "#A9C5A0"
  },
  "3": {
    "location": "Chennai",
    "color": "#C6DEC6"
  }
};

export const LEVEL_RADIUS_CONFIG: LevelRadiusConfig = {
  "4A": 50,
  "4B": 46,
  "5A": 42,
  "5B": 38,
  "6A": 34,
  "6B": 30,
  "7A": 26,
  "7B": 22,
  "8A": 18,
  "8B": 15
};

export const ORBITAL_DISTANCE_CONFIG: OrbitalDistanceConfig = {
  "4A": 480,
  "4B": 420,
  "5A": 360,
  "5B": 300,
  "6A": 240,
  "6B": 210,
  "7A": 170,
  "7B": 140,
  "8A": 110,
  "8B": 90
};
