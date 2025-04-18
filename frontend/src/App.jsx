import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import GlobalStyle, { lightTheme, darkTheme } from './theme';
import './ThemeVariables.css';
import HomePage from './pages/HomePage';
import PlayerWaitingRoom from './pages/PlayerWaitingRoom';
import SpectatorView from './pages/SpectatorView';
import DraftPlay from './pages/DraftPlay';
import LanguageSwitcher from './components/LanguageSwitcher';
import { FiSun, FiMoon, FiHome, FiMenu, FiX } from 'react-icons/fi';

// Get user's system preference for dark mode
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Styled components for the app layout and navigation
const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const AppHeader = styled.header`
  background: ${props => props.theme.primaryBackground};
  color: ${props => props.theme.primaryText};
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px ${props => props.theme.shadow};
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: 12px 16px;
  }
`;

const AppTitle = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: ${props => props.theme.primaryText};
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    font-size: 1.25rem;
  }
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    gap: 16px;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: ${props => props.theme.primaryText};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 8px;
  margin-left: 8px;
  border-radius: 50%;
  transition: background-color 0.2s;
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  &:hover {
    background-color: ${props => props.theme.hoverBackground};
  }
`;

const MobileMenu = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 75%;
  max-width: 300px;
  background: ${props => props.theme.primaryBackground};
  box-shadow: -4px 0 15px ${props => props.theme.shadow};
  z-index: 200;
  padding: 24px;
  transform: translateX(${props => props.isOpen ? '0' : '100%'});
  transition: transform 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
  
  .mobile-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .mobile-menu-close {
    background: none;
    border: none;
    color: ${props => props.theme.primaryText};
    font-size: 1.5rem;
    cursor: pointer;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
    
    &:hover {
      background-color: ${props => props.theme.hoverBackground};
    }
  }
  
  nav {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
`;

const MobileMenuOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  z-index: 150;
  opacity: ${props => props.isOpen ? 1 : 0};
  pointer-events: ${props => props.isOpen ? 'auto' : 'none'};
  transition: opacity 0.3s ease;
`;

const ThemeToggle = styled.button`
  background: ${props => props.theme.secondaryBackground};
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.primaryText}; /* Default color for icon in dark mode */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px ${props => props.theme.shadow};
  
  &:hover {
    background: ${props => props.theme.activeBackground};
    transform: rotate(15deg);
  }
  
  svg {
    font-size: 1.6rem;
    /* Set icon color based on theme */
    color: ${props => props.theme.isDark ? props.theme.primaryText : props.theme.primaryBackground};
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    width: 44px;
    height: 44px;
    svg {
      font-size: 1.4rem;
    }
  }
`;

const NavLink = styled(Link)`
  text-decoration: none;
  color: ${props => props.theme.primaryText};
  padding: 10px 16px;
  background: ${props => props.theme.hoverBackground};
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  svg {
    font-size: 1.2rem;
  }
  
  &:hover {
    background: ${props => props.theme.activeBackground};
    transform: translateY(-2px);
  }
  
  @media (max-width: ${props => props.theme.breakpoints.tablet}) {
    padding: 8px 12px;
    font-size: 0.9rem;
  }
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    width: 100%;
    padding: 12px 16px;
    font-size: 1rem;
    justify-content: flex-start;
  }
`;

const MainContent = styled.main`
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  
  @media (max-width: ${props => props.theme.breakpoints.mobile}) {
    padding: 24px 16px;
  }
`;

const LanguageSwitcherWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ThemeToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-left: 8px;
`;

const ScrollToTopOnNavigate = () => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  return null;
};

function App() {
  const { t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(prefersDark);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Set data-theme attribute on document body
  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Close mobile menu when clicking outside
  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
      <GlobalStyle />
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ScrollToTopOnNavigate />
        <AppWrapper>
          <AppHeader>
            <AppTitle>TCG Draft Builder</AppTitle>
            
            {/* Desktop navigation */}
            <HeaderControls>
              <ThemeToggleWrapper>
                <ThemeToggle onClick={toggleTheme} aria-label={t(isDarkMode ? 'switch_to_light' : 'switch_to_dark')}>
                  {isDarkMode ? <FiSun /> : <FiMoon />}
                </ThemeToggle>
              </ThemeToggleWrapper>
              
              <LanguageSwitcherWrapper>
                <LanguageSwitcher />
              </LanguageSwitcherWrapper>
              
              <NavLink to="/">
                <FiHome /> {t('Home')}
              </NavLink>
              
              <MobileMenuButton onClick={toggleMobileMenu} aria-label="Open menu">
                <FiMenu />
              </MobileMenuButton>
            </HeaderControls>
            
            {/* Mobile menu overlay */}
            <MobileMenuOverlay isOpen={mobileMenuOpen} onClick={closeMobileMenu} />
            
            {/* Mobile navigation menu */}
            <MobileMenu isOpen={mobileMenuOpen}>
              <div className="mobile-menu-header">
                <AppTitle>Menu</AppTitle>
                <button className="mobile-menu-close" onClick={closeMobileMenu} aria-label="Close menu">
                  <FiX />
                </button>
              </div>
              
              <nav>
                <NavLink to="/" onClick={closeMobileMenu}>
                  <FiHome /> {t('Home')}
                </NavLink>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <ThemeToggleWrapper>
                    <ThemeToggle onClick={toggleTheme} aria-label={t(isDarkMode ? 'switch_to_light' : 'switch_to_dark')}>
                      {isDarkMode ? <FiSun /> : <FiMoon />}
                    </ThemeToggle>
                  </ThemeToggleWrapper>
                  <LanguageSwitcher />
                </div>
              </nav>
            </MobileMenu>
          </AppHeader>
          
          <MainContent>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/:draftId/player/:playerNum" element={<PlayerWaitingRoom />} />
              <Route path="/:draftId/play/:playerNum" element={<DraftPlay />} />
              <Route path="/:draftId/spectator" element={<SpectatorView />} />
              {/* More pages can be added later */}
            </Routes>
          </MainContent>
        </AppWrapper>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
