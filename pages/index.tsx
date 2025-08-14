import { LoadingBarContainer } from "react-top-loading-bar";
import OnlineClipboard from "./OnlineClipboard";

export default function Home() {
  // List of AI tools with border colors
  const aiFrames = [
    { name: "ChatGPT", url: "https://chatgpt.com", color: "#3b82f6" }, // blue
    { name: "Google Bard", url: "https://bard.google.com", color: "#22c55e" }, // green
    { name: "Claude AI", url: "https://claude.ai", color: "#f97316" }, // orange
    { name: "Perplexity AI", url: "https://perplexity.ai", color: "#8b5cf6" }, // purple
  ];

  return (
    <div style={{ background: "#f3f4f6", padding: "20px" }}>
      <LoadingBarContainer>
        <OnlineClipboard />
        <br />

        {aiFrames.map((frame, index) => (
          <div
            key={index}
            style={{
              width: "100%",
              height: "100vh",
              marginBottom: "40px",
              background: "white",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            {/* AI Name Header */}
            <div
              style={{
                padding: "12px 16px",
                fontSize: "18px",
                fontWeight: "bold",
                background: frame.color,
                color: "white",
                textAlign: "center",
              }}
            >
              {frame.name}
            </div>

            {/* Iframe */}
            <iframe
              src={frame.url}
              style={{
                width: "100%",
                height: "calc(100% - 48px)", // adjust for header
                border: `2px solid ${frame.color}`,
              }}
              title={frame.name}
            />
          </div>
        ))}
      </LoadingBarContainer>
    </div>
  );
}
