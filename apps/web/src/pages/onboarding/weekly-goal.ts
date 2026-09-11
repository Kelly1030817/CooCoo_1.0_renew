export const suggestWeeklyGoalTarget = (frequency: number) =>
  Math.min(21, Math.max(1, frequency + 1));
