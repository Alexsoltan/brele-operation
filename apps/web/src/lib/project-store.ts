import { projects as mockProjects, type Mood, type ProjectStatus, type Risk } from "@/lib/mock-data";

export type Project = {
  id: string;
  name: string;
  clientName: string;
  description?: string;
  status: ProjectStatus;
  clientMood: Mood;
  teamMood: Mood;
  risk: Risk;
  lastMeetingAt: string;
};

const STORAGE_KEY = "brele-projects";

export function getProjects(): Project[] {
  if (typeof window === "undefined") return mockProjects;

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return mockProjects;

  try {
    return JSON.parse(saved) as Project[];
  } catch {
    return mockProjects;
  }
}

export function createProject(input: {
  name: string;
  clientName: string;
  description: string;
}): Project {
  const project: Project = {
    id: slugify(input.name),
    name: input.name,
    clientName: input.clientName,
    description: input.description,
    status: "active",
    clientMood: "neutral",
    teamMood: "neutral",
    risk: "low",
    lastMeetingAt: "Нет встреч",
  };

  const nextProjects = [project, ...getProjects()];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProjects));

  return project;
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