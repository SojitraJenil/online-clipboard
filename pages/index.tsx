import { LoadingBarContainer } from "react-top-loading-bar";
import OnlineClipboard from "./OnlineClipboard";

export default function Home() {

  return (
    <div className="">
      <LoadingBarContainer>
        <OnlineClipboard />
      </LoadingBarContainer>
    </div>
  );
}