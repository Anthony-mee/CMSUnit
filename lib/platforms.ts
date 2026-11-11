import PocketBase from "pocketbase";

export type Platform = {
  id: string;
  name: string;
  category: string;
  description: string;
  details: string;
  accent: "mint" | "blue" | "lavender";
  active: boolean;
  href: string;
};

export function platformSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const defaultPlatforms: Platform[] = [
  {
    id: "supabase",
    name: "Supabase",
    category: "Backend as a service",
    description:
      "A Postgres database, authentication, instant APIs, realtime updates, and file storage—ready to build on.",
    details: "Postgres · Auth · Realtime",
    accent: "mint",
    active: false,
    href: "https://supabase.com",
  },
  {
    id: "pocketbase",
    name: "PocketBase",
    category: "Lightweight CMS",
    description:
      "An all-in-one app platform in one tiny executable, with a database, file storage, authentication, and a built-in admin UI.",
    details: "SQLite · Auth · File storage",
    accent: "blue",
    active: true,
    href: "https://pocketbase.io",
  },
  {
    id: "directus",
    name: "Directus",
    category: "Headless CMS",
    description:
      "A flexible data platform that puts a polished admin app and APIs on top of your SQL database.",
    details: "SQL · Admin app · APIs",
    accent: "lavender",
    active: false,
    href: "https://directus.io",
  },
];

type PlatformRecord = {
  id: string;
  name: string;
  category: string;
  description: string;
  details: string;
  accent: Platform["accent"];
  active: boolean;
  href: string;
};

export async function getPlatforms(): Promise<Platform[]> {
  const pocketbaseUrl = process.env.POCKETBASE_URL;

  if (!pocketbaseUrl) {
    return defaultPlatforms;
  }

  const pocketbase = new PocketBase(pocketbaseUrl);
  const records = await pocketbase.collection("platforms").getFullList<PlatformRecord>({
    sort: "sort",
  });

  return records.map((record) => {
    const isPocketBase = record.name.toLowerCase() === "pocketbase";

    return {
      id: record.id,
      name: record.name,
      category: isPocketBase ? "Lightweight CMS" : record.category,
      description: isPocketBase
        ? "An all-in-one app platform in one tiny executable, with a database, file storage, authentication, and a built-in admin UI."
        : record.description,
      details: record.details,
      accent: record.accent,
      active: record.active,
      href: record.href,
    };
  });
}
