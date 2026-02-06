import { useEffect, useState } from "react";
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

  // 🎵 current playing
  const [current, setCurrent] = useState<Track | null>(null);

  useEffect(() => {
    loadPlaylists();
  }, []);

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

  // ▶ auto next track
  function handleEnded() {
    if (!current) return;

    const index = tracks.findIndex(t => t.id === current.id);
    const next = tracks[index + 1];
    if (next) setCurrent(next);
  }

  return (
    <div className="player">

      <h1>🎵 My Playlists</h1>

      {/* CREATE */}
      <div className="playlist-create">
        <input
          placeholder="New playlist name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <button onClick={handleCreate}>Create</button>
      </div>

      {/* PLAYLIST LIST */}
      {playlists.map(p => (
        <div
          key={p.id}
          className={`playlist-chip ${
            selected?.id === p.id ? "active" : ""
          }`}
          onClick={() => handleSelect(p)}
        >
          {p.name}

          <button
            onClick={e => {
              e.stopPropagation();
              handleDelete(p.id);
            }}
          >
            🗑
          </button>
        </div>
      ))}

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
        <audio
          className="audio"
          controls
          autoPlay
          onEnded={handleEnded}
          src={current.url}
        />
      )}

    </div>
  );
}
