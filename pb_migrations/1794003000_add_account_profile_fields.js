/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const accounts = app.findCollectionByNameOrId("fieldnotes_accounts");
  const accountsWithoutRole = app.findRecordsByFilter(
    accounts,
    "role = ''",
    "",
    0,
    0,
  );
  for (const account of accountsWithoutRole) {
    account.set("role", "author");
    app.save(account);
  }

  accounts.fields.add(
    new TextField({
      name: "username",
      min: 3,
      max: 30,
      pattern: "^[a-zA-Z0-9_]+$",
      required: false,
    }),
  );
  accounts.fields.add(
    new FileField({
      name: "avatar",
      maxSize: 5242880,
      maxSelect: 1,
      mimeTypes: ["image/jpeg", "image/png", "image/webp"],
      thumbs: ["160x160f"],
      required: false,
    }),
  );
  accounts.updateRule = "id = @request.auth.id && role = @request.body.role";
  accounts.indexes.push(
    "CREATE UNIQUE INDEX idx_fieldnotes_accounts_username ON fieldnotes_accounts (username) WHERE username != ''",
  );
  app.save(accounts);
}, (app) => {
  const accounts = app.findCollectionByNameOrId("fieldnotes_accounts");
  accounts.indexes = accounts.indexes.filter(
    (index) => !index.includes("idx_fieldnotes_accounts_username"),
  );
  accounts.fields.removeByName("username");
  accounts.fields.removeByName("avatar");
  accounts.updateRule = null;
  app.save(accounts);
});
