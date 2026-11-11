migrate((app) => {
  const collection = app.findCollectionByNameOrId("fieldnotes_accounts");
  collection.authRule = "verified = true";
  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("fieldnotes_accounts");
  collection.authRule = "";
  app.save(collection);
});
