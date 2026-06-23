"use client";

import { Fragment } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip, useMapEvents } from "react-leaflet";

type Oblast = {
  nazev: string; mesto_slug: string; okruh_km: number; lat?: number; lon?: number;
  zeme?: "pl" | "cz" | "sk" | "de" | "at" | "it";
};

const BARVA_ZEME: Record<string, string> = {
  pl: "#22c55e",
  cz: "#3b82f6",
  sk: "#f59e0b",
  de: "#ef4444",
  at: "#a855f7",
  it: "#14b8a6",
};

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
      <MapContainer center={[49.8, 17.5]} zoom={6} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <KlikHandler onKlik={onKlik} />
        {oblasti.map((o, i) => {
          const barva = BARVA_ZEME[o.zeme ?? "pl"];
          return o.lat != null && o.lon != null ? (
            <Fragment key={i}>
              <Circle center={[o.lat, o.lon]} radius={o.okruh_km * 1000} pathOptions={{ color: barva }} />
              <CircleMarker center={[o.lat, o.lon]} radius={5} pathOptions={{ color: barva, fillOpacity: 1 }}>
                <Tooltip>{o.nazev || o.mesto_slug} ({o.okruh_km} km)</Tooltip>
              </CircleMarker>
            </Fragment>
          ) : null;
        })}
      </MapContainer>
    </div>
  );
}
