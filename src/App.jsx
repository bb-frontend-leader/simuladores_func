import AudioCutter from "./components/AudioCutter/AudioCutter";
import AudioJoiner from "./components/AudioJoiner/AudioJoiner";

function App() {
  return (
    <>
      <header>
        <h1>Virtual DJ 💽</h1>
      </header>

      <main>
        <section>
          <h2>Audio Cutter ✂</h2>
          <AudioCutter />
        </section>

        <section>
          <h2>Audio Join 🔗</h2>
          <AudioJoiner />
        </section>
      </main>
    </>
  );
}

export default App;
