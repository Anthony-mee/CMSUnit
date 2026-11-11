/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const posts = app.findCollectionByNameOrId("pocketbase_posts");
  const accounts = app.findCollectionByNameOrId("fieldnotes_accounts");
  const authors = app.findRecordsByFilter(accounts, "role = 'admin' || role = 'author'", "", 1, 0);

  // Content posts require an author. A brand-new installation creates its
  // first account after migrations run, so leave that installation unchanged.
  if (!authors.length) return;

  const author = authors[0];
  const publishedAt = new Date().toISOString();
  const sensorPosts = [
    {
      title: "ESP32: the Wi-Fi bridge for your sensor system",
      slug: "esp32-wifi-sensor-bridge",
      excerpt: "Use an ESP32 as the small, connected controller that reads sensors and sends measurements to PocketBase.",
      body: [
        "# ESP32: the Wi-Fi bridge for your sensor system",
        "",
        "The ESP32 is the controller at the center of this sensor project. It reads values from the DS18B20, MQ sensor, and HC-SR04, then sends a compact JSON payload over Wi-Fi to an application API.",
        "",
        "![ESP32 development board](https://images.unsplash.com/photo-1553406830-ef2513450d76?auto=format&fit=crop&w=1400&q=80)",
        "",
        "## What it contributes",
        "",
        "- Wi-Fi connectivity for sending readings",
        "- GPIO pins for digital, analog, and timing-based sensors",
        "- Enough processing power to sample, validate, and retry readings",
        "- A low-cost platform for greenhouse, room, and equipment monitoring",
        "",
        "| Connection | Typical use |",
        "| --- | --- |",
        "| 3.3V and GND | Power reference shared by sensors |",
        "| GPIO | Sensor data and control lines |",
        "| Wi-Fi | Send readings to the CMS API |",
        "",
        "Keep the ESP32 logic separate from the dashboard: the board should collect reliable readings, while PocketBase stores and displays them.",
        "",
        "@[youtube:ESP32 sensor projects](https://www.youtube.com/watch?v=fTEFEwJxO88)",
        "",
        "The example video demonstrates the same connected-board workflow. For production, add a device key, timestamps, retry handling, and input validation before accepting readings.",
      ].join("\n"),
    },
    {
      title: "DS18B20: accurate digital temperature readings",
      slug: "ds18b20-temperature-sensor",
      excerpt: "Measure temperature reliably with a waterproof DS18B20 probe and a single data wire.",
      body: [
        "# DS18B20: accurate digital temperature readings",
        "",
        "The DS18B20 is a digital temperature sensor suited to monitoring water, soil, enclosures, and growing environments. Multiple probes can share one data bus when each device has a unique address.",
        "",
        "![Waterproof temperature probe](https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80)",
        "",
        "## Wiring checklist",
        "",
        "- Connect VDD to the ESP32 3.3V pin.",
        "- Connect GND to the common ground.",
        "- Connect DATA to a digital GPIO.",
        "- Add a 4.7 kΩ pull-up resistor between DATA and 3.3V.",
        "",
        "| Reading | Recommended practice |",
        "| --- | --- |",
        "| Temperature | Store degrees Celsius as a number |",
        "| Sample interval | Start with one reading every 5–10 seconds |",
        "| Invalid value | Reject disconnected or out-of-range readings |",
        "",
        "The sensor reading should be sent with the device ID and timestamp so the dashboard can distinguish current data from an old sample.",
        "",
        "@[youtube:ESP32 and DS18B20 temperature sensor](https://www.youtube.com/watch?v=SdR2TXewC_o)",
        "",
        "Use the waterproof probe version when the sensor will be exposed to moisture. Do not rely on a single sample for an alarm; confirm the threshold across several readings.",
      ].join("\n"),
    },
    {
      title: "MQ sensor: detecting smoke and air-quality changes",
      slug: "mq-smoke-sensor",
      excerpt: "Connect an MQ-family gas sensor to the ESP32 and track smoke-related changes without treating raw values as laboratory measurements.",
      body: [
        "# MQ sensor: detecting smoke and air-quality changes",
        "",
        "MQ-family sensors can detect changes associated with smoke and gases. Their analog output is useful for trend monitoring, but a raw ADC value is not automatically a calibrated concentration.",
        "",
        "![Electronic sensor board](https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1400&q=80)",
        "",
        "## Safer measurement flow",
        "",
        "1. Allow the sensor to warm up before using readings.",
        "2. Record a clean-air baseline for the installation location.",
        "3. Read the analog output on an ESP32 ADC-capable pin.",
        "4. Smooth several samples before displaying a trend.",
        "5. Label the result as a relative smoke indicator unless the sensor is calibrated.",
        "",
        "| Data field | Meaning |",
        "| --- | --- |",
        "| `raw_value` | ADC reading from the sensor |",
        "| `baseline` | Clean-air reference for this device |",
        "| `alarm_state` | Application threshold result |",
        "",
        "Check the sensor module voltage before connecting it. Some MQ boards can expose a higher analog voltage than the ESP32 ADC safely accepts, so use an appropriate voltage divider or level-shifting circuit.",
        "",
        "For safety-critical smoke detection, use a certified alarm rather than this educational sensor module.",
        "",
        "[Find an MQ sensor and ESP32 demonstration on YouTube](https://www.youtube.com/results?search_query=ESP32+MQ+smoke+sensor+tutorial)",
      ].join("\n"),
    },
    {
      title: "HC-SR04: measuring distance with ultrasonic pulses",
      slug: "hc-sr04-ultrasonic-sensor",
      excerpt: "Measure tank level, object distance, or approach events using the HC-SR04 ultrasonic sensor and the ESP32.",
      body: [
        "# HC-SR04: measuring distance with ultrasonic pulses",
        "",
        "The HC-SR04 estimates distance by sending an ultrasonic pulse and timing the echo. It is useful for tank-level prototypes, object detection, and simple proximity measurements.",
        "",
        "![Ultrasonic distance measurement concept](https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?auto=format&fit=crop&w=1400&q=80)",
        "",
        "## Wiring and calculation",
        "",
        "- Connect VCC according to the module specification.",
        "- Connect TRIG to an ESP32 output GPIO.",
        "- Connect ECHO through a voltage divider before it reaches the ESP32 input.",
        "- Connect GND to the ESP32 ground.",
        "",
        "The controller measures the echo duration and converts it to distance. Take several samples and discard timeout values when no echo is received.",
        "",
        "| Field | Example |",
        "| --- | --- |",
        "| `distance_cm` | `42.7` |",
        "| `signal_ok` | `true` |",
        "| `recorded_at` | ISO 8601 timestamp |",
        "",
        "The ECHO line is the important electrical detail: protect the ESP32 input from a 5 V signal with a resistor divider or a suitable level shifter.",
        "",
        "@[youtube:ESP32 and HC-SR04 distance measurement](https://www.youtube.com/watch?v=LMp-0HAuI68)",
        "",
        "A stable mounting position and a clear target surface make the readings much more consistent. Avoid mounting the sensor near fans or other sources of strong vibration.",
      ].join("\n"),
    },
  ];

  for (const postData of sensorPosts) {
    const existing = app.findRecordsByFilter(posts, "slug = {:slug}", "", 1, 0, { slug: postData.slug });
    if (existing.length) continue;

    const post = new Record(posts);
    post.set("title", postData.title);
    post.set("slug", postData.slug);
    post.set("excerpt", postData.excerpt);
    post.set("body", postData.body);
    post.set("status", "published");
    post.set("author", author.id);
    post.set("publishedAt", publishedAt);
    app.save(post);
  }
}, (app) => {
  const posts = app.findCollectionByNameOrId("pocketbase_posts");
  for (const slug of [
    "esp32-wifi-sensor-bridge",
    "ds18b20-temperature-sensor",
    "mq-smoke-sensor",
    "hc-sr04-ultrasonic-sensor",
  ]) {
    const records = app.findRecordsByFilter(posts, "slug = {:slug}", "", 0, 0, { slug });
    for (const record of records) app.delete(record);
  }
});
