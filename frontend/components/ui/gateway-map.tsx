"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";

const MALAYSIA_CENTER: [number, number] = [3.139, 101.6869];
const DEFAULT_ZOOM = 6;

// Fix default marker icon in Next.js/SSR
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type GatewayWithCoords = {
  gateway: {
    name: string;
    gateway_name?: string;
    gateway_id_mac?: string;
    chirpstack_id?: string;
    status?: string;
  };
  coords: { lat: number; lng: number };
};

type GatewayMapProps = {
  gatewaysWithLocation: GatewayWithCoords[];
  onViewFrames: (gatewayName: string) => void;
  className?: string;
};

function FitBounds({
  gatewaysWithLocation,
}: {
  gatewaysWithLocation: GatewayWithCoords[];
}) {
  const map = useMap();

  useEffect(() => {
    if (gatewaysWithLocation.length >= 2) {
      const bounds = L.latLngBounds(
        gatewaysWithLocation.map(({ coords }) => [coords.lat, coords.lng]),
      );
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
    } else if (gatewaysWithLocation.length === 1) {
      const { coords } = gatewaysWithLocation[0];
      map.setView([coords.lat, coords.lng], 10);
    } else if (gatewaysWithLocation.length === 0) {
      map.setView(MALAYSIA_CENTER, DEFAULT_ZOOM);
    }
  }, [map, gatewaysWithLocation]);

  return null;
}

export function GatewayMap({
  gatewaysWithLocation,
  onViewFrames,
  className = "",
}: GatewayMapProps) {
  const mapCenter: [number, number] =
    gatewaysWithLocation.length > 0
      ? [gatewaysWithLocation[0].coords.lat, gatewaysWithLocation[0].coords.lng]
      : MALAYSIA_CENTER;
  const mapZoom =
    gatewaysWithLocation.length === 0
      ? DEFAULT_ZOOM
      : gatewaysWithLocation.length === 1
        ? 10
        : 6;

  return (
    <div className={`h-full w-full ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        className="h-full w-full"
        scrollWheelZoom
        style={{ minHeight: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <FitBounds gatewaysWithLocation={gatewaysWithLocation} />
        <MarkerClusterGroup
          chunkedLoading
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          zoomToBoundsOnClick
        >
          {gatewaysWithLocation.map(({ gateway, coords }) => (
            <Marker key={gateway.name} position={[coords.lat, coords.lng]}>
              <Popup>
                <div className="min-w-[180px] space-y-2 p-1">
                  <p className="font-semibold">
                    {gateway.gateway_name || gateway.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {gateway.gateway_id_mac || gateway.chirpstack_id || "—"}
                  </p>
                  <p className="text-xs">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        gateway.status === "Active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {gateway.status || "Unknown"}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => onViewFrames(gateway.name)}
                    className="mt-2 w-full rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    View Frames
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
