import type { Mood, Risk } from "@/lib/mock-data";

export type ProjectStatus = "active" | "hold" | "archived";

export type Project = {
  id: string;
  name: string;
  client: string;
  clientName: string;
  description?: string;
  clientMood: Mood;
  teamMood: Mood;
  risk: Risk;
  lastMeeting: string;
  lastMeetingAt: string;
  status: ProjectStatus;
};

const STORAGE_KEY = "brele-projects";

const seedProjects: Project[] = [
  {
    id: "freeport",
    name: "Freeport",
    client: "ООО «Супертехнологии»",
    clientName: "ООО «Супертехнологии»",
    description: "",
    clientMood: "neutral",
    teamMood: "neutral",
    risk: "low",
    lastMeeting: "Нет встреч",
    lastMeetingAt: "Нет встреч",
    status: "active",
  },
  {
    id: "alfa-mobile-app",
    name: "Альфа-Банк — Mobile App",
    client: "Альфа-Банк",
    clientName: "Альфа-Банк",
    description: "",
    clientMood: "good",
    teamMood: "good",
    risk: "low",
    lastMeeting: "24 Apr 2026",
    lastMeetingAt: "24 Apr 2026",
    status: "active",
  },
];

function normalizeProject(project: Partial<Project>): Project {
  const client = project.client ?? project.clientName ?? "Клиент не указан";
  const lastMeeting = project.lastMeeting ?? project.lastMeetingAt ?? "Нет встреч";

  return {
    id: project.id ?? `project-${Date.now()}`,
    name: project.name ?? "Новый проект",
    client,
    clientName: client,
    description: project.description ?? "",
    clientMood: project.clientMood ?? "neutral",
    teamMood: project.teamMood ?? "neutral",
    risk: project.risk ?? "low",
    lastMeeting,
    lastMeetingAt: lastMeeting,
    status: project.status ?? "active",
  };
}

export function getProjects(): Project[] {
  if (typeof window === "undefined") return seedProjects;

  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedProjects));
    return seedProjects;
  }

  try {
    const parsed = JSON.parse(saved) as Partial<Project>[];
    const normalized = parsed.map(normalizeProject);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

    return normalized;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedProjects));
    return seedProjects;
  }
}

export function getProjectById(projectId: string): Project | undefined {
  return getProjects().find((project) => project.id === projectId);
}

export function createProject(input: {
  name: string;
  clientName: string;
  description: string;
}): Project {
  const project = normalizeProject({
    id: slugify(input.name),
    name: input.name,
    client: input.clientName,
    clientName: input.clientName,
    description: input.description,
    clientMood: "neutral",
    teamMood: "neutral",
    risk: "low",
    lastMeeting: "Нет встреч",
    lastMeetingAt: "Нет встреч",
    status: "active",
  });

  const nextProjects = [project, ...getProjects()];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProjects));

  return project;
}

export function updateProjectStatus(
  projectId: string,
  status: ProjectStatus,
): Project[] {
  const nextProjects = getProjects().map((project) =>
    project.id === projectId ? { ...project, status } : project,
  );

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProjects));

  return nextProjects;
}

export function getProjectsByStatus(status: ProjectStatus): Project[] {
  return getProjects().filter((project) => project.status === status);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[а]/g, "a")
    .replace(/[б]/g, "b")
    .replace(/[в]/g, "v")
    .replace(/[г]/g, "g")
    .replace(/[д]/g, "d")
    .replace(/[её]/g, "e")
    .replace(/[ж]/g, "zh")
    .replace(/[з]/g, "z")
    .replace(/[и]/g, "i")
    .replace(/[й]/g, "y")
    .replace(/[к]/g, "k")
    .replace(/[л]/g, "l")
    .replace(/[м]/g, "m")
    .replace(/[н]/g, "n")
    .replace(/[о]/g, "o")
    .replace(/[п]/g, "p")
    .replace(/[р]/g, "r")
    .replace(/[с]/g, "s")
    .replace(/[т]/g, "t")
    .replace(/[у]/g, "u")
    .replace(/[ф]/g, "f")
    .replace(/[х]/g, "h")
    .replace(/[ц]/g, "ts")
    .replace(/[ч]/g, "ch")
    .replace(/[ш]/g, "sh")
    .replace(/[щ]/g, "sch")
    .replace(/[ы]/g, "y")
    .replace(/[э]/g, "e")
    .replace(/[ю]/g, "yu")
    .replace(/[я]/g, "ya")
    .replace(/[ьъ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}