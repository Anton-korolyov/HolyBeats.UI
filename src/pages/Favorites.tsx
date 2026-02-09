import { useEffect, useState, useRef } from "react";
import { getFavorites, removeFavorite } from "../api/api";
import "./favorites.css";

type Track = {
  id: number;
  title: string;
  url: string;
};

export default function Favorites() {

  const [tracks, setTracks] = useState<Track[]>([]);
  const [current, setCurrent] = useState<Track | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setTracks(await getFavorites());
  }
useEffect(() => {
  if (!current) return;
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: current.title,
    artist: "HolyBeats",
    artwork: [
      { src: "/covers/default.png", sizes: "96x96", type: "image/png" },
      { src: "/covers/default.png", sizes: "192x192", type: "image/png" },
      { src: "/covers/default.png", sizes: "512x512", type: "image/png" }
    ]
  });

  navigator.mediaSession.setActionHandler("play", () => {
    audioRef.current?.play();
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    audioRef.current?.pause();
  });

  navigator.mediaSession.setActionHandler("previoustrack", () => {
    playPrev();
  });

  navigator.mediaSession.setActionHandler("nexttrack", () => {
    playNext();
  });

}, [current]);
  function playNext() {
    if (!current || tracks.length === 0) return;
    const i = tracks.findIndex(t => t.id === current.id);
    const next = tracks[i + 1] ?? tracks[0];
    setCurrent(next);
  }

  function playPrev() {
    if (!current || tracks.length === 0) return;
    const i = tracks.findIndex(t => t.id === current.id);
    const prev = tracks[i - 1] ?? tracks[tracks.length - 1];
    setCurrent(prev);
  }

  return (
    <div className="favorites-page">

      <h1>❤️ Liked Tracks</h1>

      {/* LIST */}
      <div className="favorites-list">

        {tracks.map(t => (
          <div
            key={t.id}
            className={`favorite-card ${current?.id === t.id ? "active" : ""}`}
          >

            {/* LEFT */}
            <div className="fav-left">

              <img
                src="/covers/default.png"
                className="fav-cover"
              />

              <div className="track-title">{t.title}</div>

            </div>

            {/* ACTIONS */}
            <div className="fav-actions">

              <button onClick={() => setCurrent(t)}>▶</button>

              <button
                onClick={async () => {
                  await removeFavorite(t.id);

                  if (current?.id === t.id) {
                    audioRef.current?.pause();
                    setCurrent(null);
                  }

                  load();
                }}
              >
                ❌
              </button>

            </div>

          </div>
        ))}

      </div>

      {/* MINI PLAYER */}
      {current && (
        <div className="mini-player">

          <div className="mini-left">

            <img
              src="/covers/default.png"
              className="mini-cover"
            />

            <div>
              <div className="mini-title">{current.title}</div>

              <div className="mini-time">
                {Math.floor(currentTime/60)}:
                {String(Math.floor(currentTime%60)).padStart(2,"0")}
                {" / "}
                {Math.floor(duration/60)}:
                {String(Math.floor(duration%60)).padStart(2,"0")}
              </div>
            </div>

          </div>

          <div className="mini-center">

            <div className="mini-controls">
              <button onClick={playPrev}>⏮</button>

              <button
                className="play-btn"
                onClick={() => {
                  const a = audioRef.current;
                  if (!a) return;
                  a.paused ? a.play() : a.pause();
                }}
              >
                ⏯
              </button>

              <button onClick={playNext}>⏭</button>
            </div>

            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCurrentTime(v);
                if (audioRef.current)
                  audioRef.current.currentTime = v;
              }}
              className="mini-progress"
              style={{
                ["--progress" as any]:
                  duration ? `${(currentTime / duration) * 100}%` : "0%"
              }}
            />

          </div>

          <audio
            ref={audioRef}
            src={current.url}
            autoPlay
            onEnded={playNext}
            onTimeUpdate={() => {
              const a = audioRef.current;
              if (!a) return;
              setCurrentTime(a.currentTime);
            }}
            onLoadedMetadata={() => {
              const a = audioRef.current;
              if (!a) return;
              setDuration(a.duration || 0);
            }}
          />

        </div>
      )}

    </div>
  );
}
