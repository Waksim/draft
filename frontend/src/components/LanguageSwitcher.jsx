import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  return (
    <button
      onClick={() => i18n.changeLanguage(i18n.language === 'ru' ? 'en' : 'ru')}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1.2em',
        margin: '0 8px',
        color: '#ffffff',
      }}
    >
      {t('switch_lang')}: {i18n.language === 'ru' ? 'EN' : 'RU'}
    </button>
  );
};
export default LanguageSwitcher;
