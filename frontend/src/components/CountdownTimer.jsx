import { useState, useEffect } from "react";

const CountdownTimer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(endTime) - new Date();
      if (diff <= 0) {
        setEnded(true);
        setTimeLeft(null);
        return;
      }
      const hours   = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds, diff });
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (ended) {
    return (
      <span className="text-gray-500 font-bold text-sm">Auction Ended</span>
    );
  }

  if (!timeLeft) return null;

  const isUrgent = timeLeft.diff < 5 * 60 * 1000; // under 5 minutes

  return (
    <span className={`font-mono font-bold text-lg ${isUrgent ? "text-red-500 animate-pulse" : "text-white"}`}>
      {String(timeLeft.hours).padStart(2, "0")}:
      {String(timeLeft.minutes).padStart(2, "0")}:
      {String(timeLeft.seconds).padStart(2, "0")}
    </span>
  );
};

export default CountdownTimer;