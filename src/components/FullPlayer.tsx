import "./fullPlayer.css";
import type { Track } from "../api/api";
import { useRef, useState, useEffect } from "react";

type Props = {
  track: Track;
  playlist?: Track[];
  onClose: () => void;           // в mini → открыть full
  onChangeTrack?: (t: Track) => void;
  mini?: boolean;
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

  /* ================================
     AUTOPLAY
  ================================= */

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play();
      setPlaying(true);
    }
  }, [track]);


  /* ================================
   MEDIA SESSION (LOCKSCREEN CONTROLS)
================================ */

useEffect(() => {
  if (!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: "Holy Beats",
    artwork: [
      { src: "/logo.png", sizes: "96x96", type: "image/png" },
      { src: "/logo.png", sizes: "192x192", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png" }
    ]
  });

  navigator.mediaSession.setActionHandler("play", () => {
    audioRef.current?.play();
    setPlaying(true);
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    audioRef.current?.pause();
    setPlaying(false);
  });

  navigator.mediaSession.setActionHandler("previoustrack", () => {
    change(-1);
  });

  navigator.mediaSession.setActionHandler("nexttrack", () => {
    change(1);
  });

}, [track]);

  /* ================================
     TIME UPDATE
  ================================= */

  function handleTimeUpdate() {
    if (!audioRef.current) return;
    setProgress(audioRef.current.currentTime);
    setDuration(audioRef.current.duration || 0);
  }

  /* ================================
     SEEK
  ================================= */

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Number(e.target.value);
  }

  /* ================================
     PLAY / PAUSE
  ================================= */

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

  /* ================================
     NEXT / PREV
  ================================= */

  function change(offset: number) {
    if (!playlist.length || !onChangeTrack) return;

    const i = playlist.findIndex(x => x.id === track.id);

    let next = i + offset;

    if (next < 0) next = playlist.length - 1;
    if (next >= playlist.length) next = 0;

    onChangeTrack(playlist[next]);
  }

  /* ================================
     SWIPE (FULL ONLY)
  ================================= */

  const startX = useRef(0);

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx > 80) change(-1);
    if (dx < -80) change(1);
  }

  /* ================================
     RENDER
  ================================= */

  return (

    <div
      className={`fp-overlay ${mini ? "mini" : "full"}`}
      onTouchStart={mini ? undefined : onTouchStart}
      onTouchEnd={mini ? undefined : onTouchEnd}
    >

      {/* CONTAINER */}
      <div
        className="fp-container"
        onClick={(e) => {
          e.stopPropagation();
          if (mini) onClose();   // открыть full
        }}
      >

        {/* CLOSE */}
        {!mini && (
          <button
            className="fp-close-center"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            ⌄
          </button>
        )}

        {/* COVER */}
        {!mini && <div className="fp-cover" />}

        {/* TITLE */}
        <h2 className="fp-title">{track.title}</h2>

        {/* PROGRESS */}
        {!mini && (
          <input
            type="range"
            className="fp-progress"
            min={0}
            max={duration || 0}
            value={progress}
            onChange={handleSeek}
            onClick={(e) => e.stopPropagation()}
          />
        )}

        {/* CONTROLS */}
        <div className="fp-controls">

          {!mini && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                change(-1);
              }}
            >
              ⏮
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            {playing ? "⏸" : "▶"}
          </button>

          {!mini && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                change(1);
              }}
            >
              ⏭
            </button>
          )}

        </div>

        {/* AUDIO */}
        <audio
          ref={audioRef}
          src={track.url}
          autoPlay
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => change(1)}
        />

      </div>

    </div>
  );
}
