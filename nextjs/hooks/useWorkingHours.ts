import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { WorkingHour } from '@/components/WorkingHoursModal';

export const useWorkingHours = (artistId?: number | string) => {
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch working hours for an artist
  const fetchWorkingHours = async (id?: number | string) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const artistIdNum = typeof id === 'string' ? parseInt(id) : id;
      const data = await api.get<WorkingHour[]>(`/artists/${artistIdNum}/working-hours`, {
        requiresAuth: true,
        useCache: false,
      });
      
      setWorkingHours(data);
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
    
    try {
      await api.post(`/artists/${artistId}/working-hours`, hours, {
        requiresAuth: true,
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
    if (artistId) {
      fetchWorkingHours(artistId);
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