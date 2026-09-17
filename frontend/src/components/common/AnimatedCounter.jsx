import React, { useEffect, useState, useRef } from "react";

/**
 * AnimatedCounter component for KPI numbers.
 * Smoothly animates from current value to next value using requestAnimationFrame.
 */
export default function AnimatedCounter({
  value = 0,
  duration = 600,
  formatter = (n) => n.toLocaleString(),
  className = "",
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const startValRef = useRef(0);
  const startTimeRef = useRef(null);
  const targetVal = typeof value === "number" ? value : parseInt(value, 10) || 0;

  useEffect(() => {
    let animationFrameId;
    const startValue = startValRef.current;
    const change = targetVal - startValue;

    if (change === 0) {
      setDisplayValue(targetVal);
      return;
    }

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + change * easeProgress);

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        startValRef.current = targetVal;
        startTimeRef.current = null;
      }
    };

    startTimeRef.current = null;
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [targetVal, duration]);

  return <span className={className}>{formatter(displayValue)}</span>;
}
