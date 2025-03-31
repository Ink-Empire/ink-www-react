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
    let isMounted = true;
    
    // Cache key for styles in localStorage
    const STYLES_CACHE_KEY = 'styles_cache';
    
    // Try to load styles from localStorage first for instant display
    const tryLoadFromCache = () => {
      if (typeof window !== 'undefined') {
        try {
          const cachedStyles = localStorage.getItem(STYLES_CACHE_KEY);
          if (cachedStyles) {
            const stylesData = JSON.parse(cachedStyles);
            // Check if cache is still valid (less than 24 hours old)
            const cacheTime = stylesData.timestamp || 0;
            const currentTime = Date.now();
            const cacheAge = currentTime - cacheTime;
            const cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
            
            if (cacheAge < cacheTTL && stylesData.styles && stylesData.styles.length > 0) {
              setStyles(stylesData.styles);
              // Still fetch fresh data in the background, but no need to show loading
              return true;
            }
          }
        } catch (err) {
          console.warn('Error reading styles from cache', err);
        }
      }
      return false;
    };
    
    // Save styles to localStorage
    const saveToCache = (stylesData: Style[]) => {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STYLES_CACHE_KEY, JSON.stringify({
            styles: stylesData,
            timestamp: Date.now()
          }));
        } catch (err) {
          console.warn('Error saving styles to cache', err);
        }
      }
    };
    
    const fetchStyles = async () => {
      // If we loaded from cache, don't show loading state
      if (!tryLoadFromCache()) {
        setLoading(true);
      }
      
      try {
        // Get styles with caching enabled
        const response = await api.get<{ styles: Style[] }>('/styles', {
          useCache: true,
          cacheTTL: 24 * 60 * 60 * 1000 // 24 hours TTL (styles rarely change)
        });
        
        if (!isMounted) return;
        
        if (response.styles) {
          setStyles(response.styles);
          saveToCache(response.styles);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching styles', err);
        setError('Failed to load styles');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    fetchStyles();
    
    return () => {
      isMounted = false;
    };
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