import React, { useState, useRef } from 'react';
import { useUser } from '../contexts/AuthContext';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  fieldName: string;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onConfirm, fieldName }) => {
  const { userData } = useUser();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  React.useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  const handleConfirm = () => {
    const data: Record<string, string> = {};
    data[fieldName] = inputValue;
    onConfirm(data);
  };

  if (!isOpen) return null;
  
  // Get placeholder based on field name
  const getPlaceholder = () => {
    switch (fieldName) {
      case 'name':
        return userData.name || 'Enter new name';
      case 'email':
        return userData.email || 'Enter new email';
      case 'password':
        return '••••••••';
      default:
        return '';
    }
  };

  // Get input type based on field name
  const getInputType = () => {
    switch (fieldName) {
      case 'password':
        return 'password';
      case 'email':
        return 'email';
      default:
        return 'text';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium">
            Update {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
        
        <div className="mb-4">
          <input
            ref={inputRef}
            type={getInputType()}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={getPlaceholder()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={handleConfirm}
            className="ml-4 inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountModal;