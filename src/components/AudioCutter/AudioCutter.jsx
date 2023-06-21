/* eslint-disable react/prop-types */
import { useEffect, useRef, useState, useCallback } from "react";

import WaveSurfer from "https://unpkg.com/wavesurfer.js@beta";
import Regions from "https://unpkg.com/wavesurfer.js@7.0.0-beta.11/dist/plugins/regions.js";
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";

const FFMPEG_CONFIGURATION = Object.freeze({
  log: true,
  mainName: "main",
  corePath: "https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js",
});

const useWavesurfer = (containerRef, options) => {
  const [wavesurfer, setWaveSurfer] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const wave = WaveSurfer.create({
      ...options,
      container: containerRef.current,
    });

    setWaveSurfer(wave);

    return () => {
      wave.destroy();
    };
  }, [options, containerRef]);

  return wavesurfer;
};

// const useFFmpeg = () => {
//   const [ready, setReady] = useState(false);

//   const loadFFmpeg = async () => {
//     await ffmpeg.load();
//     setReady(true);
//   };

//   useEffect(() => {
//     loadFFmpeg();
//   }, []);

//   return ready;
// };

function WaveSurferPlayer(props) {
  const { file } = props;

  const containerRef = useRef();
  const cutterTime = useRef({ startTime: 0, endTime: 0 });

  const [outputAudio, setOutputAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const wavesurfer = useWavesurfer(containerRef, props);
  // const readyLoadFFmpeg = useFFmpeg();

  const onPlayClick = useCallback(() => {
    wavesurfer.isPlaying() ? wavesurfer.pause() : wavesurfer.play();
  }, [wavesurfer]);

  useEffect(() => {
    if (!wavesurfer) return;

    setCurrentTime(0);
    setIsPlaying(false);

    // const WaveSurferRegions = wavesurfer.registerPlugin(Regions.create());
    const WaveSurferRegion = wavesurfer.plugins[0];
    const RegionConfig = {
      loop: true,
      activeRegion: null,
    };

    const subscriptions = [
      wavesurfer.on("ready", () => {
        WaveSurferRegion.addRegion({
          start: 0,
          end: wavesurfer.getDuration(),
        });
      }),
      wavesurfer.on("timeupdate", (currentTime) => {
        if (
          RegionConfig.activeRegion &&
          wavesurfer.isPlaying() &&
          currentTime >= RegionConfig.activeRegion.end
        ) {
          if (RegionConfig.loop) {
            // If looping, jump to the start of the region
            wavesurfer.setTime(RegionConfig.activeRegion.start);
          } else {
            // Otherwise, exit the region
            RegionConfig.activeRegion = null;
          }
        }
        setCurrentTime(currentTime);
      }),
      wavesurfer.on("play", () => setIsPlaying(true)),
      wavesurfer.on("pause", () => setIsPlaying(false)),
      wavesurfer.on("interaction", () => (RegionConfig.activeRegion = null)),
      WaveSurferRegion.on("region-clicked", (region, e) => {
        e.stopPropagation();
        RegionConfig.activeRegion = region;
        region.play();
      }),
      WaveSurferRegion.on("region-updated", (region) => {
        cutterTime.current = { startTime: region.start, endTime: region.end };
      }),
    ];

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [wavesurfer]);

  const converterTime = (time) => {
    const hour = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    return (
      ("0" + hour).slice(-2) +
      ":" +
      ("0" + minutes).slice(-2) +
      ":" +
      ("0" + seconds).slice(-2)
    );
  };
  
  const cutAudio = async () => {
    const patron = /^(.+)\.\w+$/;
    const fileOutputName = `${file.name.match(patron)[1]}-cut.mp3`;

    const ffmpeg = createFFmpeg(FFMPEG_CONFIGURATION);
    await ffmpeg.load();

    // Write the file to memory
    ffmpeg.FS("writeFile", file.name, await fetchFile(file));

    // Run the FFMpeg command
    await ffmpeg.run(
      "-i",
      file.name,
      "-ss",
      converterTime(cutterTime.current.startTime),
      "-to",
      converterTime(cutterTime.current.endTime),
      fileOutputName
    );

    // Read the result
    const data = ffmpeg.FS("readFile", fileOutputName);

    // Create a URL
    const audioUrl = URL.createObjectURL(
      new Blob([data.buffer], { type: "audio/mpeg" })
    );
    setOutputAudio(audioUrl);
  };

  return (
    <>
      <p>Seconds played: {currentTime}</p>
      <div ref={containerRef} style={{ minHeight: "120px" }} />
      <button onClick={onPlayClick}>{isPlaying ? "Pause" : "Play"}</button>
      <button onClick={cutAudio}>✂</button>

      {outputAudio && <audio src={outputAudio} controls />}
    </>
  );
}

export default function AudioCutter() {
  const [audioUrl, setAudioUrl] = useState("");
  const [audioFile, setAudioFile] = useState();

  const handleChange = (event) => {
    const audioFile = event.target.files[0];
    const url = URL.createObjectURL(audioFile);

    setAudioUrl(url);
    setAudioFile(audioFile);
  };

  return (
    <>
      <WaveSurferPlayer
        height={100}
        waveColor="rgb(108, 92, 231)"
        progressColor="rgb(10, 24, 33)"
        url={audioUrl}
        plugins={[Regions.create()]}
        file={audioFile}
      />

      <input type="file" onChange={handleChange} />
    </>
  );
}
