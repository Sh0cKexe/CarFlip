"use client";

import { Fragment, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Circle, CircleMarker, Tooltip, useMapEvents, useMap } from "react-leaflet";
import { BARVA_ZEME } from "@/lib/zemeBarvy";

type Oblast = {
  nazev: string; mesto_slug: string; okruh_km: number; lat?: number; lon?: number;
  zeme?: "pl" | "cz" | "sk" | "de" | "at" | "it";
};

function KlikHandler({ onKlik }: { onKlik: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onKlik(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Po pridani/zmene oblasti dorovna zoom/center mapy, at jsou vsechny
 * pridane oblasti videt (jinak by zustal fixni vychozi vyrez na CR a
 * oblast napr. v Italii by zustala mimo zaber, dokud by uzivatel rucne
 * neodscrolloval). Jedna oblast -> primy setView (fitBounds na 1 bod by
 * zoomoval na maximum), vic oblasti -> fitBounds s capem na zoom 10
 * (at se nezoomuje az na ulice kdyz jsou oblasti blizko sebe). */
function DorovnatZaber({ oblasti }: { oblasti: Oblast[] }) {
  const map = useMap();
  useEffect(() => {
    const body = oblasti.filter((o) => o.lat != null && o.lon != null) as (Oblast & { lat: number; lon: number })[];
    if (body.length === 0) return;
    if (body.length === 1) {
      map.setView([body[0].lat, body[0].lon], 9);
      return;
    }
    const bounds = L.latLngBounds(body.map((o) => [o.lat, o.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
  }, [oblasti, map]);
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
        <DorovnatZaber oblasti={oblasti} />
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
