"use client";

import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

const markerIcon = new L.Icon({ iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41] });

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

export default function MapView({ center, destination, route, places = [] }: { center: [number, number] | null; destination: [number, number] | null; route: [number, number][]; places?: { name: string; type: string; lat: number; lon: number }[] }) {
  const position = center ?? [51.505, -0.09] as [number, number];
  return <MapContainer center={position} zoom={13} scrollWheelZoom className="map-canvas">
    <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {center && <Marker position={center} icon={markerIcon} />}
    {destination && <Marker position={destination} icon={markerIcon} />}
    {places.map((place, index) => <Marker key={`${place.name}-${index}`} position={[place.lat, place.lon]} icon={markerIcon}><Popup>{place.name} · {place.type}</Popup></Marker>)}
    {route.length > 0 && <Polyline positions={route} pathOptions={{ color: "#1c765f", weight: 6, opacity: 0.88 }} />}
    {center && <Recenter center={center} />}
  </MapContainer>;
}