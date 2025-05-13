import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useAuth } from '@/contexts/AuthContext';
import { useArtistAppointments, useWorkingHours } from '@/hooks';

interface ArtistCalendarProps {
  artistIdOrSlug: string | number;
}

const ArtistCalendar: React.FC<ArtistCalendarProps> = ({ artistIdOrSlug }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [artist, setArtist] = useState<any>(null);
  
  // Create a ref to store the calendar instance
  const calendarRef = React.useRef<any>(null);
  
  // Fetch appointments and working hours using hooks
  const { 
    appointments: fetchedAppointments, 
    loading: appointmentsLoading, 
  } = useArtistAppointments(artistIdOrSlug);
  
  const {
    workingHours,
    loading: workingHoursLoading,
  } = useWorkingHours(artist?.id);

  // Generate available days based on working hours
  const generateAvailableDays = () => {
    if (workingHoursLoading || !workingHours.length) {
      return [];
    }
    
    const today = new Date();
    const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
    
    const availableDays: any[] = [];
    
    // Loop through each day in the date range
    const currentDate = new Date(startOfCurrentMonth);
    
    // Define Persian Green for available days
    const PERSIAN_GREEN = '#00A896';
    
    while (currentDate <= endOfNextMonth) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Find the working hours for this day of the week
      const dayWorkingHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);
      
      // If day has working hours and is not marked as a day off
      if (dayWorkingHours && !dayWorkingHours.is_day_off) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        // Parse working hours
        const startTime = dayWorkingHours.start_time.split(':').map(Number);
        const endTime = dayWorkingHours.end_time.split(':').map(Number);
        
        // Create start and end datetime for this slot
        const slotStart = new Date(currentDate);
        slotStart.setHours(startTime[0], startTime[1] || 0, 0, 0);
        
        const slotEnd = new Date(currentDate);
        slotEnd.setHours(endTime[0], endTime[1] || 0, 0, 0);
        
        // This day is available
        availableDays.push({
          id: `open-${dateStr}`,
          title: 'Available',
          start: dateStr,
          end: dateStr,
          allDay: true,
          backgroundColor: PERSIAN_GREEN,
          borderColor: PERSIAN_GREEN,
          display: 'background',
          className: 'fc-available-day',
          extendedProps: {
            status: 'available',
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString()
          }
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return availableDays;
  };

  // Process events for the calendar
  useEffect(() => {
    if (!appointmentsLoading && !workingHoursLoading) {
      const availableDays = generateAvailableDays();
      setEvents(availableDays);
    }
  }, [fetchedAppointments, appointmentsLoading, workingHours, workingHoursLoading]);

  // Fetch artist data
  useEffect(() => {
    const fetchArtistData = async () => {
      if (!artistIdOrSlug) return;
      
      setLoading(true);
      
      try {
        // For development, set demo artist data
        if (process.env.NODE_ENV === 'development') {
          setArtist({
            id: typeof artistIdOrSlug === 'number' ? artistIdOrSlug : 5,
            name: 'Levvy Martinez',
            slug: typeof artistIdOrSlug === 'string' ? artistIdOrSlug : 'levvy-dog'
          });
        } else {
          // For production, would fetch from API
        }
      } catch (error) {
        console.error('Error fetching artist data:', error);
        setError('Failed to load artist data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchArtistData();
  }, [artistIdOrSlug]);
  
  // Handle date click - simply alert the user which days are available
  const handleDateClick = (info: any) => {
    // Get the date that was selected
    const selectedDate = new Date(info.dateStr);
    
    // Format the date for comparison
    const formattedDateStr = selectedDate.toISOString().split('T')[0];
    
    // Check if this day has any available time slots
    const isAvailable = events.some(event => {
      const eventDate = new Date(event.start).toISOString().split('T')[0];
      return eventDate === formattedDateStr;
    });
    
    if (isAvailable) {
      alert(`This date (${selectedDate.toLocaleDateString()}) is available for booking. In a real application, a booking form would open.`);
    } else {
      alert("This date is not available for booking. Please choose a date marked in green.");
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

  return (
    <div className="artist-calendar">
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
            dateClick={handleDateClick}
            dayCellContent={({ date, dayNumberText }) => {
              const today = new Date();
              const isToday =
                  date.getFullYear() === today.getFullYear() &&
                  date.getMonth() === today.getMonth() &&
                  date.getDate() === today.getDate();

              return (
                  <div
                      style={{
                        color: isToday ? '#FF5722' : undefined,
                        fontWeight: isToday ? 'bold' : undefined,
                      }}
                  >
                    {dayNumberText}
                  </div>
              );
            }}
            dayCellDidMount={({ date, el }) => {
              const today = new Date();
              const isToday =
                  date.getFullYear() === today.getFullYear() &&
                  date.getMonth() === today.getMonth() &&
                  date.getDate() === today.getDate();

              if (isToday) {
                el.style.backgroundColor = '#1A1A1D';
                el.style.color = '#FFFFFF'; // Ensure text contrast
              }
            }}
            eventDidMount={({ el, event }) => {
              if (event.extendedProps?.status === 'available') {
                el.style.opacity = '1';
              }
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