import React, { useEffect, useRef, useState } from 'react';
import { Navigation } from 'lucide-react';

/**
 * CustomerDeliveryMap — Premium Swiggy/Zomato-style full-screen delivery map.
 * - Warm muted map style (cream tones, clean roads)
 * - Solid animated gradient route line (no dashes)
 * - Premium pill-shaped markers (restaurant, home, rider)
 * - Pulsing rider dot with live GPS ring
 * - Zero emojis — clean text-only labels
 */

const PERSIAN_DARBAR_COORDS = { lat: 18.5138, lng: 73.8785 };
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyCX4YYM60Z0IXcdC3zNB7YamsoafDfmbxo';

// Warm muted map style — Swiggy/Uber Eats inspired
const PREMIUM_MAP_STYLES = [
  { featureType: 'all', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }, { fontSize: '11' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f2ede4' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#eae5db' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e8e0d0' }, { weight: 0.5 }] },
  { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#f5e6c8' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#e8d5a3' }, { weight: 1 }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#8a7a5a' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#b3d4f0' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#7ab0d4' }] },
  { featureType: 'park', elementType: 'geometry', stylers: [{ color: '#d6e8c0' }] },
  { featureType: 'park', elementType: 'geometry.stroke', stylers: [{ color: '#c8ddb0' }] },
];

// Singleton script loader
let googleMapsLoadPromise = null;
const loadGoogleMapsScript = () => {
  if (googleMapsLoadPromise) return googleMapsLoadPromise;
  googleMapsLoadPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.Map) { resolve(window.google.maps); return; }
    if (!GOOGLE_MAPS_API_KEY) { reject(new Error('API key missing')); return; }
    const cbName = `__gmaps_cb_${Date.now()}`;
    window[cbName] = () => { resolve(window.google.maps); delete window[cbName]; };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&loading=async&callback=${cbName}`;
    script.async = true;
    script.defer = true;
    script.onerror = (e) => { googleMapsLoadPromise = null; reject(e); };
    document.head.appendChild(script);
  });
  return googleMapsLoadPromise;
};

// Smooth animated position transition for rider marker
function animateMarkerTo(marker, newPos, durationMs = 900) {
  if (!marker || !window.google?.maps?.geometry) {
    marker?.setPosition(newPos);
    return;
  }
  const startPos = marker.getPosition();
  if (!startPos) { marker.setPosition(newPos); return; }
  const start = Date.now();
  const startLat = startPos.lat();
  const startLng = startPos.lng();
  const dLat = newPos.lat - startLat;
  const dLng = newPos.lng - startLng;
  const tick = () => {
    const elapsed = Date.now() - start;
    const t = Math.min(1, elapsed / durationMs);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - t, 3);
    marker.setPosition({ lat: startLat + dLat * eased, lng: startLng + dLng * eased });
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// Sleek teardrop restaurant marker SVG (No bulky cards)
const makeRestaurantIcon = () => ({
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="80" height="66" viewBox="0 0 80 66">
      <defs>
        <filter id="shadow-r" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#00000035"/>
        </filter>
      </defs>
      <!-- Teardrop Pin Body -->
      <path d="M40 2 C28 2 18 12 18 24 C18 37 37 49 40 51 C43 49 62 37 62 24 C62 12 52 2 40 2 Z" fill="#E40000" filter="url(#shadow-r)"/>
      <!-- Inner white disc -->
      <circle cx="40" cy="23" r="12" fill="white"/>
      <!-- Cutlery icon -->
      <path d="M36 17 v5 a2 2 0 0 0 2 2 v5 h1.5 v-5 a2 2 0 0 0 2 -2 v-5 h-1 v3 h-1 v-3 h-1 v3 h-1 v-3 z M43 17 c0 2.5 -0.8 4 -0.8 6 v6 h1.5 v-6 c0 -2 1 -3.5 1 -6 z" fill="#E40000"/>
      <!-- Compact text label underneath -->
      <rect x="5" y="52" width="70" height="13" rx="6.5" fill="#111827" opacity="0.95"/>
      <text x="40" y="61.5" font-family="'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif" font-size="7.5" font-weight="700" fill="white" text-anchor="middle">Persian Darbar</text>
    </svg>`),
  scaledSize: { width: 80, height: 66 },
  anchor: { x: 40, y: 51 },
});

