import React, { useEffect, useRef, useState } from 'react';
import { Minimize2, Maximize2, Navigation } from 'lucide-react';

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

// Premium restaurant marker SVG — white pill card, left red accent bar
const makeRestaurantIcon = () => ({
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="130" height="44" viewBox="0 0 130 44">
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#00000028"/>
      </filter>
      <rect x="2" y="2" width="126" height="40" rx="10" fill="white" filter="url(#shadow)"/>
      <rect x="2" y="2" width="5" height="40" rx="3" fill="#E40000"/>
      <text x="18" y="16" font-family="'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif" font-size="11" font-weight="700" fill="#111827">Persian Darbar</text>
      <text x="18" y="30" font-family="'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif" font-size="9" font-weight="500" fill="#6B7280">Restaurant</text>
      <circle cx="110" cy="22" r="10" fill="#FEE2E2"/>
      <path d="M110 16a2.5 2.5 0 0 1 0 5 2.5 2.5 0 0 1 0-5zm0 7c-2.67 0-8 1.34-8 4v1h16v-1c0-2.66-5.33-4-8-4z" fill="#E40000" transform="scale(0.7) translate(72,8)"/>
    </svg>`),
  scaledSize: { width: 130, height: 44 },
  anchor: { x: 10, y: 44 },
});

// Premium home marker SVG — dark charcoal pill
const makeHomeIcon = () => ({
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="90" height="40" viewBox="0 0 90 40">
      <filter id="shadow2" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#00000040"/>
      </filter>
      <rect x="2" y="2" width="86" height="36" rx="10" fill="#111827" filter="url(#shadow2)"/>
      <text x="45" y="15" font-family="'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif" font-size="9" font-weight="600" fill="#9CA3AF" text-anchor="middle">YOUR LOCATION</text>
      <text x="45" y="29" font-family="'SF Pro Display',-apple-system,BlinkMacSystemFont,sans-serif" font-size="11" font-weight="700" fill="white" text-anchor="middle">Home</text>
    </svg>`),
  scaledSize: { width: 90, height: 40 },
  anchor: { x: 45, y: 40 },
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

  // Initialize map
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
    }

    try {
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
        styles: PREMIUM_MAP_STYLES,
      });
      mapInstanceRef.current = map;

      // Restaurant marker
      restaurantMarkerRef.current = new gm.Marker({
        position: branchCoords,
        map,
        icon: makeRestaurantIcon(),
        zIndex: 10,
      });

      // Customer/home marker
      customerMarkerRef.current = new gm.Marker({
        position: customerCoords,
        map,
        icon: makeHomeIcon(),
        zIndex: 10,
      });

      // Full route — light grey background line (Swiggy style shows full path in grey)
      routePolylineRef.current = new gm.Polyline({
        path: [branchCoords, customerCoords],
        geodesic: true,
        strokeColor: '#D1C4A8',
        strokeOpacity: 0.7,
        strokeWeight: 4,
        map,
      });

      // "Travelled" portion — orange/red solid line from restaurant toward rider
      travelledPolylineRef.current = new gm.Polyline({
        path: [branchCoords, riderPos],
        geodesic: true,
        strokeColor: '#E84318',
        strokeOpacity: 1,
        strokeWeight: 5,
        map,
      });

      // Fit all 3 points
      const bounds = new gm.LatLngBounds();
      bounds.extend(branchCoords);
      bounds.extend(customerCoords);
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 40, right: 40 });
    } catch (err) {
      console.error('Map init error:', err);
    }
  }, [mapsReady, branchCoords.lat, branchCoords.lng, customerCoords.lat, customerCoords.lng]);

  // Update rider marker + travelled line on GPS change
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
        prevRiderPosRef.current = riderPos;
      } else {
        // Smooth animated transition for rider
        animateMarkerTo(riderMarkerRef.current, riderPos, 1000);
        riderMarkerRef.current.setIcon(makeRiderIcon(hasLiveGps, riderName));
        prevRiderPosRef.current = riderPos;
      }

      // Update travelled line (orange segment from restaurant to current rider pos)
      if (travelledPolylineRef.current) {
        travelledPolylineRef.current.setPath([branchCoords, riderPos]);
      }
    } else {
      if (riderMarkerRef.current) {
        riderMarkerRef.current.setMap(null);
        riderMarkerRef.current = null;
      }
    }
  }, [hasAssignedRider, riderPos.lat, riderPos.lng, riderName, hasLiveGps, mapsReady]);

  // Resize on expand/collapse
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapsReady) return;
    const gm = window.google.maps;
    setTimeout(() => {
      gm.event.trigger(map, 'resize');
      const bounds = new gm.LatLngBounds();
      bounds.extend(branchCoords);
      bounds.extend(customerCoords);
      if (hasAssignedRider) bounds.extend(riderPos);
      map.fitBounds(bounds, { top: 60, bottom: 60, left: 40, right: 40 });
    }, 300);
  }, [isExpanded, mapsReady]);

  return (
    <div
      className="relative overflow-hidden transition-all duration-500 ease-out"
      style={{ height: isExpanded ? '72vh' : '56vw', maxHeight: isExpanded ? '520px' : '260px' }}
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

      {/* Top-left: GPS status pill */}
      <div className="absolute top-3 left-3 z-10">
        {hasLiveGps ? (
          <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-white text-[10px] font-bold tracking-wide">
              Live GPS {riderName ? `· ${riderName.split(' ')[0]}` : ''}
            </span>
          </div>
        ) : hasAssignedRider ? (
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md flex items-center gap-2 border border-neutral-200/80">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-neutral-800 text-[10px] font-bold tracking-wide">
              Rider Assigned{riderName ? ` · ${riderName.split(' ')[0]}` : ''}
            </span>
          </div>
        ) : null}
      </div>

      {/* Top-right: expand/collapse button */}
      <button
        onClick={onToggleExpand}
        className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-neutral-700 shadow-md flex items-center justify-center transition-all active:scale-90 cursor-pointer border border-neutral-200/80"
        title={isExpanded ? 'Collapse map' : 'Expand map'}
      >
        {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {/* Bottom-right: distance pill */}
      {eta && !eta.isDelayed && (
        <div className="absolute bottom-3 right-3 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-neutral-200/80 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E84318]" />
          <span className="text-[10px] font-bold text-neutral-800">{distKm} km away</span>
        </div>
      )}
    </div>
  );
};

export default CustomerDeliveryMap;
