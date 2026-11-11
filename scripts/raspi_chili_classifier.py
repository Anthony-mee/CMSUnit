import io
import json
import os
import time
import urllib.error
import urllib.request
import uuid

from picamera2 import Picamera2


def publish_image(image: bytes, api_url: str, device_key: str) -> dict:
    boundary = f"----Fieldnotes{uuid.uuid4().hex}"
    parts = [
        f"--{boundary}\r\n".encode(),
        b'Content-Disposition: form-data; name="mode"\r\n\r\nraspberry-pi\r\n',
        f"--{boundary}\r\n".encode(),
        b'Content-Disposition: form-data; name="image"; filename="raspberry-pi.jpg"\r\n',
        b"Content-Type: image/jpeg\r\n\r\n",
        image,
        b"\r\n",
        f"--{boundary}--\r\n".encode(),
    ]
    request = urllib.request.Request(
        api_url,
        data=b"".join(parts),
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "X-Device-Key": device_key,
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        return json.loads(response.read())


def main() -> None:
    api_url = os.environ.get("FIELDNOTES_API_URL", "").strip()
    device_key = os.environ.get("IOT_DEVICE_KEY", "")
    interval = float(os.environ.get("CAPTURE_INTERVAL_SECONDS", "3"))
    if not api_url.startswith("https://"):
        raise SystemExit("Set FIELDNOTES_API_URL to the public HTTPS /api/roboflow/predict endpoint.")
    if len(device_key) < 32:
        raise SystemExit("Set IOT_DEVICE_KEY to the app's private device key (at least 32 characters).")
    if interval <= 0:
        raise SystemExit("CAPTURE_INTERVAL_SECONDS must be greater than zero.")

    camera = Picamera2()
    camera.configure(camera.create_still_configuration())
    camera.start()

    try:
        time.sleep(2)
        print(f"Saving Raspberry Pi camera scans to {api_url}. Press Ctrl+C to stop.")
        while True:
            started_at = time.monotonic()
            try:
                image_buffer = io.BytesIO()
                camera.capture_file(image_buffer, format="jpeg")
                image = image_buffer.getvalue()
                response = publish_image(image, api_url, device_key)
                scan = response.get("scan", {})
                results = response.get("results", [])
                predictions = [
                    prediction
                    for model in results
                    for prediction in model.get("predictions", [])[:1]
                ]
                summary = ", ".join(
                    f"{prediction.get('class', 'unknown')}: "
                    f"{float(prediction.get('confidence', 0)):.1%}"
                    for prediction in predictions
                )
                print(
                    f"Saved scan {scan.get('id', 'unknown')} "
                    f"({scan.get('inference_status', 'unknown')}): "
                    f"{summary or 'no predictions returned'}"
                )
            except (urllib.error.URLError, TimeoutError, ValueError) as error:
                print(f"Scan upload failed: {error}")
            time.sleep(max(0, interval - (time.monotonic() - started_at)))
    finally:
        camera.stop()


if __name__ == "__main__":
    main()
