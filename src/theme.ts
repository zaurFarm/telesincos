export function getThemeClasses(isDarkMode: boolean) {
  return {
    bg: isDarkMode ? 'bg-[#1c1c1d]' : 'bg-gray-50',
    text: isDarkMode ? 'text-gray-100' : 'text-gray-900',
    cardBg: isDarkMode ? 'bg-[#2c2c2e]' : 'bg-white',
    cardBorder: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    textMuted: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    hoverBg: isDarkMode ? 'hover:bg-[#3a3a3c]' : 'hover:bg-gray-50',
    activeTabBg: isDarkMode ? 'bg-[#3a3a3c] text-white' : 'bg-blue-50 text-blue-700',
    inactiveTabBg: isDarkMode ? 'text-gray-400 hover:bg-[#3a3a3c] hover:text-white' : 'text-gray-600 hover:bg-gray-100',
    inputBg: isDarkMode ? 'bg-[#1c1c1d] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900',
  };
}
