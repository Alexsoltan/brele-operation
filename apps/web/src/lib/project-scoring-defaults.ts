export type ProjectScoringConfigKey =
  | "client_good"
  | "client_neutral"
  | "client_bad"
  | "team_good"
  | "team_neutral"
  | "team_bad"
  | "risk_low"
  | "risk_medium"
  | "risk_high";

export type ProjectScoringWeights = Record<ProjectScoringConfigKey, number>;

export const defaultProjectScoringConfig: Array<{
  key: ProjectScoringConfigKey;
  label: string;
  group: string;
  value: number;
  sortOrder: number;
}> = [
  {
    key: "client_good",
    label: "Клиент: хорошо",
    group: "client",
    value: 6,
    sortOrder: 10,
  },
  {
    key: "client_neutral",
    label: "Клиент: нейтрально",
    group: "client",
    value: -2,
    sortOrder: 20,
  },
  {
    key: "client_bad",
    label: "Клиент: плохо",
    group: "client",
    value: -12,
    sortOrder: 30,
  },

  {
    key: "team_good",
    label: "Команда: хорошо",
    group: "team",
    value: 4,
    sortOrder: 40,
  },
  {
    key: "team_neutral",
    label: "Команда: нейтрально",
    group: "team",
    value: -2,
    sortOrder: 50,
  },
  {
    key: "team_bad",
    label: "Команда: плохо",
    group: "team",
    value: -10,
    sortOrder: 60,
  },

  {
    key: "risk_low",
    label: "Риск: низкий",
    group: "risk",
    value: 2,
    sortOrder: 70,
  },
  {
    key: "risk_medium",
    label: "Риск: средний",
    group: "risk",
    value: -4,
    sortOrder: 80,
  },
  {
    key: "risk_high",
    label: "Риск: высокий",
    group: "risk",
    value: -12,
    sortOrder: 90,
  },
];

export const defaultProjectScoringWeights: ProjectScoringWeights =
  defaultProjectScoringConfig.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {} as ProjectScoringWeights);