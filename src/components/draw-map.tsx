// PolygonMap.tsx
import React, { useRef, useEffect } from "react";
import {
    MapContainer,
    TileLayer,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

const PolygonDrawer = () => {
    const map = useMap();
    const drawnItemsRef = useRef(new L.FeatureGroup());
    const polygonDrawerRef = useRef<L.Draw.Polygon | null>(null);

    useEffect(() => {
        if (!map) return;

        map.addLayer(drawnItemsRef.current);

        const startDrawing = () => {
            const drawOptions = {
                showArea: true,
                allowIntersection: false,
                shapeOptions: { color: "#2CA05A" },
            };

            polygonDrawerRef.current = new L.Draw.Polygon(map, drawOptions);
            polygonDrawerRef.current.enable();
        };

        const handleDrawCreated = (e: any) => {
            drawnItemsRef.current.addLayer(e.layer);

            // Immediately re-enable the tool after a polygon is drawn
            setTimeout(() => {
                polygonDrawerRef.current?.enable();
            }, 100);
        };

        startDrawing();
        map.on(L.Draw.Event.CREATED, handleDrawCreated);

        return () => {
            map.off(L.Draw.Event.CREATED, handleDrawCreated);
            polygonDrawerRef.current?.disable();
        };
    }, [map]);

    return null;
};

export default function PolygonMap() {
    return (
        <div>
            <h2>Draw Multiple Polygons</h2>
            <MapContainer
                center={[37.8, -96]}
                zoom={4}
                style={{ height: "80vh", width: "100%" }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <PolygonDrawer />
            </MapContainer>
        </div>
    );
}
