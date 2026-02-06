import { useState } from "react";
import { login, setToken } from "../api/api";

type Props = {
  onLogin: () => void;
};

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function submit() {
    const res = await login(email, password);
    setToken(res.accessToken);
    onLogin();
  }

  return (
    <div>
      <h2>HolyBeats Login</h2>

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

      <button onClick={submit}>Login</button>
    </div>
  );
}
