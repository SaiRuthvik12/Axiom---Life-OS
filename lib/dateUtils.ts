/**
 * Returns the current date in the user's local timezone as YYYY-MM-DD.
 * Replaces toISOString() which uses UTC.
 */
export const getLocalDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns the date string for "Yesterday" in local time.
 */
export const getYesterdayDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculates the number of days between two YYYY-MM-DD strings.
 */
export const getDaysDifference = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Returns the date string of the Monday of the current week.
 * Assumes Week starts on Monday.
 */
export const getStartOfWeek = (): string => {
  const now = new Date();
  const day = now.getDay(); // 0 (Sun) - 6 (Sat)
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(now.setDate(diff));
  
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${d}`;
};

/**
 * Returns the date string of the 1st of the current month.
 */
export const getStartOfMonth = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};