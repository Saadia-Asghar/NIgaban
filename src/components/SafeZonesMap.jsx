import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";

const CITY_CENTER = {
  Lahore: { lat: 31.5204, lng: 74.3587 },
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Peshawar: { lat: 34.0151, lng: 71.5249 },
};

function markerColor(level) {
  if (level === "high" || level === "resolved") return "#f43f5e";
  if (level === "watch") return "#f59e0b";
  if (level === "advisory" || level === "info") return "#a78bfa";
  return "#94a3b8";
}

/**
 * @param {"pins" | "heatmap"} mapLayerMode
 * @param {{ lat: number, lng: number, weight?: number }[]} heatmapPoints
 */
export default function SafeZonesMap({ city, pins, routePath = null, mapLayerMode = "pins", heatmapPoints = [] }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polyRef = useRef(null);
  const heatmapRef = useRef(null);
  const [mapError, setMapError] = useState("");
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) {
      setMapError("Set VITE_GOOGLE_MAPS_API_KEY to show the live safety map.");
      setMapLoading(false);
      return undefined;
    }

    const center = CITY_CENTER[city] || CITY_CENTER.Lahore;

    const init = () => {
      if (!elRef.current || !window.google?.maps) return;
      if (!mapRef.current) {
        mapRef.current = new window.google.maps.Map(elRef.current, {
          center,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        });
      }
      const map = mapRef.current;
      let didFitBounds = false;
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (polyRef.current) {
        polyRef.current.setMap(null);
        polyRef.current = null;
      }
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }

      const list = Array.isArray(pins) ? pins : [];
      const showPins = mapLayerMode !== "heatmap";

      if (showPins) {
        list.forEach((pin, idx) => {
          let lat = typeof pin.lat === "number" ? pin.lat : null;
          let lng = typeof pin.lng === "number" ? pin.lng : null;
          if (lat == null || lng == null) {
            const jitter = (i) => (i % 7) * 0.004 - 0.012;
            lat = center.lat + jitter(idx);
            lng = center.lng + jitter(idx + 2);
          }
          const m = new window.google.maps.Marker({
            map,
            position: { lat, lng },
            title: pin.title || "Incident",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: markerColor(pin.level),
              fillOpacity: 0.92,
              strokeColor: "#0f172a",
              strokeWeight: 2,
            },
          });
          const iw = new window.google.maps.InfoWindow({
            content: `<div style="max-width:220px;font-family:system-ui,sans-serif;font-size:12px;color:#0f172a">
            <strong>${escapeHtml(pin.title || "Report")}</strong><br/>
            <span style="opacity:.85">${escapeHtml(pin.timeLabel || "")}</span><br/>
            <p style="margin:6px 0 0;line-height:1.35">${escapeHtml((pin.description || "").slice(0, 220))}</p>
            ${pin.aiSummary ? `<p style="margin-top:8px;padding-top:8px;border-top:1px solid #e2e8f0;font-size:11px"><em>AI:</em> ${escapeHtml(pin.aiSummary.slice(0, 280))}${pin.aiSummary.length > 280 ? "…" : ""}</p>` : ""}
          </div>`,
          });
          m.addListener("click", () => {
            iw.open({ map, anchor: m });
          });
          markersRef.current.push(m);
        });
      } else if (window.google.maps.visualization?.HeatmapLayer) {
        const hp = Array.isArray(heatmapPoints) ? heatmapPoints : [];
        const weighted = hp
          .filter((p) => typeof p.lat === "number" && typeof p.lng === "number")
          .map((p) => ({
            location: new window.google.maps.LatLng(p.lat, p.lng),
            weight: typeof p.weight === "number" ? p.weight : 1,
          }));
        if (weighted.length > 0) {
          heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
            data: weighted,
            map,
            radius: 36,
            opacity: 0.88,
            gradient: [
              "rgba(0, 255, 255, 0)",
              "rgba(0, 255, 255, 1)",
              "rgba(0, 191, 255, 1)",
              "rgba(0, 127, 255, 1)",
              "rgba(0, 0, 255, 1)",
              "rgba(0, 0, 223, 1)",
              "rgba(0, 0, 191, 1)",
              "rgba(0, 0, 159, 1)",
              "rgba(0, 0, 127, 1)",
              "rgba(63, 0, 91, 1)",
              "rgba(127, 0, 63, 1)",
              "rgba(191, 0, 31, 1)",
              "rgba(255, 0, 0, 1)",
            ],
          });
          const b = new window.google.maps.LatLngBounds();
          weighted.forEach((w) => b.extend(w.location));
          map.fitBounds(b, 56);
          didFitBounds = true;
        }
      }

      const path = Array.isArray(routePath) ? routePath : [];
      if (path.length > 1) {
        polyRef.current = new window.google.maps.Polyline({
          path: path.map((p) => ({ lat: Number(p.lat), lng: Number(p.lng) })),
          geodesic: true,
          strokeColor: "#34d399",
          strokeOpacity: 0.95,
          strokeWeight: 5,
          map,
        });
        const b = new window.google.maps.LatLngBounds();
        path.forEach((p) => b.extend({ lat: Number(p.lat), lng: Number(p.lng) }));
        map.fitBounds(b, 48);
      } else if (!didFitBounds) {
        map.setCenter(center);
        map.setZoom(12);
      }

      setMapLoading(false);
      setMapError("");
    };

    if (window.google?.maps) {
      init();
      return undefined;
    }

    let script = document.querySelector("script[data-nigehbaan-maps=\"1\"]");
    if (!script) {
      script = document.createElement("script");
      script.dataset.nigehbaanMaps = "1";
      script.async = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=visualization`;
      script.onload = () => init();
      script.onerror = () => {
        setMapError("Google Maps failed to load. Check the browser key and referrer restrictions.");
        setMapLoading(false);
      };
      document.head.appendChild(script);
    } else {
      script.addEventListener("load", () => init(), { once: true });
    }
    return undefined;
  }, [city, pins, routePath, mapLayerMode, heatmapPoints]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
        <p className="text-xs font-semibold text-white">
          {mapLayerMode === "heatmap" ? "Incident heatmap" : "Pin view"} · {city}
        </p>
        {mapLoading ? <Loader2 className="w-4 h-4 animate-spin text-purple-400 ml-auto" /> : null}
      </div>
      {mapError ? (
        <p className="text-xs text-amber-200/90 p-4 leading-relaxed">{mapError}</p>
      ) : (
        <div ref={elRef} className="h-[min(65vh,480px)] md:h-[min(72vh,620px)] w-full bg-slate-900/80" />
      )}
      <p className="text-[10px] text-slate-500 px-3 py-2 border-t border-white/5">
        {mapLayerMode === "heatmap"
          ? "Density shows approved community reports with GPS. Fewer GPS points mean a sparser heatmap — encourage attaching location when reporting."
          : "Pins without GPS use an approximate city placement for demo. Verified reports with coordinates appear at true locations."}
      </p>
    </div>
  );
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
