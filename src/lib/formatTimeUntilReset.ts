interface TimeUntilResetFormatter {
  (milliseconds: number): string;
}

export const formatTimeUntilReset: TimeUntilResetFormatter = function (reset) {
  const now = Date.now();
  const timeUntilReset = (reset * 1000) - now;

  if (timeUntilReset <= 0) return 'now';

  const totalSeconds = Math.floor(timeUntilReset / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let result = 'in ';
  if (days > 0) result += `${days}d `;
  if (hours > 0 || days > 0) result += `${hours}h `;
  if (minutes > 0 || hours > 0 || days > 0) result += `${minutes}m`;
  else result += `${seconds}s`;

  return result.trim();
};
