/**
 * Represents the structure of activity logs stored in electron-store.
 * The outer key is an ISO date string (YYYY-MM-DD).
 * The inner key is the name of the application.
 * The value is the total time spent in that application (in seconds).
 */
export interface ActivityLogs {
  [date: string]: {
    [appName: string]: number;
  };
}
