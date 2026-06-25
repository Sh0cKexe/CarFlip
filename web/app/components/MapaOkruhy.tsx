"use client";

import { Fragment, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Circle, CircleMarker, GeoJSON, Tooltip, useMapEvents, useMap } from "react-leaflet";
import union from "@turf/union";
import mask from "@turf/mask";
import bbox from "@turf/bbox";
import { BARVA_ZEME } from "@/lib/zemeBarvy";
import zemeHranice from "@/lib/zeme-hranice.json";

type Oblast = {
  nazev: string; mesto_slug: string; okruh_km: number; lat?: number; lon?: number;
  zeme?: "pl" | "cz" | "sk" | "de" | "at" | "it";
};

// Polygon "sveta minus podporovane zeme" (PL/CZ/SK/DE/AT/IT) - vsechno
// mimo ne se prekryje plnou barvou pozadi, jako by tam ty staty vubec
// nebyly. Spocitano jednou pri startu modulu (staticka data, slity
// union vsech 6 hranic + turf.mask proti celemu svetu).
const HRANICE_UNIE = union(zemeHranice as any) as any;
const VYREZ_MIMO_ZEME = mask(HRANICE_UNIE);
// [minLon, minLat, maxLon, maxLat] shluku vsech 6 zemi - vychozi zaber
// mapy se na nej vzdy fitne, at je sirokej box vyplnenej a ne poloprazdny.
const ZEME_BBOX = bbox(HRANICE_UNIE);

function KlikHandler({ onKlik }: { onKlik: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onKlik(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Vychozi zaber je vzdy cely shluk podporovanych zemi (vyplni box bez
 * ohledu na jeho pomer stran - uz nehrozi velka prazdna cerna plocha
 * jako kdyz se fitovalo jen na 1-2 oblasti). Pridane oblasti zaber jen
 * rozsiri, kdyby nahodou padly mimo (normalne jsou vzdy uvnitr). */
function DorovnatZaber({ oblasti }: { oblasti: Oblast[] }) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(
      [ZEME_BBOX[1], ZEME_BBOX[0]],
      [ZEME_BBOX[3], ZEME_BBOX[2]],
    );
    for (const o of oblasti) {
      if (o.lat != null && o.lon != null) bounds.extend([o.lat, o.lon]);
    }
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 9 });
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
        <GeoJSON
          data={VYREZ_MIMO_ZEME as any}
          style={() => ({ fillColor: "#0b0d12", fillOpacity: 1, stroke: false, interactive: false })}
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
