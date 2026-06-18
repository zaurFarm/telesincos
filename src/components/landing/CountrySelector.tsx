import React, { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, DropdownOption } from '../ui/Dropdown';

interface Props {
  country: string;
  onCountryChange: (country: string) => void;
}

const COUNTRIES: DropdownOption[] = [
  { value: 'United States', label: 'United States' },
  { value: 'United Kingdom', label: 'United Kingdom' },
  { value: 'Russia', label: 'Russia' },
  { value: 'Spain', label: 'Spain' },
  { value: 'Germany', label: 'Germany' },
  { value: 'Other', label: 'Other' }
];

export const CountrySelector = memo(({ country, onCountryChange }: Props) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!country) {
      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timeZone.startsWith('Europe/Moscow') || timeZone.startsWith('Asia/Yekaterinburg') || timeZone.startsWith('Asia/Krasnoyarsk') || timeZone.startsWith('Asia/Irkutsk') || timeZone.startsWith('Asia/Yakutsk') || timeZone.startsWith('Asia/Vladivostok') || timeZone.startsWith('Asia/Magadan') || timeZone.startsWith('Asia/Kamchatka') || timeZone.startsWith('Asia/Srednekolymsk') || timeZone.startsWith('Europe/Samara') || timeZone.startsWith('Europe/Kaliningrad')) {
          onCountryChange('Russia');
        } else if (timeZone.startsWith('Europe/London')) {
          onCountryChange('United Kingdom');
        } else if (timeZone.startsWith('Europe/Madrid') || timeZone.startsWith('Atlantic/Canary')) {
          onCountryChange('Spain');
        } else if (timeZone.startsWith('Europe/Berlin') || timeZone.startsWith('Europe/Busingen')) {
          onCountryChange('Germany');
        }
      } catch (e) {
        // silently fallback
      }
    }
  }, [country, onCountryChange]);
  
  const selectedKnown = COUNTRIES.find(c => c.value === country);
  
  const options = [...COUNTRIES];
  if (!selectedKnown && country) {
    options.unshift({ value: country, label: country || t('landing.choose_country') });
  } else if (!country) {
     options.unshift({ value: '', label: t('landing.choose_country') });
  }

  return (
    <Dropdown 
      value={country}
      options={options}
      onChange={onCountryChange}
      align="right"
      buttonClassName="flex items-center gap-2 px-3 py-1.5 bg-transparent rounded-lg border border-white/50 text-white hover:border-white hover:bg-white/5 transition-colors focus:outline-none min-w-max drop-shadow-sm"
    />
  );
});

CountrySelector.displayName = 'CountrySelector';
