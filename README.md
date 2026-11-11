# Fieldnotes — PocketBase CMS Studio

A responsive Next.js project with Supabase-inspired, Directus-inspired, and PocketBase workspaces. PocketBase is the only backend: it stores workspace records and handles all account registration, email verification, and sign-in.

## Get started

```bash
npm install
npm run setup
```

The setup command downloads the latest PocketBase Windows x64 release from the
official GitHub releases, verifies its SHA-256 checksum, and creates `.env.local`
for the local CMS. PocketBase is installed under `pocketbase/bin/` and excluded
from version control. The first server start runs the included migrations, which create the
read-only-public `platforms` collection, seed Supabase, PocketBase, and Directus
records, and create a `fieldnotes_accounts` authentication collection for account registration
and sign-in.

Open two terminals and start both services:

```bash
npm run pocketbase
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site and
[http://127.0.0.1:8090/_/](http://127.0.0.1:8090/_/) to manage content in the
PocketBase admin UI. Create your first PocketBase superuser when prompted. The
public API only has permission to list and view platform records; changes are
made through the admin UI.

## Ubuntu Docker and Cloudflare Tunnel deployment

The production deployment runs Next.js, PocketBase, and `cloudflared` as
separate containers. PocketBase data is stored in the `pocketbase_data` Docker
volume, and the tunnel publishes the web app without opening inbound ports on
the Ubuntu server.

On Ubuntu 24.04, install Docker Engine and the Compose plugin, then copy the
project to the server:

```bash
cp .env.example .env
```

Edit `.env` and set `ROBOFLOW_API_KEY`, a long random `IOT_DEVICE_KEY`, and
`CLOUDFLARE_TUNNEL_TOKEN`. Set `NEXT_PUBLIC_POCKETBASE_URL` to the public
PocketBase hostname configured in Cloudflare. The browser PocketBase client
needs this hostname for account login and content operations; the server-side
Next.js API uses the private Docker hostname `http://pocketbase:8090`.

In Cloudflare Zero Trust, create a remotely managed tunnel with one public
hostname pointing to the app container:

```text
app.example.com  -> http://app:3000
```

The Next.js app proxies PocketBase through `/pocketbase-api`, so the frontend,
IoT API, authentication, files, and PocketBase admin UI all use the same
Cloudflare URL. Protect the `/pocketbase-api/_/` path with a Cloudflare Access
policy and do not expose it anonymously.

