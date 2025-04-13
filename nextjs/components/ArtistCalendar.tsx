import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

interface ArtistCalendarProps {
  artistIdOrSlug: string | number;
  initialView?: 'dayGridMonth' | 'timeGridWeek';
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  extendedProps?: {
    description?: string;
    status?: 'available' | 'booked' | 'tentative' | 'unavailable';
    clientName?: string;
    clientId?: string | number;
    tattooId?: string | number;
  };
  backgroundColor?: string;
  borderColor?: string;
}

const ArtistCalendar: React.FC<ArtistCalendarProps> = ({ 
  artistIdOrSlug, 
  initialView = 'dayGridMonth' 
}) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<string>(initialView);
  const [artist, setArtist] = useState<any>(null);
  
  // Create a ref to store the calendar instance
  const calendarRef = React.useRef<any>(null);
  
  // State for appointment modal
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedData, setEditedData] = useState<any>({});
  
  // State for appointment request modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<Array<{start: string, end: string}>>([]);
  const [requestFormData, setRequestFormData] = useState({
    timeSlot: '',
    contactInfo: '',
    description: ''
  });

  useEffect(() => {
    const fetchArtistSchedule = async () => {
      setLoading(true);
      setError(null);
      
      // Debug output
      console.log(`ArtistCalendar: Fetching schedule for artist: "${artistIdOrSlug}"`);
      console.log(`ArtistCalendar: artistIdOrSlug type: ${typeof artistIdOrSlug}`);
      
      // Check if artistIdOrSlug is actually valid
      if (!artistIdOrSlug) {
        console.warn('ArtistCalendar: Invalid artistIdOrSlug, using placeholder data');
        // For demo purposes, use ID 999 if no ID provided
        // In production, you'd show an error
      }
      
      // Fetch artist data
      try {
        // For now, just set demo artist data
        setArtist({
          id: typeof artistIdOrSlug === 'number' ? artistIdOrSlug : 1,
          name: 'Demo Artist',
          slug: typeof artistIdOrSlug === 'string' ? artistIdOrSlug : 'demo-artist'
        });
        // fetch artist data:
        // const artistData = await api.get(`/artists/${artistIdOrSlug}`);
        // setArtist(artistData);
      } catch (error) {
        console.error('Error fetching artist data:', error);
      }
      
      try {
        // Call API to get artist schedule
        // Add dummy data while API endpoint is developed
        // Create a helper function to create time slots with specific times
        const createTimeSlot = (daysFromNow: number, startHour: number, endHour: number, status: 'available' | 'booked' | 'tentative' | 'unavailable', title: string, details?: any) => {
          const date = new Date();
          date.setDate(date.getDate() + daysFromNow);
          
          const start = new Date(date);
          start.setHours(startHour, 0, 0, 0);
          
          const end = new Date(date);
          end.setHours(endHour, 0, 0, 0);
          
          return {
            id: `${daysFromNow}-${startHour}-${endHour}`,
            title,
            start: start.toISOString(),
            end: end.toISOString(),
            allDay: false,
            extendedProps: {
              status,
              ...details
            }
          };
        };
        
        // Generate dummy data for both month and week views
        const dummyData: CalendarEvent[] = [
          // Monthly full-day events
          {
            id: '1',
            title: 'Available All Day',
            start: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
            end: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
            allDay: true,
            extendedProps: {
              status: 'available'
            }
          },
          {
            id: '2',
            title: 'Booked: Sleeve Tattoo',
            start: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
            end: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
            allDay: true,
            extendedProps: {
              status: 'booked',
              description: 'Full sleeve dragon design',
              clientName: 'John Smith'
            }
          },
          {
            id: '3',
            title: 'Unavailable',
            start: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
            end: new Date(new Date().setDate(new Date().getDate() + 9)).toISOString(),
            allDay: true,
            extendedProps: {
              status: 'unavailable',
              description: 'Personal time off'
            }
          },
          
          // Weekly time slot events - today
          createTimeSlot(0, 10, 12, 'booked', 'Booked: Small Tattoo', {
            description: 'Small bird tattoo on wrist',
            clientName: 'Emma Johnson'
          }),
          createTimeSlot(0, 13, 15, 'available', 'Available'),
          createTimeSlot(0, 16, 19, 'booked', 'Booked: Cover-up Work', {
            description: 'Cover-up work on shoulder',
            clientName: 'Michael Davis'
          }),
          
          // Tomorrow
          createTimeSlot(1, 10, 13, 'available', 'Available'),
          createTimeSlot(1, 14, 16, 'tentative', 'Tentative: Consultation', {
            description: 'Initial consultation for thigh piece'
          }),
          createTimeSlot(1, 17, 19, 'available', 'Available'),
          
          // Day after tomorrow
          createTimeSlot(2, 10, 14, 'booked', 'Booked: Back Piece Session 1', {
            description: 'First session of back piece',
            clientName: 'Sarah Wilson'
          }),
          createTimeSlot(2, 15, 19, 'unavailable', 'Unavailable', {
            description: 'Studio meeting'
          }),
          
          // Two days from now
          createTimeSlot(3, 12, 19, 'booked', 'Booked: Full Day Session', {
            description: 'Full day tattooing - leg sleeve',
            clientName: 'Robert Martinez'
          })
        ];
        
        // TODO: Uncomment this when the API endpoint is ready
        // const response = await api.get<CalendarEvent[]>(`/artists/${artistIdOrSlug}/schedule`, {
        //   useCache: false // Always get fresh schedule data
        // });
        
        // For now, use dummy data
        const response = dummyData;
        
        // Process and color-code events based on status
        const processedEvents = response.map(event => {
          // Set colors based on event status - using theme colors
          let backgroundColor = '#339989'; // Default color (persian-green)
          let borderColor = '#339989';
          let textColor = '#FFFFFF'; // White text for dark backgrounds
          let title = event.title;
          
          // If not the artist owner, mask titles and only show color indicators
          if (!isArtistOwner()) {
            // For non-artists, don't show any text on the events
            title = '';
            
            // Only keep color coding
            if (event.extendedProps?.status) {
              switch(event.extendedProps.status) {
                case 'available':
                  backgroundColor = '#339989'; // Persian Green (theme color)
                  borderColor = '#287771';
                  break;
                case 'booked':
                case 'tentative':
                case 'unavailable':
                  backgroundColor = '#000000'; // Black
                  borderColor = '#000000';
                  break;
              }
            }
          } else {
            // Artist can see everything normally
            if (event.extendedProps?.status) {
              switch(event.extendedProps.status) {
                case 'available':
                  backgroundColor = '#339989'; // Persian Green (theme color)
                  borderColor = '#287771';
                  break;
                case 'booked':
                  backgroundColor = '#7B0D1E'; // Burgundy (theme color)
                  borderColor = '#5D0A17';
                  break;
                case 'tentative':
                  backgroundColor = '#E8DBC5'; // Pearl (theme color)
                  borderColor = '#CEC0A9';
                  textColor = '#1C0F13'; // Dark text for light background
                  break;
                case 'unavailable':
                  backgroundColor = '#000000'; // Black (was Licorice)
                  borderColor = '#000000';
                  break;
              }
            }
          }
          
          // Create a modified event object
          const modifiedEvent = {
            ...event,
            title,
            backgroundColor,
            borderColor,
            textColor
          };
          
          // If not the artist, adjust the display for the entire day coloring
          if (!isArtistOwner()) {
            // For non-artists, make events full-day background events
            // to color the entire day cell
            modifiedEvent.start = event.start ? new Date(new Date(event.start).setHours(0, 0, 0, 0)) : event.start;
            modifiedEvent.end = event.end ? new Date(new Date(event.end).setHours(23, 59, 59, 999)) : event.end;
            modifiedEvent.allDay = true; // Force all-day 
            
            // For available events, use background display to color the entire day
            if (event.extendedProps?.status === 'available') {
              modifiedEvent.display = 'background'; // Color the entire day
              modifiedEvent.backgroundColor = '#339989'; // Green background
            } else {
              // Keep non-available events non-interactive but invisible
              modifiedEvent.display = 'none'; // Hide other events
            }
            
            // Empty the title to hide any text
            modifiedEvent.title = '';
            modifiedEvent.timeText = '';
          }
          
          return modifiedEvent;
        });
        
        setEvents(processedEvents);
      } catch (err) {
        console.error("Error fetching artist schedule:", err);
        // Don't show errors during development when using dummy data
        // setError("Failed to load artist's schedule. Please try again later.");
        console.warn("Using demo data despite error");
        
        // Create some fallback demo data
        const fallbackDemoData = [
          {
            id: 'fallback-1',
            title: 'Available',
            start: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
            end: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
            allDay: true,
            extendedProps: {
              status: 'available'
            },
            backgroundColor: '#339989',
            borderColor: '#287771',
            textColor: '#FFFFFF'
          }
        ];
        
        // Always show some data during development
        setEvents(fallbackDemoData);
      } finally {
        setLoading(false);
      }
    };
    
    if (artistIdOrSlug) {
      fetchArtistSchedule();
    }
  }, [artistIdOrSlug]);
  
  // Handle view change from the calendar
  const handleViewChange = (viewInfo: any) => {
    console.log('View changed to:', viewInfo.view.type);
    setCurrentView(viewInfo.view.type);
  };
  
  // Handle opening the appointment modal
  const handleEventClick = (info: any) => {
    console.log('Event clicked:', info.event);
    
    // Only show appointment details if the user is the artist
    if (!isArtistOwner()) {
      // Non-artists shouldn't see any appointment details, regardless of status
      console.log('Non-artist users cannot view appointment details');
      return; // Don't open the modal
    } else {
      // Artist can see full details
      setSelectedEvent(info.event);
      setEditedData({
        title: info.event.title,
        status: info.event.extendedProps?.status || 'available',
        description: info.event.extendedProps?.description || '',
        clientName: info.event.extendedProps?.clientName || '',
        date: info.event.start ? new Date(info.event.start).toISOString().split('T')[0] : '',
        startTime: info.event.start ? 
          `${new Date(info.event.start).getHours().toString().padStart(2, '0')}:${new Date(info.event.start).getMinutes().toString().padStart(2, '0')}` : '',
        endTime: info.event.end ? 
          `${new Date(info.event.end).getHours().toString().padStart(2, '0')}:${new Date(info.event.end).getMinutes().toString().padStart(2, '0')}` : '',
        allDay: info.event.allDay || false
      });
      setIsModalOpen(true);
      setIsEditing(false);
    }
  };
  
  // Handle closing the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    setIsEditing(false);
  };
  
  // Toggle editing mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };
  
  // Find available time slots for a given date
  const findAvailableTimeSlotsForDate = (date: Date | string) => {
    // Ensure we have a valid date object
    let validDate: Date;
    try {
      // If date is a string or invalid date, create a new valid date
      validDate = date instanceof Date && !isNaN(date.getTime()) 
        ? date 
        : new Date(); // Default to current date if invalid
        
      // Format the date to match event start dates (YYYY-MM-DD)
      const dateStr = validDate.toISOString().split('T')[0];
      console.log("Finding slots for date:", dateStr);
      
      // Filter events for the selected date that have 'available' status
      const availableEvents = events.filter(event => {
        try {
          const eventStart = new Date(event.start);
          const eventDate = eventStart.toISOString().split('T')[0];
          return eventDate === dateStr && event.extendedProps?.status === 'available';
        } catch (error) {
          console.error("Error processing event date:", error);
          return false;
        }
      });
      
      // Extract time slots from available events
      const slots = availableEvents.map(event => {
        try {
          const startTime = new Date(event.start);
          const endTime = new Date(event.end);
          
          return {
            start: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`,
            end: `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`,
            display: `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')} - ${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`
          };
        } catch (error) {
          console.error("Error formatting time slot:", error);
          return {
            start: "00:00",
            end: "00:00",
            display: "Time unavailable"
          };
        }
      });
      
      return slots;
    } catch (error) {
      console.error("Error in findAvailableTimeSlotsForDate:", error);
      // Return mock slots as fallback
      return [
        {
          start: '10:00',
          end: '12:00',
          display: '10:00 - 12:00'
        },
        {
          start: '14:00',
          end: '16:00',
          display: '14:00 - 16:00'
        }
      ];
    }
  };
  
  // Handle date selection event
  const handleDateClick = (info: any) => {
    console.log("Date clicked/selected:", info);
    
    if (!isArtistOwner()) {
      try {
        // Get the date that was selected
        let selectedDate;
        
        // Safely handle various date formats from the calendar
        if (info.start) {
          selectedDate = new Date(info.start);
        } else if (info.date) {
          selectedDate = new Date(info.date);
        } else {
          // Fallback to current date
          selectedDate = new Date();
        }
        
        console.log("Selected date processed:", selectedDate);
        
        // Check if this date has available slots
        const formattedDateStr = selectedDate.toISOString().split('T')[0];
        console.log("Checking date for availability:", formattedDateStr);
        
        // Check if any event is available on this date
        const hasAvailableEvent = events.some(event => {
          try {
            const eventStart = new Date(event.start);
            const eventDate = eventStart.toISOString().split('T')[0];
            return eventDate === formattedDateStr && event.extendedProps?.status === 'available';
          } catch (error) {
            return false;
          }
        });
        
        console.log("Date has available event:", hasAvailableEvent);
        
        // Only allow booking if the date has available events
        if (hasAvailableEvent) {
          // Always use mock slots for the demo
          const mockSlots = [
            {
              start: '10:00',
              end: '12:00',
              display: '10:00 - 12:00'
            },
            {
              start: '14:00',
              end: '16:00',
              display: '14:00 - 16:00'
            }
          ];
          
          setSelectedDate(selectedDate);
          setAvailableTimeSlots(mockSlots);
          setRequestFormData({
            timeSlot: `${mockSlots[0].start}-${mockSlots[0].end}`,
            contactInfo: '',
            description: ''
          });
          setIsRequestModalOpen(true);
          console.log('Opening booking modal for available date');
        } else {
          console.log('Date is not available for booking');
          // Optional: show a message that the date is not available
        }
      } catch (error) {
        console.error("Error handling date click:", error);
        alert("There was an error processing this date. Please try another date.");
      }
    }
  };
  
  // Handle closing the request modal
  const handleCloseRequestModal = () => {
    setIsRequestModalOpen(false);
    setSelectedDate(null);
    setAvailableTimeSlots([]);
  };
  
  // Handle request form changes
  const handleRequestFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRequestFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle appointment request submission
  const handleSubmitRequest = () => {
    // In a real application, this would send the request to the backend
    console.log('Submitting appointment request:', {
      date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
      ...requestFormData
    });
    
    // For now, just close the modal and show a success message
    alert('Your appointment request has been sent to the artist!');
    handleCloseRequestModal();
  };
  
  // Handle form field changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox fields separately
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditedData({
        ...editedData,
        [name]: checked
      });
    } else {
      setEditedData({
        ...editedData,
        [name]: value
      });
    }
  };
  
  // Save changes to the appointment
  const handleSaveChanges = async () => {
    try {
      // In a real app, you would send changes to the API
      // For now, we'll just update the event in the calendar
      
      if (selectedEvent && calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        const event = calendarApi.getEventById(selectedEvent.id);
        
        if (event) {
          // Create start and end date objects from the form data
          const startDate = new Date(editedData.date);
          const endDate = new Date(editedData.date);
          
          // Parse start and end times
          if (!editedData.allDay && editedData.startTime) {
            const [startHours, startMinutes] = editedData.startTime.split(':').map(Number);
            startDate.setHours(startHours, startMinutes, 0);
          }
          
          if (!editedData.allDay && editedData.endTime) {
            const [endHours, endMinutes] = editedData.endTime.split(':').map(Number);
            endDate.setHours(endHours, endMinutes, 0);
          }
          
          // Update the event
          event.setProp('title', editedData.title);
          event.setStart(startDate);
          event.setEnd(endDate);
          event.setAllDay(editedData.allDay);
          
          // Update extended props
          event.setExtendedProp('status', editedData.status);
          event.setExtendedProp('description', editedData.description);
          event.setExtendedProp('clientName', editedData.clientName);
          
          // Update colors based on status
          let backgroundColor = '#339989'; // Default color (persian-green)
          let borderColor = '#287771';
          let textColor = '#FFFFFF'; // White text for dark backgrounds
          
          switch(editedData.status) {
            case 'available':
              backgroundColor = '#339989'; // Persian Green (theme color)
              borderColor = '#287771';
              break;
            case 'booked':
              backgroundColor = '#7B0D1E'; // Burgundy (theme color)
              borderColor = '#5D0A17';
              break;
            case 'tentative':
              backgroundColor = '#E8DBC5'; // Pearl (theme color)
              borderColor = '#CEC0A9';
              textColor = '#1C0F13'; // Dark text for light background
              break;
            case 'unavailable':
              backgroundColor = '#000000'; // Black (was Licorice)
              borderColor = '#000000';
              break;
          }
          
          event.setProp('backgroundColor', backgroundColor);
          event.setProp('borderColor', borderColor);
          event.setProp('textColor', textColor);
          
          console.log('Event updated successfully');
        }
      }
      
      // Close the modal and reset state
      setIsEditing(false);
      setIsModalOpen(false);
      setSelectedEvent(null);
      
    } catch (error) {
      console.error('Error saving changes:', error);
    }
  };
  
  // Render loading state - but add a timeout to prevent getting stuck
  useEffect(() => {
    // If loading takes more than 3 seconds, set loading to false anyway
    if (loading) {
      const timeoutId = setTimeout(() => {
        console.log('Loading timeout reached, forcing render');
        setLoading(false);
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading]);
  
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
  
  // Check if current user is the artist
  const isArtistOwner = () => {
    if (!user || !artist) return false;
    return user.id === artist.id;
  };

  return (
    <div className="artist-calendar">
      {/* View toggle buttons */}
      <div className="flex justify-end mb-4 space-x-2">
        <button 
          className={`px-3 py-1 text-sm rounded-md ${
            currentView === 'dayGridMonth' 
              ? 'bg-[#339989] text-white' 
              : 'bg-[#2C1921] text-[#E8DBC5] border border-[#333333] hover:bg-[#371F29]'
          }`}
          onClick={() => {
            setCurrentView('dayGridMonth');
            if (calendarRef.current) {
              const calendarApi = calendarRef.current.getApi();
              calendarApi.changeView('dayGridMonth');
            }
          }}
        >
          Month
        </button>
        <button 
          className={`px-3 py-1 text-sm rounded-md ${
            currentView === 'timeGridWeek' 
              ? 'bg-[#339989] text-white' 
              : 'bg-[#2C1921] text-[#E8DBC5] border border-[#333333] hover:bg-[#371F29]'
          }`}
          onClick={() => {
            setCurrentView('timeGridWeek');
            if (calendarRef.current) {
              const calendarApi = calendarRef.current.getApi();
              calendarApi.changeView('timeGridWeek');
            }
          }}
        >
          Week
        </button>
      </div>
      
      {/* Calendar component */}
      <div className="calendar-container" style={{ 
        backgroundColor: '#000000', 
        borderRadius: '8px',
        padding: '1px'
      }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView={initialView}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '' // We'll use our custom buttons instead
          }}
          views={{
            dayGridMonth: { // Month view
              titleFormat: { year: 'numeric', month: 'long' }
            },
            timeGridWeek: { // Week view with times
              titleFormat: { year: 'numeric', month: 'short', day: '2-digit' }
            }
          }}
          events={events}
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short'
          }}
          height="auto"
          datesSet={handleViewChange}
          viewDidMount={handleViewChange}
          eventClick={isArtistOwner() ? handleEventClick : handleDateClick}
          // Date selection for appointment booking
          selectable={true}
          select={handleDateClick}
          selectMirror={true}
          unselectAuto={false}
          // Add additional calendar options here
          slotMinTime="09:00:00" // Start time for the day
          slotMaxTime="21:00:00" // End time for the day
          weekends={true}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5, 6], // Monday - Saturday
            startTime: '10:00',
            endTime: '19:00',
          }}
          // Theme customization
          themeSystem="standard"
          // Dark theme colors
          eventBorderColor="#333333"
          // Handle day cell rendering for custom colors
          dayCellDidMount={(arg) => {
            // Make sure we have the right background color
            arg.el.style.backgroundColor = '#000000';
          }}
          // CSS content for styling
          didMount={(info) => {
            // Apply custom CSS
            const styleElement = document.createElement('style');
            styleElement.innerHTML = `
                /* Hide event times for non-artists and improve day cell backgrounds */
                ${!isArtistOwner() ? `
                .fc-event-time, .fc-event-title { display: none !important; }
                .fc-daygrid-day.fc-day-has-event[data-date] { 
                  cursor: pointer !important;
                }
                .fc-bg-event {
                  opacity: 0.65 !important;
                }
                ` : ''}
                
                .fc-theme-standard .fc-scrollgrid, 
                .fc-theme-standard td, 
                .fc-theme-standard th {
                  border-color: #333333;
                }
                .fc-day-today {
                  background-color: rgba(51, 153, 137, 0.15) !important;
                }
                .fc-col-header-cell {
                  background-color: #000000;
                  color: #E8DBC5;
                }
                .fc-day-header {
                  background-color: #000000;
                  color: #E8DBC5;
                }
                .fc-col-header-cell-cushion {
                  color: #E8DBC5;
                }
                .fc-daygrid-day-number {
                  color: #E8DBC5;
                }
                .fc-toolbar-title {
                  color: #E8DBC5;
                }
                .fc-button-primary {
                  background-color: #339989 !important;
                  border-color: #287771 !important;
                }
                .fc-button-primary:hover {
                  background-color: #287771 !important;
                }
                .fc-day {
                  background-color: #000000;
                }
                .fc-timegrid-slot, .fc-timegrid-slot-lane {
                  background-color: #000000;
                }
                .fc-timegrid-slot-label-cushion {
                  color: #E8DBC5;
                }
                .fc-list-day-cushion {
                  background-color: #000000 !important;
                }
                .fc-list-event:hover td {
                  background-color: #333333 !important;
                }
                .fc-list-event-title a {
                  color: #E8DBC5 !important;
                }
                .fc-timegrid-event-harness {
                  color: #FFFFFF;
                }
                /* Make days with availability slightly lighter */
                .fc-daygrid-day.fc-day-has-events {
                  background-color: #111111 !important;
                }
                
                /* Weekly view specific styles */
                .fc-timeGridWeek-view .fc-timegrid-slot-label {
                  color: #E8DBC5;
                }
                .fc-timeGridWeek-view .fc-col-header-cell {
                  background-color: #000000;
                }
                .fc-timeGridWeek-view .fc-day {
                  background-color: #000000;
                }
                .fc-timegrid-event {
                  border-radius: 3px;
                  padding: 2px 4px;
                }
                .fc-timegrid-slot-lane {
                  border-color: #333333 !important;
                }
                .fc-timegrid-now-indicator-line {
                  border-color: #7B0D1E !important;
                }
                .fc-timegrid-axis {
                  border-color: #333333;
                }
                .fc-timegrid-axis-frame {
                  color: #E8DBC5;
                }
              `;
              document.head.appendChild(styleElement);
            }
          }
      />
      
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-start gap-4 text-sm">
        <div className="flex items-center">
          <span className="block w-4 h-4 mr-1 bg-[#339989] rounded-sm border border-[#287771]"></span>
          <span>Available</span>
        </div>
        <div className="flex items-center">
          <span className="block w-4 h-4 mr-1 bg-[#7B0D1E] rounded-sm border border-[#5D0A17]"></span>
          <span>Booked</span>
        </div>
        <div className="flex items-center">
          <span className="block w-4 h-4 mr-1 bg-[#E8DBC5] rounded-sm border border-[#CEC0A9]"></span>
          <span>Tentative</span>
        </div>
        <div className="flex items-center">
          <span className="block w-4 h-4 mr-1 bg-[#000000] rounded-sm border border-[#000000]"></span>
          <span>Unavailable</span>
        </div>
        
        {!isArtistOwner() && (
          <div className="ml-2 text-xs text-[#E8DBC5] italic">
            Note: Green indicates available days. Please contact the artist for booking.
          </div>
        )}
      </div>
      
      {/* Appointment Details Modal - Only for Artists */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#2C1921] text-[#E8DBC5] rounded-lg shadow-xl max-w-md w-full max-h-90vh overflow-y-auto">
            {/* Modal Header */}
            <div className="border-b border-[#333333] px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {isEditing ? 'Edit Appointment' : 'Appointment Details'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-[#E8DBC5] hover:text-[#339989] focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="px-6 py-4">
              {!isEditing ? (
                /* View Mode */
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[#339989] font-semibold mb-1">Title</h4>
                    <p>{editedData.title}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-[#339989] font-semibold mb-1">Date</h4>
                    <p>{new Date(editedData.date).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-[#339989] font-semibold mb-1">Time</h4>
                    <p>
                      {editedData.allDay 
                        ? 'All Day' 
                        : `${editedData.startTime} - ${editedData.endTime}`}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-[#339989] font-semibold mb-1">Status</h4>
                    <p className="capitalize">{editedData.status}</p>
                  </div>
                  
                  {editedData.clientName && (
                    <div>
                      <h4 className="text-[#339989] font-semibold mb-1">Client</h4>
                      <p>{editedData.clientName}</p>
                    </div>
                  )}
                  
                  {editedData.description && (
                    <div>
                      <h4 className="text-[#339989] font-semibold mb-1">Description</h4>
                      <p>{editedData.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Mode */
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#339989] font-semibold mb-1">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={editedData.title}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-[#1C0F13] border border-[#333333] rounded-md text-[#E8DBC5] focus:outline-none focus:ring-2 focus:ring-[#339989]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[#339989] font-semibold mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={editedData.date}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-[#1C0F13] border border-[#333333] rounded-md text-[#E8DBC5] focus:outline-none focus:ring-2 focus:ring-[#339989]"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <label className="text-[#339989] font-semibold">
                      <input
                        type="checkbox"
                        name="allDay"
                        checked={editedData.allDay}
                        onChange={handleFormChange}
                        className="mr-2"
                      />
                      All Day
                    </label>
                  </div>
                  
                  {!editedData.allDay && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#339989] font-semibold mb-1">Start Time</label>
                        <input
                          type="time"
                          name="startTime"
                          value={editedData.startTime}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 bg-[#1C0F13] border border-[#333333] rounded-md text-[#E8DBC5] focus:outline-none focus:ring-2 focus:ring-[#339989]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#339989] font-semibold mb-1">End Time</label>
                        <input
                          type="time"
                          name="endTime"
                          value={editedData.endTime}
                          onChange={handleFormChange}
                          className="w-full px-3 py-2 bg-[#1C0F13] border border-[#333333] rounded-md text-[#E8DBC5] focus:outline-none focus:ring-2 focus:ring-[#339989]"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-[#339989] font-semibold mb-1">Status</label>
                    <select
                      name="status"
                      value={editedData.status}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-[#1C0F13] border border-[#333333] rounded-md text-[#E8DBC5] focus:outline-none focus:ring-2 focus:ring-[#339989]"
                    >
                      <option value="available">Available</option>
                      <option value="booked">Booked</option>
                      <option value="tentative">Tentative</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[#339989] font-semibold mb-1">Client Name</label>
                    <input
                      type="text"
                      name="clientName"
                      value={editedData.clientName}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 bg-[#1C0F13] border border-[#333333] rounded-md text-[#E8DBC5] focus:outline-none focus:ring-2 focus:ring-[#339989]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[#339989] font-semibold mb-1">Description</label>
                    <textarea
                      name="description"
                      value={editedData.description}
                      onChange={handleFormChange}
                      rows={3}
                      className="w-full px-3 py-2 bg-[#1C0F13] border border-[#333333] rounded-md text-[#E8DBC5] focus:outline-none focus:ring-2 focus:ring-[#339989]"
                    ></textarea>
                  </div>
                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#333333] flex justify-end">
              {isArtistOwner() && !isEditing && (
                <button
                  onClick={toggleEditMode}
                  className="px-4 py-2 bg-[#339989] text-white rounded-md hover:bg-[#287771] focus:outline-none focus:ring-2 focus:ring-[#339989]"
                >
                  Edit
                </button>
              )}
              
              {isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-[#1C0F13] text-[#E8DBC5] border border-[#333333] rounded-md hover:bg-[#25151B] mr-2 focus:outline-none focus:ring-2 focus:ring-[#333333]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="px-4 py-2 bg-[#339989] text-white rounded-md hover:bg-[#287771] focus:outline-none focus:ring-2 focus:ring-[#339989]"
                  >
                    Save
                  </button>
                </>
              )}
              
              {!isEditing && (
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-[#1C0F13] text-[#E8DBC5] border border-[#333333] rounded-md hover:bg-[#25151B] focus:outline-none focus:ring-2 focus:ring-[#333333]"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Appointment Request Modal - For clients/users */}
      {isRequestModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-[#2C1921] text-[#E8DBC5] rounded-lg shadow-xl max-w-md w-full max-h-90vh overflow-y-auto">
            {/* Modal Header */}
            <div className="border-b border-[#333333] px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold">Request Appointment</h3>
              <button 
                onClick={handleCloseRequestModal}
                className="text-[#E8DBC5] hover:text-[#339989] focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="px-6 py-4">
              <div className="space-y-5">
                <div>
                  <h4 className="text-[#339989] font-semibold mb-2">Selected Date</h4>
                  <p className="text-lg">{selectedDate.toLocaleDateString()}</p>
                </div>
                
                <div>
                  <label className="block text-[#339989] font-semibold mb-2">
                    Available Time Slots
                  </label>
                  <select
                    name="timeSlot"
                    value={requestFormData.timeSlot}
                    onChange={handleRequestFormChange}
                    className="w-full px-3 py-2 bg-[#1C0F13] border border-[#333333] rounded-md text-[#E8DBC5] focus:outline-none focus:ring-2 focus:ring-[#339989]"
                  >
                    {availableTimeSlots.map((slot, index) => (
                      <option key={index} value={`${slot.start}-${slot.end}`}>
                        {slot.display}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[#339989] font-semibold mb-2">
                    Contact Information (Email or Phone)
                  </label>
                  <input
                    type="text"
                    name="contactInfo"
                    value={requestFormData.contactInfo}
                    onChange={handleRequestFormChange}
                    placeholder="your@email.com or phone number"
                    className="w-full px-3 py-2 bg-[#1C0F13] border border-[#333333] rounded-md text-[#E8DBC5] focus:outline-none focus:ring-2 focus:ring-[#339989]"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-[#339989] font-semibold mb-2">
                    Description of Tattoo
                  </label>
                  <textarea
                    name="description"
                    value={requestFormData.description}
                    onChange={handleRequestFormChange}
                    placeholder="Please briefly describe what you're looking for..."
                    rows={4}
                    className="w-full px-3 py-2 bg-[#1C0F13] border border-[#333333] rounded-md text-[#E8DBC5] focus:outline-none focus:ring-2 focus:ring-[#339989]"
                    required
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#333333] flex justify-end">
              <button
                onClick={handleCloseRequestModal}
                className="px-4 py-2 bg-[#1C0F13] text-[#E8DBC5] border border-[#333333] rounded-md hover:bg-[#25151B] mr-2 focus:outline-none focus:ring-2 focus:ring-[#333333]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                className="px-4 py-2 bg-[#339989] text-white rounded-md hover:bg-[#287771] focus:outline-none focus:ring-2 focus:ring-[#339989]"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistCalendar;