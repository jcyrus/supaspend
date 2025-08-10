/**
 * Date formatting and validation utilities
 */
import { format as dateFnsFormat, isValid, parseISO } from "date-fns";

export const formatDate = (
  date: string | Date,
  pattern: string = "MMM dd, yyyy"
): string => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;

  if (!isValid(dateObj)) {
    return "Invalid Date";
  }

  return dateFnsFormat(dateObj, pattern);
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, "MMM dd, yyyy HH:mm");
};

export const formatDateInput = (date: string | Date): string => {
  return formatDate(date, "yyyy-MM-dd");
};

export const isValidDate = (date: string | Date): boolean => {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return isValid(dateObj);
};
