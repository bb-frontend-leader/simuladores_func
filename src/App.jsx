import AudioCutter from "./components/AudioCutter/AudioCutter";

function App() {
  return (
    <>
      <header>
        <h1>Virtual DJ 💽</h1>
      </header>

      <main>
        <section>
          <h2>Audio Cutter ✂</h2>
          <AudioCutter/>
        </section>

        <section>
          <h2>Audio Join 🔗</h2>
         {/* Put your component here... ❌ */}
        </section>
      </main>
    </>
  );
}

export default App;
