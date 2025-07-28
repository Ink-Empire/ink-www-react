import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import TattooCard from "../components/TattooCard";
import SearchFilters from "../components/SearchFilters";
import ActiveFilterBadges from "../components/ActiveFilterBadges";
import LogoText from "../components/LogoText";
import Layout from "../components/Layout";
import TattooCreateWizard from "../components/TattooCreateWizard";
import { useTattoos } from "../hooks";
import { useUserData } from "@/contexts/UserContext";
import { distancePreferences } from "@/utils/distancePreferences";

export default function Home() {
  const me = useUserData();
  const router = useRouter();
  const { studio_id } = router.query;

  // State for studio name (for filter display)
  const [studioName, setStudioName] = useState<string>("");

  // State for Create Tattoo modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // State to track dismissed styles (to prevent them from returning)
  const [dismissedStyles, setDismissedStyles] = useState<number[]>([]);
  
  // State to track if user has dismissed distance/location (to prevent reset to defaults)
  const [hasUserDismissedDistance, setHasUserDismissedDistance] = useState(false);

  // Initialize with user preferences - respecting distance dismissal
  const initialSearchParams = useMemo(() => {
    const getInitialStyles = () => {
      if (!me?.styles) return [];
      // Filter out any previously dismissed styles
      return me.styles.filter(style => !dismissedStyles.includes(style.id || style));
    };

    const locationSettings = distancePreferences.getDefaultLocationSettings(!!me?.location_lat_long);

    return {
      searchString: "",
      styles: getInitialStyles(),
      ...locationSettings,
      distanceUnit: "mi",
      subject: "tattoos",
      studio_id: studio_id || undefined,
    };
  }, [me?.styles, me?.location_lat_long, dismissedStyles, studio_id]);

  const [searchParams, setSearchParams] =
    useState<Record<string, any>>(initialSearchParams);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const { tattoos, loading, error } = useTattoos(searchParams);

  // Update search params when user data changes or dismissed styles change
  useEffect(() => {
    if (me?.styles) {
      const filteredStyles = me.styles.filter(style => !dismissedStyles.includes(style.id || style));
      if (filteredStyles.length !== searchParams.styles.length || 
          !filteredStyles.every(style => searchParams.styles.includes(style.id || style))) {
        setSearchParams(prev => ({
          ...prev,
          styles: filteredStyles,
          // Preserve location settings if user has dismissed distance
          ...(hasUserDismissedDistance && {
            useAnyLocation: true,
            useMyLocation: false,
            location: ''
          })
        }));
      }
    }
  }, [me?.styles, dismissedStyles, hasUserDismissedDistance]);

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

  // Handle filter changes from SearchFilters component
  const handleFilterChange = (filters: {
    searchString: string;
    styles: number[];
    distance: number;
    distanceUnit?: "mi" | "km";
    location?: string;
    useMyLocation?: boolean;
    useAnyLocation?: boolean;
    locationCoords?: { lat: number; lng: number };
  }) => {
    // Build new params object
    const newParams: Record<string, any> = {
      searchString: filters.searchString,
      styles: filters?.styles || [],
      distance: filters.distance,
      distanceUnit: filters.distanceUnit,
      location: filters.location,
      useMyLocation: filters.useMyLocation,
      useAnyLocation: filters.useAnyLocation,
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
        <div
          className={`transition-all duration-300 ${
            sidebarExpanded ? "pl-16 md:pl-64" : "pl-16"
          }`}
        >
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
              location: initialSearchParams.location,
            }}
            currentFilters={{
              searchString: searchParams.searchString,
              styles: searchParams.styles,
              distance: searchParams.distance,
              distanceUnit: searchParams.distanceUnit,
              useMyLocation: searchParams.useMyLocation,
              useAnyLocation: searchParams.useAnyLocation,
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
                locationCoords: newParams.locationCoords,
                subject: "tattoos",
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
                locationCoords: newParams.locationCoords,
                subject: "tattoos",
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
              <div className="artist-grid">
                {tattoos &&
                  tattoos.response &&
                  Array.isArray(tattoos.response) &&
                  tattoos.response.length > 0 &&
                  tattoos.response.map((tattoo) => (
                    <TattooCard key={tattoo.id} tattoo={tattoo} />
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
    </Layout>
  );
}
