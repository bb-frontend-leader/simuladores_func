/* eslint-disable react/prop-types */
import { useState, useEffect, useRef, useCallback } from "react";
import WaveSurfer from "https://unpkg.com/wavesurfer.js@beta";
import Regions from "https://unpkg.com/wavesurfer.js@7.0.0-beta.11/dist/plugins/regions.js";

import css from "./AudioCutter.module.css";

const FFMPEG_CONFIGURATION = Object.freeze({
  log: true,
  mainName: "main",
  corePath: "https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js",
});

const useWavesurfer = (element, options) => {
  const [wavesurfer, setWaveSurfer] = useState(null);

  useEffect(() => {
    if (!element) return;

    const wave = WaveSurfer.create({
      container: document.getElementById(element),
      height: 100,
      waveColor: "rgb(134, 108, 196)",
      progressColor: "rgb(59, 48, 84)",
      plugins: [Regions.create()],
      barWidth: "3",
      barGap: "1",
      barRadius: "2",
      ...options,
    });

    setWaveSurfer(wave);

    return () => {
      wave.destroy();
    };
  }, [options, element]);

  return wavesurfer;
};

export default function MediaPlayer() {
  const [selectedAudios, setSelectedAudios] = useState([]);

  const handleChange = ({ target }) => {
    const files = Array.from(target.files, (file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      file,
    }));

    setSelectedAudios(files);
  };

  return (
    <section className={css["content"]} id="a">
      <label className={css["drop__container"]}>
        <span className={css["drop__title"]}>Drop files here</span> or
        <input
          type="file"
          accept="audio/*"
          required
          onChange={handleChange}
          placeholder="Select your files"
          multiple
        />
      </label>

      {selectedAudios.length > 0 ? (
        <WaveSurferPlayer audios={selectedAudios} />
      ) : null}
    </section>
  );
}

function WaveSurferPlayer({ audios }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className={css["audio__content"]}>
      <ul>
        {audios.map((audio) => (
          <li key={audio.id}>
            <WaveSurferItem
              id={audio.id}
              url={audio.url}
              isPlaying={isPlaying}
            />
          </li>
        ))}
      </ul>

      <div className={css["audio__buttons"]}>
        <button className={css.button} onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>
    </div>
  );
}

function WaveSurferItem(props) {
  const { id, isPlaying } = props;

  const [currentTime, setCurrentTime] = useState(0);
  const wavesurfer = useWavesurfer(id, props);
  const WaveSurferRegion = useCallback(
    () => wavesurfer.plugins[0],
    [wavesurfer]
  );

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

  useEffect(() => {
    if (!wavesurfer) return;

    setCurrentTime(0);

    let activeRegion = null;

    // wavesurfer.on("play", () => setIsPlaying(true));

    // wavesurfer.on("pause", () => setIsPlaying(false));

    wavesurfer.on("interaction", () => (activeRegion = null));

    wavesurfer.on("ready", () => {
      WaveSurferRegion().addRegion({
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

    WaveSurferRegion().on("region-clicked", (region, e) => {
      e.stopPropagation();
      activeRegion = region;
      region.play();
    });

    return () => {
      wavesurfer.unAll();
    };
  }, [wavesurfer, id, WaveSurferRegion]);

  useEffect(() => {
    if (!wavesurfer) return;
    wavesurfer.isPlaying() ? wavesurfer.pause() : wavesurfer.play();
  }, [wavesurfer, isPlaying]);

  return (
    <div>
      <p>{`00:00:10 - ${converterTime(currentTime)}`}</p>
      <div id={id} style={{ position: "relative", minHeight: "120px" }} />
    </div>
  );
}
