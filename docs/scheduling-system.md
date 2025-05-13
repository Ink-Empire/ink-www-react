# Inked In: Appointment Scheduling System

This document provides a comprehensive overview of the appointment scheduling system for Inked In, detailing the design, user flows, and implementation considerations for both artists and clients. It serves as a verification reference for ensuring code implementations adhere to the specified requirements.

## Core Principles

The Inked In scheduling system adheres to the following core principles:

1. **Artist Control** - Artists have complete control over their availability and appointment types
2. **Privacy-First Design** - Calendar views only show availability, not specific booking details
3. **Two-Step Confirmation** - Appointments require artist approval before being confirmed
4. **Clear Availability** - Visual distinction between available and unavailable time slots
5. **Flexible Appointment Types** - Support for both consultation and tattoo appointments

## Calendar Interface

### Monthly View

The monthly calendar view provides an overview of artist availability:

- **Color Coding**:
  - **Persian Green** (#00A896) - Days with at least one available time slot
  - **Licorice** (#1A1A1D) - Days with no available time slots
- **Interaction**:
  - Clickable only on days with at least ONE available segment
  - Non-available days should be visually distinct and non-interactive
- **Information Display**:
  - Only shows availability status, never reveals booking details
  - Does not display who has booked appointments or which time slots are booked
  - Only shows what is available to the customer and what has been approved for them

```typescript
// Example Calendar Component Structure
function ArtistCalendar({ artistId, month, year }) {
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  
  // Fetch available days for the artist in the given month/year
  useEffect(() => {
    async function fetchAvailability() {
      const response = await artistService.getMonthlyAvailability(
        artistId, 
        month, 
        year
      );
      
      // Extract days with at least one available time slot
      setAvailableDays(response.availableDays);
    }
    
    fetchAvailability();
  }, [artistId, month, year]);
  
  // Handler for day click
  function handleDayClick(day: number) {
    // Only allow selection if day has availability
    if (availableDays.includes(day)) {
      const selectedDate = new Date(year, month, day);
      setSelectedDate(selectedDate);
      setShowModal(true);
    }
  }
  
  return (
    <div className="artist-calendar">
      <CalendarHeader month={month} year={year} />
      
      <div className="calendar-grid">
        {/* Render calendar days */}
        {generateCalendarDays(month, year).map(day => (
          <CalendarDay 
            key={day.date}
            day={day}
            isAvailable={availableDays.includes(day.dayOfMonth)}
            onClick={() => handleDayClick(day.dayOfMonth)}
          />
        ))}
      </div>
      
      {/* Time slot selection modal */}
      {showModal && selectedDate && (
        <TimeSlotModal
          artistId={artistId}
          date={selectedDate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

// Calendar Day Component
function CalendarDay({ day, isAvailable, onClick }) {
  return (
    <div 
      className={`calendar-day ${isAvailable ? 'available' : 'unavailable'}`}
      onClick={isAvailable ? onClick : undefined}
      style={{ 
        backgroundColor: isAvailable ? '#00A896' : '#1A1A1D',
        cursor: isAvailable ? 'pointer' : 'default'
      }}
    >
      {day.dayOfMonth}
    </div>
  );
}
```

### Time Slot Modal

When a user clicks on an available day, a modal appears showing available time slots:

- **Time Slot Display**:
  - Shows only available time slots for the selected day
  - Clearly distinguishes between consultation and tattoo appointment slots
  - Displays duration of each available slot
- **Appointment Request Form**:
  - Slot selection mechanism (radio buttons or similar UI element)
  - Appointment type selection (consultation or tattoo, based on artist settings)
  - Additional information field for the client to provide context
  - Clear submission button
- **Privacy Considerations**:
  - Does not show already booked slots
  - Does not reveal other clients' information

```typescript
// Example Time Slot Modal Component
function TimeSlotModal({ artistId, date, onClose }) {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [appointmentType, setAppointmentType] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  // Fetch available time slots for the selected date
  useEffect(() => {
    async function fetchTimeSlots() {
      const formattedDate = date.toISOString().split('T')[0];
      const response = await artistService.getDailyAvailability(
        artistId, 
        formattedDate
      );
      
      setAvailableSlots(response.availableSlots);
      
      // Set default appointment type if only one type is available
      const availableTypes = getUniqueAppointmentTypes(response.availableSlots);
      if (availableTypes.length === 1) {
        setAppointmentType(availableTypes[0]);
      }
    }
    
    fetchTimeSlots();
  }, [artistId, date]);
  
  // Handler for form submission
  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedSlot || !appointmentType) return;
    
    setIsSubmitting(true);
    
    try {
      await appointmentService.requestAppointment({
        artistId,
        date: date.toISOString().split('T')[0],
        timeSlotId: selectedSlot,
        appointmentType,
        additionalInfo
      });
      
      // Show success message
      showNotification('Appointment request submitted');
      onClose();
    } catch (error) {
      // Handle error
      showNotification('Failed to submit appointment request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Helper to get unique appointment types
  function getUniqueAppointmentTypes(slots: TimeSlot[]) {
    return [...new Set(slots.map(slot => slot.appointmentType))];
  }
  
  return (
    <div className="time-slot-modal">
      <div className="modal-header">
        <h3>Available Time Slots for {formatDate(date)}</h3>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="time-slots-container">
          {availableSlots.length > 0 ? (
            availableSlots.map(slot => (
              <div 
                key={slot.id}
                className={`time-slot ${selectedSlot === slot.id ? 'selected' : ''}`}
                onClick={() => setSelectedSlot(slot.id)}
              >
                <input
                  type="radio"
                  name="timeSlot"
                  value={slot.id}
                  checked={selectedSlot === slot.id}
                  onChange={() => setSelectedSlot(slot.id)}
                />
                <div className="slot-details">
                  <span className="slot-time">
                    {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </span>
                  <span className="slot-duration">
                    {calculateDuration(slot.startTime, slot.endTime)}
                  </span>
                  <span className="slot-type">
                    {slot.appointmentType}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="no-slots-message">
              No available time slots for this day.
            </p>
          )}
        </div>
        
        {availableSlots.length > 0 && (
          <>
            {/* Appointment Type Selection (if multiple types available) */}
            {getUniqueAppointmentTypes(availableSlots).length > 1 && (
              <div className="appointment-type-selection">
                <label>Appointment Type:</label>
                <div className="radio-group">
                  {getUniqueAppointmentTypes(availableSlots).map(type => (
                    <label key={type} className="radio-label">
                      <input
                        type="radio"
                        name="appointmentType"
                        value={type}
                        checked={appointmentType === type}
                        onChange={() => setAppointmentType(type)}
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
            )}
            
            {/* Additional Information */}
            <div className="additional-info">
              <label htmlFor="additionalInfo">
                Additional Information (optional):
              </label>
              <textarea
                id="additionalInfo"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Describe what you're looking for, or any special requests..."
                rows={4}
              />
            </div>
            
            <div className="modal-actions">
              <button 
                type="submit" 
                className="submit-button"
                disabled={!selectedSlot || !appointmentType || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Request Appointment'}
              </button>
              <button
                type="button"
                className="cancel-button"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
```

## Artist Availability Management

Artists have full control over their availability through a dedicated interface:

### Availability Settings

- **Working Hours Configuration**:
  - Set default working hours for each day of the week
  - Option to mark entire days as unavailable
- **Appointment Type Settings**:
  - Configure which types of appointments they offer (consultation, tattoo, or both)
  - Set different duration options for each appointment type
- **Time Slot Management**:
  - Create custom time slots outside regular hours
  - Block off specific dates/times (for vacations, events, etc.)
- **Scheduling Rules**:
  - Set minimum notice period for bookings
  - Define maximum booking window (how far in advance clients can book)

```typescript
// Example Artist Working Hours Component
function WorkingHoursModal({ artistId, onSave }) {
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: { isWorking: true, slots: [{ start: '10:00', end: '18:00' }] },
    tuesday: { isWorking: true, slots: [{ start: '10:00', end: '18:00' }] },
    wednesday: { isWorking: true, slots: [{ start: '10:00', end: '18:00' }] },
    thursday: { isWorking: true, slots: [{ start: '10:00', end: '18:00' }] },
    friday: { isWorking: true, slots: [{ start: '10:00', end: '18:00' }] },
    saturday: { isWorking: false, slots: [] },
    sunday: { isWorking: false, slots: [] },
  });
  
  const [appointmentTypes, setAppointmentTypes] = useState({
    consultation: {
      enabled: true,
      duration: 30, // minutes
    },
    tattoo: {
      enabled: true,
      duration: 120, // minutes
    }
  });
  
  // Load existing settings on component mount
  useEffect(() => {
    async function loadSettings() {
      const response = await artistService.getAvailabilitySettings(artistId);
      if (response.workingHours) {
        setWorkingHours(response.workingHours);
      }
      if (response.appointmentTypes) {
        setAppointmentTypes(response.appointmentTypes);
      }
    }
    
    loadSettings();
  }, [artistId]);
  
  // Toggle working status for a day
  function toggleWorkingDay(day: string) {
    setWorkingHours(current => ({
      ...current,
      [day]: {
        ...current[day],
        isWorking: !current[day].isWorking
      }
    }));
  }
  
  // Update working hours for a specific day
  function updateWorkingHours(day: string, slotIndex: number, field: string, value: string) {
    setWorkingHours(current => {
      const updatedSlots = [...current[day].slots];
      updatedSlots[slotIndex] = {
        ...updatedSlots[slotIndex],
        [field]: value
      };
      
      return {
        ...current,
        [day]: {
          ...current[day],
          slots: updatedSlots
        }
      };
    });
  }
  
  // Add a new time slot to a day
  function addTimeSlot(day: string) {
    setWorkingHours(current => ({
      ...current,
      [day]: {
        ...current[day],
        slots: [
          ...current[day].slots,
          { start: '12:00', end: '17:00' }
        ]
      }
    }));
  }
  
  // Remove a time slot from a day
  function removeTimeSlot(day: string, slotIndex: number) {
    setWorkingHours(current => ({
      ...current,
      [day]: {
        ...current[day],
        slots: current[day].slots.filter((_, index) => index !== slotIndex)
      }
    }));
  }
  
  // Toggle appointment type availability
  function toggleAppointmentType(type: string) {
    setAppointmentTypes(current => ({
      ...current,
      [type]: {
        ...current[type],
        enabled: !current[type].enabled
      }
    }));
  }
  
  // Update appointment type duration
  function updateAppointmentDuration(type: string, duration: number) {
    setAppointmentTypes(current => ({
      ...current,
      [type]: {
        ...current[type],
        duration
      }
    }));
  }
  
  // Save all settings
  async function handleSave() {
    try {
      await artistService.updateAvailabilitySettings(artistId, {
        workingHours,
        appointmentTypes
      });
      
      onSave();
    } catch (error) {
      // Handle error
    }
  }
  
  return (
    <div className="working-hours-modal">
      <h2>Manage Your Availability</h2>
      
      {/* Appointment Types Section */}
      <section className="appointment-types-section">
        <h3>Appointment Types</h3>
        <div className="appointment-type-controls">
          <div className="appointment-type">
            <label>
              <input
                type="checkbox"
                checked={appointmentTypes.consultation.enabled}
                onChange={() => toggleAppointmentType('consultation')}
              />
              Consultation Appointments
            </label>
            {appointmentTypes.consultation.enabled && (
              <div className="duration-control">
                <label>Duration (minutes):</label>
                <select
                  value={appointmentTypes.consultation.duration}
                  onChange={(e) => updateAppointmentDuration(
                    'consultation', 
                    parseInt(e.target.value)
                  )}
                >
                  <option value="15">15</option>
                  <option value="30">30</option>
                  <option value="45">45</option>
                  <option value="60">60</option>
                </select>
              </div>
            )}
          </div>
          
          <div className="appointment-type">
            <label>
              <input
                type="checkbox"
                checked={appointmentTypes.tattoo.enabled}
                onChange={() => toggleAppointmentType('tattoo')}
              />
              Tattoo Appointments
            </label>
            {appointmentTypes.tattoo.enabled && (
              <div className="duration-control">
                <label>Duration (minutes):</label>
                <select
                  value={appointmentTypes.tattoo.duration}
                  onChange={(e) => updateAppointmentDuration(
                    'tattoo', 
                    parseInt(e.target.value)
                  )}
                >
                  <option value="60">60</option>
                  <option value="120">120</option>
                  <option value="180">180</option>
                  <option value="240">240</option>
                  <option value="300">300</option>
                  <option value="360">360</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Working Hours Section */}
      <section className="working-hours-section">
        <h3>Regular Working Hours</h3>
        {Object.entries(workingHours).map(([day, settings]) => (
          <div key={day} className="day-settings">
            <div className="day-header">
              <label>
                <input
                  type="checkbox"
                  checked={settings.isWorking}
                  onChange={() => toggleWorkingDay(day)}
                />
                {day.charAt(0).toUpperCase() + day.slice(1)}
              </label>
            </div>
            
            {settings.isWorking && (
              <div className="time-slots">
                {settings.slots.map((slot, index) => (
                  <div key={index} className="time-slot-controls">
                    <select
                      value={slot.start}
                      onChange={(e) => updateWorkingHours(
                        day, 
                        index, 
                        'start', 
                        e.target.value
                      )}
                    >
                      {generateTimeOptions().map(time => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    
                    <span>to</span>
                    
                    <select
                      value={slot.end}
                      onChange={(e) => updateWorkingHours(
                        day, 
                        index, 
                        'end', 
                        e.target.value
                      )}
                    >
                      {generateTimeOptions().map(time => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    
                    <button
                      type="button"
                      className="remove-slot"
                      onClick={() => removeTimeSlot(day, index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="add-slot"
                  onClick={() => addTimeSlot(day)}
                >
                  Add Time Slot
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
      
      <div className="modal-actions">
        <button 
          type="button" 
          className="save-button"
          onClick={handleSave}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}

// Helper function to generate time options in 30-minute intervals
function generateTimeOptions() {
  const times = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute of ['00', '30']) {
      const formattedHour = hour.toString().padStart(2, '0');
      times.push(`${formattedHour}:${minute}`);
    }
  }
  return times;
}
```

## Appointment Approval Flow

The system implements a two-step confirmation process:

1. **Initial Request**:
   - Client selects available time slot and submits request
   - System records the request as "pending"
   - Artist is notified of the pending request

2. **Artist Review**:
   - Artist receives notification of pending appointment
   - Can view request details including client info and request notes
   - Makes decision to approve or decline

3. **Final Confirmation**:
   - If approved, client receives confirmation notification
   - Appointment is marked as "confirmed" in the system
   - Time slot is removed from availability
   - Calendar updates to show the client their confirmed appointment

```typescript
// Example Appointment Request Notification Component
function AppointmentRequestNotification({ request, onApprove, onDecline }) {
  return (
    <div className="appointment-request">
      <div className="request-header">
        <h4>New Appointment Request</h4>
        <span className="request-date">
          {formatDate(request.date)} at {formatTime(request.startTime)}
        </span>
      </div>
      
      <div className="request-details">
        <div className="client-info">
          <img 
            src={request.client.profileImage} 
            alt={request.client.name} 
            className="client-avatar"
          />
          <div className="client-details">
            <span className="client-name">{request.client.name}</span>
            <span className="appointment-type">{request.appointmentType}</span>
            <span className="appointment-duration">
              {calculateDuration(request.startTime, request.endTime)}
            </span>
          </div>
        </div>
        
        {request.additionalInfo && (
          <div className="additional-info">
            <h5>Additional Information:</h5>
            <p>{request.additionalInfo}</p>
          </div>
        )}
      </div>
      
      <div className="request-actions">
        <button 
          className="approve-button"
          onClick={() => onApprove(request.id)}
        >
          Approve
        </button>
        <button 
          className="decline-button"
          onClick={() => onDecline(request.id)}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
```

## Client View of Appointments

Clients can view their appointments with specific artists:

- **Upcoming Appointments**:
  - List of confirmed appointments
  - Appointment details (date, time, artist, type)
  - Option to cancel appointment (subject to cancellation policy)
- **Pending Appointments**:
  - Appointments awaiting artist approval
  - Clear indication of pending status
- **Past Appointments**:
  - History of previous appointments
  - Option to book follow-up appointments with the same artist

```typescript
// Example Client Appointments Component
function ClientAppointments() {
  const [appointments, setAppointments] = useState({
    upcoming: [],
    pending: [],
    past: []
  });
  
  useEffect(() => {
    async function fetchAppointments() {
      const response = await appointmentService.getClientAppointments();
      
      // Categorize appointments
      const upcoming = [];
      const pending = [];
      const past = [];
      
      const now = new Date();
      
      response.appointments.forEach(appointment => {
        const appointmentDate = new Date(appointment.date + 'T' + appointment.startTime);
        
        if (appointment.status === 'pending') {
          pending.push(appointment);
        } else if (appointmentDate < now) {
          past.push(appointment);
        } else {
          upcoming.push(appointment);
        }
      });
      
      setAppointments({
        upcoming,
        pending,
        past
      });
    }
    
    fetchAppointments();
  }, []);
  
  return (
    <div className="client-appointments">
      <h2>My Appointments</h2>
      
      <section className="appointment-section">
        <h3>Upcoming Appointments</h3>
        {appointments.upcoming.length > 0 ? (
          <div className="appointment-list">
            {appointments.upcoming.map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                actionType="cancel"
              />
            ))}
          </div>
        ) : (
          <p className="no-appointments">No upcoming appointments.</p>
        )}
      </section>
      
      <section className="appointment-section">
        <h3>Pending Approval</h3>
        {appointments.pending.length > 0 ? (
          <div className="appointment-list">
            {appointments.pending.map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                actionType="cancel"
                isPending={true}
              />
            ))}
          </div>
        ) : (
          <p className="no-appointments">No pending appointments.</p>
        )}
      </section>
      
      <section className="appointment-section">
        <h3>Past Appointments</h3>
        {appointments.past.length > 0 ? (
          <div className="appointment-list">
            {appointments.past.map(appointment => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                actionType="rebook"
              />
            ))}
          </div>
        ) : (
          <p className="no-appointments">No past appointments.</p>
        )}
      </section>
    </div>
  );
}

// Appointment Card Component
function AppointmentCard({ appointment, actionType, isPending }) {
  const handleAction = async () => {
    if (actionType === 'cancel') {
      if (window.confirm('Are you sure you want to cancel this appointment?')) {
        await appointmentService.cancelAppointment(appointment.id);
        // Update UI
      }
    } else if (actionType === 'rebook') {
      // Navigate to booking page with pre-filled artist
      window.location.href = `/artists/${appointment.artist.slug}/schedule`;
    }
  };
  
  return (
    <div className={`appointment-card ${isPending ? 'pending' : ''}`}>
      <div className="appointment-info">
        <div className="appointment-date">
          <div className="date-display">
            {formatDateShort(appointment.date)}
          </div>
          <div className="time-display">
            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
          </div>
          {isPending && (
            <span className="pending-badge">Awaiting Approval</span>
          )}
        </div>
        
        <div className="appointment-details">
          <div className="artist-info">
            <img 
              src={appointment.artist.profileImage} 
              alt={appointment.artist.name} 
              className="artist-avatar"
            />
            <span className="artist-name">{appointment.artist.name}</span>
          </div>
          
          <div className="appointment-type">
            {appointment.appointmentType}
          </div>
          
          {appointment.studio && (
            <div className="studio-info">
              <span className="studio-name">{appointment.studio.name}</span>
              <span className="studio-address">{appointment.studio.address}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="appointment-actions">
        <button 
          className={actionType === 'cancel' ? 'cancel-button' : 'rebook-button'}
          onClick={handleAction}
        >
          {actionType === 'cancel' ? 'Cancel' : 'Book Again'}
        </button>
      </div>
    </div>
  );
}
```

## Artist View of Appointments

Artists have a comprehensive view of their appointment schedule:

- **Calendar View**:
  - Shows booked and available time slots
  - Different colors for different appointment types
  - Clear indication of pending vs. confirmed appointments
- **Appointment List**:
  - Chronological list of upcoming appointments
  - Appointment details including client info
  - Actions for each appointment (approve, decline, reschedule, cancel)
- **Client History**:
  - View previous appointments with a specific client
  - Notes and images from past sessions

## Implementation Considerations

### Data Models

Key data structures for the scheduling system:

1. **ArtistAvailability**:
   - Regular working hours configuration
   - Special date settings (holidays, time off)
   - Appointment type preferences

2. **TimeSlot**:
   - Date and time range
   - Appointment type (consultation, tattoo)
   - Status (available, booked, pending)

3. **Appointment**:
   - Client and artist references
   - Date and time information
   - Appointment type and duration
   - Status (pending, confirmed, cancelled, completed)
   - Additional information from client

### API Integration

The frontend scheduling system interacts with the ink-api endpoints:

- **GET /api/artists/{id}/availability**: Retrieve artist's availability
- **GET /api/appointments**: List appointments (filtered by artist and status)
- **POST /api/appointments**: Create a new appointment request
- **PUT /api/appointments/{id}**: Update appointment status
- **DELETE /api/appointments/{id}**: Cancel an appointment

### Accessibility Considerations

The scheduling system is designed with accessibility in mind:

- **Keyboard Navigation**: Full keyboard support for all calendar interactions
- **Screen Reader Support**: ARIA labels for calendar days and status information
- **Color Contrast**: High contrast between available and unavailable days
- **Text Alternatives**: Non-color indicators for availability status

### Mobile Responsiveness

The scheduling interface adapts to different screen sizes:

- **Mobile Calendar View**: Simplified calendar optimized for touch interactions
- **Time Slot Selection**: Larger touch targets on mobile devices
- **Modal Behavior**: Full-screen modals on small devices

## Future Enhancements

Potential enhancements to consider for future versions:

1. **Recurring Appointments**: Support for series of appointments
2. **Waitlist System**: Allow clients to join waitlists for cancellations
3. **Calendar Integration**: Export to iCal, Google Calendar, etc.
4. **Automated Reminders**: SMS or email reminders for upcoming appointments
5. **Dynamic Availability**: Adjust available time slots based on appointment type
6. **Multi-Artist Sessions**: Support for appointments with multiple artists

## Conclusion

The Inked In scheduling system provides a flexible, privacy-focused approach to tattoo appointments. By giving artists full control over their availability while providing clients with a clear, intuitive booking experience, the system streamlines the appointment process while respecting the unique needs of the tattoo industry.