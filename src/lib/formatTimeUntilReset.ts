interface TimeUntilResetFormatter {
  (milliseconds: number): string;
}

export const formatTimeUntilReset: TimeUntilResetFormatter = function (reset) {
  const now = Date.now();
  const timeUntilReset = (reset * 1000) - now;
  if (timeUntilReset <= 0) {
    return 'now';
  }

  const seconds = Math.floor(timeUntilReset / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `in ${days} day${days > 1 ? 's' : ''}`;
  } else if (hours > 0) {
    return `in ${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `in ${seconds} second${seconds > 1 ? 's' : ''}`;
  }
};
