'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const MIN_DELAY_MS = 10_000;   // 10 sec
const MAX_DELAY_MS = 300_000;  // 5 min
const DISPLAY_MS   = 3_500;
const FADE_MS      = 500;

const EXCLUDE_USERS = ["uo300028@uniovi.es"]

// Variables de módulo: persisten aunque el componente se desmonte por navegación
let audioUnlocked = false;  // el usuario ya hizo click alguna vez
let eggDone = false;        // el easter egg ya se mostró esta sesión

export function EasterEgg() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<'hidden' | 'in' | 'visible' | 'out'>('hidden');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // No volver a programar si ya se mostró esta sesión
    if (eggDone) return;

    if (user && EXCLUDE_USERS.includes(user.email)) return;

    const audio = new Audio('/easter-egg/audio.mp3');
    audioRef.current = audio;
    let t1: ReturnType<typeof setTimeout> | null = null;

    function startTimer() {
      const delay = Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS) + MIN_DELAY_MS;
      t1 = setTimeout(() => {
        eggDone = true;
        audio.currentTime = 0.5;
        audio.play().catch(() => {});
        setPhase('in');

        setTimeout(() => setPhase('visible'), 50);
        setTimeout(() => setPhase('out'), FADE_MS + DISPLAY_MS);
        setTimeout(() => setPhase('hidden'), FADE_MS + DISPLAY_MS + FADE_MS);
      }, delay);
    }

    if (audioUnlocked) {
      // El usuario ya había hecho click antes (e.g. volvió de otra página)
      startTimer();
    } else {
      function onFirstClick() {
        audioUnlocked = true;
        document.removeEventListener('click', onFirstClick, true);
        audio.volume = 0;
        audio.play()
          .then(() => { audio.pause(); audio.currentTime = 0; audio.volume = 1; })
          .catch(() => {});
        startTimer();
      }
      document.addEventListener('click', onFirstClick, true);

      return () => {
        document.removeEventListener('click', onFirstClick, true);
        if (t1) clearTimeout(t1);
      };
    }

    return () => { if (t1) clearTimeout(t1); };
  }, []);

  if (phase === 'hidden') return null;

  const opacity = phase === 'in' ? 0 : phase === 'out' ? 0 : 1;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-9999 flex items-center justify-center"
      style={{
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        background: 'rgba(0,0,0,0.35)',
        opacity,
        transition: `opacity ${FADE_MS}ms ease-in-out`,
      }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/easter-egg/photo.jpg"
          alt=""
          style={{
          width: 'min(88vw, 640px)',
          maxHeight: '85vh',
            objectFit: 'contain',
            borderRadius: 8,
            boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
          }}
        />
    </div>
  );
}
