import React, { useState, useEffect } from 'react';
import { useStyles } from '../contexts/StyleContext';

interface StyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (styles: number[]) => void;
  selectedStyles: number[];
}

const StyleModal: React.FC<StyleModalProps> = ({ isOpen, onClose, onApply, selectedStyles: initialSelectedStyles }) => {
  const { styles } = useStyles();
  const [localSelectedStyles, setLocalSelectedStyles] = useState<number[]>([]);
  
  // Initialize local state when the modal opens or selected styles change
  useEffect(() => {
    setLocalSelectedStyles([...initialSelectedStyles]);
  }, [initialSelectedStyles, isOpen]);

  // Toggle a style selection
  const toggleStyle = (styleId: number) => {
    if (localSelectedStyles.includes(styleId)) {
      setLocalSelectedStyles(localSelectedStyles.filter(id => id !== styleId));
    } else {
      setLocalSelectedStyles([...localSelectedStyles, styleId]);
    }
  };

  // Check if a style is selected
  const isSelected = (styleId: number) => {
    return localSelectedStyles.includes(styleId);
  };

  // Select or deselect all styles
  const toggleSelectAll = () => {
    if (localSelectedStyles.length > 0) {
      setLocalSelectedStyles([]);
    } else {
      setLocalSelectedStyles(styles.map(style => style.id));
    }
  };

  // Check if any styles are selected
  const hasAnyChecked = () => {
    return localSelectedStyles.length > 0;
  };

  // Handle apply button click
  const handleApply = () => {
    onApply(localSelectedStyles);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <button 
              onClick={onClose}
              className="mr-2 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-lg font-medium text-gray-900">Styles</h2>
          </div>
          <button 
            onClick={handleApply}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Apply
          </button>
        </div>
        
        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          <ul className="divide-y divide-gray-200">
            {/* Select All option */}
            <li className="px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {hasAnyChecked() ? 'Deselect All' : 'Select All'}
                </span>
                <input
                  type="checkbox"
                  checked={hasAnyChecked() && localSelectedStyles.length === styles.length}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </div>
            </li>
            
            {/* Style options */}
            {styles.map(style => (
              <li key={style.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{style.name}</span>
                  <input
                    type="checkbox"
                    checked={isSelected(style.id)}
                    onChange={() => toggleStyle(style.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StyleModal;