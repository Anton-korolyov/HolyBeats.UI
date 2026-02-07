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
const [genreFilter, setGenreFilter] = useState<string>("all");
const [langFilter, setLangFilter] = useState<string>("all");

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

const genres = ["all", ...new Set(tracks.map(t => t.genre))];
const languages = ["all", ...new Set(tracks.map(t => t.language))];
  // ===== UI =====
  const [showLogin, setShowLogin] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
const filteredTracks = tracks.filter(t =>
  (genreFilter === "all" || t.genre === genreFilter) &&
  (langFilter === "all" || t.language === langFilter)
);
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


/* ================================
   MEDIA SESSION (PLAYER)
================================ */

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

<div className="filters">

  <select
    value={genreFilter}
    onChange={e => setGenreFilter(e.target.value)}
  >
    {genres.map(g => (
      <option key={g} value={g}>{g}</option>
    ))}
  </select>

  <select
    value={langFilter}
    onChange={e => setLangFilter(e.target.value)}
  >
    {languages.map(l => (
      <option key={l} value={l}>{l}</option>
    ))}
  </select>

</div>


      <h2>All Tracks</h2>

      <div className="tracks">
       {filteredTracks.map(t => (

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
<div className="track-meta">
  🎵 {t.genre} • ⏱ {formatTime(t.duration)}
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



    </div>

    {/* AUDIO */}
 <audio
  ref={audioRef}
  src={current.url}
  autoPlay
  onEnded={playNext}
  onTimeUpdate={() => {
    const a = audioRef.current;
    if (!a) return;

    setCurrentTime(a.currentTime);

    if ("mediaSession" in navigator) {
      navigator.mediaSession.setPositionState({
        duration: a.duration || 0,
        position: a.currentTime,
        playbackRate: 1
      });
    }
  }}
  onLoadedMetadata={() => {
    const a = audioRef.current;
    if (!a) return;
    setDuration(a.duration || 0);
  }}
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