Start the stack:

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f cloudflared
```

Enter the same public app hostname in the ESP32 setup portal as its HTTPS
readings endpoint:

```text
https://app.example.com/api/iot/readings
```

For a simple local-only setup, connect the Ubuntu VM and ESP32 to the same
Wi-Fi/LAN and use Ubuntu's LAN address instead:

```text
http://UBUNTU_LAN_IP:3000/api/iot/readings
```

The Ubuntu VM must use a bridged network adapter rather than VirtualBox NAT.
This local option does not require Cloudflare, but it is reachable only from
the same network.

Cloudflare Tunnel does not interfere with ESP32 connectivity. The ESP32 only
needs outbound internet access, DNS, and TLS support; it no longer needs to be
on the same LAN as the Ubuntu server. The firmware sends the private device
key in the `X-Device-Key` header and validates the endpoint using the Google
Trust Services Root R1 CA.

The tunnel is outbound-only, so router port forwarding is not required. The
ESP32 needs internet access through a Wi-Fi network configured in its setup
portal, and the MQ sensor still needs stable hardware power; Docker and
Cloudflare cannot fix a brownout.

Camera uploads and predictions are saved as `camera_scans` records in
PocketBase, including the original image, source, timestamp, and model results.
The Charts page reads this shared history and displays scan thumbnails; records
are retained without an automatic limit in the `pocketbase_data` volume. The
browser camera analyzes a frame every 2.5 seconds while live scanning is on.

### ESP32 Wi-Fi configuration

The Wi-Fi name and password are configured near the top of `src/main.cpp`.
The firmware connects directly to that network. The readings endpoint and
device key are still configured through the setup portal.

Generate a unique device key (at least 32 characters), keep it private, and set
it in the server's `.env` file before starting the Docker Compose stack. Do not
put the key or Wi-Fi password in firmware source. The setup portal is protected
with WPA2; change the portal password in `src/main.cpp` if this project is
shared with others.

To clear saved Wi-Fi and device settings and provision the ESP32 again, hold
the board's BOOT button for five seconds after it has started. The device will
restart and reopen its setup network. The firmware validates HTTPS using the
Google Trust Services Root R1 CA; configure an endpoint with a certificate
issued under that trust root.

If the saved endpoint is missing or invalid, the firmware opens the setup
portal automatically after connecting to Wi-Fi instead of uploading readings.

Do not expose `/pocketbase-api/_/` anonymously. Apply a Cloudflare Access
policy to that admin path while leaving the dashboard and device readings API
reachable; the ESP32 authenticates POST requests with `X-Device-Key`.

The PocketBase workspace includes four starter sensor articles: ESP32,
DS18B20, MQ smoke sensor, and HC-SR04. They are published by the
`1794005000_seed_pocketbase_sensor_posts.js` migration when an existing account
is available, and are stored in the `pocketbase_posts` collection. Each article
uses the same editor format as the other workspaces, including a cover-style
image in the article body, wiring notes, tables, and a relevant video or
resource link.

To reinstall the latest release, stop the PocketBase server and run
`npm run pocketbase:install -- --force`.

## `platforms` collection

The schema is managed by `pb_migrations/`, so run PocketBase from the project
root to apply it automatically. The collection has public list/view access and
superuser-only write access. The CMS role and `content_posts` collections are
also managed by migrations; restart PocketBase after updating the project so
any new migrations are applied.

The home page fetches platform cards from PocketBase at request time. Each
card opens its own CMS workspace at `/supabase`, `/directus`, or `/pocketbase`.
Each workspace is organized in its own route folder and has a distinct
platform-specific layout. They read the project records from the same
`platforms` collection. Without `POCKETBASE_URL`, they use built-in content.
Previous `/studio/supabase`, `/studio/directus`, and `/studio/pocketbase` links
redirect to the corresponding workspace pages.

Edit project records and manage accounts in the PocketBase admin UI. The
Supabase and Directus pages are workspace interfaces; they do not require or
connect to separate Supabase or Directus services.

## Chili camera scanner

The Supabase workspace navigation links to `/sample-system`, which provides
live camera scanning from a phone or desktop and image upload classification.
The browser sends each frame once to `/api/roboflow/predict`; the server
forwards that image to all configured Roboflow models in parallel and returns
grouped results in one scan. Configure `ROBOFLOW_API_KEY` in the server's
environment and optionally set `ROBOFLOW_MODEL_ID` (defaults to
`chili-classification-5ohkl/9`). The combined scan includes flower
segmentation, chili segmentation, and chili maturity classification. Configure
their versioned IDs as `ROBOFLOW_FLOWER_SEGMENTATION_MODEL_ID`,
`ROBOFLOW_CHILI_SEGMENTATION_MODEL_ID`, and
`ROBOFLOW_CHILI_MATURITY_MODEL_ID`, respectively, using the
`project-slug/version-number` shown by each Roboflow model's Deploy page. These
three options remain disabled until a valid versioned ID is set. Do not add the
API key to a `NEXT_PUBLIC_` variable or commit it.

The scanner displays segmentation bounding-box length and width in pixels. To
also show centimeters, include a reference object in the image and enter its
real length and pixel length in the scanner calibration panel. The scanner
uses the fixed supplied scale of `1 px = 0.0265 cm` and shows converted
length/width automatically. This fixed scale is only valid for the camera
setup used to establish it. The
maturity view displays the label and confidence returned by
the maturity model. Capsaicin and Scoville values are shown only when the
Roboflow response includes numeric `capsaicin`/`capsaicin_content` and
`scoville`/`scoville_heat_index` fields; the app does not invent heat estimates
from a chili class label.

The scanner also displays an experimental heat estimate when all three
classification, segmentation, and maturity results are available. It starts
from a class-specific reference range: siling labuyo `80,000–100,000 SHU`,
siling haba `30,000–50,000 SHU` (comparative estimate), and siling demonyo
`100,000–225,000 SHU`. It places the result within that range using:
`position = 0.7 × maturity + 0.2 × stress + 0.1 × size`, where size is based
on the fixed `1 px = 0.0265 cm` scale, maturity comes from the maturity label,
and segmentation confidence is used as an experimental visual stress proxy.
Capsaicin is displayed as `SHU / 16` in mg/kg. These are heuristic estimates,
not laboratory measurements, and require calibration against measured samples
before scientific or production use.

The Raspberry Pi option uploads each captured JPEG to the same application API,
so Pi images also appear in Charts. On Raspberry Pi OS, install
`python3-picamera2` and `python3-venv`, then create a virtual environment with
`--system-site-packages`. Set `FIELDNOTES_API_URL` to
`https://app.example.com/api/roboflow/predict` and `IOT_DEVICE_KEY` to the same
private key configured on the app server, then run
`python scripts/raspi_chili_classifier.py`. The Roboflow key stays on the app
server. Captures upload every 3 seconds by default; set
`CAPTURE_INTERVAL_SECONDS` to change this. Camera inference uses Roboflow
account limits and may incur costs.

