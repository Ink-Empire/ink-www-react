import React from 'react';
import { WorkingHour } from './WorkingHoursModal';

interface WorkingHoursDisplayProps {
  workingHours: WorkingHour[];
  className?: string;
}

const WorkingHoursDisplay: React.FC<WorkingHoursDisplayProps> = ({ 
  workingHours,
  className = ''
}) => {
  // Day names for display
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Determine if there are any hours set
  const hasHours = Array.isArray(workingHours) && workingHours.length > 0;

  return (
    <div className={`text-sm ${className}`}>
      {hasHours ? (
          <div className="border border-gray-200 rounded-md overflow-hidden mb-2">
            <table className="w-full">
              <tbody>
                {workingHours.map((day, index) => (
                  <tr 
                    key={index} 
                    className={`${index < workingHours.length - 1 ? 'border-b border-gray-200' : ''}`}
                  >
                    <td className="py-2 px-4 font-medium text-black">
                      {/* Use index position mod 7 to ensure we always have correct day names */}
                      {DAY_NAMES[index % 7]}
                    </td>
                    <td className="py-2 px-4 text-black text-right">
                      {day.is_day_off || (day.start_time === '00:00:00' && day.end_time === '00:00:00') ? (
                        <span className="italic">Day Off</span>
                      ) : (
                        <>
                          {day.start_time?.substring?.(0, 5) || '00:00'} - {day.end_time?.substring?.(0, 5) || '00:00'}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      ) : (
        <div className="text-center bg-white p-5 rounded-md border border-gray-200 mx-auto" style={{ maxWidth: '350px' }}>
          <svg 
            className="w-8 h-8 mx-auto text-black mb-2" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-black">No working hours set yet</p>
        </div>
      )}
    </div>
  );
};

export default WorkingHoursDisplay;