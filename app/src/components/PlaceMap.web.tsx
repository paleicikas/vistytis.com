import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import type { Locale, Place, UserLocation } from "../types";
import { categoryLabel, localizePlace, translate } from "../i18n";
import { categoryColors, colors, mapCategory } from "../theme";
import type { PlaceMapRef, PlaceMapRegion } from "./PlaceMap";

type PlaceMapProps = {
  activeCategories?: readonly string[];
  initialRegion?: PlaceMapRegion;
  locale: Locale;
  onPlacePress: (place: Place) => void;
  userLocation: UserLocation | null;
  visiblePlaces: Place[];
};

const initialCenter: L.LatLngExpression = [54.455, 22.735];
const initialZoom = 9;

function zoomForRegion(region: PlaceMapRegion) {
  return Math.max(3, Math.min(18, Math.round(Math.log2(360 / region.latitudeDelta))));
}

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "'": "&#39;",
    '"': "&quot;",
    "<": "&lt;",
    ">": "&gt;",
  };

  return value.replace(/[&<>"']/g, (character) => entities[character] ?? character);
}

function markerIcon(color: string) {
  return L.divIcon({
    className: "vistytis-marker-icon",
    html: `<span style="display:block;width:18px;height:18px;border:2px solid #ffffff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.35);background:${color}"></span>`,
    iconAnchor: [12, 24],
    iconSize: [24, 24],
  });
}

export const PlaceMap = forwardRef<PlaceMapRef, PlaceMapProps>(
  function PlaceMap(
    {
      activeCategories,
      initialRegion,
      locale,
      onPlacePress,
      userLocation,
      visiblePlaces,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);
    const userMarkerRef = useRef<L.CircleMarker | null>(null);
    const initialRegionRef = useRef(initialRegion);
    const onPlacePressRef = useRef(onPlacePress);

    useEffect(() => {
      onPlacePressRef.current = onPlacePress;
    }, [onPlacePress]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const map = L.map(container, {
        attributionControl: true,
        zoomControl: true,
      }).setView(
        initialRegionRef.current
          ? [initialRegionRef.current.latitude, initialRegionRef.current.longitude]
          : initialCenter,
        initialRegionRef.current ? zoomForRegion(initialRegionRef.current) : initialZoom
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      markersRef.current = L.layerGroup().addTo(map);
      window.requestAnimationFrame(() => map.invalidateSize());

      return () => {
        map.remove();
        mapRef.current = null;
        markersRef.current = null;
        userMarkerRef.current = null;
      };
    }, []);

    useEffect(() => {
      const markers = markersRef.current;
      if (!markers) return;

      markers.clearLayers();
      visiblePlaces.forEach((place) => {
        const category = mapCategory(place.categories, activeCategories);
        const marker = L.marker([place.coordinates[1], place.coordinates[0]], {
          icon: markerIcon(categoryColors[category] ?? colors.primary),
        });
        const title = escapeHtml(localizePlace(place, locale).name);
        const categoryName = escapeHtml(categoryLabel(locale, category));
        const openLabel = escapeHtml(translate(locale, "place.open"));

        marker.bindPopup(
          `<div class="vistytis-place-popup"><strong style="display:block">${title}</strong><span style="display:block;margin-top:4px;color:${colors.primary};font-size:11px;font-weight:700">${categoryName}</span><button type="button" style="margin-top:8px">${openLabel}</button></div>`
        );
        marker.on("popupopen", (event) => {
          const button = event.popup
            .getElement()
            ?.querySelector<HTMLButtonElement>("button");
          if (button) {
            button.onclick = () => onPlacePressRef.current(place);
          }
        });
        markers.addLayer(marker);
      });
    }, [activeCategories, locale, visiblePlaces]);

    useEffect(() => {
      const map = mapRef.current;
      if (!map) return;

      if (!userLocation) {
        userMarkerRef.current?.removeFrom(map);
        userMarkerRef.current = null;
        return;
      }

      const position: L.LatLngExpression = [
        userLocation.latitude,
        userLocation.longitude,
      ];
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng(position);
      } else {
        userMarkerRef.current = L.circleMarker(position, {
          color: colors.primaryDark,
          fillColor: "#ffffff",
          fillOpacity: 1,
          radius: 8,
          weight: 3,
        }).addTo(map);
      }
    }, [userLocation]);

    useImperativeHandle(
      ref,
      () => ({
        fitToCoordinates: (coordinates, options) => {
          const map = mapRef.current;
          if (!map || !coordinates.length) return;

          const bounds = L.latLngBounds(
            coordinates.map(({ latitude, longitude }) => [latitude, longitude])
          );
          map.fitBounds(bounds, {
            animate: options.animated,
            paddingBottomRight: [
              options.edgePadding.right,
              options.edgePadding.bottom,
            ],
            paddingTopLeft: [options.edgePadding.left, options.edgePadding.top],
          });
        },
        animateToRegion: (region, duration) => {
          const map = mapRef.current;
          if (!map) return;

          const zoom = Math.max(
            3,
            Math.min(18, Math.round(Math.log2(360 / region.latitudeDelta)))
          );
          map.setView([region.latitude, region.longitude], zoom, {
            animate: true,
            duration: duration / 1000,
          });
        },
      }),
      []
    );

    return (
      <div
        ref={containerRef}
        style={{ height: "100%", width: "100%" }}
      />
    );
  }
);
