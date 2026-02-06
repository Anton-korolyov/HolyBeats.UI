import "./fullPlayer.css";
import type { Track } from "../api/api";
import { useRef, useState, useEffect } from "react";

type Props = {
  track: Track;
  playlist?: Track[];
  onClose: () => void;
  onChangeTrack?: (t: Track) => void;
  mini?: boolean; // 👈 ВАЖНО
};

export default function FullPlayer({
  track,
  playlist = [],
  onClose,
  onChangeTrack,
  mini = false
}: Props) {

  const audioRef = useRef<HTMLAudioElement>(null);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(true);

  // ▶ when track changes -> autoplay
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play();
      setPlaying(true);
    }
  }, [track]);

  // ⏱ progress update
  function handleTimeUpdate() {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
    setDuration(audioRef.current.duration || 0);
  }

  // 🎚 seek
  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Number(e.target.value);
  }

  // ▶⏸ play pause
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

  // ⏮⏭ next / prev
  function change(offset: number) {
    if (!playlist.length || !onChangeTrack) return;

    const i = playlist.findIndex(x => x.id === track.id);
    const next = playlist[i + offset];
    if (next) onChangeTrack(next);
  }

  // 👆 SWIPE
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
      className={`fp-overlay ${mini ? "mini" : "full"}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >

      <div className="fp-container">

        {/* CLOSE ONLY IN FULL */}
        {!mini && (
          <button className="fp-close-center" onClick={onClose}>
            ⌄
          </button>
        )}

        {/* COVER */}
        {!mini && <div className="fp-cover" />}

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
          {!mini && <button onClick={() => change(-1)}>⏮</button>}

          <button onClick={togglePlay}>
            {playing ? "⏸" : "▶"}
          </button>

          {!mini && <button onClick={() => change(1)}>⏭</button>}
        </div>

        {/* AUDIO (ONLY ONE) */}
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          src={track.url}
        />

      </div>

    </div>
  );
}
