import React, { createContext, useContext, useState, ReactNode } from 'react';
import Dialog, { DialogType } from '../components/Dialog';

interface DialogOptions {
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

interface DialogContextType {
  showDialog: (options: DialogOptions) => Promise<boolean>;
  showMessage: (message: string, title?: string, type?: DialogType) => void;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProviderProps {
  children: ReactNode;
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogOptions, setDialogOptions] = useState<DialogOptions>({
    title: '',
    message: '',
    type: 'info'
  });
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null);

  const showDialog = (options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogOptions(options);
      setResolver(() => resolve);
      setIsOpen(true);
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    if (resolver) {
      resolver(false);
      setResolver(null);
    }
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) {
      resolver(true);
      setResolver(null);
    }
  };

  // Convenience methods
  const showMessage = (message: string, title: string = 'Information', type: DialogType = 'info') => {
    showDialog({
      title,
      message,
      type,
      confirmText: 'OK',
      showCancel: false
    });
  };

  const showConfirm = (message: string, title: string = 'Confirm'): Promise<boolean> => {
    return showDialog({
      title,
      message,
      type: 'confirm',
      confirmText: 'Yes',
      cancelText: 'No',
      showCancel: true
    });
  };

  const showSuccess = (message: string, title: string = 'Success') => {
    showMessage(message, title, 'success');
  };

  const showError = (message: string, title: string = 'Error') => {
    showMessage(message, title, 'error');
  };

  const showWarning = (message: string, title: string = 'Warning') => {
    showMessage(message, title, 'warning');
  };

  const contextValue: DialogContextType = {
    showDialog,
    showMessage,
    showConfirm,
    showSuccess,
    showError,
    showWarning
  };

  return (
    <DialogContext.Provider value={contextValue}>
      {children}
      <Dialog
        open={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={dialogOptions.title}
        message={dialogOptions.message}
        type={dialogOptions.type}
        confirmText={dialogOptions.confirmText}
        cancelText={dialogOptions.cancelText}
        showCancel={dialogOptions.showCancel}
      />
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};