import { ImageResponse } from "next/og";

export const alt = "Internship Radar — student opportunities, in one place";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f8fafc",
          color: "#0f172a",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          padding: "80px",
          width: "100%"
        }}
      >
        <div
          style={{
            alignItems: "center",
            color: "#2563eb",
            display: "flex",
            fontSize: 28,
            fontWeight: 700,
            gap: 16
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: "#2563eb",
              borderRadius: 18,
              color: "white",
              display: "flex",
              height: 56,
              justifyContent: "center",
              width: 56
            }}
          >
            IR
          </div>
          INTERNSHIP RADAR
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.08,
            marginTop: 40,
            maxWidth: 1000
          }}
        >
          Find your next opportunity.
        </div>
        <div
          style={{
            color: "#475569",
            fontSize: 30,
            marginTop: 28
          }}
        >
          Internships · Hackathons · Research · Scholarships
        </div>
      </div>
    ),
    size
  );
}
