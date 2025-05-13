# Implementation Verification Guidelines

This document serves as a checklist for verifying that code implementations correctly adhere to the specified requirements for the Inked In scheduling system. It provides clear criteria that can be used by developers, reviewers, or AI systems during code analysis.

## Scheduling System Requirements Verification

### 1. Artist Availability Configuration

#### Critical Requirements:
- [ ] Artists can designate specific time slots as available for appointments
- [ ] Artists can specify slot availability type: consultation appointments, tattoo appointments, or both
- [ ] The system must support artists who want to offer only consultation appointments
- [ ] The system must support artists who want to offer only tattoo appointments
- [ ] The system must support artists who want to offer both appointment types

#### Code Validation Points:
- Verify artist schema includes appointment type preferences
- Verify UI allows toggling different appointment types independently
- Confirm appointment type settings are properly saved to the API
- Confirm calendar only shows appointment types the artist has enabled

```typescript
// Expected appointment type configuration structure
interface AppointmentTypeSettings {
  consultation: {
    enabled: boolean;
    duration: number; // in minutes
  };
  tattoo: {
    enabled: boolean;
    duration: number; // in minutes
  };
}

// Example verification test
test("Artist can set available appointment types", async () => {
  // Configure artist to only offer consultation appointments
  const settings = {
    appointmentTypes: {
      consultation: { enabled: true, duration: 30 },
      tattoo: { enabled: false, duration: 120 }
    }
  };
  
  await artistService.updateAvailabilitySettings(artistId, settings);
  const updatedSettings = await artistService.getAvailabilitySettings(artistId);
  
  expect(updatedSettings.appointmentTypes.consultation.enabled).toBe(true);
  expect(updatedSettings.appointmentTypes.tattoo.enabled).toBe(false);
});
```

### 2. Calendar Day Interaction

#### Critical Requirements:
- [ ] Calendar days are only clickable if they have at least ONE available time segment
- [ ] Days with no available time slots must be non-interactive
- [ ] Available days must visually indicate their clickable status
- [ ] Clicking an available day must display a modal with available time slots

#### Code Validation Points:
- Verify calendar component conditionally enables click handlers
- Confirm CSS class application for available vs. unavailable days
- Verify modal only appears when clicking on available days
- Test boundary cases: days with a single available slot should be clickable

```typescript
// Example verification test
test("Calendar days are only clickable when they have availability", async () => {
  // Setup: Create an artist with availability only on specific days
  const availableDays = [1, 5, 10]; // Available on 1st, 5th, and 10th of month
  
  // Render the calendar component
  const { getByTestId } = render(<ArtistCalendar artistId={artistId} />);
  
  // Check each day of the month
  for (let day = 1; day <= 31; day++) {
    const dayElement = getByTestId(`calendar-day-${day}`);
    
    if (availableDays.includes(day)) {
      // Available days should have the 'available' class and be clickable
      expect(dayElement).toHaveClass('available');
      expect(dayElement).not.toHaveClass('unavailable');
      expect(dayElement).toHaveAttribute('role', 'button');
    } else {
      // Unavailable days should have the 'unavailable' class and not be clickable
      expect(dayElement).toHaveClass('unavailable');
      expect(dayElement).not.toHaveClass('available');
      expect(dayElement).not.toHaveAttribute('role', 'button');
    }
  }
});
```

### 3. Calendar Color Scheme

