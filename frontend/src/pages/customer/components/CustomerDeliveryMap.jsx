import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2, Bike } from 'lucide-react';

/**
 * CustomerDeliveryMap
 * Production-ready interactive Leaflet map for live order & rider tracking.
 * - Uses Esri World Street Map tiles (100% Free, NO API key required, NO watermark).
 * - Live GPS coordinates from rider's phone or smart route fallback upon assignment.
 * - Robust lifecycle management preventing Leaflet _leaflet_pos race conditions.
 */

// Official Persian Darbar Camp Pune Coordinates
const PERSIAN_DARBAR_COORDS = [18.5138, 73.8785];

export const CustomerDeliveryMap = ({
  order,
  eta,
  isExpanded,
  onToggleExpand,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const restaurantMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const resizeTimerRef = useRef(null);

  // Branch coordinates or default to Camp, Pune
  const branchCoords = order?.branch_coords || PERSIAN_DARBAR_COORDS;

  // Calculate realistic customer coords based on distance_km
  const distKm = parseFloat(order?.distance_km || eta?.distKm || 3.5);
  const customerCoords = order?.customer_coords || [
    branchCoords[0] - (distKm * 0.0065),
    branchCoords[1] + (distKm * 0.0055),
  ];

  const status = order?.status || 'placed';
  const isOutForDelivery = status === 'out_for_delivery';
  const isReady = status === 'ready';

  // Rider assignment detection (Admin assigned personal rider OR Porter 3rd-party)
  const riderName = order?.delivery_partner_name || order?.porter_rider_name || order?.assigned_rider_name;
  const hasAssignedRider = Boolean(
    order?.delivery_partner_name ||
    order?.delivery_partner_id ||
    order?.delivery_partner ||
    order?.porter_order_id ||
    order?.assigned_rider ||
    isReady ||
    isOutForDelivery
  );

  // Rider progress along the route (0 = restaurant, 1 = customer)
  let progress = 0.08;
  if (isReady) progress = 0.22;
  else if (isOutForDelivery) progress = 0.65;

  // Live GPS from rider's phone (native HTML5/Capacitor GPS broadcast)
  const liveLat = order?.rider_lat != null ? parseFloat(order.rider_lat) : null;
  const liveLng = order?.rider_lng != null ? parseFloat(order.rider_lng) : null;
  const hasLiveGps = liveLat !== null && liveLng !== null && !isNaN(liveLat) && !isNaN(liveLng);

  const fallbackLat = branchCoords[0] + (customerCoords[0] - branchCoords[0]) * progress;
  const fallbackLng = branchCoords[1] + (customerCoords[1] - branchCoords[1]) * progress;

  const riderLat = hasLiveGps ? liveLat : fallbackLat;
  const riderLng = hasLiveGps ? liveLng : fallbackLng;

  // Initialize Leaflet Map once
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    // Destroy prior map instance cleanly if exists
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.stop();
        mapInstanceRef.current.off();
        mapInstanceRef.current.remove();
      } catch (err) {
        // safe ignore
      }
      mapInstanceRef.current = null;
    }

    if (container._leaflet_id) {
      container._leaflet_id = null;
    }

    try {
      const map = L.map(container, {
        center: branchCoords,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: false,
        zoomAnimation: false, // Prevents DomUtil _leaflet_pos transition race condition
        markerZoomAnimation: false,
      });

      // 100% Free OpenStreetMap Tiles (Zero API key, zero watermark, 100% reliable)
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Custom Restaurant Pin
      const restaurantIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
            <div style="background:#E40000; color:white; width:36px; height:36px; border-radius:12px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(228,0,0,0.45); border:2.5px solid white;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/>
                <line x1="6" y1="17" x2="18" y2="17"/>
              </svg>
            </div>
            <div style="background:#111827; color:white; font-size:9px; font-weight:800; padding:2px 6px; border-radius:6px; margin-top:2px; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
              Persian Darbar
            </div>
          </div>
        `,
        iconSize: [36, 52],
        iconAnchor: [18, 52],
      });

      restaurantMarkerRef.current = L.marker(branchCoords, { icon: restaurantIcon }).addTo(map);

      // Custom Customer Home Pin
      const customerIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="position:relative; display:flex; flex-direction:column; align-items:center;">
            <div style="background:#111827; color:white; width:34px; height:34px; border-radius:12px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(0,0,0,0.35); border:2.5px solid white;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div style="background:white; color:#111827; font-size:9px; font-weight:800; padding:2px 6px; border-radius:6px; margin-top:2px; white-space:nowrap; border:1px solid #e5e7eb; box-shadow:0 2px 6px rgba(0,0,0,0.15);">
              Your Doorstep
            </div>
          </div>
        `,
        iconSize: [34, 50],
        iconAnchor: [17, 50],
      });

      customerMarkerRef.current = L.marker(customerCoords, { icon: customerIcon }).addTo(map);

      // Route Path connecting restaurant to customer
      const routePoints = [
        branchCoords,
        [branchCoords[0] - (customerCoords[0] - branchCoords[0]) * 0.35, branchCoords[1] + (customerCoords[1] - branchCoords[1]) * 0.15],
        [branchCoords[0] + (customerCoords[0] - branchCoords[0]) * 0.65, branchCoords[1] + (customerCoords[1] - branchCoords[1]) * 0.85],
        customerCoords,
      ];

      polylineRef.current = L.polyline(routePoints, {
        color: '#E40000',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '7, 9',
        lineCap: 'round',
      }).addTo(map);

      // Fit map cleanly when ready without transition animation
      map.whenReady(() => {
        if (mapContainerRef.current) {
          const bounds = L.latLngBounds([branchCoords, customerCoords]);
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15, animate: false });
        }
      });

      mapInstanceRef.current = map;
    } catch (e) {
      console.error('Error initializing Leaflet map:', e);
    }

    return () => {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.stop();
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (err) {
          // safe ignore
        }
        mapInstanceRef.current = null;
      }
      if (container) {
        container._leaflet_id = null;
      }
    };
  }, [branchCoords[0], branchCoords[1], customerCoords[0], customerCoords[1]]);

  // Manage Rider Marker independently (shows upon Rider Assignment OR Out for Delivery)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (hasAssignedRider) {
      const displayName = riderName || 'Delivery Fleet';
      const riderHtml = `
        <div style="position:relative; width:44px; height:44px; display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <span style="position:absolute; width:100%; height:100%; border-radius:50%; background:${hasLiveGps ? 'rgba(16,185,129,0.35)' : 'rgba(228,0,0,0.35)'}; animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></span>
          <div style="background:white; color:${hasLiveGps ? '#059669' : '#E40000'}; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(0,0,0,0.28); border:2.5px solid ${hasLiveGps ? '#10B981' : '#E40000'};">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="18.5" cy="17.5" r="3.5"/>
              <circle cx="5.5" cy="17.5" r="3.5"/>
              <circle cx="15" cy="5" r="1"/>
              <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
            </svg>
          </div>
          <div style="background:#111827; color:white; font-size:8.5px; font-weight:800; padding:1.5px 6px; border-radius:6px; margin-top:2px; white-space:nowrap; box-shadow:0 2px 6px rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.15);">
            ${displayName}
          </div>
        </div>
      `;

      const riderIcon = L.divIcon({
        className: 'custom-rider-pin',
        html: riderHtml,
        iconSize: [44, 56],
        iconAnchor: [22, 28],
      });

      if (!riderMarkerRef.current) {
        riderMarkerRef.current = L.marker([riderLat, riderLng], { icon: riderIcon }).addTo(map);
      } else {
        riderMarkerRef.current.setIcon(riderIcon);
        riderMarkerRef.current.setLatLng([riderLat, riderLng]);
      }
    } else if (riderMarkerRef.current) {
      map.removeLayer(riderMarkerRef.current);
      riderMarkerRef.current = null;
    }
  }, [hasAssignedRider, riderLat, riderLng, riderName, hasLiveGps]);

  // Handle expand/collapse resize without destroying map
  useEffect(() => {
    if (mapInstanceRef.current) {
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        if (mapInstanceRef.current && mapContainerRef.current) {
          try {
            mapInstanceRef.current.invalidateSize({ animate: false });
          } catch (e) {}
        }
      }, 250);
    }
  }, [isExpanded]);

  return (
    <div
      className={`mx-4 rounded-3xl overflow-hidden border border-neutral-200/80 shadow-md relative transition-all duration-300 ${
        isExpanded ? 'h-[360px]' : 'h-[210px]'
      }`}
    >
      {/* Map DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0 bg-[#F4F5F7]" />

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
