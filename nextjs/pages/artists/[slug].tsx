import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import LogoText from '../../components/LogoText';
import { Box, Button, Modal, Paper, IconButton, Tabs, Tab, TextField, MenuItem, FormControl, InputLabel, Select, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ImageIcon from '@mui/icons-material/Image';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import {useArtist, useArtistPortfolio, useWorkingHours} from '../../hooks';
import TattooCard from "@/components/TattooCard";
import {useAuth} from '../../contexts/AuthContext';
import TattooUpload from '@/components/TattooUpload';
import ArtistCalendar from '@/components/ArtistCalendar';
import WorkingHoursDisplay from '@/components/WorkingHoursDisplay';

export default function ArtistDetail() {
    const router = useRouter();
    const {slug} = router.query;
    const {artist, loading: artistLoading, error: artistError} = useArtist(slug as string);
    const {workingHours, loading: hoursLoading} = useWorkingHours(artist?.id);
    const {user, isAuthenticated} = useAuth();
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
    const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
    const [selectedWorkingHours, setSelectedWorkingHours] = useState<any>(null);
    
    const isOwner = isAuthenticated && user && (user.slug === slug || user.id === artist?.id);
    const portfolio = artist?.tattoos || [];
    
    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };
    
    const handleOpenUploadModal = () => {
        setUploadModalOpen(true);
    };
    
    const handleCloseUploadModal = () => {
        setUploadModalOpen(false);
    };
    
    const handleUploadSuccess = (tattooId: number) => {
        // Refresh the artist's portfolio data
        router.replace(router.asPath);
    };
    
    // Handle booking modal
    const handleOpenBookingModal = (date: Date, workingHoursData: any) => {
        setSelectedDate(date);
        setSelectedWorkingHours(workingHoursData);
        
        // Generate available time slots based on working hours
        if (workingHoursData) {
            const startTime = workingHoursData.start_time.split(':');
            const endTime = workingHoursData.end_time.split(':');
            
            const startHour = parseInt(startTime[0]);
            const endHour = parseInt(endTime[0]);
            
            const slots = [];
            for (let hour = startHour; hour < endHour; hour++) {
                slots.push(`${hour.toString().padStart(2, '0')}:00`);
                slots.push(`${hour.toString().padStart(2, '0')}:30`);
            }
            
            setAvailableTimeSlots(slots);
            setSelectedTimeSlot(slots[0]);
        }
        
        setBookingModalOpen(true);
    };
    
    const handleCloseBookingModal = () => {
        setBookingModalOpen(false);
        setSelectedDate(null);
        setSelectedTimeSlot('');
    };
    
    const handleBookAppointment = () => {
        if (!selectedDate || !selectedTimeSlot) {
            alert('Please select a date and time');
            return;
        }
        
        // TODO: Call API to book appointment
        console.log('Booking appointment:', {
            artistId: artist?.id,
            date: selectedDate,
            timeSlot: selectedTimeSlot
        });
        
        // Close the modal
        handleCloseBookingModal();
        
        // Show success message
        alert('Appointment request sent!');
    };
    
    // We're now using the onDateSelected prop callback instead of custom events

    if (artistLoading) {
        return <div className="loading">Loading artist details...</div>;
    }

    if (artistError) {
        return <div className="error">Error: {artistError.message}</div>;
    }

    if (!artist) {
        return <div>Artist not found</div>;
    }

    return (
        <Layout>
            <Head>
                <title>{artist.name} | InkedIn</title>
                <meta name="description" content={`Learn more about ${artist.name} and their tattoo work`}/>
                <link rel="icon" href="/assets/img/logo.png"/>
                <link rel="preload" href="/fonts/tattoo.ttf" as="font" type="font/ttf" crossOrigin="anonymous"/>
            </Head>

            <div className="py-6">
                <div className="artist-grid" style={{display: 'block', maxWidth: '750px', margin: '0 auto', position: 'relative'}}>
                    {isOwner && (
                        <Button 
                            variant="contained" 
                            onClick={handleOpenUploadModal}
                            style={{
                                position: 'absolute',
                                top: '0',
                                right: '0',
                                backgroundColor: '#339989',
                                color: 'white',
                                fontSize: '12px',
                                padding: '4px 10px',
                                zIndex: 10
                            }}
                        >
                            Upload New
                        </Button>
                    )}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        marginBottom: '20px',
                        paddingLeft: '1px'
                    }}>
                        <div style={{
                            width: '80px', 
                            height: '80px', 
                            position: 'relative',
                            marginBottom: '8px',
                            borderRadius: '50%',
                            overflow: 'hidden'
                        }}>
                            <Image 
                                src={artist.primary_image?.uri}
                                alt={artist.name || 'Artist'}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <h3 style={{
                            margin: '0',
                            fontSize: '18px', 
                            fontWeight: 'bold'
                        }}>{artist.name}</h3>
                        <p style={{
                            margin: '0',
                            fontSize: '14px',
                            color: '#888'
                        }}>{artist?.studio_name}</p>
                        {artist?.location && (
                          <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '14px',
                              color: '#888',
                              margin: '0'
                          }}>
                              <span style={{ marginRight: '4px' }}>📍</span>
                              <span>{artist?.location}</span>
                          </div>
                        )}
                        
                        {artist?.styles && artist.styles.length > 0 && (
                          <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                              marginTop: '12px',
                              marginBottom: '12px'
                          }}>
                              {artist.styles.map((style, index) => {
                                  const styleName = typeof style === 'string' ? style : style.name;
                                  return (
                                      <span key={index} style={{
                                          backgroundColor: '#339989',
                                          color: 'white',
                                          padding: '2px 8px',
                                          borderRadius: '12px',
                                          fontSize: '12px',
                                          whiteSpace: 'nowrap'
                                      }}>
                                          {styleName}
                                      </span>
                                  );
                              })}
                          </div>
                        )}
                        
                        {artist?.about && (
                          <>
                            <hr style={{
                              width: '100%',
                              margin: '15px 0',
                              border: 'none',
                              borderTop: '1px solid #333',
                            }} />
                            <p style={{
                              margin: '0',
                              fontSize: '14px',
                              lineHeight: '1.5',
                              color: '#ccc',
                              maxWidth: '450px'
                            }}>
                              {artist.about}
                            </p>
                          </>
                        )}
                    </div>
                    
                    {/* Tabs navigation */}
                    <div style={{ width: '100%', marginTop: '20px', marginBottom: '20px' }}>
                      <Tabs 
                        value={activeTab} 
                        onChange={handleTabChange}
                        centered
                        sx={{
                          '& .MuiTab-root': {
                            minWidth: '50%',
                            color: '#888',
                          },
                          '& .Mui-selected': {
                            color: '#339989',
                          },
                          '& .MuiTabs-indicator': {
                            backgroundColor: '#339989',
                          }
                        }}
                      >
                        <Tab icon={<ImageIcon />} aria-label="Tattoos" />
                        <Tab icon={<CalendarMonthIcon />} aria-label="Schedule" />
                      </Tabs>
                    </div>
                    
                    {/* Tab content */}
                    {activeTab === 0 ? (
                      /* Tattoos Tab */
                      portfolio.length > 0 ? (
                          <div style={{
                              display: 'grid',
                              gridTemplateColumns: `repeat(auto-fit, minmax(${Math.floor(750/3)}px, 1fr))`,
                              gap: '2px',
                              width: '100%'
                          }}>
                              {portfolio.map(tattoo => (
                                  <div key={tattoo.id} style={{
                                      aspectRatio: '1/1',
                                      position: 'relative'
                                  }}>
                                      <Image
                                          src={tattoo.primary_image?.uri}
                                          alt={tattoo.title || 'Tattoo work'}
                                          fill
                                          className="object-cover"
                                      />
                                      {isOwner && (
                                          <IconButton 
                                              size="small"
                                              aria-label="edit"
                                              onClick={() => router.push(`/tattoos/update?id=${tattoo.id}`)}
                                              sx={{
                                                  position: 'absolute',
                                                  top: 5,
                                                  right: 5,
                                                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                                                  color: 'white',
                                                  '&:hover': { 
                                                      bgcolor: 'rgba(0, 0, 0, 0.7)', 
                                                      color: '#339989' 
                                                  },
                                                  zIndex: 10,
                                                  padding: '6px',
                                              }}
                                          >
                                              <EditIcon fontSize="small" />
                                          </IconButton>
                                      )}
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <p>No portfolio items found.</p>
                      )
                    ) : (
                      /* Schedule Tab */
                      <div style={{ width: '100%' }}>
                        {/*<div className="mb-6">*/}
                        {/*  <WorkingHoursDisplay */}
                        {/*    workingHours={workingHours}*/}
                        {/*    className="max-w-md mx-auto" */}
                        {/*  />*/}
                        {/*</div>*/}
                        <ArtistCalendar 
                          artistIdOrSlug={slug as string}
                          onDateSelected={(date, workingHours) => handleOpenBookingModal(date, workingHours)} 
                        />
                      </div>
                    )}
                </div>
            </div>
            
            {/* TattooUpload Modal */}
            <Modal
                open={uploadModalOpen}
                onClose={handleCloseUploadModal}
                aria-labelledby="tattoo-upload-modal"
                aria-describedby="modal-for-uploading-new-tattoo-images"
            >
                <Paper 
                    sx={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)',
                        maxWidth: '90%',
                        maxHeight: '90%',
                        overflow: 'auto',
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        borderRadius: 1
                    }}
                >
                    <TattooUpload 
                        onClose={handleCloseUploadModal} 
                        onSuccess={handleUploadSuccess}
                    />
                </Paper>
            </Modal>
            
            {/* Booking Modal */}
            <Modal
                open={bookingModalOpen}
                onClose={handleCloseBookingModal}
                aria-labelledby="booking-modal"
                aria-describedby="modal-for-booking-appointments"
            >
                <Paper 
                    sx={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)',
                        width: 400,
                        maxWidth: '90%',
                        bgcolor: '#2a1a1e',
                        boxShadow: 24,
                        borderRadius: 1,
                        p: 4,
                        color: 'white'
                    }}
                >
                    <Typography variant="h5" component="h2" sx={{ mb: 2, color: '#339989' }}>
                        Book Appointment
                    </Typography>
                    
                    {selectedDate && (
                        <Typography variant="body1" sx={{ mb: 3 }}>
                            Date: {selectedDate.toLocaleDateString()}
                        </Typography>
                    )}
                    
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel id="time-slot-label" sx={{ color: '#888' }}>Select Time</InputLabel>
                        <Select
                            labelId="time-slot-label"
                            value={selectedTimeSlot}
                            onChange={(e) => setSelectedTimeSlot(e.target.value)}
                            label="Select Time"
                            sx={{ 
                                color: 'white',
                                '.MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#444'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#339989'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#339989'
                                }
                            }}
                        >
                            {availableTimeSlots.map((slot) => (
                                <MenuItem key={slot} value={slot}>{slot}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label="Notes for the artist"
                        variant="outlined"
                        placeholder="Describe what you're interested in..."
                        sx={{ 
                            mb: 3,
                            color: 'white',
                            '& label': { color: '#888' },
                            '& label.Mui-focused': { color: '#339989' },
                            '& .MuiInputBase-input': { color: 'white' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: '#444' },
                                '&:hover fieldset': { borderColor: '#666' },
                                '&.Mui-focused fieldset': { borderColor: '#339989' }
                            }
                        }}
                    />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            onClick={handleCloseBookingModal}
                            sx={{ 
                                color: '#888',
                                '&:hover': { color: 'white' }
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleBookAppointment}
                            sx={{ 
                                bgcolor: '#339989',
                                '&:hover': { bgcolor: '#267b6e' }
                            }}
                        >
                            Book Appointment
                        </Button>
                    </div>
                </Paper>
            </Modal>
        </Layout>
    );
}
