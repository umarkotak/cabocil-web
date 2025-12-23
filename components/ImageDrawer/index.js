import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Pencil, Eraser, Undo, Redo, Trash2 } from 'lucide-react';
import cabocilAPI from '@/apis/cabocil_api';
import useDebounce from '@/components/useDebounce';
import ColorPicker from './ColorPicker';

const BRUSH_SIZES = {
  draw: [1, 2, 3, 4, 5, 8, 10, 12, 15, 20],
  erase: [10, 15, 20, 25, 30, 35, 40, 45, 50]
};

export default function ImageDrawer({ imageUrl, className, onImageLoad, bookID, bookContentID, focus }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const activePointerRef = useRef(null);

  const [strokes, setStrokes] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [renderedSize, setRenderedSize] = useState({ width: 0, height: 0 });

  // Tool settings
  const [tool, setTool] = useState('draw');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [opacity, setOpacity] = useState(0.88);
  const [recentColors, setRecentColors] = useState([]);

  // Eraser cursor
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [isCursorVisible, setIsCursorVisible] = useState(false);

  const debouncedStrokes = useDebounce(strokes, 500);

  // --- API Communication ---
  useEffect(() => {
    if (!bookContentID) return;
    setIsInitialLoad(true);
    
    cabocilAPI.GetUserStroke("", {}, { book_content_id: bookContentID })
      .then(async (response) => {
        if (response.ok) {
          const body = await response.json();
          setStrokes(body.data.strokes || []);
        }
      })
      .catch(err => console.error('Error loading strokes:', err))
      .finally(() => setIsInitialLoad(false));
  }, [bookContentID]);

  useEffect(() => {
    if (isInitialLoad || !bookContentID || debouncedStrokes.length === 0) return;
    
    cabocilAPI.PostUserStroke("", {}, {
      book_id: bookID,
      book_content_id: bookContentID,
      image_url: imageUrl,
      strokes: debouncedStrokes
    }).catch(err => console.error('Error saving strokes:', err));
  }, [debouncedStrokes, bookID, bookContentID, imageUrl, isInitialLoad]);

  // --- Canvas Sizing with ResizeObserver ---
  useEffect(() => {
    if (!imageLoaded || !imgRef.current || !canvasRef.current) return;

    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      const container = canvas?.parentElement;
      if (!canvas || !img || !container) return;

      const containerRect = container.getBoundingClientRect();
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const containerAspect = containerRect.width / containerRect.height;

      let width, height;
      if (containerAspect > imgAspect) {
        height = containerRect.height;
        width = height * imgAspect;
      } else {
        width = containerRect.width;
        height = width / imgAspect;
      }

      const pixelRatio = window.devicePixelRatio || 1;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = width * pixelRatio;
      canvas.height = height * pixelRatio;
      canvas.style.left = `${(containerRect.width - width) / 2}px`;
      canvas.style.top = `${(containerRect.height - height) / 2}px`;

      const ctx = canvas.getContext('2d');
      ctx.scale(pixelRatio, pixelRatio);
      setRenderedSize({ width, height });
    };

    updateCanvasSize();
    
    const observer = new ResizeObserver(updateCanvasSize);
    if (containerRef.current) observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, [imageLoaded, focus]);

  // --- Canvas Drawing ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded || renderedSize.width === 0) return;

    const ctx = canvas.getContext('2d');
    const { width, height } = renderedSize;

    const drawPath = (stroke) => {
      const pts = stroke.points;
      if (pts.length < 2) return;

      ctx.beginPath();
      ctx.globalCompositeOperation = stroke.tool === 'erase' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = stroke.color || '#000000';
      ctx.lineWidth = stroke.relativeSize ? stroke.relativeSize * width : (stroke.brushSize || 2);
      ctx.globalAlpha = stroke.opacity || 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(pts[0].x * width, pts[0].y * height);

      if (pts.length === 2) {
        ctx.lineTo(pts[1].x * width, pts[1].y * height);
      } else {
        for (let i = 1; i < pts.length - 1; i++) {
          const midX = (pts[i].x + pts[i + 1].x) / 2 * width;
          const midY = (pts[i].y + pts[i + 1].y) / 2 * height;
          ctx.quadraticCurveTo(pts[i].x * width, pts[i].y * height, midX, midY);
        }
        ctx.lineTo(pts[pts.length - 1].x * width, pts[pts.length - 1].y * height);
      }
      ctx.stroke();
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach(drawPath);
    
    if (currentPath.length > 0) {
      drawPath({
        tool,
        color: tool === 'draw' ? color : undefined,
        relativeSize: brushSize / width,
        opacity,
        points: currentPath,
      });
    }
  }, [strokes, currentPath, imageLoaded, tool, color, brushSize, opacity, renderedSize]);

  // --- Pointer Event Handlers ---
  const getCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    };
  }, []);

  const handleColorUsed = useCallback((usedColor) => {
    setRecentColors(prev => [usedColor, ...prev.filter(c => c !== usedColor)].slice(0, 10));
  }, []);

  const finishStroke = useCallback(() => {
    if (currentPath.length === 0) return;
    
    const newStroke = {
      tool,
      color: tool === 'draw' ? color : undefined,
      relativeSize: brushSize / renderedSize.width,
      opacity,
      points: currentPath,
    };
    
    setStrokes(prev => [...prev, newStroke]);
    if (tool === 'draw') handleColorUsed(color);
    setCurrentPath([]);
  }, [currentPath, tool, color, brushSize, opacity, renderedSize.width, handleColorUsed]);

  const handlePointerDown = useCallback((e) => {
    if (!e.isPrimary) return;
    e.target.setPointerCapture(e.pointerId);
    activePointerRef.current = e.pointerId;
    
    const coords = getCoords(e);
    if (coords) {
      setCurrentPath([coords]);
      setIsDrawing(true);
      setRedoStack([]);
    }
  }, [getCoords]);

  const handlePointerMove = useCallback((e) => {
    // Update cursor position for eraser preview
    if (tool === 'erase' && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }

    if (!isDrawing || e.pointerId !== activePointerRef.current) return;
    const coords = getCoords(e);
    if (coords) setCurrentPath(prev => [...prev, coords]);
  }, [isDrawing, getCoords, tool]);

  const handlePointerUp = useCallback((e) => {
    if (e.pointerId !== activePointerRef.current) return;
    e.target.releasePointerCapture(e.pointerId);
    activePointerRef.current = null;
    setIsDrawing(false);
    finishStroke();
  }, [finishStroke]);

  const handleImageLoadInternal = useCallback((e) => {
    onImageLoad?.(e);
    setImageLoaded(true);
  }, [onImageLoad]);

  // --- Toolbar Actions ---
  const undo = useCallback(() => {
    if (strokes.length === 0) return;
    setRedoStack(prev => [...prev, strokes[strokes.length - 1]]);
    setStrokes(strokes.slice(0, -1));
  }, [strokes]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    setStrokes(prev => [...prev, redoStack[redoStack.length - 1]]);
    setRedoStack(redoStack.slice(0, -1));
  }, [redoStack]);

  const clearCanvas = useCallback(() => {
    if (window.confirm("Apakah kamu yakin untuk membersihkan halaman ini?")) {
      setStrokes([]);
      setRedoStack([]);
      setCurrentPath([]);
    }
  }, []);

  const switchTool = useCallback((newTool) => {
    setTool(newTool);
    setBrushSize(newTool === 'draw' ? 2 : 20);
    setOpacity(newTool === 'draw' ? 0.88 : 1);
  }, []);

  return (
    <div className={`flex lg:flex-row flex-col h-full ${className || ''}`}>
      {/* Toolbar */}
      <div className="bg-white lg:border-r border-b lg:border-b-0 border-gray-200 shadow-sm overflow-auto lg:w-48 lg:min-w-48 lg:max-w-48 lg:h-full max-h-32 lg:max-h-none">
        <div className="lg:p-2 p-0">
          <div className="flex lg:flex-col flex-row lg:gap-6 gap-1 lg:items-stretch items-center flex-nowrap">
            {/* Tools */}
            <div className="lg:w-full">
              <h3 className="text-sm font-medium text-gray-700 mb-2 hidden lg:block">Tools</h3>
              <div className="flex lg:flex-col flex-row bg-gray-100 rounded-lg p-1 lg:gap-1 gap-0">
                {['draw', 'erase'].map((t) => (
                  <button
                    key={t}
                    onClick={() => switchTool(t)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors lg:w-full lg:justify-start justify-center ${
                      tool === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t === 'draw' ? <Pencil size={16} /> : <Eraser size={16} />}
                    <span className="lg:inline hidden capitalize">{t === 'draw' ? 'Draw' : 'Erase'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Color Picker */}
            {tool === 'draw' && (
              <div className="lg:w-full">
                <h3 className="text-sm font-medium text-gray-700 mb-2 hidden lg:block">Colors</h3>
                <ColorPicker
                  color={color}
                  onChange={setColor}
                  recentColors={recentColors}
                  onColorUsed={handleColorUsed}
                />
              </div>
            )}

            {/* Brush Settings */}
            <div className="lg:w-full">
              <h3 className="text-sm font-medium text-gray-700 mb-2 hidden lg:block">Brush Settings</h3>
              <div className="flex lg:flex-col flex-row lg:gap-4 gap-3">
                <div className="flex lg:flex-col flex-row lg:items-start items-center lg:gap-2 gap-2">
                  <label className="text-sm font-medium text-gray-700">Size</label>
                  <select
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-12 lg:w-full p-1 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    {BRUSH_SIZES[tool].map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div className="flex lg:flex-col flex-row lg:items-start items-center lg:gap-2 gap-2">
                  <label className="text-sm font-medium text-gray-700">Opacity</label>
                  <div className="flex items-center gap-2 lg:w-full">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="lg:flex-1 w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 lg:w-12 w-8 text-center">{Math.round(opacity * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="lg:w-full lg:ml-0 ml-auto">
              <h3 className="text-sm font-medium text-gray-700 mb-2 hidden lg:block">Actions</h3>
              <div className="flex lg:flex-col flex-row lg:gap-2 gap-1">
                <button onClick={undo} disabled={strokes.length === 0} className="lg:flex lg:items-center lg:gap-2 lg:px-3 lg:py-2 lg:text-sm lg:font-medium lg:justify-start lg:w-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Undo">
                  <Undo size={18} /><span className="lg:inline hidden">Undo</span>
                </button>
                <button onClick={redo} disabled={redoStack.length === 0} className="lg:flex lg:items-center lg:gap-2 lg:px-3 lg:py-2 lg:text-sm lg:font-medium lg:justify-start lg:w-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Redo">
                  <Redo size={18} /><span className="lg:inline hidden">Redo</span>
                </button>
                <button onClick={clearCanvas} className="lg:flex lg:items-center lg:gap-2 lg:px-3 lg:py-2 lg:text-sm lg:font-medium lg:justify-start lg:w-full p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors" title="Clear canvas">
                  <Trash2 size={18} /><span className="lg:inline hidden">Clear</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden select-none bg-background cursor-crosshair"
        onPointerEnter={() => setIsCursorVisible(true)}
        onPointerLeave={() => setIsCursorVisible(false)}
        style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Drawing background"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          onLoad={handleImageLoadInternal}
          draggable="false"
        />
        {imageLoaded && (
          <canvas
            ref={canvasRef}
            className="absolute"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onContextMenu={(e) => e.preventDefault()}
            style={{ touchAction: 'none', userSelect: 'none' }}
          />
        )}

        {/* Eraser cursor preview */}
        {tool === 'erase' && isCursorVisible && (
          <div
            className="absolute rounded-full border border-gray-500 bg-gray-500 bg-opacity-20 pointer-events-none"
            style={{
              left: cursorPos.x,
              top: cursorPos.y,
              width: brushSize,
              height: brushSize,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
