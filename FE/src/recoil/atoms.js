import { atom } from 'recoil';

// Example atom
export const exampleState = atom({
  key: 'exampleState',
  default: '',
});

// User auth state
export const userState = atom({
  key: 'userState',
  default: null,
});

// Theme state
export const themeState = atom({
  key: 'themeState',
  default: 'light',
});

// Loading state
export const loadingState = atom({
  key: 'loadingState',
  default: false,
});
