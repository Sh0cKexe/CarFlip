"use client";

import { Fragment } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip, useMapEvents } from "react-leaflet";

type Oblast = { nazev: string; mesto_slug: string; okruh_km: number; lat?: number; lon?: number };

function KlikHandler({ onKlik }: { onKlik: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onKlik(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapaOkruhy({
  oblasti, onKlik,
}: { oblasti: Oblast[]; onKlik: (lat: number, lon: number) => void }) {
  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-border" style={{ height: 320 }}>
      <MapContainer center={[52.0, 19.0]} zoom={6} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <KlikHandler onKlik={onKlik} />
        {oblasti.map((o, i) =>
          o.lat != null && o.lon != null ? (
            <Fragment key={i}>
              <Circle center={[o.lat, o.lon]} radius={o.okruh_km * 1000} pathOptions={{ color: "#22c55e" }} />
              <CircleMarker center={[o.lat, o.lon]} radius={5} pathOptions={{ color: "#22c55e", fillOpacity: 1 }}>
                <Tooltip>{o.nazev || o.mesto_slug} ({o.okruh_km} km)</Tooltip>
              </CircleMarker>
            </Fragment>
          ) : null
        )}
      </MapContainer>
    </div>
  );
}
