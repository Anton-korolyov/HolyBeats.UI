import { useEffect, useState, useRef } from "react";
import {
  getTracks,
  addFavorite,
  getPlaylists,
  createPlaylist,
  addTrackToPlaylist,
  getPlaylistTracks
} from "../api/api";
import { getTrackFilters } from "../api/api";
import type { Track, Playlist } from "../api/api";
import FullPlayer from "../components/FullPlayer";
import LoginModal from "../components/LoginModal";
import "./player.css";

type PlayerProps = {
  authorized: boolean;
};

/* ================= SCROLL TOP ================= */

function ScrollTopButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      className={`scroll-top-btn ${show ? "show" : ""}`}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      ⬆
    </button>
  );
}

/* ================= PLAYER ================= */

export default function Player({ authorized }: PlayerProps) {

  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [langFilter, setLangFilter] = useState<string>("all");
  const lastPositionUpdate = useRef(0);
   const [isPlaying, setIsPlaying] = useState(false);
  // ===== DATA =====
  const [tracks, setTracks] = useState<Track[]>([]);
  const [current, setCurrent] = useState<Track | null>(null);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] =
    useState<number | null>(null);

  // ===== PAGINATION =====
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [_playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [newPlaylist, setNewPlaylist] = useState("");

const [totalTracks, setTotalTracks] = useState(0);
const [genres, setGenres] = useState<string[]>(["all"]);
const [languages, setLanguages] = useState<string[]>(["all"])
  // ===== UI =====
  const [showLogin, setShowLogin] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);



  /* ================= LOAD TRACKS ================= */

 async function loadTracksPage(p: number) {
  if (loading) return;
  setLoading(true);

  const result = await getTracks(
    p,
    genreFilter,
    langFilter
  );

  setTracks(prev =>
    p === 1 ? result.items : [...prev, ...result.items]
  );

setHasMore(result.hasMore);
setTotalTracks(result.total);
setLoading(false);
}

  useEffect(() => {
    setPage(1);
    setTracks([]);
    loadTracksPage(1);
  }, [authorized]);

  useEffect(() => {
    if (page > 1) loadTracksPage(page);
  }, [page]);
useEffect(() => {
  getTrackFilters().then(r => {
    setGenres(["all", ...r.genres]);
    setLanguages(["all", ...r.languages]);
  });
}, []);

useEffect(() => {
  setPage(1);
  setTracks([]);
  loadTracksPage(1);
}, [genreFilter, langFilter]);

  useEffect(() => {
    function onScroll() {
      if (!hasMore || loading) return;

      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 300
      ) {
        setPage(p => p + 1);
      }
    }

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasMore, loading]);

  /* ================= PLAYER CONTROLS ================= */

  function playNext() {
    if (!tracks.length || !current) return;

    const i = tracks.findIndex(x => x.id === current.id);
    let next = i + 1;
    if (next >= tracks.length) next = 0;

    setCurrent(tracks[next]);
    setTimeout(() => audioRef.current?.play(), 0);
  }

  function playPrev() {
    if (!tracks.length || !current) return;

    const i = tracks.findIndex(x => x.id === current.id);
    let prev = i - 1;
    if (prev < 0) prev = tracks.length - 1;

    setCurrent(tracks[prev]);
    setTimeout(() => audioRef.current?.play(), 0);
  }

  /* ================= MEDIA SESSION ================= */

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!("mediaSession" in navigator)) return;
    if (!duration) return;

    const now = Date.now();
    if (now - lastPositionUpdate.current < 1000) return;
    lastPositionUpdate.current = now;

    (navigator as any).mediaSession.setPositionState({
      duration: duration,
      position: Math.floor(a.currentTime),
      playbackRate: 1
    });
  }, [currentTime, duration]);

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

    navigator.mediaSession.setActionHandler("previoustrack", playPrev);
    navigator.mediaSession.setActionHandler("nexttrack", playNext);
  }, [current]);

  /* ================= PLAYLIST ================= */

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
    if (!authorized) {
      setShowLogin(true);
      return;
    }

    if (playlists.length === 0) {
      await createPlaylist("Playlist1");
      const updated = await getPlaylists();
      setPlaylists(updated);

      const first = updated[0];
      setSelectedPlaylistId(first.id);
      await addTrackToPlaylist(first.id, trackId);
      return;
    }

    const targetId = selectedPlaylistId ?? playlists[0].id;
    setSelectedPlaylistId(targetId);
    await addTrackToPlaylist(targetId, trackId);
  }

  /* ================= RENDER ================= */

  return (
    <div className="player">

      <h1 className="title">🎵 HolyBeats</h1>

      {/* PLAYLIST PANEL */}
      {authorized && (
        <div className="playlist-panel">

          <h3>📁 Playlists</h3>

          <div className="playlist-row">

            <input
              className="playlist-input"
              placeholder="New playlist name"
              value={newPlaylist}
              onChange={e => setNewPlaylist(e.target.value)}
            />

            <button
              className="playlist-create-btn"
              onClick={handleCreatePlaylist}
            >
              ➕ Create
            </button>

            <select
              className="playlist-select"
              value={selectedPlaylistId ?? ""}
              onChange={async (e) => {
                const id = Number(e.target.value);
                setSelectedPlaylistId(id);

                const p = playlists.find(x => x.id === id);
                if (p) await handleSelectPlaylist(p);
              }}
            >
              <option value="">Select playlist</option>

              {playlists.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

          </div>

        </div>
      )}

      {/* FILTERS */}

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

        {tracks.map(t => (

          <div
           className={`card ${
  current?.id === t.id
    ? (isPlaying ? "playing" : "current")
    : ""
}`}
            key={t.id}
          >

            {/* OPEN FULL PLAYER */}
            <div
              className="cover"
              onClick={() => {
                setCurrent(t);
                setShowFullPlayer(true);
              }}
            >

              {current?.id === t.id && isPlaying && (
                <div className="equalizer">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              )}

            </div>

            <div
              className="track-title"
              title={t.title}
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
                  if (!authorized) {
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

      {loading && <div className="loading">Loading...</div>}
      {!hasMore && <div className="loading"> {totalTracks > 0 && (
  <div className="loading">
   ✅ No more tracks • 🎵 {tracks.length} / {totalTracks}
  </div>
)}</div>}

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

  onPlay={() => setIsPlaying(true)}
  onPause={() => setIsPlaying(false)}

  onEnded={() => {
    setIsPlaying(false);
    playNext();
  }}

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
          onSuccess={async () => {
            setShowLogin(false);
            setPage(1);
            setTracks([]);
            loadTracksPage(1);
          }}
        />
      )}

      <ScrollTopButton />

    </div>
  );
}
