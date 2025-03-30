import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../utils/api';

// Define interface for style data
interface Style {
  id: number;
  name: string;
  description?: string;
}

interface StyleContextType {
  styles: Style[];
  loading: boolean;
  error: string | null;
  getStyleName: (id: number) => string;
}

const StyleContext = createContext<StyleContextType>({
  styles: [],
  loading: false,
  error: null,
  getStyleName: () => '',
});

// Provider component
export const StyleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStyles = async () => {
      setLoading(true);
      
      try {
        // Replace with your actual API endpoint
        const response = await api.get<{ styles: Style[] }>('/styles');
        if (response.styles) {
          setStyles(response.styles);
        }
      } catch (err) {
        console.error('Error fetching styles', err);
        setError('Failed to load styles');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStyles();
  }, []);

  // Function to get style name by ID
  const getStyleName = (id: number): string => {
    const style = styles.find(s => s.id === id);
    return style ? style.name : 'Unknown Style';
  };

  return (
    <StyleContext.Provider
      value={{
        styles,
        loading,
        error,
        getStyleName,
      }}
    >
      {children}
    </StyleContext.Provider>
  );
};

// Hook to use the style context
export const useStyles = () => useContext(StyleContext);