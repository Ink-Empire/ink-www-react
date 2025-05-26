import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api';

interface ArtistSettings {
  books_open: boolean;
  accepts_walk_ins: boolean;
  accepts_deposits: boolean;
  accepts_consultations: boolean;
  accepts_appointments: boolean;
}

interface ArtistSettingsToggleProps {
  artistId: number;
  initialSettings?: Partial<ArtistSettings>;
  onSettingsUpdate?: (settings: ArtistSettings) => void;
}

const ArtistSettingsToggle: React.FC<ArtistSettingsToggleProps> = ({
  artistId,
  initialSettings = {},
  onSettingsUpdate
}) => {
  const [settings, setSettings] = useState<ArtistSettings>({
    books_open: false,
    accepts_walk_ins: false,
    accepts_deposits: false,
    accepts_consultations: false,
    accepts_appointments: false,
    ...initialSettings
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current settings on component mount
  useEffect(() => {
    fetchSettings();
  }, [artistId]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ data: ArtistSettings }>(`/artists/${artistId}/settings`, {
        requiresAuth: true
      });
      
      if (response && response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (err) {
      console.error('Error fetching artist settings:', err);
      // Don't show error for missing settings - they might not exist yet
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof ArtistSettings, value: boolean) => {
    const previousSettings = { ...settings };
    const newSettings = { ...settings, [key]: value };
    
    // Optimistically update UI
    setSettings(newSettings);
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put<{ data: ArtistSettings }>(`/artists/${artistId}/settings`, {
        [key]: value
      }, {
        requiresAuth: true
      });
      
      if (response && response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
        if (onSettingsUpdate) {
          onSettingsUpdate(response.data);
        }
      }
    } catch (err) {
      // Revert on error
      setSettings(previousSettings);
      setError('Failed to update setting. Please try again.');
      console.error('Error updating artist setting:', err);
    } finally {
      setLoading(false);
    }
  };

  const settingsConfig = [
    {
      key: 'books_open' as keyof ArtistSettings,
      label: 'Books Open',
      description: 'Accept new tattoo appointments and bookings',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      key: 'accepts_appointments' as keyof ArtistSettings,
      label: 'Scheduled Appointments',
      description: 'Allow clients to book scheduled appointments',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      key: 'accepts_walk_ins' as keyof ArtistSettings,
      label: 'Walk-ins',
      description: 'Accept walk-in clients without appointments',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      key: 'accepts_consultations' as keyof ArtistSettings,
      label: 'Consultations',
      description: 'Offer consultation sessions for tattoo planning',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      )
    },
    {
      key: 'accepts_deposits' as keyof ArtistSettings,
      label: 'Deposits',
      description: 'Require deposits for bookings and appointments',
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900">Booking Preferences</h3>
        <p className="text-sm text-gray-600 mt-1">
          Configure what types of bookings and services you offer
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {settingsConfig.map((config) => (
          <div key={config.key} className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 text-gray-400">
                {config.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {config.label}
                </div>
                <div className="text-xs text-gray-600">
                  {config.description}
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <button
                type="button"
                disabled={loading}
                onClick={() => updateSetting(config.key, !settings[config.key])}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-persian-green focus:ring-offset-2 ${
                  settings[config.key]
                    ? 'bg-persian-green'
                    : 'bg-gray-200'
                } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings[config.key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              
              {loading && (
                <div className="ml-2">
                  <svg className="animate-spin h-4 w-4 text-persian-green" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <strong>Note:</strong> Turning off "Books Open" will hide your calendar from potential clients and prevent new bookings.
        </div>
      </div>
    </div>
  );
};

export default ArtistSettingsToggle;