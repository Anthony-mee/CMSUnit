/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    name: "sensor_readings",
    type: "base",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "device_id", type: "text", required: true, min: 1, max: 100 },
      { name: "temperature_c", type: "number", required: false },
      { name: "mq_raw", type: "number", required: false },
      { name: "distance_cm", type: "number", required: false },
      { name: "signal_status", type: "select", required: true, maxSelect: 1, values: ["ok", "partial", "offline"] },
      { name: "recorded_at", type: "date", required: true },
    ],
    indexes: [
      "CREATE INDEX idx_sensor_readings_device_time ON sensor_readings (device_id, recorded_at)",
    ],
  });
  app.save(collection);
}, (app) => {
  app.delete(app.findCollectionByNameOrId("sensor_readings"));
});
