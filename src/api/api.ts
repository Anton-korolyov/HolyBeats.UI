const API = "https://localhost:7075";

/* ================= TOKEN ================= */

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

function authHeader(): HeadersInit {
  const t = localStorage.getItem("token");

  return t
    ? {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`
      }
    : {
        "Content-Type": "application/json"
      };
}

/* ================= LOGIN ================= */

export async function login(
  email: string,
  password: string
): Promise<{ accessToken: string }> {

  const r = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  if (!r.ok) throw new Error("Login failed");

  return r.json();
}

/* ================= MODELS ================= */

export type Track = {
  id: number;
  title: string;
  url: string;   // 🔥 MP3 URL from R2
};

export type Playlist = {
  id: number;
  name: string;
};

/* ================= TRACKS ================= */

export async function getTracks(
  page: number,
  pageSize = 20
): Promise<{ items: Track[]; hasMore: boolean }> {

  const r = await fetch(
    `${API}/api/tracks?page=${page}&pageSize=${pageSize}`,
    {
      headers: authHeader()
    }
  );

  if (!r.ok) throw new Error("Unauthorized");

  return r.json();
}

export async function addFavorite(trackId: number) {
  const r = await fetch(`${API}/api/favorites/${trackId}`, {
    method: "POST",
    headers: authHeader()
  });

  if (!r.ok) throw new Error("Add favorite failed");
}

/* ================= PLAYLISTS ================= */

export async function getPlaylists(): Promise<Playlist[]> {
  const r = await fetch(`${API}/api/playlists`, {
    headers: authHeader()
  });

  if (!r.ok) throw new Error("Unauthorized");

  return r.json();
}

export async function createPlaylist(name: string) {
  const r = await fetch(`${API}/api/playlists`, {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(name)
  });

  if (!r.ok) throw new Error("Create playlist failed");
}

export async function deletePlaylist(id: number) {
  const r = await fetch(`${API}/api/playlists/${id}`, {
    method: "DELETE",
    headers: authHeader()
  });

  if (!r.ok) throw new Error("Delete playlist failed");
}

export async function getPlaylistTracks(
  playlistId: number
): Promise<Track[]> {

  const r = await fetch(
    `${API}/api/playlists/${playlistId}/tracks`,
    {
      headers: authHeader()
    }
  );

  if (!r.ok) throw new Error("Unauthorized");

  return r.json();
}

export async function addTrackToPlaylist(
  playlistId: number,
  trackId: number
) {
  const r = await fetch(
    `${API}/api/playlists/${playlistId}/tracks/${trackId}`,
    {
      method: "POST",
      headers: authHeader()
    }
  );

  if (!r.ok) throw new Error("Add to playlist failed");
}

export async function removeTrackFromPlaylist(
  playlistId: number,
  trackId: number
) {
  const r = await fetch(
    `${API}/api/playlists/${playlistId}/tracks/${trackId}`,
    {
      method: "DELETE",
      headers: authHeader()
    }
  );

  if (!r.ok) throw new Error("Remove track failed");
}
// ===== FAVORITES =====

export async function getFavorites(): Promise<Track[]> {
  const r = await fetch(`${API}/api/favorites`, {
    headers: authHeader()
  });

  if (!r.ok) throw new Error("Unauthorized");

  return r.json();
}

export async function removeFavorite(trackId: number) {
  const r = await fetch(`${API}/api/favorites/${trackId}`, {
    method: "DELETE",
    headers: authHeader()
  });

  if (!r.ok) throw new Error("Remove failed");
}

