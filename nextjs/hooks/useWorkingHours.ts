import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { WorkingHour } from '@/components/WorkingHoursModal';

export const useWorkingHours = (artistId?: number | string | null) => {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch working hours for an artist
  const fetchWorkingHours = async (id?: number | string) => {
    if (!id) {
      console.log('useWorkingHours: No artist ID provided, skipping fetch');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const artistIdNum = typeof id === 'string' ? parseInt(id) : id;
      const data = await api.get<WorkingHour[]>(`/artists/${artistIdNum}/working-hours`, {
        requiresAuth: true,
        useCache: false,
      });
      
      console.log(`Working Hours API Response for artist ${artistIdNum}:`, {
        data,
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 'not an array',
        rawData: JSON.stringify(data)
      });
      
      // Make sure data is an array before setting it
      if (Array.isArray(data)) {
        setWorkingHours(data);
      } else if (data && typeof data === 'object') {
        // Try to handle if data is wrapped in an object
        const hoursArray = data.workingHours || data.hours || data.data || data.availability;
        if (Array.isArray(hoursArray)) {
          console.log('Found hours array in data object:', hoursArray);
          setWorkingHours(hoursArray);
        } else {
          console.error('API response is not an array and no hours array found in object:', data);
          setWorkingHours([]);
        }
      } else {
        console.error('Unexpected API response format:', data);
        setWorkingHours([]);
      }
    } catch (err) {
      console.error('Error fetching working hours:', err);
      setError('Failed to load working hours');
      setWorkingHours([]);
    } finally {
      setLoading(false);
    }
  };

  // Save working hours for an artist
  const saveWorkingHours = async (hours: WorkingHour[]) => {
    if (!artistId) return false;
    
    setLoading(true);
    setError(null);

    const body = {
      availability: hours,
    };
    
    try {
      // Using the same endpoint pattern for consistency
      await api.post(`/artists/${artistId}/working-hours`, body, {
        requiresAuth: true,
      });
      
      console.log(`Saved working hours for artist ${artistId}:`, {
        hoursPayload: body,
        endpoint: `/artists/${artistId}/working-hours`
      });
      
      setWorkingHours(hours);
      return true;
    } catch (err) {
      console.error('Error saving working hours:', err);
      setError('Failed to save working hours');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Load working hours when artistId changes
  useEffect(() => {
    console.log('useWorkingHours useEffect triggered with artistId:', artistId);
    if (artistId) {
      console.log('useWorkingHours: Fetching working hours for artist:', artistId);
      fetchWorkingHours(artistId);
    } else {
      console.log('useWorkingHours: No artistId provided, not fetching');
    }
  }, [artistId]);

  return {
    workingHours,
    loading,
    error,
    fetchWorkingHours,
    saveWorkingHours,
  };
};