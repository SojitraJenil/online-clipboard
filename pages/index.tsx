import { LoadingBarContainer } from "react-top-loading-bar";
import OnlineClipboard from "./OnlineClipboard";

export default function Home() {

  return (
    <div className="">
      <LoadingBarContainer>
        <OnlineClipboard />
<br/>
  <div style={{ width: "100%", height: "100vh" }}>
      <iframe
        src="https://example.com" // replace with allowed third-party URL
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        title="Third Party Content"
      />
    </div>
  
      </LoadingBarContainer>
    </div>
  );
}