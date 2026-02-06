import { useState } from "react";

import Player from "./pages/Player";
import Playlists from "./pages/Playlists";
import Favorites from "./pages/Favorites";
import LoginModal from "./components/LoginModal";

import "./App.css";

export default function App() {

  const [auth, setAuth] = useState<boolean>(
    !!localStorage.getItem("token")
  );

  const [page, setPage] =
    useState<"player" | "playlists" | "favorites">("player");

  const [showLogin, setShowLogin] = useState(false);

  function requireAuth(nextPage: "playlists" | "favorites") {
    if (!auth) {
      setShowLogin(true);
      return;
    }
    setPage(nextPage);
  }

  return (
    <div>

      {/* TOP BAR */}
      <div className="topbar">

        <div className="topbar-left">
          🎵 HolyBeats
        </div>

        <div className="topbar-buttons">

          <button
            className={page === "player" ? "active" : ""}
            onClick={() => setPage("player")}
          >
            🎧 Player
          </button>

          <button
            className={page === "playlists" ? "active" : ""}
            onClick={() => requireAuth("playlists")}
          >
            📂 Playlists
          </button>

          <button
            className={page === "favorites" ? "active" : ""}
            onClick={() => requireAuth("favorites")}
          >
            ❤️ Favorites
          </button>

          {auth ? (
            <button
              className="logout"
              onClick={() => {
                localStorage.removeItem("token");
                setAuth(false);
                setPage("player");
              }}
            >
              🚪 Logout
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
            >
              🔐 Login
            </button>
          )}

        </div>

      </div>

      {/* PAGES */}
      {page === "player" && <Player />}
      {page === "playlists" && auth && <Playlists />}
      {page === "favorites" && auth && <Favorites />}

      {/* LOGIN MODAL */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false);
            setAuth(true);
          }}
        />
      )}

    </div>
  );
}
