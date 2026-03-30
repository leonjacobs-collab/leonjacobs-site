import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Binnacle",
  description:
    "Binnacle is an iOS app that turns an iPhone into an auxiliary instrument cluster for Tesla Model 3 and Model Y.",
};

export default function BinnaclePage() {
  return (
    <main
      className="container"
      style={{ paddingTop: "var(--sp-8)", paddingBottom: "var(--sp-12)" }}
    >
      <Link
        href="/"
        style={{
          display: "inline-block",
          fontSize: "var(--text-sm)",
          color: "var(--fg-muted)",
          marginBottom: "var(--sp-6)",
        }}
      >
        &larr; Home
      </Link>

      <div style={{ marginBottom: "var(--sp-2)" }}>
        <span className="tag">iOS</span>
      </div>

      <h1
        style={{
          fontSize: "var(--text-2xl)",
          lineHeight: "var(--leading-tight)",
          marginBottom: "var(--sp-4)",
        }}
      >
        Binnacle
      </h1>

      <div className="prose" style={{ marginBottom: "var(--sp-6)" }}>
        <p>
          Binnacle is an iOS app that turns an iPhone into an auxiliary
          instrument cluster for Tesla Model 3 and Model Y. The phone mounts
          behind the steering wheel, visible through the rim gap, and displays
          real-time driving intelligence — stopping distance, contextual road
          alerts, weather, air quality, nearby chargers, and navigation —
          sourced from open data APIs and Tesla telemetry.
        </p>

        <p>
          The app connects to a lightweight relay server that enriches vehicle
          data with third-party feeds including OpenChargeMap for EV charger
          availability, Open-Meteo for weather, OpenStreetMap Overpass for speed
          cameras and road features, and Belgian transport APIs for traffic
          conditions.
        </p>

        <p>
          Binnacle is a personal project by Leon Jacobs, built in Swift and
          SwiftUI for the European market. It is not affiliated with Tesla, Inc.
        </p>
      </div>

      <hr className="divider" />

      <section style={{ marginBottom: "var(--sp-6)" }}>
        <h2
          style={{
            fontSize: "var(--text-lg)",
            marginBottom: "var(--sp-2)",
          }}
        >
          API Access
        </h2>
        <p
          style={{
            fontSize: "var(--text-sm)",
            color: "var(--fg-muted)",
            maxWidth: "55ch",
            lineHeight: "var(--leading-body)",
          }}
        >
          Binnacle requires an API key to connect to the relay server. To
          request access, contact{" "}
          <a href="mailto:mailto@leonmay.be">mailto@leonmay.be</a> with your Tesla
          account region and a brief description of your use case.
        </p>
      </section>

      <hr className="divider" />

      <footer
        style={{
          fontSize: "var(--text-xs)",
          color: "var(--fg-faint)",
          lineHeight: "var(--leading-body)",
        }}
      >
        <p>
          Tesla and all related marks are trademarks of Tesla, Inc. Binnacle is
          an independent project and is not endorsed by or affiliated with
          Tesla, Inc.
        </p>
      </footer>
    </main>
  );
}
