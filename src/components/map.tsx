import {
  FeatureGroup,
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  Rectangle,
  ScaleControl,
  TileLayer,
  useMap,
  useMapEvent,
  useMapEvents
} from "react-leaflet";
import {EditControl} from "react-leaflet-draw";
import {forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState} from "react";
import {v4 as uuidv4} from "uuid";
import L from "leaflet";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import * as turf from "@turf/helpers";
import {useEventHandlers} from "@react-leaflet/core";

const POSITION_CLASSES = {
  bottomleft: 'leaflet-bottom leaflet-left',
  bottomright: 'leaflet-bottom leaflet-right',
  topleft: 'leaflet-top leaflet-left',
  topright: 'leaflet-top leaflet-right',
}

const BOUNDS_STYLE = { weight: 1, color: "#ff7800" };

function MinimapBounds({ parentMap, zoom }) {
  const minimap = useMap()

  // Clicking a point on the minimap sets the parent's map center
  const onClick = useCallback(
      (e) => {
        parentMap.setView(e.latlng, parentMap.getZoom())
      },
      [parentMap],
  )
  useMapEvent('click', onClick)

  // Keep track of bounds in state to trigger renders
  const [bounds, setBounds] = useState(parentMap.getBounds())
  const onChange = useCallback(() => {
    setBounds(parentMap.getBounds())
    // Update the minimap's view to match the parent map's center and zoom
    minimap.setView(parentMap.getCenter(), zoom)
  }, [minimap, parentMap, zoom])

  // Listen to events on the parent map
  const handlers = useMemo(() => ({ move: onChange, zoom: onChange }), [])
  useEventHandlers({ instance: parentMap }, handlers)

  return <Rectangle bounds={bounds} pathOptions={BOUNDS_STYLE} />
}

function MinimapControl({ position, zoom }) {
  const parentMap = useMap()
  const mapZoom = zoom || 0

  // Memoize the minimap so it's not affected by position changes
  const minimap = useMemo(
      () => (
          <MapContainer
              style={{ height: 80, width: 80 }}
              center={parentMap.getCenter()}
              zoom={mapZoom}
              dragging={false}
              doubleClickZoom={false}
              scrollWheelZoom={false}
              attributionControl={false}
              zoomControl={false}>
              scale={true}
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MinimapBounds parentMap={parentMap} zoom={mapZoom} />
          </MapContainer>
      ),
      [mapZoom, parentMap],
  )

  const positionClass =
      (position && POSITION_CLASSES[position]) || POSITION_CLASSES.bottomright
  return (
      <div className={positionClass}>
        <div className="leaflet-control leaflet-bar">{minimap}</div>
      </div>
  )
}

interface MapProps {
  iconUrl: string;
}

interface UserMarker {
  id: string;
  position: [number, number];
  iconUrl: string;
}

function ClickHandler({ onClick }: { onClick: (latlng: [number, number]) => void }) {
  console.log("ran this")
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

function createIcon(url: string) {
  return new L.Icon({
    iconUrl: url,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -32],
  });
}

