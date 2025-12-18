export const APP_VERSION = {
  major: 0,
  minor: 1,
  build: 0,
};

export const getVersionString = () => {
  return `${APP_VERSION.major}.${APP_VERSION.minor}.${APP_VERSION.build}`;
};

export const getCopyrightYear = () => {
  return new Date().getFullYear();
};
