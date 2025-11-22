export const log = {
  info: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[INFO]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug('[DEBUG]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[WARN]', ...args);
    }
  }
};
