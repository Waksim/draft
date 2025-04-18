import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components'; 
import DraftConstructor from './DraftConstructor';
import Container from '../components/Container';

// Styled component for the heading to apply theme color
const WelcomeHeading = styled.h1`
  color: var(--text);
  text-align: center; /* Optional: center the heading */
  margin-bottom: 2rem; /* Optional: add some space below */
`;

const HomePage = () => {
  const { t } = useTranslation();
  return (
    <Container maxWidth="700px">
      {/* Use the styled heading */}
      <WelcomeHeading>{t('welcome')}</WelcomeHeading>
      <DraftConstructor />
    </Container>
  );
};
export default HomePage;
