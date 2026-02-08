import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

type SnackbarType = 'success' | 'error';

interface SnackbarState {
  message: string;
  type: SnackbarType;
  id: number;
}

interface SnackbarContextType {
  snackbar: SnackbarState | null;
  showSnackbar: (message: string, type?: SnackbarType) => void;
  hideSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextType>({
  snackbar: null,
  showSnackbar: () => {},
  hideSnackbar: () => {},
});

export const SnackbarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [snackbar, setSnackbar] = useState<SnackbarState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const hideSnackbar = useCallback(() => {
    setSnackbar(null);
  }, []);

  const showSnackbar = useCallback((message: string, type: SnackbarType = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    idRef.current += 1;
    setSnackbar({ message, type, id: idRef.current });
    timerRef.current = setTimeout(() => {
      setSnackbar(null);
    }, 3000);
  }, []);

  return (
    <SnackbarContext.Provider value={{ snackbar, showSnackbar, hideSnackbar }}>
      {children}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => useContext(SnackbarContext);
