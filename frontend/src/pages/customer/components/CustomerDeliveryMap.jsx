import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

/**
 * CustomerDeliveryMap
 * Google Maps powered live order & rider tracking map.
 * - Uses Google Maps JavaScript API (styled, smooth, satellite-quality tiles).
 * - Loads Google Maps dynamically to prevent URI malformed error.
 * - Live GPS coordinates from rider's phone or smart route fallback.
 * - Works on Web, iOS native (Capacitor), and Android native (Capacitor).
 */

const PERSIAN_DARBAR_COORDS = { lat: 18.5138, lng: 73.8785 };
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

// Singleton loader — loads Google Maps script only once across the app
let googleMapsLoadPromise = null;
const loadGoogleMapsScript = () => {
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    // Already loaded
    if (window.google?.maps?.Map) {
      resolve(window.google.maps);
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error('Google Maps API key missing'));
      return;
    }

    const callbackName = `__gmaps_cb_${Date.now()}`;
    window[callbackName] = () => {
      resolve(window.google.maps);
      delete window[callbackName];
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = (e) => {
      googleMapsLoadPromise = null; // allow retry
      reject(e);
    };
    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
};

export const CustomerDeliveryMap = ({
  order,
  eta,
  isExpanded,
  onToggleExpand,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const restaurantMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const [mapsError, setMapsError] = useState(false);
  const [mapsReady, setMapsReady] = useState(!!window.google?.maps?.Map);

  // Branch coordinates or default to Camp, Pune
  const branchCoords = order?.branch_coords
    ? { lat: order.branch_coords[0], lng: order.branch_coords[1] }
    : PERSIAN_DARBAR_COORDS;

  // Calculate realistic customer coords based on distance_km
  const distKm = parseFloat(order?.distance_km || eta?.distKm || 3.5);
  const customerCoords = order?.customer_coords
    ? { lat: order.customer_coords[0], lng: order.customer_coords[1] }
    : {
        lat: branchCoords.lat - distKm * 0.0065,
        lng: branchCoords.lng + distKm * 0.0055,
      };

  const status = order?.status || 'placed';
  const isOutForDelivery = status === 'out_for_delivery';
  const isReady = status === 'ready';

  const riderName =
    order?.delivery_partner_name ||
    order?.porter_rider_name ||
    order?.assigned_rider_name;
  const hasAssignedRider = Boolean(
    order?.delivery_partner_name ||
      order?.delivery_partner_id ||
      order?.delivery_partner ||
      order?.porter_order_id ||
      order?.assigned_rider ||
      isReady ||
      isOutForDelivery
  );

  let progress = 0.08;
  if (isReady) progress = 0.22;
  else if (isOutForDelivery) progress = 0.65;

  const liveLat =
    order?.rider_lat != null ? parseFloat(order.rider_lat) : null;
  const liveLng =
    order?.rider_lng != null ? parseFloat(order.rider_lng) : null;
  const hasLiveGps =
    liveLat !== null && liveLng !== null && !isNaN(liveLat) && !isNaN(liveLng);

  const riderPos = hasLiveGps
    ? { lat: liveLat, lng: liveLng }
    : {
        lat:
          branchCoords.lat +
          (customerCoords.lat - branchCoords.lat) * progress,
        lng:
          branchCoords.lng +
          (customerCoords.lng - branchCoords.lng) * progress,
      };

  // Load Google Maps SDK once
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setMapsReady(true))
      .catch((err) => {
        console.error('Google Maps load error:', err);
        setMapsError(true);
      });
  }, []);

  // Build SVG data URI for custom markers (avoids AdvancedMarkerElement compatibility issues)
  const makeRestaurantIcon = () => ({
    url:
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="44" height="56" viewBox="0 0 44 56">
        <rect x="4" y="4" width="36" height="36" rx="10" fill="#E40000" stroke="white" stroke-width="2.5"/>
        <path d="M14 24.87A4 4 0 0 1 15.41 17a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 24.59 17 4 4 0 0 1 26 24.87V32H14Z" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="14" y1="28" x2="26" y2="28" stroke="white" stroke-width="2.2" stroke-linecap="round"/>
        <rect x="4" y="42" width="36" height="12" rx="5" fill="#111827"/>
        <text x="22" y="52" font-family="Arial,sans-serif" font-size="7.5" font-weight="800" fill="white" text-anchor="middle">Persian Darbar</text>
      </svg>`),
    scaledSize: { width: 44, height: 56 },
    anchor: { x: 22, y: 56 },
  });

  const makeCustomerIcon = () => ({
    url:
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="42" height="54" viewBox="0 0 42 54">
        <rect x="3" y="3" width="36" height="36" rx="10" fill="#111827" stroke="white" stroke-width="2.5"/>
        <path d="M21 8l9 7v11a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V15Z" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="18,42 18,32 24,32 24,42" stroke="white" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="3" y="41" width="36" height="12" rx="5" fill="white" stroke="#E5E7EB" stroke-width="1"/>
        <text x="21" y="51" font-family="Arial,sans-serif" font-size="7.5" font-weight="800" fill="#111827" text-anchor="middle">Your Doorstep</text>
      </svg>`),
    scaledSize: { width: 42, height: 54 },
    anchor: { x: 21, y: 54 },
  });

  const makeRiderIcon = (live, name) => ({
    url:
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" fill="${live ? '#10B981' : '#E40000'}" opacity="0.25"/>
        <circle cx="24" cy="24" r="16" fill="white" stroke="${live ? '#10B981' : '#E40000'}" stroke-width="2.5"/>
        <circle cx="34" cy="33" r="4" stroke="${live ? '#10B981' : '#E40000'}" stroke-width="2" fill="none"/>
        <circle cx="13" cy="33" r="4" stroke="${live ? '#10B981' : '#E40000'}" stroke-width="2" fill="none"/>
        <circle cx="29" cy="13" r="2" stroke="${live ? '#10B981' : '#E40000'}" stroke-width="1.5" fill="none"/>
        <path d="M24 33V27l-4-4 5-4 3 4h3" stroke="${live ? '#10B981' : '#E40000'}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`),
    scaledSize: { width: 48, height: 48 },
    anchor: { x: 24, y: 24 },
  });

  // Initialize Google Map
  useEffect(() => {
    if (!mapsReady || !mapContainerRef.current) return;

    const gm = window.google.maps;

    // Destroy previous instance
    if (mapInstanceRef.current) {
      // Google Maps does not need explicit destroy for simple cleanup
      mapInstanceRef.current = null;
      restaurantMarkerRef.current = null;
      customerMarkerRef.current = null;
      riderMarkerRef.current = null;
      polylineRef.current = null;
    }

    try {
      // Google Maps styled — clean light style
      const map = new gm.Map(mapContainerRef.current, {
        center: branchCoords,
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        gestureHandling: 'cooperative',
        styles: [
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          {
            featureType: 'transit',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }],
          },
          {
            featureType: 'road.arterial',
            elementType: 'geometry',
            stylers: [{ color: '#ffd9d9' }],
          },
          {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [{ color: '#ffb3b3' }],
          },
          {
            featureType: 'landscape',
            stylers: [{ color: '#f5f5f5' }],
          },
          {
            featureType: 'water',
            stylers: [{ color: '#c9e8ff' }],
          },
        ],
      });

      mapInstanceRef.current = map;

      // Restaurant marker
      restaurantMarkerRef.current = new gm.Marker({
        position: branchCoords,
        map,
        icon: makeRestaurantIcon(),
        zIndex: 10,
      });

      // Customer marker
      customerMarkerRef.current = new gm.Marker({
        position: customerCoords,
        map,
        icon: makeCustomerIcon(),
        zIndex: 10,
      });

      // Dashed route polyline
      polylineRef.current = new gm.Polyline({
        path: [branchCoords, customerCoords],
        geodesic: true,
        strokeColor: '#E40000',
        strokeOpacity: 0,
        icons: [
          {
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 0.85,
              scale: 3.5,
              strokeColor: '#E40000',
            },
            offset: '0',
            repeat: '16px',
          },
        ],
        map,
      });

      // Fit bounds
      const bounds = new gm.LatLngBounds();
      bounds.extend(branchCoords);
      bounds.extend(customerCoords);
      map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    } catch (err) {
      console.error('Google Map init error:', err);
    }
  }, [
    mapsReady,
    branchCoords.lat,
    branchCoords.lng,
    customerCoords.lat,
    customerCoords.lng,
  ]);

  // Manage rider marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapsReady) return;

    const gm = window.google.maps;

    if (hasAssignedRider) {
      if (!riderMarkerRef.current) {
        riderMarkerRef.current = new gm.Marker({
          position: riderPos,
          map,
          icon: makeRiderIcon(hasLiveGps, riderName),
          zIndex: 20,
          title: riderName || 'Delivery Rider',
        });
      } else {
        riderMarkerRef.current.setPosition(riderPos);
        riderMarkerRef.current.setIcon(makeRiderIcon(hasLiveGps, riderName));
      }
    } else {
      if (riderMarkerRef.current) {
        riderMarkerRef.current.setMap(null);
        riderMarkerRef.current = null;
      }
    }
  }, [hasAssignedRider, riderPos.lat, riderPos.lng, riderName, hasLiveGps, mapsReady]);

  // Handle expand/collapse resize
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapsReady) return;
    const gm = window.google.maps;
    setTimeout(() => {
      gm.event.trigger(map, 'resize');
      const bounds = new gm.LatLngBounds();
      bounds.extend(branchCoords);
      bounds.extend(customerCoords);
      map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    }, 280);
  }, [isExpanded, mapsReady]);

  return (
    <div
      className={`mx-4 rounded-3xl overflow-hidden border border-neutral-200/80 shadow-md relative transition-all duration-300 ${
        isExpanded ? 'h-[360px]' : 'h-[210px]'
      }`}
    >
      {/* Map DOM Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full z-0 bg-[#F4F5F7]"
      />

      {/* Error fallback */}
      {mapsError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 z-20">
          <span className="text-3xl mb-2">🗺️</span>
          <p className="text-neutral-600 text-xs font-semibold text-center px-4">
            Map unavailable. Check your internet connection.
          </p>
        </div>
      )}

      {/* Loading shimmer */}
      {!mapsReady && !mapsError && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse z-20" />
      )}

      {/* GPS Status Indicator */}
      {hasLiveGps ? (
        <div className="absolute top-3 left-3 z-10 bg-emerald-600/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm text-white flex items-center gap-1.5 text-[10px] font-black tracking-wide border border-emerald-500/40">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          <span>Live Rider GPS ({riderName || 'Rider'})</span>
        </div>
      ) : hasAssignedRider ? (
        <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-neutral-200 flex items-center gap-1.5 text-[10px] font-black text-neutral-800">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Rider Assigned: {riderName || 'Fleet Partner'}</span>
        </div>
      ) : isOutForDelivery ? (
        <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-neutral-200 flex items-center gap-1.5 text-[10px] font-black text-neutral-700">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span>On the Way</span>
        </div>
      ) : null}

      {/* Map Expand/Collapse Button */}
      <button
        onClick={onToggleExpand}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/95 text-neutral-700 shadow-md flex items-center justify-center active:scale-90 transition-all cursor-pointer border border-neutral-200 hover:bg-white"
        title={isExpanded ? 'Collapse Map' : 'Expand Map'}
      >
        {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* Live Distance Pill */}
      {eta && !eta.isDelayed && (
        <div className="absolute bottom-3 right-3 z-10 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm border border-neutral-200 flex items-center gap-1.5 text-[10px] font-black text-neutral-800">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span>{distKm} km from you</span>
        </div>
      )}
    </div>
  );
};

export default CustomerDeliveryMap;
