/* eslint-disable react/prop-types */
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { useRef, useState } from "react";

const FFMPEG_CONFIGURATION = Object.freeze({
  log: true,
  mainName: "main",
  corePath: "https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js",
});

function AudioPlayer({ id, url, onTime }) {
  const refAudio = useRef();

  const handleCut = () => {
    if (onTime) {
      onTime({ id, time: refAudio.current.currentTime });
    }
  };

  return (
    <div>
      <audio ref={refAudio} src={url} controls />
      <button onClick={handleCut}>✂</button>
    </div>
  );
}

export default function AudiJoiner() {
  const [selectedAudios, setSelectedAudios] = useState([]);
  const audioTimelineRef = useRef([]);
  const [outputAudio, setOutputAudio] = useState(null);

  const handleOnChange = ({ target }) => {
    const files = Array.from(target.files, (file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      file,
    }));

    setSelectedAudios(files);
  };

  const handleAudioTimeLine = ({ id, time }) => {
    const audioTimeLineIndex = audioTimelineRef.current.findIndex(
      (item) => item.id === id
    );

    if (audioTimeLineIndex >= 0) {
      audioTimelineRef.current = [
        ...audioTimelineRef.current.slice(0, audioTimeLineIndex),
        { ...audioTimelineRef.current[audioTimeLineIndex], timeEnd: time },
        ...audioTimelineRef.current.slice(audioTimeLineIndex + 1),
      ];

      return;
    }

    audioTimelineRef.current.push({ id, timeStart: time });
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

  const handleCutAudio = async ({ file, startTime, endTime }) => {
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
      converterTime(startTime),
      "-to",
      converterTime(endTime),
      fileOutputName
    );

    // Read the result
    const data = ffmpeg.FS("readFile", fileOutputName);

    // Create audio
    const newAudio = new Blob([data.buffer], { type: "audio/mpeg" });

    return newAudio;
  };

  const mergeAudios = async () => {
    const ffmpeg = createFFmpeg(FFMPEG_CONFIGURATION);
    await ffmpeg.load();

    const audioFiles = [];

    for (const audio of audioTimelineRef.current) {
      audioFiles.push(
        await handleCutAudio({
          file: selectedAudios.find(({ id }) => id === audio.id).file,
          startTime: audio.timeStart,
          endTime: audio.timeEnd,
        })
      );
    }

    console.log(audioFiles);

    // Cargar los archivos de audio
    for (let i = 0; i < audioFiles.length; i++) {
      ffmpeg.FS("writeFile", `input${i}.mp3`, await fetchFile(audioFiles[i]));
    }

    // Crear un archivo de texto con la lista de archivos de audio
    const fileList = audioFiles
      .map((_, i) => `file 'input${i}.mp3'`)
      .join("\n");
    ffmpeg.FS("writeFile", "input.txt", fileList);

    // Concatenar los archivos de audio
    await ffmpeg.run(
      "-f",
      "concat",
      "-i",
      "input.txt",
      "-c",
      "copy",
      "output.mp3"
    );

    // Obtener el archivo de audio resultante
    const data = ffmpeg.FS("readFile", "output.mp3");

    // Convertir el archivo de datos en un objeto URL
    const audioUrl = URL.createObjectURL(
      new Blob([data.buffer], { type: "audio/mpeg" })
    );

    setOutputAudio(audioUrl);
  };

  return (
    <label>
      <span>Drop files here</span> or
      <input
        type="file"
        accept="audio/*"
        required
        placeholder="Select your files"
        multiple
        onChange={handleOnChange}
      />
      <ul>
        {selectedAudios.map(({ id, url }) => (
          <li key={id}>
            <AudioPlayer id={id} url={url} onTime={handleAudioTimeLine} />
          </li>
        ))}
      </ul>
      <button onClick={mergeAudios}>Join 🔗</button>
      {outputAudio ? (
        <div data-audio>
          <audio src={outputAudio} controls />
        </div>
      ) : null}
    </label>
  );
}
