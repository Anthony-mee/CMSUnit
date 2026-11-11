migrate((app) => {
  const posts = app.findCollectionByNameOrId("content_posts");
  posts.fields.add(
    new FileField({
      name: "cover",
      maxSize: 5242880,
      maxSelect: 1,
      mimeTypes: ["image/jpeg", "image/png", "image/webp"],
      thumbs: ["960x600f"],
      required: false,
    }),
  );
  app.save(posts);
}, (app) => {
  const posts = app.findCollectionByNameOrId("content_posts");
  posts.fields.removeByName("cover");
  app.save(posts);
});
