import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import { useArtistAppointments } from '@/hooks';

interface ArtistCalendarProps {
  artistIdOrSlug: string | number;
  onDateSelected?: (date: Date, workingHours: any) => void;
}

// Interface for working hours from API
interface WorkingHour {
  id?: number;
  artist_id: number;
  day_of_week: number;
  day_name?: string;
  start_time: string;
  end_time: string;
  is_day_off: boolean | number; // API may return 0/1 instead of true/false
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  backgroundColor?: string;
  borderColor?: string;
  display?: string;
  className?: string;
  extendedProps?: {
    status?: 'available' | 'booked' | 'tentative' | 'unavailable';
    startTime?: string;
    endTime?: string;
  };
}

const ArtistCalendar: React.FC<ArtistCalendarProps> = ({ artistIdOrSlug, onDateSelected }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [artist, setArtist] = useState<any>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [workingHoursLoading, setWorkingHoursLoading] = useState<boolean>(true);
  
  // Create a ref to store the calendar instance
  const calendarRef = React.useRef<any>(null);
  
  // Fetch appointments using the hook
  const { 
    appointments: fetchedAppointments, 
    loading: appointmentsLoading
  } = useArtistAppointments(artistIdOrSlug);

  // Fetch artist data
  useEffect(() => {
    const fetchArtistData = async () => {
      if (!artistIdOrSlug) return;
      
      setLoading(true);
      
      try {
        // Parse the ID or use the slug
        const id = typeof artistIdOrSlug === 'number' 
          ? artistIdOrSlug 
          : parseInt(artistIdOrSlug.toString()) || 0;
        
        const slug = typeof artistIdOrSlug === 'string' 
          ? artistIdOrSlug 
          : artistIdOrSlug.toString();

        setArtist({
          id,
          slug
        });
      } catch (error) {
        console.error('Error processing artist data:', error);
        setError('Failed to load artist data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchArtistData();
  }, [artistIdOrSlug]);


  // Fetch working hours from the API
  useEffect(() => {
    const fetchWorkingHours = async () => {
      if (!artist) return;
      
      setWorkingHoursLoading(true);
      
      try {
        // Use the API endpoint from ink-api
        const data = await api.get<{ data: WorkingHour[] }>(
            `/artists/${artist.slug}/working-hours`
        );

        // We know the API returns data.data directly
        if (data && typeof data === 'object' && 'data' in data) {
          setWorkingHours(data.data);
        } else {
          console.error('Unexpected API response format (missing data property):', data);
          setWorkingHours([]);
        }
      } catch (error) {
        console.error('Error fetching working hours:', error);
        setWorkingHours([]);
      } finally {
        setWorkingHoursLoading(false);
      }
    };
    
    fetchWorkingHours();
  }, [artist?.id]);

  // Generate available days based on working hours
  const generateAvailableDays = () => {

    if (workingHoursLoading) {
      return [];
    }
    
    if (!workingHours || !workingHours.length) {
      return [];
    }
    
    const today = new Date();
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    const availableDays: CalendarEvent[] = [];
    
    // Loop through each day in the date range
    const currentDate = new Date(startOfCurrentMonth);
    
    // Define Persian Green for available days
    const PERSIAN_GREEN = '#00A896';
    
    let dayCount = 0;
    while (currentDate <= endOfNextMonth) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Find the working hours for this day of the week
      const dayWorkingHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);
      
      if (!dayWorkingHours) {
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
        dayCount++;
        continue;
      }

      // Check if the day is a day off (handle both boolean and 0/1 value)
      const isDayOff = dayWorkingHours.is_day_off === true || dayWorkingHours.is_day_off === 1;
      
      // If the day is not a day off, add it to available days
      if (!isDayOff) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Parse working hours (with error handling)
        let startTime: number[] = [0, 0];
        let endTime: number[] = [0, 0];
        
        try {
          startTime = dayWorkingHours.start_time.split(':').map(Number);
          endTime = dayWorkingHours.end_time.split(':').map(Number);
          
          if (isNaN(startTime[0]) || isNaN(endTime[0])) {
            console.error('Invalid time format in working hours:', dayWorkingHours);
            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
            dayCount++;
            continue;
          }
        } catch (e) {
          console.error('Error parsing time:', e, dayWorkingHours);
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
          dayCount++;
          continue;
        }
        
        // Create start and end datetime for this slot
        const slotStart = new Date(currentDate);
        slotStart.setHours(startTime[0], startTime[1] || 0, 0, 0);
        
        const slotEnd = new Date(currentDate);
        slotEnd.setHours(endTime[0], endTime[1] || 0, 0, 0);
        
        // Check if day is already booked by appointments
        const isFullyBooked = fetchedAppointments.some(appointment => {
          // Handle different date formats - appointment.start might be a string or Date object
          const appointmentDate = appointment.start instanceof Date 
            ? appointment.start.toISOString().split('T')[0] 
            : typeof appointment.start === 'string' 
              ? new Date(appointment.start).toISOString().split('T')[0]
              : '';
              
          return appointmentDate === dateStr && 
                (appointment.status === 'confirmed' || appointment.status === 'approved');
        });
        
        if (isFullyBooked) {
          //TODO add a different color for fully booked days
          console.log(`${dateStr} is fully booked, skipping`);
        } else {
          // Create the event in a format FullCalendar can definitely recognize
          const event = {
            id: `open-${dateStr}`,
            title: 'Available',
            start: dateStr,
            end: dateStr,
            allDay: true,
            backgroundColor: PERSIAN_GREEN,
            borderColor: PERSIAN_GREEN,
            display: 'background', // 'background', 'block', or undefined
            color: PERSIAN_GREEN,
            className: 'fc-available-day',
            extendedProps: {
              status: 'available',
              startTime: slotStart.toISOString(),
              endTime: slotEnd.toISOString()
            }
          };
          
          availableDays.push(event);
        }
      } else {
        console.log(`${currentDate.toDateString()} is marked as a day off, skipping`);
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      dayCount++;
    }

    return availableDays;
  };

  // Process events for the calendar
  useEffect(() => {
    if (!appointmentsLoading && !workingHoursLoading) {
      // Generate the available days from the API data
      const availableDays = generateAvailableDays();
      // Set the events with only the API-based available days
      setEvents(availableDays);
    }
  }, [fetchedAppointments, appointmentsLoading, workingHours, workingHoursLoading, artist?.id]);
  
  // Set up click event handlers for day cells
  useEffect(() => {
    const setupDayCellClickHandlers = () => {
      setTimeout(() => {
        const dayCells = document.querySelectorAll('.fc-daygrid-day');
        
        dayCells.forEach(cell => {
          // Get the date from the cell's data attribute
          const dateStr = cell.getAttribute('data-date');
          if (!dateStr) return;
          
          // Check if this date is available
          const isAvailable = events.some(event => {
            return typeof event.start === 'string' 
              ? event.start.split('T')[0] === dateStr
              : event.start.toString().split('T')[0] === dateStr;
          });
          
          if (isAvailable) {
            // Add class to make it more obvious it's clickable
            cell.classList.add('available-day-cell');
            
            // Add click handler
            cell.addEventListener('click', () => {
              const clickedDate = new Date(dateStr);
              // Get working hours for this day
              const dayOfWeek = clickedDate.getDay();
              const dayWorkingHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);
              
              if (dayWorkingHours) {
                // Call the callback if provided
                if (onDateSelected) {
                  onDateSelected(clickedDate, dayWorkingHours);
                }
              }
            });
          }
        });
      }, 300); // Give time for FullCalendar to render
    };
    
    // Call immediately and also when events change
    if (events.length > 0) {
      setupDayCellClickHandlers();
    }
    
    // Also set up when calendar view changes
    const calendarInstance = calendarRef.current;
    if (calendarInstance) {
      const calendarApi = calendarInstance.getApi();
      calendarApi.on('datesSet', setupDayCellClickHandlers);
      
      // Clean up
      return () => {
        calendarApi.off('datesSet', setupDayCellClickHandlers);
      };
    }
  }, [events, workingHours, artist]);
  
  // Handle event click for selecting available days
  const handleEventClick = (info: any) => {
    // Get the date from the clicked event
    const eventObj = info.event;
    const selectedDate = new Date(eventObj.start);
    
    // Get working hours for this day
    const dayOfWeek = selectedDate.getDay();
    const dayWorkingHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);
    
    if (dayWorkingHours) {
      // Call the callback if provided
      if (onDateSelected) {
        onDateSelected(selectedDate, dayWorkingHours);
      }
    }
  };
  
  // Handle day cell click
  const handleDateClick = (info: any) => {
    const clickedDate = new Date(info.dateStr);
    const dateStr = clickedDate.toISOString().split('T')[0];
    
    // Check if this is an available day
    const isAvailable = events.some(event => {
      const eventDate = event.start.toString().split('T')[0];
      return eventDate === dateStr;
    });
    
    if (isAvailable) {
      // Get working hours for this day
      const dayOfWeek = clickedDate.getDay();
      const dayWorkingHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);
      
      if (dayWorkingHours) {
        console.log(`Working hours for this day: ${dayWorkingHours.start_time} - ${dayWorkingHours.end_time}`);
      }
    } else {
      console.log(`Unavailable day clicked: ${clickedDate.toLocaleDateString()}`);
    }
  };
  
  // Render loading state
  if (loading && events.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-persian-green"></div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Create FullCalendar-specific business hours from workingHours
  const businessHours = workingHours.map(wh => {
    // Skip days off
    if (wh.is_day_off === true || wh.is_day_off === 1) {
      return null;
    }
    
    return {
      daysOfWeek: [wh.day_of_week], // FullCalendar uses 0=Sunday, 6=Saturday
      startTime: wh.start_time,
      endTime: wh.end_time
    };
  }).filter(Boolean); // Remove null entries

  return (
    <div className="artist-calendar">
      {/* DEBUG: Show raw events for troubleshooting */}
      {events.length === 0 && (
        <div className="p-4 mb-4 bg-yellow-100 text-yellow-800 rounded">
          No openings available.
        </div>
      )}
      
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev',
          center: 'title',
          right: 'next'
        }}
        events={events}
        height="auto"
        eventContent={() => {
          // Make all events visible as green blocks
          return (
            <div style={{ 
              backgroundColor: '#00A896', 
              width: '100%', 
              height: '100%',
              opacity: 1
            }}></div>
          );
        }}
        eventClick={handleEventClick}
        datesSet={() => {
          // Force all events to be visible after calendar render
          setTimeout(() => {
            // Log if any events were found in the DOM
            const eventEls = document.querySelectorAll('.fc-event');
            if (eventEls.length === 0) {
              const bgEventEls = document.querySelectorAll('.fc-bg-event');
            }
            
            // Apply styles to all event elements
            eventEls.forEach(el => {
              (el as HTMLElement).style.backgroundColor = '#00A896';
              (el as HTMLElement).style.opacity = '1';
            });

            events.forEach(event => {
              const dateStr = typeof event.start === 'string' 
                ? event.start.split('T')[0] 
                : event.start.toString().split('T')[0];
                
              const dayEl = document.querySelector(`.fc-day[data-date="${dateStr}"]`);
              if (dayEl) {
                (dayEl as HTMLElement).style.backgroundColor = '#00A896';
              } else {
                console.log(`No day element found for ${dateStr}`);
              }
            });
          }, 200);
        }}
      />
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-start gap-4 text-sm">
        <div className="flex items-center">
          <span className="block w-4 h-4 mr-1 bg-[#00A896] rounded-sm"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center">
          <span className="block w-4 h-4 mr-1 bg-[#1A1A1D] rounded-sm"></span>
          <span>Unavailable</span>
        </div>
        
        <div className="ml-2 text-xs text-[#E8DBC5] italic">
          Note: Only days in green are available for booking.
        </div>
      </div>
    </div>
  );
};

export default ArtistCalendar;