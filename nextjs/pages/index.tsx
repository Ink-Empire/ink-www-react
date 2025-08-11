import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import TattooCard from "../components/TattooCard";
import TattooModal from "../components/TattooModal";
import SearchFilters from "../components/SearchFilters";
import ActiveFilterBadges from "../components/ActiveFilterBadges";
import Layout from "../components/Layout";
import TattooCreateWizard from "../components/TattooCreateWizard";
import { useTattoos } from "../hooks";
import { useUserData } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useStyles } from "@/contexts/StyleContext";
import { distancePreferences } from "@/utils/distancePreferences";

export default function Home() {
  const me = useUserData();
  const { user: authUser, isAuthenticated } = useAuth();
  const { styles } = useStyles();
  const router = useRouter();
  const { studio_id } = router.query;


  // State for studio name (for filter display)
  const [studioName, setStudioName] = useState<string>("");

  // State for Create Tattoo modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // State for Tattoo detail modal
  const [selectedTattooId, setSelectedTattooId] = useState<string | null>(null);
  const [isTattooModalOpen, setIsTattooModalOpen] = useState(false);

  // State to track dismissed styles (to prevent them from returning)
  const [dismissedStyles, setDismissedStyles] = useState<number[]>([]);
  
  // State to track if user has dismissed distance/location (to prevent reset to defaults)
  const [hasUserDismissedDistance, setHasUserDismissedDistance] = useState(false);

  // Handler for opening tattoo modal
  const handleTattooClick = (tattooId: string) => {
    setSelectedTattooId(tattooId);
    setIsTattooModalOpen(true);
  };

  // Handler for closing tattoo modal
  const handleCloseTattooModal = () => {
    setIsTattooModalOpen(false);
    setSelectedTattooId(null);
  };

  const getTattooFavoriteStatus = (tattooId: string) => {
    if (!me?.tattoos) return false;
    return me.tattoos.includes(parseInt(tattooId));
  };

  // Helper to check if artist is followed (using me instead of currentUser)
  const getArtistFollowStatus = (artistId: number) => {
    if (!me?.artists) return false;
    return me.artists.includes(artistId);
  };

  // Get current tattoo data for modal
  const getCurrentTattoo = () => {
    if (!selectedTattooId || !tattoos?.response) return null;
    return tattoos.response.find((t: any) => t.id.toString() === selectedTattooId);
  };


  // Initialize with user preferences - respecting distance dismissal but NO auto-applied styles
  const initialSearchParams = useMemo(() => {
    const locationSettings = distancePreferences.getDefaultLocationSettings(!!me?.location_lat_long);

    return {
      searchString: router.query.searchString || "",
      styles: [], // Empty array - no auto-applied styles
      applySavedStyles: false, // Default to false
      booksOpen: false, // Default to false
      ...locationSettings,
      distanceUnit: "mi",
      subject: "tattoos",
      studio_id: studio_id || undefined,
    };
  }, [me?.location_lat_long, studio_id, router.query.searchString]);

  const [searchParams, setSearchParams] =
    useState<Record<string, any>>(initialSearchParams);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { tattoos, loading, error } = useTattoos(searchParams);


  // No longer auto-apply user saved styles - removed this useEffect

  // When we get tattoo data back, try to find the studio name based on the studio_id
  useEffect(() => {
    if (tattoos?.response && Array.isArray(tattoos.response) && studio_id) {
      // Find the first tattoo that has the matching studio ID
      const studioIdStr = String(studio_id);

      const tattooWithStudio = tattoos.response.find(
        (tattoo) => tattoo.studio && String(tattoo.studio.id) === studioIdStr
      );

      if (tattooWithStudio?.studio?.name) {
        setStudioName(tattooWithStudio.studio.name);
      }
    }
  }, [tattoos, studio_id]);

  // Update searchParams when studio_id changes in the URL
  useEffect(() => {
    if (studio_id) {
      setSearchParams((prev) => ({ ...prev, studio_id }));
    }
  }, [studio_id]);

  // Update searchParams when searchString query parameter changes
  useEffect(() => {
    if (router.query.searchString) {
      setSearchParams((prev) => ({ 
        ...prev, 
        searchString: router.query.searchString as string 
      }));
    }
  }, [router.query.searchString]);

  // Update searchParams when styleSearch query parameter changes
  useEffect(() => {
    if (router.query.styleSearch && styles.length > 0) {
      const styleSearchName = router.query.styleSearch as string;
      // Find the style ID that matches the name
      const matchingStyle = styles.find(style => 
        style.name.toLowerCase() === styleSearchName.toLowerCase()
      );
      
      if (matchingStyle) {
        setSearchParams((prev) => ({ 
          ...prev, 
          styles: [matchingStyle.id],
          searchString: "" // Clear search string when filtering by style
        }));
      }
    }
  }, [router.query.styleSearch, styles]);

  // Handle filter changes from SearchFilters component
  const handleFilterChange = (filters: {
    searchString: string;
    styles: number[];
    distance: number;
    distanceUnit?: "mi" | "km";
    location?: string;
    useMyLocation?: boolean;
    useAnyLocation?: boolean;
    applySavedStyles?: boolean;
    booksOpen?: boolean;
    locationCoords?: { lat: number; lng: number };
  }) => {
    // Handle applySavedStyles - merge user's saved styles with selected styles if enabled
    let finalStyles = filters?.styles || [];
    if (filters.applySavedStyles && me?.styles) {
      const userStyleIds = me.styles.map(style => style.id || style);
      // Merge without duplicates and filter out dismissed styles
      const mergedStyles = [...new Set([...finalStyles, ...userStyleIds])];
      finalStyles = mergedStyles.filter(style => !dismissedStyles.includes(style));
    }

    // Build new params object
    const newParams: Record<string, any> = {
      searchString: filters.searchString,
      styles: finalStyles,
      distance: filters.distance,
      distanceUnit: filters.distanceUnit,
      location: filters.location,
      useMyLocation: filters.useMyLocation,
      useAnyLocation: filters.useAnyLocation,
      applySavedStyles: filters.applySavedStyles,
      booksOpen: filters.booksOpen,
      subject: "tattoos",
    };

    // Preserve studio_id from URL if it exists
    if (studio_id) {
      newParams.studio_id = studio_id;
    }

    // Format locationCoords as comma-separated string if present
    if (
      filters.locationCoords &&
      filters.locationCoords.lat &&
      filters.locationCoords.lng
    ) {
      newParams.locationCoords = `${filters.locationCoords.lat},${filters.locationCoords.lng}`;
    }

    // Handle location-based parameters
    if (filters.useMyLocation) {
      // Using "My location" - backend will use user's location_lat_long directly
      // Remove any conflicting location parameters
      delete newParams.locationCoords;
    } else if (filters.useAnyLocation) {
      // Using "Anywhere" - remove all location parameters
      delete newParams.locationCoords;
    } else {
      // Using custom location - locationCoords should be set by the calling component
      // Keep locationCoords as is
    }

    // Update state with new parameters
    setSearchParams(newParams);
  };

  return (
    <Layout>
      <Head>
        <title>InkedIn | Find Your Perfect Tattoo</title>
        <meta
          name="description"
          content="Browse our collection of amazing tattoos"
        />
        <link rel="icon" href="/assets/img/logo.png" />
        <link
          rel="preload"
          href="/fonts/tattoo.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </Head>

      <div className="py-3">
        <div className="w-full">
          {/* Search Filters Component */}
          <SearchFilters
            type="tattoos"
            onFilterChange={handleFilterChange}
            initialFilters={{
              searchString: initialSearchParams.searchString,
              styles: initialSearchParams.styles,
              distance: initialSearchParams.distance,
              distanceUnit: initialSearchParams.distanceUnit,
              useMyLocation: initialSearchParams.useMyLocation,
              useAnyLocation: initialSearchParams.useAnyLocation,
              applySavedStyles: initialSearchParams.applySavedStyles,
              booksOpen: initialSearchParams.booksOpen,
              location: initialSearchParams.location,
            }}
            currentFilters={{
              searchString: searchParams.searchString,
              styles: searchParams.styles,
              distance: searchParams.distance,
              distanceUnit: searchParams.distanceUnit,
              useMyLocation: searchParams.useMyLocation,
              useAnyLocation: searchParams.useAnyLocation,
              applySavedStyles: searchParams.applySavedStyles,
              booksOpen: searchParams.booksOpen,
              location: searchParams.location,
              locationCoords: searchParams.locationCoords,
            }}
            onSidebarToggle={setSidebarExpanded}
            initialExpanded={sidebarExpanded}
            isLoading={loading}
            onCreateTattoo={() => setIsCreateModalOpen(true)}
          />

          {/* Active Filters Component */}
          <ActiveFilterBadges
            searchString={searchParams.searchString}
            selectedStyles={searchParams.styles}
            distance={searchParams.distance}
            distanceUnit={searchParams.distanceUnit}
            location={searchParams.location}
            useMyLocation={searchParams.useMyLocation}
            useAnyLocation={searchParams.useAnyLocation}
            studioId={searchParams.studio_id}
            studioName={studioName}
            onClearSearch={() => {
              const newParams = { ...searchParams, searchString: "" };
              setSearchParams(newParams);
              handleFilterChange({
                searchString: "",
                styles: newParams.styles,
                distance: newParams.distance,
                distanceUnit: newParams.distanceUnit,
                location: newParams.location,
                useMyLocation: newParams.useMyLocation,
                useAnyLocation: newParams.useAnyLocation,
                applySavedStyles: newParams.applySavedStyles,
                locationCoords: newParams.locationCoords,
              });
            }}
            onClearStyle={(styleId) => {
              // Add to dismissed styles to prevent it from returning
              setDismissedStyles(prev => [...prev, styleId]);
              
              const newStyles = searchParams.styles.filter(
                (id) => id !== styleId
              );
              const newParams = { ...searchParams, styles: newStyles };
              setSearchParams(newParams);
              handleFilterChange({
                searchString: newParams.searchString,
                styles: newStyles,
                distance: newParams.distance,
                distanceUnit: newParams.distanceUnit,
                location: newParams.location,
                useMyLocation: newParams.useMyLocation,
                useAnyLocation: newParams.useAnyLocation,
                applySavedStyles: newParams.applySavedStyles,
                locationCoords: newParams.locationCoords,
              });
            }}
            onClearDistance={() => {
              // Permanently mark that user has dismissed distance
              distancePreferences.setDistanceDismissed();
              setHasUserDismissedDistance(true);
              
              const newParams = {
                ...searchParams,
                distance: "",
                useAnyLocation: true,
                useMyLocation: false,
                location: "",
              };
              setSearchParams(newParams);
              handleFilterChange({
                searchString: newParams.searchString,
                styles: newParams.styles,
                distance: "",
                distanceUnit: newParams.distanceUnit,
                location: "",
                useMyLocation: false,
                useAnyLocation: true,
                applySavedStyles: newParams.applySavedStyles,
              });
            }}
            onClearStudio={() => {
              // Remove studio_id from URL
              router.push("/", undefined, { shallow: true });

              // Clear studio_id from search params
              const { studio_id: _studio_id, ...rest } = searchParams;
              setSearchParams(rest);

              // Refresh results without studio_id
              handleFilterChange({
                searchString: rest.searchString || "",
                styles: rest.styles || [],
                distance: rest.distance,
                distanceUnit: rest.distanceUnit,
                location: rest.location,
                useMyLocation: rest.useMyLocation,
                locationCoords: rest.locationCoords,
              });
            }}
            onClearLocation={() => {
              // When clearing location, we switch back to using "My Location"
              const newParams = {
                ...searchParams,
                location: "",
                useMyLocation: true,
                useAnyLocation: false,
                subject: "tattoos",
              };
              setSearchParams(newParams);
              handleFilterChange({
                searchString: newParams.searchString,
                styles: newParams.styles,
                distance: newParams.distance,
                distanceUnit: newParams.distanceUnit,
                location: "",
                useMyLocation: true,
                useAnyLocation: false,
              });
            }}
          />

          {error ? (
            <div className="error">Error: {error.message}</div>
          ) : (
            <>
              {tattoos &&
                tattoos.response &&
                Array.isArray(tattoos.response) &&
                tattoos.response.length === 0 && (
                  <div
                    className="no-results-message"
                    style={{
                      width: "100%",
                      textAlign: "center",
                      padding: "2rem",
                      color: "white",
                      fontSize: "1.1rem",
                      lineHeight: "1.6",
                    }}
                  >
                    <h3 style={{ marginBottom: "1rem", color: "white" }}>
                      No results found for your search
                    </h3>
                  </div>
                )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {tattoos &&
                  tattoos.response &&
                  Array.isArray(tattoos.response) &&
                  tattoos.response.length > 0 &&
                  tattoos.response.map((tattoo) => (
                    <TattooCard 
                      key={tattoo.id} 
                      tattoo={tattoo} 
                      onTattooClick={handleTattooClick}
                    />
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Tattoo Modal */}
      {isCreateModalOpen && (
        <TattooCreateWizard
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            // Refresh the tattoos list
            window.location.reload();
          }}
        />
      )}

      <TattooModal
        tattooId={selectedTattooId}
        open={isTattooModalOpen}
        onClose={handleCloseTattooModal}
        currentUser={me}
        tattooFavorite={selectedTattooId ? getTattooFavoriteStatus(selectedTattooId) : false}
        artistFavorite={getCurrentTattoo()?.artist?.id ? getArtistFollowStatus(getCurrentTattoo().artist.id) : false}
      />
    </Layout>
  );
}
