import "./fullPlayer.css";
import type { Track } from "../api/api";
import { useRef, useState, useEffect } from "react";
import "./fullPlayer.css";
type Props = {
  track: Track;
  playlist?: Track[];
  onClose: () => void;
  onChangeTrack?: (t: Track) => void;
};

export default function FullPlayer({
  track,
  playlist = [],
  onClose,
  onChangeTrack
}: Props) {

  const audioRef = useRef<HTMLAudioElement>(null);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(true);

  // ===== when track changes -> play =====
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play();
    }
  }, [track]);

  // ===== AUDIO UPDATE =====
  function handleTimeUpdate() {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
    setDuration(audioRef.current.duration || 0);
  }

  // ===== SEEK =====
  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Number(e.target.value);
  }

  // ===== PLAY / PAUSE =====
  function togglePlay() {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play();
      setPlaying(true);
    } else {
      audioRef.current.pause();
      setPlaying(false);
    }
  }

  // ===== NEXT / PREV =====
  function change(offset: number) {
    if (!playlist.length || !onChangeTrack) return;

    const i = playlist.findIndex(x => x.id === track.id);
    const next = playlist[i + offset];
    if (next) onChangeTrack(next);
  }

  // ===== SWIPE =====
  let startX = 0;

  function onTouchStart(e: React.TouchEvent) {
    startX = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > 80) change(-1);
    if (dx < -80) change(1);
  }

  return (
    <div
      className="fp-overlay"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >

      <div className="fp-container">

        {/* CLOSE */}
        <button className="fp-close-center" onClick={onClose}>
          ⌄
        </button>

        {/* COVER */}
        <div className="fp-cover" />

        {/* TITLE */}
        <h2 className="fp-title">{track.title}</h2>

        {/* PROGRESS */}
        <input
          type="range"
          className="fp-progress"
          min={0}
          max={duration || 0}
          value={progress}
          onChange={handleSeek}
        />

        {/* CONTROLS */}
        <div className="fp-controls">

          <button onClick={() => change(-1)}>⏮</button>

          <button onClick={togglePlay}>
            {playing ? "⏸" : "▶"}
          </button>

          <button onClick={() => change(1)}>⏭</button>

        </div>

        {/* AUDIO */}
        <audio
          ref={audioRef}
          autoPlay
          onTimeUpdate={handleTimeUpdate}
          src={track.url}
        />

      </div>

    </div>
  );
}
