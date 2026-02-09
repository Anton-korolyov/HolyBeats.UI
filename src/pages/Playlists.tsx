import { useEffect, useState,useRef} from "react";
import {
  getPlaylists,
  createPlaylist,
  getPlaylistTracks,
  deletePlaylist,
  removeTrackFromPlaylist
} from "../api/api";

import "./Playlists.css";

/* ================= TYPES ================= */

type Playlist = {
  id: number;
  name: string;
};

type Track = {
  id: number;
  title: string;
  url: string;   // 🔥 MP3 from R2
};

/* ================= COMPONENT ================= */

export default function Playlists() {

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selected, setSelected] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [name, setName] = useState("");
const audioRef = useRef<HTMLAudioElement>(null);

const [currentTime, setCurrentTime] = useState(0);
const [duration, setDuration] = useState(0);
  // 🎵 current playing
  const [current, setCurrent] = useState<Track | null>(null);

  useEffect(() => {
    loadPlaylists();
  }, []);
useEffect(() => {
  if (!current) return;
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: current.title,
    artist: "Holy Beats",
    artwork: [
      { src: "/logo.png", sizes: "96x96", type: "image/png" },
      { src: "/logo.png", sizes: "192x192", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png" }
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

  async function loadPlaylists() {
    setPlaylists(await getPlaylists());
  }

  async function handleCreate() {
    if (!name.trim()) return;

    await createPlaylist(name);
    setName("");
    loadPlaylists();
  }

  async function handleSelect(p: Playlist) {
    setSelected(p);
    const list = await getPlaylistTracks(p.id);
    setTracks(list);
    setCurrent(null);
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete playlist?")) return;

    await deletePlaylist(id);
    setSelected(null);
    setTracks([]);
    setCurrent(null);
    loadPlaylists();
  }

  async function handleRemoveTrack(trackId: number) {
    if (!selected) return;

    await removeTrackFromPlaylist(selected.id, trackId);
    const list = await getPlaylistTracks(selected.id);
    setTracks(list);
  }
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
  // ▶ auto next track
 

  return (
    <div className="player">

      <h1>🎵 My Playlists</h1>

      {/* CREATE */}
   <div className="playlist-create">
  <input
    className="playlist-input"
    placeholder="New playlist name"
    value={name}
    onChange={e => setName(e.target.value)}
  />

  <button
    className="playlist-create-btn"
    onClick={handleCreate}
  >
    ➕ Create
  </button>
</div>

      {/* PLAYLIST LIST */}
     <select
  className="playlist-select"
  value={selected?.id ?? ""}
  onChange={async (e) => {
    const id = Number(e.target.value);
    const p = playlists.find(x => x.id === id);
    if (p) await handleSelect(p);
  }}
>
  <option value="">Select playlist</option>

  {playlists.map(p => (
    <option key={p.id} value={p.id}>
      {p.name}
    </option>
  ))}
</select>

{/* delete button */}
{selected && (
  <button
    className="playlist-delete-btn"
    onClick={() => handleDelete(selected.id)}
  >
    🗑 Delete playlist
  </button>
)}


      {/* TRACKS */}
      {selected && (
        <>
          <h2>🎧 {selected.name}</h2>

          {tracks.map(t => (
            <div key={t.id} className="card-playlist">

              <div className="track-title">
                {t.title}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>

                <button onClick={() => setCurrent(t)}>
                  ▶ Play
                </button>

                <button onClick={() => handleRemoveTrack(t.id)}>
                  ❌
                </button>

              </div>

            </div>
          ))}
        </>
      )}

      {/* 🎧 AUDIO PLAYER */}
    {current && (
  <div className="mini-player">

    <div className="mini-left">
      <div className="mini-title">{current.title}</div>
      <div className="mini-time">
        {Math.floor(currentTime/60)}:
        {String(Math.floor(currentTime%60)).padStart(2,"0")}
        {" / "}
        {Math.floor(duration/60)}:
        {String(Math.floor(duration%60)).padStart(2,"0")}
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
