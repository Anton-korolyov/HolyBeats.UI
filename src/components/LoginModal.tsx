import { useState } from "react";
import { login, setToken } from "../api/api";
import "./loginModal.css";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function LoginModal({ onClose, onSuccess }: Props) {

  const [mode, setMode] = useState<"login" | "register">("login");
  const API = import.meta.env.VITE_API_URL;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");

  async function handleLogin() {
    try {
      const res = await login(email, password);
      setToken(res.accessToken);
      onSuccess();
    } catch {
      setError("Invalid email or password");
    }
  }

async function handleRegister() {

  if (password !== confirmPassword) {
    setError("Passwords do not match");
    return;
  }

  try {
    const r = await fetch(`${API}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        confirmPassword
      })
    });

    if (!r.ok) {
      setError("Registration failed");
      return;
    }

    // автологин
    await handleLogin();

  } catch {
    setError("Registration error");
  }
}


  return (
    <div className="modal-backdrop">

      <div className="modal">

        {/* TABS */}
        <div className="tabs">

          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Login
          </button>

          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            Register
          </button>

        </div>

        <h2>
          {mode === "login"
            ? "Login"
            : "Create account"}
        </h2>

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {mode === "register" && (
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
        )}

        {error && <div className="error">{error}</div>}

        {mode === "login" ? (
          <button onClick={handleLogin}>
            Login
          </button>
        ) : (
          <button onClick={handleRegister}>
            Register
          </button>
        )}

        <button
          className="secondary"
          onClick={onClose}
        >
          Cancel
        </button>

      </div>

    </div>
  );
}
