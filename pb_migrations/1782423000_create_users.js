migrate((app) => {
  const collection = new Collection({
    name: "fieldnotes_accounts",
    type: "auth",
    listRule: null,
    viewRule: "id = @request.auth.id",
    createRule: "",
    updateRule: "id = @request.auth.id",
    deleteRule: null,
    authRule: "verified = true",
    fields: [
      { name: "name", type: "text", required: true, min: 2, max: 100 },
    ],
    indexes: [],
    authOptions: {
      allowOAuth2: false,
      allowUsernameAuth: false,
      minPasswordLength: 8,
      requireEmail: true,
      exceptEmailDomains: [],
      onlyEmailDomains: [],
    },
  });

  app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("fieldnotes_accounts");
  app.delete(collection);
});
