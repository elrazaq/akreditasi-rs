import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

export const TopLoadingBar: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return api.subscribeLoading((isLoading) => {
      setLoading(isLoading);
    });
  }, []);

  useEffect(() => {
    let timer: any;
    let fadeTimer: any;

    if (loading) {
      setVisible(true);
      setProgress(25);
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev < 85) {
            return prev + Math.floor(Math.random() * 15) + 5;
          }
          return prev;
        });
      }, 250);
    } else if (visible) {
      setProgress(100);
      fadeTimer = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 350);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(fadeTimer);
    };
  }, [loading, visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] h-[3.5px] bg-transparent pointer-events-none transition-opacity duration-300"
      style={{ opacity: loading ? 1 : 0 }}
      role="progressbar"
      aria-label="Memuat data..."
    >
      <div
        className="h-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-300 transition-all duration-300 ease-out shadow-[0_0_10px_#14b8a6,0_0_5px_#10b981]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

