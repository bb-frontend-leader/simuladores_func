/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useEffect, useRef, useState, useCallback } from "react";

import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import WaveSurfer from "https://unpkg.com/wavesurfer.js@beta";
import Regions from "https://unpkg.com/wavesurfer.js@7.0.0-beta.11/dist/plugins/regions.js";

import css from "./AudioCutter.module.css";

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

function WaveSurferPlayer(props) {
  const { file } = props;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [outputAudio, setOutputAudio] = useState(null);

  const containerRef = useRef();
  const cutterTime = useRef({ startTime: 0, endTime: 0 });
  const wavesurfer = useWavesurfer(containerRef, props);

  const handleWaveSurferEvent = () => {
    const WaveSurferRegion = wavesurfer.plugins[0];
    let activeRegion = null;

    wavesurfer.on("play", () => setIsPlaying(true));

    wavesurfer.on("pause", () => setIsPlaying(false));

    wavesurfer.on("interaction", () => (activeRegion = null));

    wavesurfer.on("ready", () => {
      WaveSurferRegion.addRegion({
        start: 0,
        end: wavesurfer.getDuration(),
      });
    });

    wavesurfer.on("timeupdate", (currentTime) => {
      if (
        activeRegion &&
        wavesurfer.isPlaying() &&
        currentTime >= activeRegion.end
      ) {
        wavesurfer.setTime(activeRegion.start);
      }

      setCurrentTime(currentTime);
    });

    WaveSurferRegion.on("region-clicked", (region, e) => {
      e.stopPropagation();
      activeRegion = region;
      region.play();
    });

    WaveSurferRegion.on("region-updated", (region) => {
      cutterTime.current = {
        startTime: region.start,
        endTime: region.end,
      };
    });
  };

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

  const handleCutAudio = async () => {
    const REGEX = /^(.+)\.\w+$/;
    const fileOutputName = `${file.name.match(REGEX)[1]}-cut.mp3`;

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

  const handlePlayClick = useCallback(() => {
    wavesurfer.isPlaying() ? wavesurfer.pause() : wavesurfer.play();
  }, [wavesurfer]);

  useEffect(() => {
    if (!wavesurfer) return;

    setCurrentTime(0);
    setIsPlaying(false);

    // We trigger all events from WaveSufer
    handleWaveSurferEvent();

    return () => {
      wavesurfer.unAll();
    };
  }, [wavesurfer]);

  return (
    <div className={css["audio__content"]}>
      <p>Seconds played: {converterTime(currentTime)}</p>

      <div ref={containerRef} style={{ minHeight: "120px" }} />

      <div className={css["audio__buttons"]}>
        <button className={css.button} onClick={handlePlayClick}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button className={css.button} onClick={handleCutAudio}>
          ✂
        </button>
      </div>

      {outputAudio ? (
        <div data-audio>
          <audio src={outputAudio} controls />
        </div>
      ) : null}
    </div>
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
    <section className={css["content"]}>
      <label className={css["drop__container"]}>
        <span className={css["drop__title"]}>Drop files here</span> or
        <input
          type="file"
          accept="audio/*"
          required
          onChange={handleChange}
          placeholder="Select your files"
        />
      </label>

      {audioFile ? (
        <WaveSurferPlayer
          height={100}
          waveColor="rgb(134, 108, 196)"
          progressColor="rgb(59, 48, 84)"
          url={audioUrl}
          plugins={[Regions.create()]}
          file={audioFile}
          barWidth="3"
          barGap="1"
          barRadius="2"
        />
      ) : null}
    </section>
  );
}
