import React, { useState, useEffect } from 'react';
import WorkingHoursDisplay from "@/components/WorkingHoursDisplay";

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
  day_of_week: index, // Sunday (0) to Saturday (6)
  start_time: '00:00:00',
  end_time: '00:00:00',
  is_day_off: true, // Default all days as off
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
  
  // New state for selected time slots
  const [selectedStartTime, setSelectedStartTime] = useState<string>('00:00');
  const [selectedEndTime, setSelectedEndTime] = useState<string>('00:00');
  
  // State for which days are selected for applying hours
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  
  // State for edit mode
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

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
      
      // Reset selected days and set to view mode when opening
      setSelectedDays([]);
      setIsEditMode(false);
    }
  }, [isOpen, artistId, initialWorkingHours]);

  // Handle checkbox change for day selection
  const handleDaySelection = (dayIndex: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(day => day !== dayIndex);
      } else {
        return [...prev, dayIndex];
      }
    });
  };

  // Apply selected hours to the selected days
  const applyHoursToSelectedDays = () => {
    if (selectedDays.length === 0) return;

    const updatedHours = [...workingHours];
    
    selectedDays.forEach(dayIndex => {
      if (selectedStartTime === '00:00' && selectedEndTime === '00:00') {
        // If both times are 00:00, mark as day off
        updatedHours[dayIndex] = {
          ...updatedHours[dayIndex],
          start_time: '00:00:00',
          end_time: '00:00:00',
          is_day_off: true,
        };
      } else {
        updatedHours[dayIndex] = {
          ...updatedHours[dayIndex],
          start_time: `${selectedStartTime}:00`,
          end_time: `${selectedEndTime}:00`,
          is_day_off: false,
        };
      }
    });
    
    setWorkingHours(updatedHours);
    setSelectedDays([]);
  };

  // Handle save action
  const handleSave = async () => {
    // Format times to ensure they're in HH:MM:SS format
    const formattedHours = workingHours.map(hour => ({
      ...hour,
      day_of_week: hour.day_of_week + 1, // Convert to 1-7 range for API
      start_time: hour.start_time.includes(':') && hour.start_time.split(':').length === 2 
        ? `${hour.start_time}:00` 
        : hour.start_time,
      end_time: hour.end_time.includes(':') && hour.end_time.split(':').length === 2 
        ? `${hour.end_time}:00` 
        : hour.end_time,
      is_day_off: hour.start_time === '00:00:00' && hour.end_time === '00:00:00',
    }));
    
    // Pass formattedHours to parent component's onSave function
    onSave(formattedHours);
    onClose();
  };

  const handleDoneEditing = () => {
    setIsEditMode(false);
    setSelectedDays([]);
  };

  if (!isOpen) return null;

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
        <div className="px-6 py-4">
          {isEditMode ? (
            // Edit Mode
            <>
              {/* Time Selection Section */}
              <div className="mb-5">
                <h4 className="text-sm font-medium text-black mb-2">Select Hours</h4>
                <div className="flex items-end space-x-2 mb-3">
                  <div className="flex-1">
                    <label className="block text-xs text-black mb-1">Start</label>
                    <input
                      type="time"
                      value={selectedStartTime}
                      onChange={(e) => setSelectedStartTime(e.target.value)}
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
                      value={selectedEndTime}
                      onChange={(e) => setSelectedEndTime(e.target.value)}
                      className="w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-2
                        focus:outline-none focus:ring-2 focus:ring-persian-green focus:border-persian-green text-sm text-black
                        accent-[#339989]"
                      style={{colorScheme: 'light'}}
                    />
                  </div>
                </div>
                
                {/* Day Selection */}
                <div className="mb-3">
                  <h5 className="text-xs font-medium text-black mb-2">Apply to:</h5>
                  <div className="space-y-1.5">
                    {DAYS_OF_WEEK.map((day, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-20 flex items-center">
                          <input
                            type="checkbox"
                            id={`day-${index}`}
                            checked={selectedDays.includes(index)}
                            onChange={() => handleDaySelection(index)}
                            className="h-4 w-4 text-persian-green focus:ring-persian-green border-gray-300 rounded accent-[#339989]"
                          />
                          <label htmlFor={`day-${index}`} className="ml-1.5 text-sm text-black">
                            {day.substring(0, 3)}
                          </label>
                        </div>
                        <div className="text-xs text-gray-400">
                          {!workingHours[index].is_day_off && workingHours[index].start_time !== '00:00:00' ? 
                            `${workingHours[index].start_time.substring(0, 5)} - ${workingHours[index].end_time.substring(0, 5)}` : 
                            'Off'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={applyHoursToSelectedDays}
                  disabled={selectedDays.length === 0}
                  className={`w-full py-1.5 text-sm rounded-md text-white mb-4
                    ${selectedDays.length > 0
                      ? 'bg-persian-green hover:bg-persian-green-dark'
                      : 'bg-gray-400 cursor-not-allowed'}
                    focus:outline-none focus:ring-1 focus:ring-persian-green`}
                >
                  Apply Hours
                </button>
                
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="text-xs font-medium text-black mb-2">Quick Actions:</h5>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const weekdays = [1, 2, 3, 4, 5];
                        setSelectedDays(weekdays);
                      }}
                      className="flex-1 py-1.5 text-xs border border-gray-300 rounded-md text-black 
                        hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-persian-green"
                    >
                      Select Weekdays
                    </button>
                    <button
                      onClick={() => {
                        const weekend = [0, 6];
                        setSelectedDays(weekend);
                      }}
                      className="flex-1 py-1.5 text-xs border border-gray-300 rounded-md text-black 
                        hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-persian-green"
                    >
                      Select Weekend
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
                      }}
                      className="flex-1 py-1.5 text-xs border border-gray-300 rounded-md text-black 
                        hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-persian-green"
                    >
                      Select All
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleDoneEditing}
                  className="w-full mt-5 py-1.5 text-sm rounded-md text-white
                    bg-persian-green hover:bg-persian-green-dark
                    focus:outline-none focus:ring-1 focus:ring-persian-green"
                >
                  Done Editing
                </button>
              </div>
            </>
          ) : (
            // View Mode - Weekly Schedule
            <>
              <h4 className="text-sm font-medium text-black mb-3">Weekly Schedule</h4>

              <WorkingHoursDisplay
                  workingHours={workingHours}
              />
              
              <button
                onClick={() => setIsEditMode(true)}
                className="w-full py-1.5 text-sm rounded-md text-white
                  bg-persian-green hover:bg-persian-green-dark
                  focus:outline-none focus:ring-1 focus:ring-persian-green"
              >
                Edit Hours
              </button>
            </>
          )}
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