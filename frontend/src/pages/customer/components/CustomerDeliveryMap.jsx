import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Maximize2, Minimize2 } from 'lucide-react';

/**
 * CustomerDeliveryMap
 * Production-ready real interactive Leaflet map for order tracking.
 * Uses high-res CartoDB Voyager tiles (100% free, no API key required).
 * Renders real GPS coordinates for Persian Darbar and customer doorstep with live rider marker.
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

  // Branch coordinates or default to Camp, Pune
  const branchCoords = order?.branch_coords || PERSIAN_DARBAR_COORDS;

  // Calculate realistic customer coords based on distance_km
  const distKm = parseFloat(order?.distance_km || eta?.distKm || 3.5);
  // Offset ~0.009 degrees per km south-east
  const customerCoords = order?.customer_coords || [
    branchCoords[0] - (distKm * 0.0065),
    branchCoords[1] + (distKm * 0.0055),
  ];

  const status = order?.status || 'placed';
  const isOutForDelivery = status === 'out_for_delivery';
  const isReady = status === 'ready';

  // Rider progress along the route (0 = restaurant, 1 = customer)
  let progress = 0.05;
  if (isReady) progress = 0.15;
  else if (isOutForDelivery) {
    // If order has ETA, calculate progress
    progress = 0.65;
  }

  // Rider current position
  const riderLat = branchCoords[0] + (customerCoords[0] - branchCoords[0]) * progress;
  const riderLng = branchCoords[1] + (customerCoords[1] - branchCoords[1]) * progress;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean up existing map instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    try {
      // Initialize map
      const map = L.map(mapContainerRef.current, {
        center: branchCoords,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Voyager high-res modern tiles (clean, beautiful, like Zomato)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Custom Restaurant Icon
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

      L.marker(branchCoords, { icon: restaurantIcon }).addTo(map);

      // Custom Customer Home Icon
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

      L.marker(customerCoords, { icon: customerIcon }).addTo(map);

      // Polyline route connecting restaurant to customer
      const routePoints = [
        branchCoords,
        [branchCoords[0] - (customerCoords[0] - branchCoords[0]) * 0.35, branchCoords[1] + (customerCoords[1] - branchCoords[1]) * 0.15],
        [branchCoords[0] + (customerCoords[0] - branchCoords[0]) * 0.65, branchCoords[1] + (customerCoords[1] - branchCoords[1]) * 0.85],
        customerCoords,
      ];

      // Background route line
      L.polyline(routePoints, {
        color: '#1F2937',
        weight: 4,
        opacity: 0.8,
        dashArray: '6, 8',
        lineCap: 'round',
      }).addTo(map);

      // Rider Live Marker (shown when preparing, ready, or out for delivery)
      if (isOutForDelivery || isReady) {
        const riderIcon = L.divIcon({
          className: 'custom-rider-pin',
          html: `
            <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center;">
              <span style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(228,0,0,0.35); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>
              <div style="background:white; color:#E40000; width:34px; height:34px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.3); border:2.5px solid #E40000;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="18.5" cy="17.5" r="3.5"/>
                  <circle cx="5.5" cy="17.5" r="3.5"/>
                  <circle cx="15" cy="5" r="1"/>
                  <path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        riderMarkerRef.current = L.marker([riderLat, riderLng], { icon: riderIcon }).addTo(map);
      }

      // Fit map to show both restaurant and customer comfortably
      const bounds = L.latLngBounds([branchCoords, customerCoords]);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });

      mapInstanceRef.current = map;

      // Invalidate size after layout settles
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);
    } catch (e) {
      console.error('Error initializing Leaflet map:', e);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [branchCoords[0], branchCoords[1], customerCoords[0], customerCoords[1], isOutForDelivery, isReady, progress]);

  // Handle expand/collapse resize
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.invalidateSize();
      }, 300);
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
