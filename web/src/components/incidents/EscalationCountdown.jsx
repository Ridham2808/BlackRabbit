import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import dayjs from 'dayjs';

/**
 * High-visibility countdown timer for STOLEN incidents.
 * Auto-escalates visually when deadline passes.
 */
const EscalationCountdown = ({ createdAt, escalatedAt }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (escalatedAt) return;

    const deadline = dayjs(createdAt).add(2, 'hour');
    
    const timer = setInterval(() => {
      const now = dayjs();
      const diff = deadline.diff(now);

      if (diff <= 0) {
        setIsOverdue(true);
        const overdueMinutes = Math.abs(Math.floor(diff / 60000));
        setTimeLeft(`ESCALATION OVERDUE — ${overdueMinutes}m past deadline`);
      } else {
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [createdAt, escalatedAt]);

  if (escalatedAt) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-sm font-medium">
        <AlertTriangle className="w-4 h-4" />
        Escalated at {dayjs(escalatedAt).format('HH:mm')}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
      isOverdue 
        ? 'bg-red-600 text-white animate-pulse' 
        : 'bg-slate-900 text-white'
    }`}>
      <Clock className="w-4 h-4" />
      <span className="font-mono">{timeLeft}</span>
    </div>
  );
};

export default EscalationCountdown;
