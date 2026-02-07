import "./fullPlayer.css";
import type { Track } from "../api/api";
import { useRef, useState, useEffect } from "react";

type Props = {
  track: Track;
  playlist?: Track[];
  onClose: () => void;
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
     AUTOPLAY ON TRACK CHANGE
  ================================= */

  useEffect(() => {
    if (!audioRef.current) return;

    audioRef.current.load();
    audioRef.current.play();
    setPlaying(true);

    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "playing";
    }
  }, [track]);

  /* ================================
     MEDIA SESSION
  ================================= */

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
      navigator.mediaSession.playbackState = "playing";
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
      setPlaying(false);
      navigator.mediaSession.playbackState = "paused";
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
    const a = audioRef.current;
    if (!a) return;

    const current = a.currentTime;
    const dur = a.duration;

    setProgress(current);
    setDuration(dur || 0);

    if (
      "mediaSession" in navigator &&
      typeof dur === "number" &&
      isFinite(dur) &&
      dur > 1
    ) {
      try {
        navigator.mediaSession.setPositionState({
          duration: dur,
          position: current,
          playbackRate: 1
        });
      } catch {}
    }
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

      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "playing";
      }
    } else {
      audioRef.current.pause();
      setPlaying(false);

      if ("mediaSession" in navigator) {
        navigator.mediaSession.playbackState = "paused";
      }
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

      <div
        className="fp-container"
        onClick={(e) => {
          e.stopPropagation();
          if (mini) onClose();
        }}
      >

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

        {!mini && <div className="fp-cover" />}

        <h2 className="fp-title">{track.title}</h2>

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

        <audio
          ref={audioRef}
          src={track.url}
          autoPlay

          onLoadedMetadata={() => {
            const a = audioRef.current;
            if (!a) return;

            setDuration(a.duration);

            if ("mediaSession" in navigator) {
              try {
                navigator.mediaSession.setPositionState({
                  duration: a.duration,
                  position: 0,
                  playbackRate: 1
                });
              } catch {}
            }
          }}

          onTimeUpdate={handleTimeUpdate}
          onEnded={() => change(1)}
        />

      </div>

    </div>
  );
}
