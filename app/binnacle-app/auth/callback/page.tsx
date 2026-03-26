"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function CallbackContent() {
  const params = useSearchParams();
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    return (
      <div style={{ fontFamily: "monospace", padding: 40, color: "#f87171" }}>
        <h2>Authorization Failed</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (code) {
    return (
      <div
        style={{
          fontFamily: "monospace",
          padding: 40,
          color: "#34d399",
          maxWidth: 600,
        }}
      >
        <h2>Binnacle — Tesla Authorized</h2>
        <p style={{ color: "#888", marginTop: 12 }}>
          Copy this authorization code to your relay server:
        </p>
        <pre
          style={{
            background: "#141820",
            padding: 16,
            borderRadius: 8,
            marginTop: 12,
            wordBreak: "break-all",
            whiteSpace: "pre-wrap",
          }}
        >
          {code}
        </pre>
        {state && (
          <p style={{ color: "#666", marginTop: 12, fontSize: 12 }}>
            State: {state}
          </p>
        )}
        <p style={{ color: "#666", marginTop: 24, fontSize: 13 }}>
          You can close this window.
        </p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "monospace", padding: 40, color: "#888" }}>
      <p>Waiting for Tesla authorization...</p>
    </div>
  );
}

export default function TeslaCallback() {
  return (
    <div
      style={{
        background: "#06080D",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Suspense fallback={<div style={{ color: "#888" }}>Loading...</div>}>
        <CallbackContent />
      </Suspense>
    </div>
  );
}
