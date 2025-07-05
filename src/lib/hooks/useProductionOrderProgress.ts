// src/lib/hooks/useProductionOrderProgress.ts
import { useState, useEffect } from 'react';
import { ProductionLineOrder } from '@/lib/types';

/**
 * Interface for the return value of the useProductionOrderProgress hook.
 */
interface OrderProgress {
  percentage: number;
  timeRemainingMs: number;
  status: 'running' | 'completed' | 'halted' | 'not_started';
}

/**
 * A custom React hook to calculate and update the progress and time remaining for a production order in real-time.
 * @param order The ProductionLineOrder object from the FIO API.
 * @returns An object containing the current percentage, time remaining in milliseconds, and the order's status.
 */
export const useProductionOrderProgress = (order: ProductionLineOrder | null): OrderProgress => {
  const [progress, setProgress] = useState<OrderProgress>({
    percentage: 0,
    timeRemainingMs: 0,
    status: 'not_started',
  });

  useEffect(() => {
    if (!order) {
      setProgress({ percentage: 0, timeRemainingMs: 0, status: 'not_started' });
      return;
    }

    const calculateProgress = () => {
      const now = Date.now();
      let currentPercentage = 0;
      let timeRemainingMs = 0;
      let status: 'running' | 'completed' | 'halted' | 'not_started' = 'not_started';

      if (order.IsHalted) {
        status = 'halted';
        // If halted, base percentage and time remaining on the last known state
        currentPercentage = order.CompletedPercentage !== null ? order.CompletedPercentage : 0;
        if (order.CompletionEpochMs && order.StartedEpochMs && order.CompletedPercentage !== null) {
          const totalDuration = order.CompletionEpochMs - order.StartedEpochMs;
          timeRemainingMs = totalDuration * (1 - order.CompletedPercentage);
        } else {
          timeRemainingMs = 0; // Can't calculate if started/completion times are missing
        }
      } else if (order.StartedEpochMs && order.CompletionEpochMs) {
        const totalDuration = order.CompletionEpochMs - order.StartedEpochMs;
        const elapsedMs = now - order.StartedEpochMs;

        if (totalDuration <= 0) { // Handle instant completion or invalid duration
            currentPercentage = 1;
            timeRemainingMs = 0;
            status = 'completed';
        } else if (elapsedMs >= totalDuration) {
          currentPercentage = 1;
          timeRemainingMs = 0;
          status = 'completed';
        } else if (elapsedMs > 0) {
          currentPercentage = Math.min(1, elapsedMs / totalDuration);
          timeRemainingMs = order.CompletionEpochMs - now;
          status = 'running';
        } else {
          // Not started yet (StartedEpochMs is in the future relative to now or null)
          status = 'not_started';
          timeRemainingMs = order.CompletionEpochMs - now;
          currentPercentage = 0;
        }
      } else if (order.CompletionEpochMs && !order.StartedEpochMs) {
        // This scenario might mean a recurring order not yet started, or a one-shot without a start time
        status = 'not_started';
        timeRemainingMs = order.CompletionEpochMs - now;
        currentPercentage = 0;
      }

      currentPercentage = Math.max(0, Math.min(1, currentPercentage));
      timeRemainingMs = Math.max(0, timeRemainingMs);

      setProgress({
        percentage: currentPercentage,
        timeRemainingMs: timeRemainingMs,
        status: status,
      });
    };

    calculateProgress();

    const intervalId = setInterval(calculateProgress, 1000);

    return () => clearInterval(intervalId);
  }, [order]);

  return progress;
};

/**
 * Helper function to format milliseconds into a human-readable duration string.
 * @param ms The duration in milliseconds.
 * @returns A formatted string (e.g., "1d 5h 30m 15s").
 */
export const formatDurationMs = (ms: number | null): string => {
    if (ms === null || isNaN(ms) || ms <= 0) return 'N/A';

    let seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / (3600 * 24));
    seconds -= days * 3600 * 24;
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
};