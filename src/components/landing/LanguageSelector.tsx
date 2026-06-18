import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { Dropdown, DropdownOption } from '../ui/Dropdown';

interface Props {
  language: string;
  onLanguageChange: (language: string) => void;
}

const LANGUAGES: DropdownOption[] = [
  { value: 'en', label: '🇺🇸 English', mobileLabel: '🇺🇸' },
  { value: 'ru', label: '🇷🇺 Русский', mobileLabel: '🇷🇺' },
  { value: 'es', label: '🇪🇸 Español', mobileLabel: '🇪🇸' },
  { value: 'fr', label: '🇫🇷 Français', mobileLabel: '🇫🇷' },
  { value: 'de', label: '🇩🇪 Deutsch', mobileLabel: '🇩🇪' },
  { value: 'zh', label: '🇨🇳 中文', mobileLabel: '🇨🇳' },
];

export const LanguageSelector = memo(({ language, onLanguageChange }: Props) => {
  return (
    <Dropdown 
      value={language}
      options={LANGUAGES}
      onChange={onLanguageChange}
      icon={<Globe size={16} />}
      align="right"
      buttonClassName="flex items-center gap-2 px-3 py-1.5 bg-transparent rounded-lg border border-white/50 text-white hover:border-white hover:bg-white/5 transition-colors focus:outline-none min-w-max drop-shadow-sm"
    />
  );
});

LanguageSelector.displayName = 'LanguageSelector';
