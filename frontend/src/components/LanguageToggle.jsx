import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageToggle = ({ className = '' }) => {
  const { i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'fr' : 'en';
    i18n.changeLanguage(newLang);
  };
  
  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:bg-white/10 ${className}`}
      data-testid="language-toggle"
      title={i18n.language === 'en' ? 'Switch to French' : 'Passer en anglais'}
    >
      <Globe size={16} />
      <span className="uppercase font-semibold">
        {i18n.language === 'en' ? 'FR' : 'EN'}
      </span>
    </button>
  );
};

export default LanguageToggle;