## Content publishing

Each workspace has a distinct publishing collection and editorial area:

- Supabase: `/supabase/admin`, stored in `supabase_posts`
- Directus: `/directus/admin`, stored in `directus_posts`
- PocketBase: `/pocketbase/admin`, stored in `pocketbase_posts`

`/admin` links to the three studios. Administrators can write posts, save
drafts, publish, edit, and delete posts in the matching studio. Published
posts appear on that workspace's home page and have a public article URL at
`/{workspace}/posts/{slug}`. The editor stores plain text with paragraph
breaks, plus a title, URL slug, optional excerpt and cover image, and
publication status.

New accounts are created with the `author` role and cannot create, edit, or
delete posts. To grant editorial administration, open the PocketBase admin UI,
select the `fieldnotes_accounts` collection, edit a trusted account, and set
its `role` field to `admin`. Users cannot change their own role; PocketBase
collection rules enforce admin-only content changes. An admin can then sign in
to the site and open the matching workspace studio.

## Profiles

Signed-in users see their active session in the workspace's collapsible
navigation and can sign out or open `/account`. The profile page lets them
change their display name, unique username, and profile photo. PocketBase
stores the username and avatar on `fieldnotes_accounts`; collection rules only
allow a user to update their own profile without changing their role.

## Accounts

Each workspace has a sign-in and registration page:

- `/supabase/login` and `/supabase/register`
- `/directus/login` and `/directus/register`
- `/pocketbase/login` and `/pocketbase/register`

After signing in, users are sent to the matching workspace home page. The same
verified account can sign in through any of the Supabase, Directus, and
PocketBase login pages.

All six pages use the same PocketBase `fieldnotes_accounts` authentication
collection. An account registered at any workspace login/register page can be
used to sign in at any of the three. Email verification and password checks
are handled by PocketBase.

Configure PocketBase SMTP in the admin UI and set the
`fieldnotes_accounts` verification email template to a URL on this app such as
`http://localhost:3000/pocketbase/verify?token={{.Token}}` for local testing
(use your deployed app origin in production). The verification route confirms
the PocketBase token and sends the user to login. For deployments where the
browser cannot reach PocketBase at `127.0.0.1:8090`, set
`NEXT_PUBLIC_POCKETBASE_URL` to the PocketBase URL accessible by visitors.
The public API allows signup and authentication. Users can view their own
account record, while account changes and role assignment are restricted to
the PocketBase admin UI. Passwords must be at least 8 characters.

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — lint the project
- `npm run setup` — download and verify the PocketBase Windows x64 binary
- `npm run pocketbase` — start PocketBase at `127.0.0.1:8090`
- `npm run pocketbase:install -- --force` — reinstall the latest PocketBase release
