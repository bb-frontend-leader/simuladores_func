// import AudioCutter from "./components/AudioCutter/AudioCutter";
// import AudioJoiner from "./components/AudioJoiner/AudioJoiner";

import { useRef } from "react";
import useResize from "./hooks/useResize";

function App() {
  const containerRef = useRef();

  const { styles } = useResize(containerRef);

  return (
    <>
      <header>
        <h1>Virtual DJ 💽</h1>
      </header>

      <main>
        <div ref={containerRef} className="container" style={{...styles}}>
          {/* 🎵 Audio */}
          <span data-side="left" className="side"></span>
          <span data-side="right" className="side side--right"></span>
        </div>
        
      </main>
    </>
  );
}

export default App;
