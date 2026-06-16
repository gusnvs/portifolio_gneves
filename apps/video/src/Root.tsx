import { Composition } from "remotion";
import { MascotIntro } from "./compositions/MascotIntro";
import { MascotLoop } from "./compositions/MascotLoop";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MascotIntro"
        component={MascotIntro}
        durationInFrames={96}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="MascotLoop"
        component={MascotLoop}
        durationInFrames={60}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