const Map = forwardRef(({ iconUrl }: MapProps, ref) => {
  const defaultPosition: [number, number] = [39.8283, -98.5795];
  const [userMarkers, setUserMarkers] = useState<UserMarker[]>([]);
  const [statesData, setStatesData] = useState(null);
  const [coloredStates, setColoredStates] = useState<{ [stateName: string]: string }>({});
  const [isDrawing, setIsDrawing] = useState(false);


  useEffect(() => {
    const stored = localStorage.getItem("userMarkers");
    if (stored) {
      setUserMarkers(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    fetch("/states.json")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load states.json");
          return res.json();
        })
        .then((data) => setStatesData(data))
        .catch((err) => {
          console.error(err);
        });
  }, []);

  useEffect(() => {
    localStorage.setItem("userMarkers", JSON.stringify(userMarkers));
  }, [userMarkers]);

  const handleMapClick = (latlng: [number, number]) => {
    if (isDrawing) return;
    if (iconUrl === "blue_icon.svg" || iconUrl === "red_icon.svg"|| iconUrl === "green_icon.svg") {
      if (!statesData) return;

      const pt = turf.point([latlng[1], latlng[0]]);

      const clickedFeature = statesData.features.find((feature) =>
          booleanPointInPolygon(pt, feature)
      );

      const colorMap = {
        "blue_icon.svg": "blue",
        "red_icon.svg": "red",
        "green_icon.svg": "green",
      };

      if (clickedFeature) {
        const stateName = clickedFeature.properties.name;
        setColoredStates((prev) => ({
          ...prev,
          [stateName]: colorMap[iconUrl] || prev[stateName], // fallback to existing color if iconUrl not found
        }));
      }
      // IMPORTANT: Do NOT add a marker if no polygon matched
      return;
    }

    // For other icons, add normal marker
    setUserMarkers((prev) => [
      ...prev,
      {
        id: uuidv4(),
        position: latlng,
        iconUrl,
      },
    ]);
  };


  const handleMarkerClick = (id: string) => {
    setUserMarkers((prev) => prev.filter((marker) => marker.id !== id));
  };

  const clearMarkersByType = (targetIconUrl: string) => {
    setUserMarkers((prev) => prev.filter((m) => m.iconUrl !== targetIconUrl));
    // Also clear colored states if clearing red or blue
    if (targetIconUrl === "red_icon.svg" || targetIconUrl === "blue_icon.svg" || targetIconUrl === "green_icon.svg") {
      setColoredStates((prev) => {
        const newColored = { ...prev };
        for (const state in newColored) {
          if (
              (targetIconUrl === "red_icon.svg" && newColored[state] === "red") ||
              (targetIconUrl === "blue_icon.svg" && newColored[state] === "blue") ||
              (targetIconUrl === "green_icon.svg" && newColored[state] === "green")
          ) {
            delete newColored[state];
          }
        }
        return newColored;
      });
    }
  };

  // Expose clear function via ref
  useImperativeHandle(ref, () => ({
    clearMarkersByType,
  }));

  const getPolygonStyle = (feature) => {
    const stateName = feature.properties.name;
    const fillColor = coloredStates[stateName] ?? "#083A90";

    return {
      fillColor,
      weight: 1,
      opacity: 1,
      color: "grey",
      dashArray: "3",
      fillOpacity: fillColor === "#083A90" ? 0.1 : 0.4,
    };
  };

  if (!statesData) return <div>Loading map data...</div>;

  return (
      <MapContainer
          style={{ height: "80vh", width: "100%" }}
          center={defaultPosition}
          zoom={4}
          scale={true}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FeatureGroup>
          <EditControl
              position="topright"
              onDrawStart={() => {
                console.log("Started drawing")
                setIsDrawing(true)
              }}
              onCreated={(e) => {
                console.log("Polygon created:", e.layer.getLatLngs());
                setIsDrawing(false)
              }}
              onEdited={(e) => {
                console.log("Polygon(s) edited", e.layers);
                setIsDrawing(false)
              }}
              onEditStart={(e) => {
                setIsDrawing(true)
                console.log("Started editing polygon(s)", e.layers);
              }}
              onDeleteStart={(e) => {
                setIsDrawing(true)
                console.log("Started deleting", e.layers);
              }}
              onDeleted={(e) => {
                console.log("Polygon(s) deleted", e.layers);
                setIsDrawing(false)
              }}
              draw={{
                rectangle: false,
                circle: false,
                circlemarker: false,
                marker: false,
                polyline: false,
                polygon: {
                  allowIntersection: false,
                  showArea: true,
                  shapeOptions: {
                    color: "red", // green
                    opacity: 0.4
                  },
                },
              }}
          />
        </FeatureGroup>
        <MinimapControl></MinimapControl>
        <ScaleControl position="bottomleft" />
        <ClickHandler onClick={handleMapClick} />
        <GeoJSON data={statesData} style={getPolygonStyle} />
        {userMarkers.map((marker) => (
            <Marker
                key={marker.id}
                position={marker.position}
                icon={createIcon(marker.iconUrl)}
                eventHandlers={{
                  click: () => handleMarkerClick(marker.id),
                }}
            >
              <Popup>
                <b>Custom Marker</b>
                <p>
                  Lat: {marker.position[0].toFixed(5)}, Lng:{" "}
                  {marker.position[1].toFixed(5)}
                </p>
                <p>(Click to remove)</p>
              </Popup>
            </Marker>
        ))}
      </MapContainer>
  );
});

export default Map;
