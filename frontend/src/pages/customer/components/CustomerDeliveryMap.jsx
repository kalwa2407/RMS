import React, { useEffect, useRef, useState } from 'react';
import { Navigation, LocateFixed } from 'lucide-react';

/**
 * CustomerDeliveryMap: full-bleed live delivery map.
 * - Clean, low-noise map style (pale land, white roads, no POIs)
 * - Bold dark route for the distance still to go, grey for what is covered
 * - Small, legible markers: green pickup dot, red drop pin with ETA label,
 *   top-down scooter that rotates to the direction of travel
 */

const PERSIAN_DARBAR_COORDS = { lat: 18.5138, lng: 73.8785 };
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyCX4YYM60Z0IXcdC3zNB7YamsoafDfmbxo';

// Clean, low-noise map style (ride-hailing look).
const PREMIUM_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#F4F4F2' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8C8C8C' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#F4F4F2' }, { weight: 3 }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#E2EDD9' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#A3A3A3' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#E6E6E3' }, { weight: 0.6 }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9A9A9A' }] },
  { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#DCDCD8' }, { weight: 1 }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CFE0EC' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#8FB0C7' }] },
];

const ROUTE_COLOR = '#111111';

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
    const eased = 1 - Math.pow(1 - t, 3);
    marker.setPosition({ lat: startLat + dLat * eased, lng: startLng + dLng * eased });
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const FONT = "-apple-system,BlinkMacSystemFont,'SF Pro Text',Roboto,sans-serif";
const svgIcon = (svg, w, h, ax, ay) => ({
  url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
  scaledSize: { width: w, height: h },
  anchor: { x: ax, y: ay },
});

// Approximate text width for the label pills drawn inside SVG markers.
const pillWidth = (text, size = 12) => Math.ceil(text.length * size * 0.56) + 22;

// Pickup (restaurant): green dot with white ring + white label pill above.
const makeRestaurantIcon = (label = 'Persian Darbar') => {
  const pw = pillWidth(label);
  const w = Math.max(pw, 28) + 8;
  const cx = w / 2;
  return svgIcon(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="64" viewBox="0 0 ${w} 64">
      <defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000" flood-opacity="0.22"/></filter></defs>
      <rect x="${cx - pw / 2}" y="4" width="${pw}" height="26" rx="13" fill="#FFFFFF" filter="url(#s)"/>
      <text x="${cx}" y="21.5" font-family="${FONT}" font-size="12" font-weight="600" fill="#111111" text-anchor="middle">${label}</text>
      <circle cx="${cx}" cy="50" r="10" fill="#FFFFFF" filter="url(#s)"/>
      <circle cx="${cx}" cy="50" r="6" fill="#1E8E3E"/>
    </svg>`, w, 64, cx, 50);
};

// Drop (customer): red pin with an ETA / label pill above it.
const makeHomeIcon = (label = 'Home') => {
  const pw = pillWidth(label);
  const w = Math.max(pw, 32) + 8;
  const cx = w / 2;
  return svgIcon(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="78" viewBox="0 0 ${w} 78">
      <defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.5" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/></filter></defs>
      <rect x="${cx - pw / 2}" y="4" width="${pw}" height="26" rx="13" fill="#111111" filter="url(#s)"/>
      <text x="${cx}" y="21.5" font-family="${FONT}" font-size="12" font-weight="600" fill="#FFFFFF" text-anchor="middle">${label}</text>
      <path d="M${cx} 76 C${cx - 3} 70 ${cx - 13} 62 ${cx - 13} 52 a13 13 0 0 1 26 0 C${cx + 13} 62 ${cx + 3} 70 ${cx} 76 Z" fill="#B4232F" filter="url(#s)"/>
      <circle cx="${cx}" cy="52" r="5" fill="#FFFFFF"/>
    </svg>`, w, 78, cx, 76);
};

// Rider: top-down scooter in a white disc, rotated to the heading of travel.
const makeRiderIcon = (isLive, name, heading = 0) => svgIcon(`
  <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
    <defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.28"/></filter></defs>
    ${isLive ? '<circle cx="28" cy="28" r="26" fill="#111111" fill-opacity="0.08"/>' : ''}
    <circle cx="28" cy="28" r="18" fill="#FFFFFF" filter="url(#s)"/>
    <g transform="rotate(${Math.round(heading)} 28 28)">
      <rect x="24.5" y="14" width="7" height="6" rx="2.5" fill="#111111"/>
      <rect x="22" y="19" width="12" height="3" rx="1.5" fill="#111111"/>
      <rect x="23.5" y="21" width="9" height="15" rx="4" fill="#B4232F"/>
      <rect x="25" y="25" width="6" height="7" rx="2.5" fill="#111111" fill-opacity="0.85"/>
      <rect x="25" y="35" width="6" height="7" rx="2.5" fill="#111111"/>
    </g>
  </svg>`, 56, 56, 28, 28);

const toLatLngLiteral = (p) => (p && typeof p.lat === 'function' ? { lat: p.lat(), lng: p.lng() } : p);

