import React, { useState, useEffect } from 'react';

interface WorkingHoursProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (workingHours: WorkingHour[]) => void;
  artistId: number;
  initialWorkingHours?: WorkingHour[];
}

export interface WorkingHour {
  artist_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_day_off: boolean;
}

// Day name mapping
const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

const DEFAULT_HOURS: WorkingHour[] = Array.from({ length: 7 }, (_, index) => ({
  artist_id: 0, // Will be set from props
  day_of_week: index + 1, // Sunday (1) to Saturday (7)
  start_time: '00:00:00',
  end_time: '00:00:00',
  is_day_off: index === 0, // Default Sunday as day off
}));

const WorkingHoursModal: React.FC<WorkingHoursProps> = ({
  isOpen,
  onClose,
  onSave,
  artistId,
  initialWorkingHours,
}) => {
  // Set up state for working hours
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>(DEFAULT_HOURS);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(1); // Monday (index 1) by default
  
  // Load initial data when modal opens
  useEffect(() => {
    if (isOpen) {
      // Use initialWorkingHours if provided, otherwise use default hours
      if (initialWorkingHours && initialWorkingHours.length > 0) {
        setWorkingHours(initialWorkingHours);
      } else {
        // Set artistId for default hours
        setWorkingHours(DEFAULT_HOURS.map(hour => ({
          ...hour,
          artist_id: artistId,
        })));
      }
    }
  }, [isOpen, artistId, initialWorkingHours]);

  // Update the selected day's working hours
  const updateSelectedDayHours = (field: keyof WorkingHour, value: any) => {
    const updatedHours = [...workingHours];
    updatedHours[selectedDayIndex] = {
      ...updatedHours[selectedDayIndex],
      [field]: value,
    };
    
    // If toggling is_day_off to true, reset times to default
    if (field === 'is_day_off' && value === true) {
      updatedHours[selectedDayIndex].start_time = '09:00:00';
      updatedHours[selectedDayIndex].end_time = '17:00:00';
    }
    
    setWorkingHours(updatedHours);
  };

  // Handle save action
  const handleSave = () => {
    // Format times to ensure they're in HH:MM:SS format
    const formattedHours = workingHours.map(hour => ({
      ...hour,
      start_time: hour.start_time.includes(':') && hour.start_time.split(':').length === 2 
        ? `${hour.start_time}:00` 
        : hour.start_time,
      end_time: hour.end_time.includes(':') && hour.end_time.split(':').length === 2 
        ? `${hour.end_time}:00` 
        : hour.end_time,
    }));
    
    onSave(formattedHours);
    onClose();
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDayIndex(parseInt(e.target.value));
  };

  if (!isOpen) return null;

  const selectedDay = workingHours[selectedDayIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Modal Header */}
        <div className="border-b border-gray-200 px-6 py-3 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-black">Working Hours</h3>
          <button 
            onClick={onClose}
            className="text-black hover:text-gray-700 focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="px-6 py-3">
          <div className="flex items-center space-x-3 mb-3">
            <select
              value={selectedDayIndex}
              onChange={handleDayChange}
              className="border border-gray-300 rounded-md shadow-sm py-1.5 px-3 
                focus:outline-none focus:ring-2 focus:ring-persian-green focus:border-persian-green text-sm text-black
                accent-[#339989]"
              style={{colorScheme: 'light'}}
            >
              {DAYS_OF_WEEK.map((day, index) => (
                <option key={index} value={index}>
                  {day}
                </option>
              ))}
            </select>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="dayOff"
                checked={selectedDay.is_day_off}
                onChange={(e) => updateSelectedDayHours('is_day_off', e.target.checked)}
                className="h-4 w-4 text-persian-green focus:ring-persian-green border-gray-300 rounded accent-[#339989]"
              />
              <label htmlFor="dayOff" className="ml-2 text-sm text-black">
                Day Off
              </label>
            </div>
          </div>
          
          {!selectedDay.is_day_off && (
            <div className="flex items-end space-x-2 mb-4">
              <div className="flex-1">
                <label className="block text-xs text-black mb-1">Start</label>
                <input
                  type="time"
                  value={selectedDay.start_time.substring(0, 5)} // Handle HH:MM:SS format
                  onChange={(e) => updateSelectedDayHours('start_time', e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2
                    focus:outline-none focus:ring-2 focus:ring-persian-green focus:border-persian-green text-sm text-black 
                    accent-[#339989]"
                  style={{colorScheme: 'light'}}
                />
              </div>
              <div className="flex-none pt-5 pb-1.5 text-black">to</div>
              <div className="flex-1">
                <label className="block text-xs text-black mb-1">End</label>
                <input
                  type="time"
                  value={selectedDay.end_time.substring(0, 5)} // Handle HH:MM:SS format
                  onChange={(e) => updateSelectedDayHours('end_time', e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2
                    focus:outline-none focus:ring-2 focus:ring-persian-green focus:border-persian-green text-sm text-black
                    accent-[#339989]"
                  style={{colorScheme: 'light'}}
                />
              </div>
            </div>
          )}
          
          {/* Compact weekly hours summary */}
          <div className="text-xs border-t border-gray-200 pt-3">
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
              {workingHours.map((day, index) => (
                <div key={index} className="flex justify-between">
                  <span className="font-medium text-black">{DAYS_OF_WEEK[index]}:</span>
                  <span className="text-black">
                    {day.is_day_off 
                      ? "Off" 
                      : day.start_time && day.end_time 
                        ? `${day.start_time.substring(0, 5)} - ${day.end_time.substring(0, 5)}`
                        : "00:00 - 00:00"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-gray-300 shadow-sm text-sm rounded-md text-black 
              bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-persian-green mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 border border-transparent shadow-sm text-sm rounded-md text-white 
              bg-persian-green hover:bg-persian-green-dark focus:outline-none focus:ring-1 focus:ring-persian-green"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkingHoursModal;