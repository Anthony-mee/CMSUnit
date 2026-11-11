migrate((app) => {
  const collection = new Collection({
    name: "platforms",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "name", type: "text", required: true, min: 1, max: 80 },
      { name: "category", type: "text", required: true, min: 1, max: 100 },
      { name: "description", type: "text", required: true, min: 1, max: 1000 },
      { name: "details", type: "text", required: true, min: 1, max: 200 },
      {
        name: "accent",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["mint", "blue", "lavender"],
      },
      { name: "active", type: "bool" },
      { name: "href", type: "url", required: true },
      { name: "sort", type: "number", required: true },
    ],
  });

  app.save(collection);

  const platformRecords = [
    {
      name: "Supabase",
      category: "Backend as a service",
      description:
        "A Postgres database, authentication, instant APIs, realtime updates, and file storage—ready to build on.",
      details: "Postgres · Auth · Realtime",
      accent: "mint",
      active: false,
      href: "https://supabase.com",
      sort: 1,
    },
    {
      name: "PocketBase",
      category: "Lightweight CMS",
      description:
        "An all-in-one app platform in one tiny executable, with a database, file storage, authentication, and a built-in admin UI.",
      details: "SQLite · Auth · File storage",
      accent: "blue",
      active: true,
      href: "https://pocketbase.io",
      sort: 2,
    },
    {
      name: "Directus",
      category: "Headless CMS",
      description:
        "A flexible data platform that puts a polished admin app and APIs on top of your SQL database.",
      details: "SQL · Admin app · APIs",
      accent: "lavender",
      active: false,
      href: "https://directus.io",
      sort: 3,
    },
  ];

  for (const platform of platformRecords) {
    app.save(new Record(collection, platform));
  }
}, (app) => {
  const collection = app.findCollectionByNameOrId("platforms");
  app.delete(collection);
});
