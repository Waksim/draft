import { createGlobalStyle } from 'styled-components';

// Shared variables for both themes
const breakpoints = {
  mobile: '576px',
  tablet: '768px',
  laptop: '992px',
  desktop: '1200px',
};

export const lightTheme = {
  // Background colors
  background: '#f7f9fa',
  primaryBackground: '#7680bc', // Header background (purple)
  secondaryBackground: '#ffffff', // Card background
  hoverBackground: 'rgba(118, 128, 188, 0.1)', // Light purple hover
  activeBackground: 'rgba(118, 128, 188, 0.2)', // Darker purple active
  // Text colors
  text: '#1a1a1a',
  primaryText: '#ffffff', // Header text
  secondaryText: '#6272a4', // Secondary text
  mutedText: '#6d7585',
  // Table and draft constructor colors
  tableHeaderBackground: '#e0e4f5',
  tableRowBackground: '#ffffff',
  tableTextColor: '#333333',
  tableAltRowBackground: '#f0f2f8',
  tableBorderColor: '#c9d0e8',
  // UI elements
  border: '#e0e3e9',
  accent: '#7680bc', // Primary accent (purple)
  accentLight: '#8f97c9', // Lighter purple
  accentDark: '#5c64a0', // Darker purple
  buttonPrimary: '#7680bc',
  buttonSecondary: '#f0f2f5',
  buttonText: '#ffffff',
  buttonTextSecondary: '#6272a4',
  shadow: 'rgba(0, 0, 0, 0.1)',
  cardShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
  // Responsive design
  breakpoints,
  isDark: false, // Flag for light theme
};

export const darkTheme = {
  // Background colors
  background: '#121420', // Very dark blue-purple background
  primaryBackground: '#1e2030', // Header background
  secondaryBackground: '#1a1e36', // Card background
  hoverBackground: 'rgba(118, 128, 188, 0.15)', // Dark purple hover
  activeBackground: 'rgba(118, 128, 188, 0.25)', // Darker purple active
  // Text colors
  text: '#e7eaf0',
  primaryText: '#f1f5f9', // Header text (slightly off-white)
  secondaryText: '#a8b2d1', // Secondary text
  mutedText: '#8a92b2',
  // Table and draft constructor colors
  tableHeaderBackground: '#252a43',
  tableRowBackground: '#1e2030',
  tableTextColor: '#e7eaf0',
  tableAltRowBackground: '#232639',
  tableBorderColor: '#343c5c',
  // UI elements
  border: '#2e3450',
  accent: '#8f97c9', // Primary accent (lighter purple for dark mode)
  accentLight: '#a3a9d2', // Lighter purple
  accentDark: '#7680bc', // Darker purple
  buttonPrimary: '#7680bc',
  buttonSecondary: '#252a43',
  buttonText: '#f1f5f9',
  buttonTextSecondary: '#a8b2d1',
  shadow: 'rgba(0, 0, 0, 0.3)',
  cardShadow: '0 4px 6px rgba(0, 0, 0, 0.2), 0 1px 3px rgba(0, 0, 0, 0.15)',
  // Responsive design
  breakpoints,
  isDark: true, // Flag for dark theme
};

const GlobalStyle = createGlobalStyle`
  /* Import Google fonts */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  
  *, *::before, *::after {
    box-sizing: border-box;
  }
  
  body {
    background: ${({ theme }) => theme.background};
    color: ${({ theme }) => theme.text};
    margin: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: background 0.3s ease, color 0.3s ease;
    min-height: 100vh;
    font-size: 16px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  h1, h2, h3, h4, h5, h6 {
    color: ${({ theme }) => theme.text};
    margin-top: 0;
    line-height: 1.2;
  }
  
  h1 {
    font-size: 2rem;
    
    @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
      font-size: 2.5rem;
    }
  }
  
  h2 {
    font-size: 1.75rem;
    
    @media (min-width: ${({ theme }) => theme.breakpoints.tablet}) {
      font-size: 2rem;
    }
  }
  
  p {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  button {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    border-radius: 6px;
    transition: all 0.2s ease;
    cursor: pointer;
    font-weight: 500;
    border: none;
    padding: 8px 16px;
    outline: none;
    
    &:focus {
      box-shadow: 0 0 0 2px ${({ theme }) => theme.accent};
    }
  }
  
  a {
    color: ${({ theme }) => theme.accent};
    text-decoration: none;
    transition: color 0.2s ease;
    
    &:hover {
      color: ${({ theme }) => theme.accentLight};
    }
    
    &:active {
      color: ${({ theme }) => theme.accentDark};
    }
  }
  
  input, select, textarea {
    background: ${({ theme }) => theme.secondaryBackground};
    border: 1px solid ${({ theme }) => theme.border};
    color: ${({ theme }) => theme.text};
    border-radius: 6px;
    padding: 10px 14px;
    transition: all 0.2s ease;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 1rem;
    width: 100%;
    
    &:focus {
      border-color: ${({ theme }) => theme.accent};
      outline: none;
      box-shadow: 0 0 0 2px ${({ theme }) => theme.accent}40;
    }
    
    &::placeholder {
      color: ${({ theme }) => theme.mutedText};
    }
  }
  
  /* Card component */
  .card {
    background: ${({ theme }) => theme.secondaryBackground};
    border-radius: 12px;
    box-shadow: ${({ theme }) => theme.cardShadow};
    padding: 20px;
    margin-bottom: 20px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px ${({ theme }) => theme.shadow};
    }
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      padding: 16px;
      margin-bottom: 16px;
    }
  }
  
  /* Header component */
  .header {
    background: ${({ theme }) => theme.primaryBackground};
    color: ${({ theme }) => theme.primaryText};
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 8px ${({ theme }) => theme.shadow};
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 12px;
    }
  }
  
  /* Button components */
  .button-primary {
    background: ${({ theme }) => theme.buttonPrimary};
    color: ${({ theme }) => theme.buttonText};
    font-weight: 600;
    padding: 10px 18px;
    box-shadow: 0 2px 4px ${({ theme }) => theme.shadow};
    
    &:hover {
      background: ${({ theme }) => theme.accentLight};
      transform: translateY(-1px);
    }
    
    &:active {
      background: ${({ theme }) => theme.accentDark};
      transform: translateY(1px);
    }
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      width: 100%;
      padding: 12px 16px;
      font-size: 1rem;
    }
  }
  
  .button-secondary {
    background: ${({ theme }) => theme.buttonSecondary};
    color: ${({ theme }) => theme.buttonTextSecondary};
    font-weight: 500;
    
    &:hover {
      background: ${({ theme }) => theme.hoverBackground};
    }
    
    &:active {
      background: ${({ theme }) => theme.activeBackground};
    }
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      width: 100%;
      padding: 12px 16px;
      font-size: 1rem;
    }
  }
  
  /* Responsive container */
  .container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      padding: 0 16px;
    }
  }
  
  /* Grid system */
  .grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 20px;
    
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      grid-template-columns: 1fr;
      gap: 16px;
    }
  }
`;
export default GlobalStyle;
