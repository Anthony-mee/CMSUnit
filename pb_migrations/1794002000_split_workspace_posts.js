/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const legacy = app.findCollectionByNameOrId("content_posts");
  const accounts = app.findCollectionByNameOrId("fieldnotes_accounts");
  const workspaceSlugs = ["supabase", "directus", "pocketbase"];

  for (const workspace of workspaceSlugs) {
    const collection = new Collection({
      name: `${workspace}_posts`,
      type: "base",
      listRule: "status = 'published' || @request.auth.role = 'admin'",
      viewRule: "status = 'published' || @request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: "title", type: "text", required: true, min: 1, max: 180 },
        { name: "slug", type: "text", required: true, min: 1, max: 180 },
        { name: "excerpt", type: "text", max: 500 },
        { name: "body", type: "text", required: true, min: 1, max: 50000 },
        {
          name: "status",
          type: "select",
          required: true,
          maxSelect: 1,
          values: ["draft", "published"],
        },
        {
          name: "author",
          type: "relation",
          required: true,
          maxSelect: 1,
          collectionId: accounts.id,
          cascadeDelete: false,
        },
        { name: "publishedAt", type: "date" },
        {
          name: "cover",
          type: "file",
          maxSize: 5242880,
          maxSelect: 1,
          mimeTypes: ["image/jpeg", "image/png", "image/webp"],
          thumbs: ["960x600f"],
          required: false,
        },
      ],
      indexes: [
        `CREATE UNIQUE INDEX idx_${workspace}_posts_slug ON ${workspace}_posts (slug)`,
      ],
    });
    app.save(collection);

    const legacyPosts = app.findRecordsByFilter(
      legacy,
      "platform = {:platform}",
      "",
      0,
      0,
      { platform: workspace },
    );
    for (const post of legacyPosts) {
      const record = new Record(collection);
      for (const field of ["title", "slug", "excerpt", "body", "status", "author", "publishedAt", "cover"]) {
        const value = post.get(field);
        if (value !== undefined && value !== null) record.set(field, value);
      }
      app.save(record);
    }
  }
}, (app) => {
  for (const workspace of ["supabase", "directus", "pocketbase"]) {
    const collection = app.findCollectionByNameOrId(`${workspace}_posts`);
    app.delete(collection);
  }
});
