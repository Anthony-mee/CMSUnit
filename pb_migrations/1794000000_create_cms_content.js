migrate((app) => {
  const accounts = app.findCollectionByNameOrId("fieldnotes_accounts");
  accounts.fields.add(
    new SelectField({
      name: "role",
      values: ["author", "admin"],
      maxSelect: 1,
      required: true,
    }),
  );
  accounts.createRule = "role = 'author'";
  accounts.updateRule = null;
  app.save(accounts);

  const posts = new Collection({
    name: "content_posts",
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
        name: "platform",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["supabase", "directus", "pocketbase"],
      },
      {
        name: "status",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["draft", "published"],
      },
      { name: "author", type: "relation", required: true, maxSelect: 1, collectionId: accounts.id, cascadeDelete: false },
      { name: "publishedAt", type: "date" },
    ],
    indexes: [
      "CREATE UNIQUE INDEX idx_content_posts_platform_slug ON content_posts (platform, slug)",
    ],
  });

  app.save(posts);
}, (app) => {
  const posts = app.findCollectionByNameOrId("content_posts");
  app.delete(posts);

  const accounts = app.findCollectionByNameOrId("fieldnotes_accounts");
  accounts.fields.removeByName("role");
  accounts.createRule = "";
  accounts.updateRule = "id = @request.auth.id";
  app.save(accounts);
});