#### Critical Requirements:
- [ ] Monthly view must use ONLY TWO colors for day states:
  - [ ] Persian Green (#00A896) for days with available time slots
  - [ ] Licorice (#1A1A1D) for days with no available time slots
- [ ] No other colors should be used to indicate day status in the monthly view

#### Code Validation Points:
- Verify CSS color definitions match the specified hex values
- Confirm no additional colors are used for day status indicators
- Check color application in all calendar view states
- Ensure color contrast meets accessibility standards

```typescript
// Example CSS validation
test("Calendar uses correct color scheme", () => {
  const styles = getComputedStyle(document.documentElement);
  
  // Get the actual colors used by the calendar day elements
  const availableDayColor = styles.getPropertyValue('--color-available-day').trim();
  const unavailableDayColor = styles.getPropertyValue('--color-unavailable-day').trim();
  
  // Verify they match the required colors
  expect(availableDayColor).toBe('#00A896'); // Persian Green
  expect(unavailableDayColor).toBe('#1A1A1D'); // Licorice
  
  // Verify no other color classes exist for day status
  const styleSheet = document.styleSheets[0];
  const colorClasses = Array.from(styleSheet.cssRules)
    .filter(rule => rule.selectorText?.includes('.calendar-day'))
    .map(rule => rule.style.backgroundColor);
  
  // Should only find the two specified colors
  expect(colorClasses.length).toBe(2);
  expect(colorClasses).toContain('#00A896');
  expect(colorClasses).toContain('#1A1A1D');
});
```

### 4. Time Slot Selection Modal

#### Critical Requirements:
- [ ] Modal displays available time slots for the selected day
- [ ] Each time slot clearly indicates whether it's for consultation or tattoo appointment
- [ ] Modal includes a field for additional client information
- [ ] Modal has a clear submission button to request the appointment

#### Code Validation Points:
- Verify modal appears after clicking an available day
- Confirm all available time slots are displayed with correct appointment types
- Check that the additional information field is properly included
- Verify form submission sends the correct data to the API

```typescript
// Example verification test
test("Time slot modal displays correctly", async () => {
  // Setup: Click an available day on the calendar
  const { getByTestId, getByLabelText, getByText } = render(
    <ArtistCalendar artistId={artistId} month={5} year={2025} />
  );
  
  // Click on an available day
  fireEvent.click(getByTestId('calendar-day-15'));
  
  // Verify modal appears
  const modal = getByTestId('time-slot-modal');
  expect(modal).toBeInTheDocument();
  
  // Verify time slots are displayed
  const timeSlots = within(modal).getAllByTestId(/time-slot-/);
  expect(timeSlots.length).toBeGreaterThan(0);
  
  // Verify each slot shows its type (consultation or tattoo)
  timeSlots.forEach(slot => {
    const slotType = within(slot).getByTestId('slot-type');
    expect(slotType.textContent).toMatch(/consultation|tattoo/i);
  });
  
  // Verify additional information field exists
  const additionalInfoField = getByLabelText(/additional information/i);
  expect(additionalInfoField).toBeInTheDocument();
  
  // Verify submission button exists
  const submitButton = getByText(/request appointment/i);
  expect(submitButton).toBeInTheDocument();
});
```

### 5. Privacy Protection

#### Critical Requirements:
- [ ] Calendar must NEVER reveal who has booked which segments
- [ ] Calendar must NEVER show which segments are booked to other customers
- [ ] Calendar must only show what is available to the customer
- [ ] Calendar must only show what has been approved for the specific customer

#### Code Validation Points:
- Verify calendar only displays available/unavailable status
- Confirm no client information is exposed in calendar data
- Check that booked slots simply appear unavailable without any booking details
- Verify that approved appointments for the current user are properly displayed

```typescript
// Example verification test
test("Calendar preserves booking privacy", async () => {
  // Setup: Create a calendar with some booked appointments
  // Appointment 1: Booked by another user
  // Appointment 2: Booked by the current user but pending
  // Appointment 3: Booked by the current user and approved
  
  const { queryByText, queryByTestId } = render(
    <ArtistCalendar 
      artistId={artistId} 
      month={5} 
      year={2025}
      currentUserId={currentUserId}
    />
  );
  
  // Verify no client names are visible in the calendar
  expect(queryByText(/client name/i)).not.toBeInTheDocument();
  
  // Verify no "booked" or "pending" indicators are visible
  expect(queryByText(/booked/i)).not.toBeInTheDocument();
  expect(queryByText(/pending/i)).not.toBeInTheDocument();
  
  // Verify no special styling for booked slots
  const dayWithBookings = queryByTestId('calendar-day-16');
  expect(dayWithBookings).not.toHaveClass('booked');
  
  // Verify days with bookings by others simply appear unavailable
  // if there are no other slots available
  const fullyBookedDay = queryByTestId('calendar-day-17');
  expect(fullyBookedDay).toHaveClass('unavailable');
  expect(fullyBookedDay).not.toHaveClass('available');
});
```

### 6. Appointment Approval Workflow

#### Critical Requirements:
- [ ] When modal is submitted, it should message the artist
- [ ] Artist must have option to approve or decline the appointment request
- [ ] Appointment is not confirmed until artist approves it
- [ ] Client must be notified of approval status

#### Code Validation Points:
- Verify appointment request creates a "pending" appointment
- Confirm notification is sent to the artist
- Check artist UI provides approve/decline options
- Verify client is notified after artist decision
- Confirm appointment status changes after approval/decline

```typescript
// Example verification test
test("Appointment approval workflow", async () => {
  // Step 1: Client submits appointment request
  const appointmentRequest = {
    artistId: artistId,
    date: '2025-05-20',
    timeSlotId: 'slot-123',
    appointmentType: 'consultation',
    additionalInfo: 'First tattoo consultation'
  };
  
  const response = await appointmentService.requestAppointment(appointmentRequest);
  
  // Verify initial status is "pending"
  expect(response.status).toBe('pending');
  
  // Step 2: Check artist notification
  const artistNotifications = await notificationService.getArtistNotifications(artistId);
  const appointmentNotification = artistNotifications.find(
    n => n.type === 'appointment_request' && n.appointmentId === response.id
  );
  expect(appointmentNotification).toBeDefined();
  
  // Step 3: Artist approves appointment
  await appointmentService.updateAppointmentStatus(response.id, 'approved');
  
  // Step 4: Verify client notification
  const clientNotifications = await notificationService.getClientNotifications(clientId);
  const approvalNotification = clientNotifications.find(
    n => n.type === 'appointment_approved' && n.appointmentId === response.id
  );
  expect(approvalNotification).toBeDefined();
  
  // Step 5: Verify appointment status updated
  const updatedAppointment = await appointmentService.getAppointment(response.id);
  expect(updatedAppointment.status).toBe('approved');
});
```

## Component Implementation Checklist

### ArtistCalendar Component

- [ ] Uses correct color scheme (Persian Green for available, Licorice for unavailable)
- [ ] Only allows clicking on days with at least one available time slot
- [ ] Shows time slot selection modal when clicking an available day
- [ ] Does not display booking information for privacy
- [ ] Visually distinguishes available from unavailable days

### TimeSlotModal Component

- [ ] Displays all available time slots for the selected day
- [ ] Shows appointment type for each slot (consultation or tattoo)
- [ ] Includes field for additional information
- [ ] Has clear submission button
- [ ] Submits appointment as "pending" for artist approval

### WorkingHoursModal Component

- [ ] Allows artists to set regular working hours
- [ ] Enables separate configuration for consultation and tattoo appointments
- [ ] Allows enabling/disabling each appointment type
- [ ] Correctly saves settings to the backend
- [ ] Updates calendar display based on new settings

### AppointmentRequestNotification Component

- [ ] Shows client and appointment information to artist
- [ ] Provides approve and decline buttons
- [ ] Does not expose client details to other users
- [ ] Updates appointment status when artist takes action

## API Endpoints Verification

- [ ] GET /api/artists/{id}/availability - Returns correct availability data
- [ ] POST /api/appointments - Creates pending appointment request
- [ ] PUT /api/appointments/{id} - Updates appointment status
- [ ] GET /api/appointments - Returns only appointments relevant to the requesting user

## Data Model Verification

### Appointment Model

- [ ] Includes required fields: artistId, clientId, date, startTime, endTime, type, status
- [ ] Status field supports: pending, approved, declined, cancelled, completed
- [ ] Type field supports: consultation, tattoo
- [ ] Additional information field exists for client notes

### Artist Availability Model

- [ ] Supports configuring regular working hours
- [ ] Allows marking specific days/times as available or unavailable
- [ ] Supports different availability for different appointment types
- [ ] Correctly integrates with appointment data to prevent booking conflicts

## Testing Scenarios

Complete system testing should verify these key scenarios:

1. Artist configures availability for consultation appointments only
2. Artist configures availability for tattoo appointments only
3. Artist configures availability for both appointment types
4. Client attempts to book unavailable time slot (should fail)
5. Client books available time slot (creates pending appointment)
6. Artist approves appointment request
7. Artist declines appointment request
8. Client views their approved and pending appointments
9. Calendar correctly updates as slots become booked
10. Privacy is maintained throughout all user interactions