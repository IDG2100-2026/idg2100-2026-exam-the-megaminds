/**
 * Simple Dark/Light Mode Theme System
 * Toggle between dark and light modes with different accent colors
 */

export const BOARD_COLORS = {
  green: '#2D5016',
  blue: '#1A3A52',
  burgundy: '#3D1F1F',
  grey: '#3A3A3A',
  purple: '#2D1B3D',
};

export const BOARD_COLORS_LIGHT = {
  green: '#4a8c22',
  blue: '#2a6a8a',
  burgundy: '#7a3535',
  grey: '#6a6a6a',
  purple: '#5a2d7a',
};

export const DEFAULT_BOARD_COLOR = 'green';

export const THEMES = {
  dark: {
    id: 'dark',
    name: 'Dark Mode',
    colors: {
      // Primary background
      primary: '#0D150E',
      primaryLight: '#1a2618',
      
      // Text
      text: '#E8E8E8',
      textSecondary: '#B0B0B0',
      textInverse: '#0D150E',
      
      // Background
      background: '#0D150E',
      backgroundAlt: '#1a2618',
      backgroundCard: 'rgba(13, 21, 14, 0.6)',
      
      // Accents - Muted Green
      accent: '#5CB856',
      accentLight: '#6FD86F',
      accentDark: '#3D8A3A',
      
      // Shadows
      shadowLight: 'rgba(0, 0, 0, 0.08)',
      shadowMedium: 'rgba(0, 0, 0, 0.15)',
      shadowStrong: 'rgba(0, 0, 0, 0.25)',
      shadowFocus: 'rgba(0, 0, 0, 0.35)',
      
      // Status
      success: '#5CB856',
      warning: '#FFB84D',
      error: '#FF6B6B',
      info: '#667eea',
    },
  },

  light: {
    id: 'light',
    name: 'Light Mode',
    colors: {
      // Primary background 
      primary: '#E8E8E8',
      primaryLight: '#F0F0F0',
      
      // Text
      text: '#2C2C2C',
      textSecondary: '#555555',
      textInverse: '#F0F0F0',
      
      // Background 
      background: '#F0F0F0',
      backgroundAlt: '#dde0dc',
      backgroundCard: 'rgba(61, 138, 58, 0.11)',
      
      // Accents
      accent: '#1b6b1a',
      accentLight: '#2d8a2a',
      accentDark: '#0d4c0c',
      
      // Shadows
      shadowLight: 'rgba(0, 0, 0, 0.08)',
      shadowMedium: 'rgba(0, 0, 0, 0.15)',
      shadowStrong: 'rgba(0, 0, 0, 0.25)',
      shadowFocus: 'rgba(0, 0, 0, 0.35)',
      
      // Status
      success: '#1b6b1a',
      warning: '#FF9800',
      error: '#D32F2F',
      info: '#1b6b1a',
    },
  },
};

export const DEFAULT_THEME = 'dark';


export const getTheme = (themeId = DEFAULT_THEME) => {
  return THEMES[themeId] || THEMES[DEFAULT_THEME];
};
