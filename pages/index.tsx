import { LoadingBarContainer } from "react-top-loading-bar";
import OnlineClipboard from "./OnlineClipboard";

export default function Home() {
  // List of AI tools with border colors
  const aiFrames = [
    { url: "https://chatgpt.com", color: "blue" },
    { url: "https://bard.google.com", color: "green" },
    { url: "https://claude.ai", color: "orange" },
    { url: "https://perplexity.ai", color: "purple" },
  ];

  return (
    <div>
      <LoadingBarContainer>
        <OnlineClipboard />
        <br />
        {aiFrames.map((frame, index) => (
          <div
            key={index}
            style={{ width: "100%", height: "100vh", marginBottom: "20px" }}
          >
            <iframe
              src={frame.url}
              style={{
                width: "100%",
                height: "100%",
                border: `2px solid ${frame.color}`, // simpler border
                borderRadius: "8px",
              }}
              title={`AI Tool ${index + 1}`}
            />
          </div>
        ))}
      </LoadingBarContainer>
    </div>
  );
}
