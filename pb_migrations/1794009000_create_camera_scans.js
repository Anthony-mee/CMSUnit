/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    name: "camera_scans",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "device_id", type: "text", required: true, min: 1, max: 100 },
      {
        name: "mode",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["raspberry-pi", "camera", "upload"],
      },
      {
        name: "image",
        type: "file",
        required: true,
        maxSize: 8388608,
        maxSelect: 1,
        mimeTypes: ["image/jpeg", "image/png", "image/webp"],
        thumbs: ["480x320f"],
      },
      { name: "results", type: "json", required: true },
      {
        name: "inference_status",
        type: "select",
        required: true,
        maxSelect: 1,
        values: ["complete", "partial", "unavailable"],
      },
      { name: "recorded_at", type: "date", required: true },
    ],
    indexes: [
      "CREATE INDEX idx_camera_scans_recorded_at ON camera_scans (recorded_at)",
      "CREATE INDEX idx_camera_scans_device_time ON camera_scans (device_id, recorded_at)",
    ],
  });
  app.save(collection);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("camera_scans"));
});
