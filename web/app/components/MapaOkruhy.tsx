"use client";

import { Fragment, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Circle, CircleMarker, GeoJSON, Tooltip, useMapEvents, useMap } from "react-leaflet";
import union from "@turf/union";
import bbox from "@turf/bbox";
import { BARVA_ZEME } from "@/lib/zemeBarvy";
import zemeHranice from "@/lib/zeme-hranice.json";

type Oblast = {
  nazev: string; mesto_slug: string; okruh_km: number; lat?: number; lon?: number;
  zeme?: "pl" | "cz" | "sk" | "de" | "at" | "it";
};

// Sjednocena hranice podporovanych zemi (PL/CZ/SK/DE/AT/IT) - jen obrys
// presne na hranicich (zadne prekryti/maskovani okoli), at je videt
// kde appka funguje, ale zbytek mapy zustane normalne viditelny.
const HRANICE_UNIE = union(zemeHranice as any) as any;
// [minLon, minLat, maxLon, maxLat] shluku vsech 6 zemi - vychozi staticky
// zaber mapy (nemeni se podle pridanych oblasti/okruhu).
const ZEME_BBOX = bbox(HRANICE_UNIE);

function KlikHandler({ onKlik }: { onKlik: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onKlik(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Vychozi zaber je vzdy cely shluk podporovanych zemi - nastavi se jen
 * jednou, kdyz je mapa pripravena. NEreaguje na pridane oblasti/okruhy
 * (drive se pri pridani/zmene oblasti mapa priblizovala k ni, coz
 * uzivatel nechtel). */
function DorovnatZaber() {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(
      [ZEME_BBOX[1], ZEME_BBOX[0]],
      [ZEME_BBOX[3], ZEME_BBOX[2]],
    );
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 9 });
  }, [map]);
  return null;
}

export default function MapaOkruhy({
  oblasti, onKlik,
}: { oblasti: Oblast[]; onKlik: (lat: number, lon: number) => void }) {
  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-border" style={{ height: 420 }}>
      <MapContainer center={[49.8, 17.5]} zoom={6} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <GeoJSON
          data={HRANICE_UNIE}
          style={() => ({ fillOpacity: 0, color: "#000000", weight: 3, opacity: 0.85, interactive: false })}
        />
        <KlikHandler onKlik={onKlik} />
        <DorovnatZaber />
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
