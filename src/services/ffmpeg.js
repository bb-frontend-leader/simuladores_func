import { createFFmpeg } from '@ffmpeg/ffmpeg';

const ffmpeg = createFFmpeg({ 
  log: true,  
  mainName: 'main',
  corePath: 'https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js'
})

export default ffmpeg