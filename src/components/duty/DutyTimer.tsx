'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface DutyTimerProps {
  startTime: string | Date;
}

export default function DutyTimer({ startTime }: DutyTimerProps) {
  const [elapsed, setElapsed] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const start = new Date(startTime).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const diffSeconds = Math.max(0, Math.floor((now - start) / 1000));

      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;

      setElapsed({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const pad = (num: number) => (num < 10 ? `0${num}` : `${num}`);

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-2 text-emerald-400 font-mono text-3xl sm:text-5xl font-bold tracking-wider drop-shadow-md">
        <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500 animate-pulse" />
        <span>
          {pad(elapsed.hours)}:{pad(elapsed.minutes)}:{pad(elapsed.seconds)}
        </span>
      </div>
      <p className="text-xs sm:text-sm text-slate-400 mt-2">
        Durasi berjalan:{' '}
        <strong className="text-emerald-300 font-medium">
          {elapsed.hours > 0 ? `${elapsed.hours} jam ` : ''}
          {elapsed.minutes} menit {elapsed.seconds} detik
        </strong>
      </p>
    </div>
  );
}
