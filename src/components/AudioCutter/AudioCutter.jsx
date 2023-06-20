import { useState, useEffect } from "react";
import ffmpeg from "../../services/ffmpeg";

export default function AudioCutter() {
  const [ready, setReady] = useState(false);

  const loadAsync = async () => {
    await ffmpeg.load();
    setReady(true);
  };

  useEffect(() => {
    loadAsync();
  }, []);

  return (
    <audio preload="metadata" controls>
      <source
        src="https://mdn.github.io/learning-area/accessibility/multimedia/viper.mp3"
        type="audio/mp3"
      />
    </audio>
  );
}
