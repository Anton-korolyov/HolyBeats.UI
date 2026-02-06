import { useEffect, useState } from "react";
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

  // tracks
  const [tracks, setTracks] = useState<Track[]>([]);
  const [current, setCurrent] = useState<Track | null>(null);

  // playlists
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] =
    useState<number | null>(null);

  const [_playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [newPlaylist, setNewPlaylist] = useState("");

  // ui
  const [showLogin, setShowLogin] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const result = await getTracks(1);
    setTracks(result.items);

    if (isLoggedIn()) {
      setPlaylists(await getPlaylists());
    }
  }

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

            <div className="track-title">
              {t.title}
            </div>

            <div className="actions">

              {/* PLAY -> MINI PLAYER */}
              <button
                onClick={() => {
                  setCurrent(t);
                  setShowFullPlayer(false);
                }}
              >
                ▶
              </button>

              <button
                onClick={() => {
                  if (!isLoggedIn()) {
                    setShowLogin(true);
                    return;
                  }
                  addFavorite(t.id);
                  alert("Добавлено в избранное ❤️");
                }}
              >
                ❤️
              </button>

              <button
                onClick={() => handleAddToPlaylist(t.id)}
              >
                ➕
              </button>

            </div>

          </div>
        ))}
      </div>

      {/* FULL PLAYER (ALWAYS WHEN TRACK EXISTS) */}
      {current && (
        <FullPlayer
          track={current}
          playlist={tracks}
          onChangeTrack={setCurrent}
          onClose={() => setShowFullPlayer(false)}
          mini={!showFullPlayer}
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
