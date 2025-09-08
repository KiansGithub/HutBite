import React, { createContext, useState, useContext, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface TabThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const TabThemeContext = createContext<TabThemeContextProps | undefined>(undefined);

export const TabThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark for the feed screen

  return (
    <TabThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </TabThemeContext.Provider>
  );
};

export const useTabTheme = () => {
  const context = useContext(TabThemeContext);
  if (!context) {
    throw new Error('useTabTheme must be used within a TabThemeProvider');
  }
  return context;
};