const headingBetween = (from, to) => {
  const gm = window.google?.maps;
  if (!from || !to || !gm?.geometry?.spherical) return 0;
  const a = toLatLngLiteral(from);
  const b = toLatLngLiteral(to);
  return gm.geometry.spherical.computeHeading(new gm.LatLng(a.lat, a.lng), new gm.LatLng(b.lat, b.lng)) || 0;
};

// Gentle curved path between two points, used until (or when) the road route
// from the Directions service is not available. Looks intentional instead of
// a ruler-straight line across the city.
const curvedPath = (from, to, steps = 48) => {
  const gm = window.google.maps;
  const dLat = to.lat - from.lat;
  const dLng = to.lng - from.lng;
  // Control point: midpoint pushed sideways by ~18% of the distance
  const ctrl = { lat: from.lat + dLat / 2 - dLng * 0.18, lng: from.lng + dLng / 2 + dLat * 0.18 };
  const pts = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const u = 1 - t;
    pts.push(new gm.LatLng(
      u * u * from.lat + 2 * u * t * ctrl.lat + t * t * to.lat,
      u * u * from.lng + 2 * u * t * ctrl.lng + t * t * to.lng
    ));
  }
  return pts;
};

export const CustomerDeliveryMap = ({ order, eta, isExpanded, onToggleExpand, bottomInset = 40 }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const restaurantMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const casingPolylineRef = useRef(null);
  const remainingPolylineRef = useRef(null);
  const travelledPolylineRef = useRef(null);
  const cachedRoadPathRef = useRef([]);
  const [mapsError, setMapsError] = useState(false);
  const [mapsReady, setMapsReady] = useState(!!window.google?.maps?.Map);
  const [routeVersion, setRouteVersion] = useState(0);
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

  const dropLabel = eta && !eta.isDelayed && eta.minsRemaining ? `${eta.minsRemaining} min` : 'Home';
  const fitPadding = { top: 110, bottom: bottomInset + 30, left: 48, right: 48 };

  // Load Google Maps SDK
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setMapsReady(true))
      .catch(() => setMapsError(true));
  }, []);

  // Initialize map & fetch the real driving route via DirectionsService
  useEffect(() => {
    if (!mapsReady || !mapContainerRef.current) return;
    const gm = window.google.maps;

    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
      restaurantMarkerRef.current = null;
      customerMarkerRef.current = null;
      riderMarkerRef.current = null;
      casingPolylineRef.current = null;
      remainingPolylineRef.current = null;
      travelledPolylineRef.current = null;
      cachedRoadPathRef.current = [];
    }

    try {
      // greedy gestureHandling enables 1-finger panning
      const map = new gm.Map(mapContainerRef.current, {
        center: branchCoords,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        keyboardShortcuts: false,
        gestureHandling: 'greedy',
        backgroundColor: '#F4F4F2',
        styles: PREMIUM_MAP_STYLES,
      });
      mapInstanceRef.current = map;
      // Start with a curved fallback; replaced by the real road route when available.
      const fallbackPath = curvedPath(branchCoords, customerCoords);
      cachedRoadPathRef.current = fallbackPath;

      restaurantMarkerRef.current = new gm.Marker({
        position: branchCoords,
        map,
        icon: makeRestaurantIcon('Persian Darbar'),
        zIndex: 15,
        title: 'Persian Darbar',
      });

      customerMarkerRef.current = new gm.Marker({
        position: customerCoords,
        map,
        icon: makeHomeIcon(dropLabel),
        zIndex: 16,
        title: 'Delivery Address',
      });

      // White casing under the route so it reads on any road colour.
      casingPolylineRef.current = new gm.Polyline({
        path: fallbackPath,
        strokeColor: '#FFFFFF',
        strokeOpacity: 1,
        strokeWeight: 10,
        zIndex: 1,
        map,
      });
      // Distance still to go: bold and dark.
      remainingPolylineRef.current = new gm.Polyline({
        path: fallbackPath,
        strokeColor: ROUTE_COLOR,
        strokeOpacity: 1,
        strokeWeight: 5,
        zIndex: 3,
        map,
      });
      // Distance already covered by the rider: soft grey.
      travelledPolylineRef.current = new gm.Polyline({
        path: [],
        strokeColor: '#B9B9B6',
        strokeOpacity: 1,
        strokeWeight: 5,
        zIndex: 2,
        map,
      });

      try {
        const directionsService = new gm.DirectionsService();
        directionsService.route(
          {
            origin: branchCoords,
            destination: customerCoords,
            travelMode: gm.TravelMode.DRIVING,
          },
          (result, dirStatus) => {
            if (dirStatus === gm.DirectionsStatus.OK && result?.routes?.[0]?.overview_path) {
              const roadPath = result.routes[0].overview_path;
              cachedRoadPathRef.current = roadPath;
              casingPolylineRef.current?.setPath(roadPath);
              remainingPolylineRef.current?.setPath(roadPath);
              const bounds = new gm.LatLngBounds();
              roadPath.forEach(pt => bounds.extend(pt));
              map.fitBounds(bounds, fitPadding);
              setRouteVersion((v) => v + 1);
            }
          }
        );
      } catch (dirErr) {
        console.warn('DirectionsService route warning:', dirErr);
      }

      const bounds = new gm.LatLngBounds();
      fallbackPath.forEach((pt) => bounds.extend(pt));
      map.fitBounds(bounds, fitPadding);
    } catch (err) {
      console.error('Map init error:', err);
    }
  }, [mapsReady, branchCoords.lat, branchCoords.lng, customerCoords.lat, customerCoords.lng]);

  // Keep the ETA label on the drop pin fresh
  useEffect(() => {
    if (customerMarkerRef.current && mapsReady) {
      customerMarkerRef.current.setIcon(makeHomeIcon(dropLabel));
    }
  }, [dropLabel, mapsReady]);

  // Update the rider marker and split the route into covered / remaining
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapsReady) return;
    const gm = window.google.maps;
    const roadPath = cachedRoadPathRef.current;

    let effectivePos = riderPos;
    let splitIndex = 0;
    if (roadPath.length > 1) {
      if (hasLiveGps) {
        let best = Infinity;
        roadPath.forEach((pt, i) => {
          const d = (pt.lat() - riderPos.lat) ** 2 + (pt.lng() - riderPos.lng) ** 2;
          if (d < best) { best = d; splitIndex = i; }
        });
      } else {
        splitIndex = Math.min(roadPath.length - 1, Math.max(1, Math.floor(roadPath.length * progress)));
        effectivePos = toLatLngLiteral(roadPath[splitIndex]);
      }
    }

    if (hasAssignedRider) {
      if (roadPath.length > 1) {
        travelledPolylineRef.current?.setPath(roadPath.slice(0, splitIndex + 1));
        remainingPolylineRef.current?.setPath([effectivePos, ...roadPath.slice(splitIndex + 1)]);
      } else {
        travelledPolylineRef.current?.setPath([branchCoords, effectivePos]);
        remainingPolylineRef.current?.setPath([effectivePos, customerCoords]);
      }

      const next = roadPath.length > splitIndex + 1 ? roadPath[splitIndex + 1] : customerCoords;
      const heading = prevRiderPosRef.current && hasLiveGps
        ? headingBetween(prevRiderPosRef.current, effectivePos)
        : headingBetween(effectivePos, next);

      if (!riderMarkerRef.current) {
        riderMarkerRef.current = new gm.Marker({
          position: effectivePos,
          map,
          icon: makeRiderIcon(hasLiveGps, riderName, heading),
          zIndex: 25,
          title: riderName || 'Delivery partner',
        });
      } else {
        animateMarkerTo(riderMarkerRef.current, effectivePos, 1000);
        riderMarkerRef.current.setIcon(makeRiderIcon(hasLiveGps, riderName, heading));
      }
      prevRiderPosRef.current = effectivePos;
    } else {
      travelledPolylineRef.current?.setPath([]);
      if (roadPath.length > 1) remainingPolylineRef.current?.setPath(roadPath);
      if (riderMarkerRef.current) {
        riderMarkerRef.current.setMap(null);
        riderMarkerRef.current = null;
      }
    }
  }, [hasAssignedRider, riderPos.lat, riderPos.lng, riderName, hasLiveGps, mapsReady, progress, routeVersion]);

  const fitAll = () => {
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
    map.fitBounds(bounds, fitPadding);
  };

  // Refit after the sheet expands/collapses
  useEffect(() => {
    if (!mapInstanceRef.current || !mapsReady) return undefined;
    const t = setTimeout(() => {
      window.google.maps.event.trigger(mapInstanceRef.current, 'resize');
      fitAll();
    }, 320);
    return () => clearTimeout(t);
  }, [isExpanded, mapsReady, bottomInset]);

  return (
    <div
      className="relative w-full h-full min-h-[280px] overflow-hidden select-none bg-[#F4F4F2]"
      style={{ touchAction: 'pan-x pan-y' }}
    >
      <div ref={mapContainerRef} className="w-full h-full" />

      {!mapsReady && !mapsError && (
        <div className="absolute inset-0 bg-[#F4F4F2] z-20 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-[3px] border-black/10 border-t-black/60 animate-spin" />
        </div>
      )}

      {mapsError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#F4F4F2] z-20">
          <Navigation className="w-8 h-8 text-pd-ink-3 mb-2" />
          <p className="text-pd-ink-2 text-[14px] text-center px-6">
            Map unavailable. Check your internet connection.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={fitAll}
        className="absolute right-4 z-20 w-11 h-11 rounded-full bg-white shadow-pd-2 flex items-center justify-center text-pd-ink pd-press"
        style={{ bottom: bottomInset + 16 }}
        title="Re-center map"
        aria-label="Re-center map"
      >
        <LocateFixed className="w-5 h-5" strokeWidth={2} />
      </button>
    </div>
  );
};

export default CustomerDeliveryMap;
