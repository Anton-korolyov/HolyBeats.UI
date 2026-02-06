import { useEffect, useState } from "react";
import { getFavorites } from "../api/api";
import { removeFavorite } from "../api/api";
type Track = {
  id: number;
  title: string;
  url: string;
};

export default function Favorites() {

  const [tracks, setTracks] = useState<Track[]>([]);
  const [current, setCurrent] = useState<Track | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await getFavorites();
    setTracks(data);
  }

  return (
    <div className="player">

      <h1>❤️ Избранное</h1>

      {tracks.map(t => (
  <div key={t.id} className="card">

    <div className="track-title">{t.title}</div>

    <div style={{ display: "flex", gap: "10px" }}>

      <button onClick={() => setCurrent(t)}>
        ▶
      </button>

   <button
  onClick={async () => {
    await removeFavorite(t.id);

    // если удаляемый трек сейчас играет
    if (current?.id === t.id) {
      setCurrent(null);   // 🔥 убираем плеер
    }

    load(); // обновляем список
  }}
>
  ❌
</button>


    </div>

  </div>
))}

      {current && (
        <audio
          controls
          autoPlay
          src={current.url}
        />
      )}

    </div>
  );
}
