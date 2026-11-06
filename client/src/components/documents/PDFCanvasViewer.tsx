import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Download,
  Layout,
  Maximize,
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PDFCanvasViewerProps {
  url: string;
  downloadUrl: string;
  documentTitle: string;
  token?: string;
}

export const PDFCanvasViewer: React.FC<PDFCanvasViewerProps> = ({
  url,
  downloadUrl,
  documentTitle,
  token,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isPdfMode, setIsPdfMode] = useState<boolean>(true);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);

  // 1. Muat Berkas (Deteksi Otomatis: PDF Asli vs Image/Scan)
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(url, { headers })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const blob = await res.blob();
        const arrayBuf = await blob.arrayBuffer();

        // Periksa magic bytes %PDF (0x25, 0x50, 0x44, 0x46)
        const header = new Uint8Array(arrayBuf.slice(0, 5));
        const isPdf =
          header[0] === 0x25 &&
          header[1] === 0x50 &&
          header[2] === 0x44 &&
          header[3] === 0x46;

        if (isPdf) {
          setIsPdfMode(true);
          const loadingTask = pdfjsLib.getDocument({
            data: arrayBuf,
            cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/cmaps/',
            cMapPacked: true,
          });
          const doc = await loadingTask.promise;
          if (isCancelled) return;
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setCurrentPage(1);
          setLoading(false);
        } else {
          // Berkas berupa Image (PNG / JPEG / WebP dari Cloudinary / scan)
          setIsPdfMode(false);
          const imgUrl = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            if (isCancelled) return;
            setImageElement(img);
            setNumPages(1);
            setLoading(false);
          };
          img.onerror = () => {
            if (isCancelled) return;
            setError('Gagal membaca gambar berkas dokumen.');
            setLoading(false);
          };
          img.src = imgUrl;
        }
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error('File load error:', err);
        setError('Gagal memuat berkas dokumen.');
        setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [url]);

  // 2. Render Page ke HTML5 Canvas sesuai Skala Zoom & Rotasi
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    if (isPdfMode && pdfDoc) {
      let renderTask: any = null;
      const renderPdfPage = async () => {
        try {
          const page = await pdfDoc.getPage(currentPage);
          const scale = zoom / 100;
          const viewport = page.getViewport({ scale, rotation });

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          renderTask = page.render({
            canvasContext: context,
            viewport: viewport,
          });
          await renderTask.promise;
        } catch (err: any) {
          if (err?.name !== 'RenderingCancelledException') {
            console.error('PDF render error:', err);
          }
        }
      };

      renderPdfPage();
      return () => {
        if (renderTask) renderTask.cancel();
      };
    } else if (!isPdfMode && imageElement) {
      // Render Image ke Canvas dengan Real Zoom & Rotation
      const scale = zoom / 100;
      const rad = (rotation * Math.PI) / 180;
      const isSideways = rotation % 180 !== 0;

      const baseWidth = isSideways ? imageElement.naturalHeight : imageElement.naturalWidth;
      const baseHeight = isSideways ? imageElement.naturalWidth : imageElement.naturalHeight;

      canvas.width = baseWidth * scale;
      canvas.height = baseHeight * scale;

      context.save();
      context.translate(canvas.width / 2, canvas.height / 2);
      context.rotate(rad);
      context.drawImage(
        imageElement,
        (-imageElement.naturalWidth * scale) / 2,
        (-imageElement.naturalHeight * scale) / 2,
        imageElement.naturalWidth * scale,
        imageElement.naturalHeight * scale
      );
      context.restore();
    }
  }, [isPdfMode, pdfDoc, imageElement, currentPage, zoom, rotation]);

  // Fit to Width: sesuaikan lebar dokumen dengan lebar layar
  const handleFitWidth = async () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 48;

    if (isPdfMode && pdfDoc) {
      const page = await pdfDoc.getPage(currentPage);
      const vp = page.getViewport({ scale: 1, rotation });
      const fitScale = Math.max(30, Math.floor((containerWidth / vp.width) * 100));
      setZoom(fitScale);
    } else if (!isPdfMode && imageElement) {
      const isSideways = rotation % 180 !== 0;
      const baseWidth = isSideways ? imageElement.naturalHeight : imageElement.naturalWidth;
      const fitScale = Math.max(30, Math.floor((containerWidth / baseWidth) * 100));
      setZoom(fitScale);
    }
  };

  // Fit to Canvas: sesuaikan dokumen utuh muat di layar
  const handleFitCanvas = async () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 48;
    const containerHeight = containerRef.current.clientHeight - 48;

    if (isPdfMode && pdfDoc) {
      const page = await pdfDoc.getPage(currentPage);
      const vp = page.getViewport({ scale: 1, rotation });
      const scaleX = containerWidth / vp.width;
      const scaleY = containerHeight / vp.height;
      const fitScale = Math.max(30, Math.floor(Math.min(scaleX, scaleY) * 100));
      setZoom(fitScale);
    } else if (!isPdfMode && imageElement) {
      const isSideways = rotation % 180 !== 0;
      const baseWidth = isSideways ? imageElement.naturalHeight : imageElement.naturalWidth;
      const baseHeight = isSideways ? imageElement.naturalWidth : imageElement.naturalHeight;
      const scaleX = containerWidth / baseWidth;
      const scaleY = containerHeight / baseHeight;
      const fitScale = Math.max(30, Math.floor(Math.min(scaleX, scaleY) * 100));
      setZoom(fitScale);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 overflow-hidden select-none">
      {/* Real Canvas PDF Toolbar */}
      <div className="bg-slate-800 border-b border-slate-700/80 px-4 py-2 flex items-center justify-between gap-3 flex-wrap flex-shrink-0 text-white text-xs">
        {/* Page Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1 || loading}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 transition cursor-pointer"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-mono text-xs px-2 text-slate-300">
            Hal. {currentPage} / {numPages || 1}
          </span>

          <button
            type="button"
            disabled={currentPage >= numPages || loading}
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:opacity-40 transition cursor-pointer"
            title="Halaman Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Real PDF & Image Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={loading}
            onClick={() => setZoom((z) => Math.max(25, z - 25))}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition cursor-pointer"
            title="Perkecil (Zoom Out)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="font-mono text-xs font-semibold px-2 text-center min-w-[50px] text-teal-300">
            {zoom}%
          </span>

          <button
            type="button"
            disabled={loading}
            onClick={() => setZoom((z) => Math.min(300, z + 25))}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition cursor-pointer"
            title="Perbesar (Zoom In)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1"></div>

          <button
            type="button"
            disabled={loading}
            onClick={handleFitCanvas}
            className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            title="Sesuaikan halaman penuh dengan layar"
          >
            <Layout className="w-3.5 h-3.5 text-teal-400" />
            <span>Fit Page</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleFitWidth}
            className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            title="Sesuaikan lebar halaman dengan layar"
          >
            <Maximize className="w-3.5 h-3.5 text-teal-400" />
            <span>Fit Width</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition cursor-pointer"
            title="Putar Dokumen 90 Derajat"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Download & External Link */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={downloading}
            onClick={async () => {
              try {
                setDownloading(true);
                const headers: Record<string, string> = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;
                const res = await fetch(downloadUrl, { headers });
                if (!res.ok) throw new Error('Gagal mengunduh berkas');
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = documentTitle;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
              } catch (err) {
                console.error('Download error:', err);
                alert('Gagal mengunduh berkas.');
              } finally {
                setDownloading(false);
              }
            }}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition cursor-pointer disabled:opacity-50"
            title="Unduh Berkas Asli Secara Aman"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Real Canvas Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6 flex items-start justify-center bg-slate-950"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-2" />
            <span className="text-xs">Memuat dokumen berkas...</span>
          </div>
        )}

        {error && (
          <div className="p-6 bg-rose-950/40 border border-rose-800 rounded-2xl text-rose-300 text-xs text-center max-w-md">
            {error}
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={`shadow-2xl rounded-sm transition-all duration-150 ${
            loading || error ? 'hidden' : 'block'
          }`}
        />
      </div>
    </div>
  );
};
