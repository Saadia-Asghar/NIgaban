import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Navigation } from "lucide-react";
import SafeZonesMap from "./SafeZonesMap.jsx";
import { api } from "../lib/api.js";
import { decodePolyline } from "../lib/decodePolyline.js";

export default function SafetyMapScreen() {
  const [city, setCity] = useState("Lahore");
  const [pins, setPins] = useState([]);
  const [heatmapPoints, setHeatmapPoints] = useState([]);
  const [mapLayerMode, setMapLayerMode] = useState("pins");
  const [dest, setDest] = useState("");
  const [routePath, setRoutePath] = useState(null);
  const [loadingPins, setLoadingPins] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeNote, setRouteNote] = useState("");

  const loadHeatGeo = useMemo(() => async (c) => {
    try {
      const data = await api(`/community/incidents-geo?city=${encodeURIComponent(c)}`);
      setHeatmapPoints(data.points || []);
    } catch {
      setHeatmapPoints([]);
    }
  }, []);

  const loadPins = useCallback(async () => {
    setLoadingPins(true);
    try {
      const data = await api(`/community/feed?city=${encodeURIComponent(city)}`);
      const feed = data.feed || [];
      setPins(
        feed.map((it) => ({
          lat: typeof it.lat === "number" ? it.lat : null,
          lng: typeof it.lng === "number" ? it.lng : null,
          title: it.title,
          description: it.description,
          level: it.level,
          aiSummary: it.aiSummary || "",
          timeLabel: it.time ? new Date(it.time).toLocaleString() : "",
        })),
      );
      await loadHeatGeo(city);
    } catch {
      setPins([]);
      setHeatmapPoints([]);
    } finally {
      setLoadingPins(false);
    }
  }, [city, loadHeatGeo]);

  useEffect(() => {
    loadPins();
  }, [loadPins]);

  const findRoute = async () => {
    const d = dest.trim();
    if (!d) return;
    setLoadingRoute(true);
    setRoutePath(null);
    setRouteNote("");
    try {
      const pos = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Location not available"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15_000,
          maximumAge: 60_000,
        });
      });
      const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
      const data = await api(
        `/maps/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(d)}`,
      );
      const enc = data?.route?.overview_polyline?.points;
      if (!enc) {
        setRouteNote(data?.error || "No route returned. Try a clearer address.");
        return;
      }
      const path = decodePolyline(enc);
      setRoutePath(path);
      setRouteNote(
        "Walking directions favor public paths. At night, stay on main roads with lighting and shops — this map is guidance, not a guarantee.",
      );
    } catch (e) {
      setRouteNote(e?.message || "Could not build route. Check destination and location permission.");
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div className="px-4 pt-4 pb-28 space-y-4 animate-in fade-in max-w-lg mx-auto w-full">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Safety map</h2>
        <p className="text-xs text-slate-400 mt-1">Pins or incident heatmap (Supabase-backed when configured) + optional walking route.</p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">City feed</label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          {["Lahore", "Karachi", "Islamabad", "Peshawar"].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 gap-1">
        <button
          type="button"
          onClick={() => setMapLayerMode("pins")}
          className={`flex-1 rounded-lg py-2 text-[11px] font-bold ${mapLayerMode === "pins" ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : "text-slate-400"}`}
        >
          Pin view
        </button>
        <button
          type="button"
          onClick={() => setMapLayerMode("heatmap")}
          className={`flex-1 rounded-lg py-2 text-[11px] font-bold ${mapLayerMode === "heatmap" ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" : "text-slate-400"}`}
        >
          Heatmap
        </button>
      </div>
      <p className="text-[10px] text-slate-500">
        {heatmapPoints.length} approved reports with GPS in {city}. Judges can toggle density vs pins.
      </p>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
        <p className="text-xs font-semibold text-white flex items-center gap-2">
          <Navigation className="w-4 h-4 text-emerald-400" /> Find safe route
        </p>
        <input
          value={dest}
          onChange={(e) => setDest(e.target.value)}
          placeholder="Destination (address or place name)"
          className="w-full rounded-xl border border-white/10 bg-[#141523] px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
        <button
          type="button"
          disabled={loadingRoute || !dest.trim()}
          onClick={findRoute}
          className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white disabled:opacity-50 active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
        >
          {loadingRoute ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
          {loadingRoute ? "Routing…" : "Use my location + route"}
        </button>
        {routeNote ? <p className="text-[11px] text-slate-300 leading-relaxed">{routeNote}</p> : null}
      </div>

      {loadingPins ? (
        <p className="text-xs text-slate-400 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading map data…
        </p>
      ) : null}

      <SafeZonesMap city={city} pins={pins} routePath={routePath} mapLayerMode={mapLayerMode} heatmapPoints={heatmapPoints} />
    </div>
  );
}
