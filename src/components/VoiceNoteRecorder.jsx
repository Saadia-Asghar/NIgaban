import { useRef, useState } from "react";
import { Download, Mic, Square } from "lucide-react";

export default function VoiceNoteRecorder() {
  const [recording, setRecording] = useState(false);
  const [blobUrl, setBlobUrl] = useState("");
  const [filename, setFilename] = useState("nigehbaan-voice-note.webm");
  const [seconds, setSeconds] = useState(0);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = async () => {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4" });
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        if (blobUrl) URL.revokeObjectURL(blobUrl);
        setFilename(`nigehbaan-voice-note-${Date.now()}.webm`);
        setBlobUrl(URL.createObjectURL(blob));
        chunksRef.current = [];
      };
      mr.start(200);
      setRecording(true);
      setSeconds(0);
      stopTimer();
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      // permission denied
    }
  };

  const stop = () => {
    if (!recording || !mediaRef.current) return;
    mediaRef.current.stop();
    setRecording(false);
    stopTimer();
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">Voice Note</p>
        {recording ? (
          <span className="text-xs font-mono text-rose-300 animate-pulse">{seconds}s</span>
        ) : null}
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">Discreet recording for your own use. Saved only on this device until you download.</p>
      <div className="flex flex-wrap gap-2">
        {!recording ? (
          <button
            type="button"
            onClick={start}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.98] transition-transform"
          >
            <Mic className="w-4 h-4" /> Record
          </button>
        ) : (
          <button
            type="button"
            onClick={stop}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white active:scale-[0.98] transition-transform"
          >
            <Square className="w-4 h-4" /> Stop
          </button>
        )}
        {blobUrl ? (
          <a
            href={blobUrl}
            download={filename}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            <Download className="w-4 h-4" /> Download
          </a>
        ) : null}
      </div>
    </div>
  );
}
