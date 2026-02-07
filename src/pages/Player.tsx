import { useEffect, useState,useRef } from "react";
import {
  getTracks,
  addFavorite,
  getPlaylists,
  createPlaylist,
  addTrackToPlaylist,
  getPlaylistTracks
} from "../api/api";

import type { Track, Playlist } from "../api/api";
import FullPlayer from "../components/FullPlayer";
import LoginModal from "../components/LoginModal";
import "./player.css";

function isLoggedIn() {
  return !!localStorage.getItem("token");
}

export default function Player() {

  // ===== DATA =====
  const [tracks, setTracks] = useState<Track[]>([]);
  const [current, setCurrent] = useState<Track | null>(null);
    
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] =
    useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [_playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [newPlaylist, setNewPlaylist] = useState("");

  // ===== UI =====
  const [showLogin, setShowLogin] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  // ===== LOAD =====
  useEffect(() => {
    loadAll();
  }, []);
  function playNext() {
  if (!tracks.length || !current) return;

  const i = tracks.findIndex(x => x.id === current.id);

  let next = i + 1;
  if (next >= tracks.length) next = 0;

  setCurrent(tracks[next]);
}
function playPrev() {
  if (!tracks.length || !current) return;

  const i = tracks.findIndex(x => x.id === current.id);

  let prev = i - 1;
  if (prev < 0) prev = tracks.length - 1;

  setCurrent(tracks[prev]);
}
  async function loadAll() {
    const result = await getTracks(1);
    setTracks(result.items);

    if (isLoggedIn()) {
      setPlaylists(await getPlaylists());
    }
  }

  // ===== PLAYLIST =====
  async function handleSelectPlaylist(p: Playlist) {
    setSelectedPlaylistId(p.id);
    const list = await getPlaylistTracks(p.id);
    setPlaylistTracks(list);
  }

  async function handleCreatePlaylist() {
    if (!newPlaylist.trim()) return;

    await createPlaylist(newPlaylist);
    setNewPlaylist("");
    setPlaylists(await getPlaylists());
  }
function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
  async function handleAddToPlaylist(trackId: number) {
    if (!isLoggedIn()) {
      setShowLogin(true);
      return;
    }

    if (!selectedPlaylistId) {
      alert("Select playlist first");
      return;
    }

    await addTrackToPlaylist(selectedPlaylistId, trackId);
    alert("Added to playlist");
  }

  // ===============================
  // ✅ RENDER
  // ===============================

  return (
    <div className="player">

      <h1 className="title">🎵 HolyBeats</h1>

      {/* PLAYLIST PANEL */}
      {isLoggedIn() && (
        <div className="playlist-panel">

          <h3>📁 Playlists</h3>

          <div className="playlist-create">
            <input
              placeholder="New playlist name"
              value={newPlaylist}
              onChange={e => setNewPlaylist(e.target.value)}
            />
            <button onClick={handleCreatePlaylist}>
              Create
            </button>
          </div>

          <div className="playlist-list">
            {playlists.map(p => (
              <div
                key={p.id}
                className={`playlist-chip ${
                  selectedPlaylistId === p.id ? "active" : ""
                }`}
                onClick={() => handleSelectPlaylist(p)}
              >
                {p.name}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* TRACKS */}
      <h2>All Tracks</h2>

      <div className="tracks">
        {tracks.map(t => (
          <div className="card" key={t.id}>

            {/* OPEN FULL PLAYER */}
            <div
              className="cover"
              onClick={() => {
                setCurrent(t);
                setShowFullPlayer(true);
              }}
            />

            <div className="track-title"
                    title={t.title}   // при наведении покажет полностью
>
  {t.title}
            </div>

            <div className="actions">

              {/* PLAY -> MINI */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent(t);
                  setShowFullPlayer(false);
                }}
              >
                ▶
              </button>

              {/* FAVORITE */}
              <button
                onClick={() => {
                  if (!isLoggedIn()) {
                    setShowLogin(true);
                    return;
                  }
                  addFavorite(t.id);
                  alert("Added to favorites ❤️");
                }}
              >
                ❤️
              </button>

              {/* ADD TO PLAYLIST */}
              <button
                onClick={() => handleAddToPlaylist(t.id)}
              >
                ➕
              </button>

            </div>

          </div>
        ))}
      </div>

      {/* MINI PLAYER */}

    {current && !showFullPlayer && (
  <div className="mini-player">

    {/* LEFT */}
    <div className="mini-left">
      <div className="mini-title">
        {current.title}
      </div>

      <div className="mini-time">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>

    {/* CENTER */}
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

    {/* AUDIO */}
    <audio
      ref={audioRef}
      src={current.url}
      autoPlay
      onEnded={playNext}
      onTimeUpdate={() =>
        setCurrentTime(audioRef.current?.currentTime || 0)
      }
      onLoadedMetadata={() =>
        setDuration(audioRef.current?.duration || 0)
      }
    />

  </div>
)}


      {/* FULL PLAYER */}
      {current && showFullPlayer && (
        <FullPlayer
          track={current}
          playlist={tracks}
          onChangeTrack={setCurrent}
          onClose={() => setShowFullPlayer(false)}
        />
      )}

      {/* LOGIN */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false);
            loadAll();
          }}
        />
      )}

    </div>
  );
}
