import dateformat from 'dateformat';

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getCurrentDate = (): string =>
  dateformat(new Date(), `dd.mm.yyyy, HH:MM:ss`);
