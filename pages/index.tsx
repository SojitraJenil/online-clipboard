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
        src="http://chatgpt.com"
        style={{
          width: "100%",
          height: "100%",
          border: "4px solid red",
        }}
        title="Third Party Content"
      />
    </div>
  
      </LoadingBarContainer>
    </div>
  );
}