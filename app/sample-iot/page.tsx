import Link from "next/link";
import WorkspaceNavigation from "@/components/auth/WorkspaceNavigation";
import IotDashboard from "@/components/iot/IotDashboard";

export const metadata = {
  title: "Sample IoT — ESP32 Sensor Dashboard | Fieldnotes",
  description: "Live ESP32 readings from DS18B20, MQ, and HC-SR04 sensors.",
};

export default function SampleIotPage() {
  return (
    <main className="sample-iot-page">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Fieldnotes home">
          <span className="wordmark-mark" aria-hidden="true">f.</span>
          <span>fieldnotes</span>
        </Link>
        <WorkspaceNavigation platform="pocketbase" />
      </header>
      <section className="iot-dashboard-hero">
        <p className="section-kicker">Sample IoT · ESP32 monitor</p>
        <h1>Live sensor<br /><span>readings.</span></h1>
        <p>
          This dashboard receives actual readings from your ESP32, DS18B20,
          MQ sensor, and HC-SR04 through the PocketBase API.
        </p>
        <p className="iot-firmware-note">
          PlatformIO firmware is ready in <code>src/main.cpp</code>. Configure
          your Wi-Fi and computer LAN IP, then upload it to the ESP32.
        </p>
      </section>
      <IotDashboard />
    </main>
  );
}
