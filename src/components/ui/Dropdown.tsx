import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  mobileLabel?: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  icon?: ReactNode;
  align?: 'left' | 'right';
  className?: string;
  buttonClassName?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ value, options, onChange, icon, align = 'left', className = '', buttonClassName = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className={buttonClassName || "flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50"}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {icon && <span className="text-current opacity-80">{icon}</span>}
        {selectedOption?.mobileLabel ? (
          <>
            <span className="text-current font-medium text-sm truncate max-w-[120px] hidden sm:inline-block">
              {selectedOption.label}
            </span>
            <span className="text-current font-medium text-sm sm:hidden">
              {selectedOption.mobileLabel}
            </span>
          </>
        ) : (
          <span className="text-current font-medium text-sm truncate max-w-[120px]">
            {selectedOption?.label || value}
          </span>
        )}
        <ChevronDown size={14} className={`text-current opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-50 mt-2 w-48 rounded-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden py-1 ${align === 'right' ? 'right-0' : 'left-0'}`}
            role="listbox"
          >
            {options.map((option) => (
              <button
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                <span className={`truncate ${option.value === value ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'}`}>
                  {option.label}
                </span>
                {option.value === value && (
                  <Check size={14} className="text-blue-600 dark:text-blue-400" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