// Sleek teardrop home marker SVG (No bulky cards)
const makeHomeIcon = () => ({
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="64" viewBox="0 0 60 64">
      <defs>
        <filter id="shadow-h" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" flood-color="#00000040"/>
        </filter>
      </defs>
      <!-- Teardrop Pin Body -->
      <path d="M30 2 C19 2 10 11 10 22 C10 34 27 45 30 47 C33 45 50 34 50 22 C50 11 41 2 30 2 Z" fill="#111827" filter="url(#shadow-h)"/>
      <!-- Inner white disc -->
      <circle cx="30" cy="21" r="11" fill="white"/>
      <!-- House icon -->
      <path d="M30 14 L22 20.5 v7.5 a1 1 0 0 0 1 1 h4 v-5 h6 v5 h4 a1 1 0 0 0 1 -1 v-7.5 Z" fill="#111827"/>
      <!-- Compact text label underneath -->
      <rect x="12" y="48" width="36" height="13" rx="6.5" fill="#111827" opacity="0.95"/>
      <text x="30" y="57.5" font-family="'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif" font-size="7.5" font-weight="700" fill="white" text-anchor="middle">Home</text>
    </svg>`),
  scaledSize: { width: 60, height: 64 },
  anchor: { x: 30, y: 47 },
});

// Rider marker SVG — white circle with pulsing ring, name label
const makeRiderIcon = (isLive, name) => {
  const displayName = name ? (name.split(' ')[0]) : 'Rider';
  const nameWidth = Math.min(90, Math.max(60, displayName.length * 7 + 20));
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${nameWidth + 10}" height="68" viewBox="0 0 ${nameWidth + 10} 68">
        <defs>
          <filter id="rshadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${isLive ? '#10B98150' : '#E4000050'}"/>
          </filter>
        </defs>
        <!-- outer pulse ring -->
        <circle cx="${(nameWidth + 10) / 2}" cy="22" r="20" fill="${isLive ? '#10B98120' : '#E4000018'}" stroke="${isLive ? '#10B981' : '#E40000'}" stroke-width="1.5" stroke-opacity="0.5"/>
        <!-- white circle background -->
        <circle cx="${(nameWidth + 10) / 2}" cy="22" r="14" fill="white" filter="url(#rshadow)" stroke="${isLive ? '#10B981' : '#E40000'}" stroke-width="2"/>
        <!-- bike icon path -->
        <g transform="translate(${(nameWidth + 10) / 2 - 8}, 14)">
          <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2m-4 1-4 4-2-2-3 3" stroke="${isLive ? '#10B981' : '#E40000'}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="4" cy="12" r="2.5" stroke="${isLive ? '#10B981' : '#E40000'}" stroke-width="1.4" fill="none"/>
          <circle cx="13" cy="12" r="2.5" stroke="${isLive ? '#10B981' : '#E40000'}" stroke-width="1.4" fill="none"/>
        </g>
        <!-- name label pill -->
        <rect x="5" y="42" width="${nameWidth}" height="22" rx="8" fill="${isLive ? '#111827' : '#1F2937'}" />
        <text x="${(nameWidth + 10) / 2}" y="57" font-family="'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif" font-size="9.5" font-weight="700" fill="white" text-anchor="middle">${displayName}</text>
        ${isLive ? `<circle cx="${nameWidth - 2}" cy="47" r="4" fill="#10B981"/>` : ''}
      </svg>`),
    scaledSize: { width: nameWidth + 10, height: 68 },
    anchor: { x: (nameWidth + 10) / 2, y: 22 },
  };
};

export const CustomerDeliveryMap = ({ order, eta, isExpanded, onToggleExpand }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const restaurantMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const travelledPolylineRef = useRef(null);
  const cachedRoadPathRef = useRef([]);
  const [mapsError, setMapsError] = useState(false);
  const [mapsReady, setMapsReady] = useState(!!window.google?.maps?.Map);
  const prevRiderPosRef = useRef(null);

  const branchCoords = order?.branch_coords
    ? { lat: order.branch_coords[0], lng: order.branch_coords[1] }
    : PERSIAN_DARBAR_COORDS;

  const distKm = parseFloat(order?.distance_km || eta?.distKm || 3.5);
  const customerCoords = order?.customer_coords
    ? { lat: order.customer_coords[0], lng: order.customer_coords[1] }
    : { lat: branchCoords.lat - distKm * 0.0065, lng: branchCoords.lng + distKm * 0.0055 };

  const status = order?.status || 'placed';
  const isOutForDelivery = status === 'out_for_delivery';
  const isReady = status === 'ready';
  const riderName = order?.delivery_partner_name || order?.porter_rider_name || order?.assigned_rider_name;
  const hasAssignedRider = Boolean(
    order?.delivery_partner_name || order?.delivery_partner_id || order?.delivery_partner ||
    order?.porter_order_id || order?.assigned_rider || isReady || isOutForDelivery
  );

  let progress = 0.08;
  if (isReady) progress = 0.22;
  else if (isOutForDelivery) progress = 0.65;

  const liveLat = order?.rider_lat != null ? parseFloat(order.rider_lat) : null;
  const liveLng = order?.rider_lng != null ? parseFloat(order.rider_lng) : null;
  const hasLiveGps = liveLat !== null && liveLng !== null && !isNaN(liveLat) && !isNaN(liveLng);

  const riderPos = hasLiveGps
    ? { lat: liveLat, lng: liveLng }
    : {
      lat: branchCoords.lat + (customerCoords.lat - branchCoords.lat) * progress,
      lng: branchCoords.lng + (customerCoords.lng - branchCoords.lng) * progress,
    };

  // Load Google Maps SDK
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setMapsReady(true))
      .catch(() => setMapsError(true));
  }, []);

  // Initialize map & fetch real driving road route via DirectionsService
  useEffect(() => {
    if (!mapsReady || !mapContainerRef.current) return;
    const gm = window.google.maps;

    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
      restaurantMarkerRef.current = null;
      customerMarkerRef.current = null;
      riderMarkerRef.current = null;
      routePolylineRef.current = null;
      travelledPolylineRef.current = null;
      cachedRoadPathRef.current = [];
    }

    try {
      // greedy gestureHandling enables 1-finger smooth scrolling & panning
      const map = new gm.Map(mapContainerRef.current, {
        center: branchCoords,
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        gestureHandling: 'greedy',
        styles: PREMIUM_MAP_STYLES,
      });
      mapInstanceRef.current = map;

      // Sleek restaurant teardrop pin
      restaurantMarkerRef.current = new gm.Marker({
        position: branchCoords,
        map,
        icon: makeRestaurantIcon(),
        zIndex: 15,
        title: 'Persian Darbar',
      });

      // Sleek customer/home teardrop pin
      customerMarkerRef.current = new gm.Marker({
        position: customerCoords,
        map,
        icon: makeHomeIcon(),
        zIndex: 15,
        title: 'Delivery Address',
      });

      // Full road route — light grey background path along actual city streets
      routePolylineRef.current = new gm.Polyline({
        path: [branchCoords, customerCoords],
        geodesic: true,
        strokeColor: '#D1C4A8',
        strokeOpacity: 0.75,
        strokeWeight: 4,
        map,
      });

      // "Travelled" portion — solid vibrant delivery orange/red line
      travelledPolylineRef.current = new gm.Polyline({
        path: [branchCoords, riderPos],
        geodesic: true,
        strokeColor: '#E84318',
        strokeOpacity: 1,
        strokeWeight: 5,
        map,
      });

      // Fetch true driving directions along Pune streets (Zomato/Swiggy style)
      try {
        const directionsService = new gm.DirectionsService();
        directionsService.route(
          {
            origin: branchCoords,
            destination: customerCoords,
            travelMode: gm.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === gm.DirectionsStatus.OK && result?.routes?.[0]?.overview_path) {
              const roadPath = result.routes[0].overview_path;
              cachedRoadPathRef.current = roadPath;
              routePolylineRef.current?.setPath(roadPath);

              // Calculate travelled segment on the real road
              const targetIndex = Math.min(
                roadPath.length - 1,
                Math.max(1, Math.floor(roadPath.length * progress))
              );
              const travelled = roadPath.slice(0, targetIndex + 1);
              travelledPolylineRef.current?.setPath(travelled);

              // Snap rider marker position directly onto the street
              if (hasAssignedRider && riderMarkerRef.current) {
                const snapped = hasLiveGps ? riderPos : roadPath[targetIndex];
                riderMarkerRef.current.setPosition(snapped);
              }

              // Fit bounds to the road route
              const bounds = new gm.LatLngBounds();
              roadPath.forEach(pt => bounds.extend(pt));
              map.fitBounds(bounds, { top: 80, bottom: 40, left: 40, right: 40 });
            }
          }
        );
      } catch (dirErr) {
        console.warn('DirectionsService route warning:', dirErr);
      }

      // Initial bounds fit
      const bounds = new gm.LatLngBounds();
      bounds.extend(branchCoords);
      bounds.extend(customerCoords);
      map.fitBounds(bounds, { top: 80, bottom: 40, left: 40, right: 40 });
    } catch (err) {
      console.error('Map init error:', err);
    }
  }, [mapsReady, branchCoords.lat, branchCoords.lng, customerCoords.lat, customerCoords.lng]);

  // Update rider marker + travelled line on GPS / progress change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapsReady) return;
    const gm = window.google.maps;

    // Determine best position along actual road route if GPS not available
    let effectivePos = riderPos;
    if (!hasLiveGps && cachedRoadPathRef.current.length > 0) {
      const roadPath = cachedRoadPathRef.current;
      const targetIndex = Math.min(
        roadPath.length - 1,
        Math.max(1, Math.floor(roadPath.length * progress))
      );
      effectivePos = roadPath[targetIndex];

      // Update travelled polyline along the road
      if (travelledPolylineRef.current) {
        travelledPolylineRef.current.setPath(roadPath.slice(0, targetIndex + 1));
      }
    } else if (travelledPolylineRef.current) {
      travelledPolylineRef.current.setPath([branchCoords, riderPos]);
    }

    if (hasAssignedRider) {
      if (!riderMarkerRef.current) {
        riderMarkerRef.current = new gm.Marker({
          position: effectivePos,
          map,
          icon: makeRiderIcon(hasLiveGps, riderName),
          zIndex: 25,
          title: riderName || 'Delivery Rider',
        });
        prevRiderPosRef.current = effectivePos;
      } else {
        animateMarkerTo(riderMarkerRef.current, effectivePos, 1000);
        riderMarkerRef.current.setIcon(makeRiderIcon(hasLiveGps, riderName));
        prevRiderPosRef.current = effectivePos;
      }
    } else {
      if (riderMarkerRef.current) {
        riderMarkerRef.current.setMap(null);
        riderMarkerRef.current = null;
      }
    }
  }, [hasAssignedRider, riderPos.lat, riderPos.lng, riderName, hasLiveGps, mapsReady, progress]);

  // Recenter map bounds
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps) return;
    const gm = window.google.maps;
    const bounds = new gm.LatLngBounds();
    if (cachedRoadPathRef.current && cachedRoadPathRef.current.length > 0) {
      cachedRoadPathRef.current.forEach(pt => bounds.extend(pt));
    } else {
      bounds.extend(branchCoords);
      bounds.extend(customerCoords);
    }
    if (hasAssignedRider) bounds.extend(riderPos);
    map.fitBounds(bounds, { top: 80, bottom: 40, left: 40, right: 40 });
  };

  // Resize on expand/collapse
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapsReady) return;
    const gm = window.google.maps;
    setTimeout(() => {
      gm.event.trigger(map, 'resize');
      const bounds = new gm.LatLngBounds();
      if (cachedRoadPathRef.current && cachedRoadPathRef.current.length > 0) {
        cachedRoadPathRef.current.forEach(pt => bounds.extend(pt));
      } else {
        bounds.extend(branchCoords);
        bounds.extend(customerCoords);
      }
      if (hasAssignedRider) bounds.extend(riderPos);
      map.fitBounds(bounds, { top: 80, bottom: 40, left: 40, right: 40 });
    }, 300);
  }, [isExpanded, mapsReady]);

  return (
    <div
      className="relative w-full h-full min-h-[280px] overflow-hidden select-none"
      style={{ touchAction: 'pan-x pan-y' }}
    >
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full bg-[#F2EDE4]" />

      {/* Loading shimmer */}
      {!mapsReady && !mapsError && (
        <div className="absolute inset-0 bg-[#F2EDE4] animate-pulse z-20" />
      )}

      {/* Error fallback */}
      {mapsError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F2EDE4] z-20">
          <Navigation className="w-8 h-8 text-neutral-400 mb-2" />
          <p className="text-neutral-500 text-xs font-semibold text-center px-6">
            Map unavailable. Check your internet connection.
          </p>
        </div>
      )}

      {/* Bottom-left: Distance pill */}
      {eta && !eta.isDelayed && (
        <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-neutral-200/80 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#E84318]" />
          <span className="text-[11px] font-bold text-neutral-800">{distKm} km from you</span>
        </div>
      )}

      {/* Bottom-right: Swiggy/Zomato style target re-center button */}
      <button
        type="button"
        onClick={handleRecenter}
        className="absolute bottom-4 right-4 z-20 w-10 h-10 rounded-full bg-white shadow-lg border border-black/10 flex items-center justify-center text-neutral-800 active:scale-90 transition-transform cursor-pointer"
        title="Re-center map"
        aria-label="Re-center map"
      >
        <Navigation className="w-4 h-4 text-[#E40000] rotate-45" />
      </button>
    </div>
  );
};

export default CustomerDeliveryMap;
