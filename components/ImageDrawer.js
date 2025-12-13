import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Eraser, Undo, Redo, Trash2, ChevronDown } from 'lucide-react';
import cabocilAPI from '@/apis/cabocil_api';
import useDebounce from './useDebounce';

// ========== Procreate-Style Color Picker Component ==========
const ColorPickerDropdown = ({ color, onChange, recentColors, onColorUsed }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [brightness, setBrightness] = useState(50);
  const dropdownRef = useRef(null);
  const colorWheelRef = useRef(null);
  const satBrightRef = useRef(null);
  const [isDraggingWheel, setIsDraggingWheel] = useState(false);
  const [isDraggingSB, setIsDraggingSB] = useState(false);

  const defaultPalette = [
    // Row 1 - Basic colors
    '#000000', '#404040', '#808080', '#c0c0c0', '#ffffff',
    // Row 2 - Warm colors
    '#ff0000', '#ff4500', '#ff8c00', '#ffa500', '#ffd700',
    // Row 3 - Nature colors
    '#ffff00', '#9acd32', '#32cd32', '#00fa9a', '#00ffff',
    // Row 4 - Cool colors
    '#00bfff', '#4169e1', '#0000ff', '#8a2be2', '#9400d3',
    // Row 5 - Accent colors
    '#ff00ff', '#ff1493', '#ff69b4', '#db7093', '#bc8f8f',
  ];

  // Convert HSL to Hex
  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  // Convert Hex to HSL
  const hexToHsl = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 100, l: 50 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  // Initialize HSL from current color when dropdown opens
  useEffect(() => {
    if (isOpen && color) {
      const hsl = hexToHsl(color);
      setHue(hsl.h);
      setSaturation(hsl.s);
      setBrightness(hsl.l);
    }
  }, [isOpen, color]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle color wheel interaction
  const handleWheelInteraction = (e) => {
    const rect = colorWheelRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left - centerX;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top - centerY;

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    setHue(Math.round(angle));
    const newColor = hslToHex(Math.round(angle), saturation, brightness);
    onChange(newColor);
  };

  // Handle saturation/brightness interaction
  const handleSBInteraction = (e) => {
    const rect = satBrightRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, (e.clientX || e.touches?.[0]?.clientX) - rect.left));
    const y = Math.max(0, Math.min(rect.height, (e.clientY || e.touches?.[0]?.clientY) - rect.top));

    const newSaturation = Math.round((x / rect.width) * 100);
    const newBrightness = Math.round(100 - (y / rect.height) * 100);

    setSaturation(newSaturation);
    setBrightness(newBrightness);
    const newColor = hslToHex(hue, newSaturation, newBrightness);
    onChange(newColor);
  };

  // Mouse/Touch event handlers for wheel
  const handleWheelMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingWheel(true);
    handleWheelInteraction(e);
  };

  const handleWheelMouseMove = (e) => {
    if (isDraggingWheel) {
      handleWheelInteraction(e);
    }
  };

  const handleWheelMouseUp = () => {
    setIsDraggingWheel(false);
  };

  // Mouse/Touch event handlers for saturation/brightness
  const handleSBMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingSB(true);
    handleSBInteraction(e);
  };

  const handleSBMouseMove = (e) => {
    if (isDraggingSB) {
      handleSBInteraction(e);
    }
  };

  const handleSBMouseUp = () => {
    setIsDraggingSB(false);
  };

  useEffect(() => {
    if (isDraggingWheel) {
      document.addEventListener('mousemove', handleWheelMouseMove);
      document.addEventListener('mouseup', handleWheelMouseUp);
      document.addEventListener('touchmove', handleWheelMouseMove);
      document.addEventListener('touchend', handleWheelMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleWheelMouseMove);
      document.removeEventListener('mouseup', handleWheelMouseUp);
      document.removeEventListener('touchmove', handleWheelMouseMove);
      document.removeEventListener('touchend', handleWheelMouseUp);
    };
  }, [isDraggingWheel, hue, saturation, brightness]);

  useEffect(() => {
    if (isDraggingSB) {
      document.addEventListener('mousemove', handleSBMouseMove);
      document.addEventListener('mouseup', handleSBMouseUp);
      document.addEventListener('touchmove', handleSBMouseMove);
      document.addEventListener('touchend', handleSBMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleSBMouseMove);
      document.removeEventListener('mouseup', handleSBMouseUp);
      document.removeEventListener('touchmove', handleSBMouseMove);
      document.removeEventListener('touchend', handleSBMouseUp);
    };
  }, [isDraggingSB, hue, saturation, brightness]);

  const selectColor = (selectedColor) => {
    onChange(selectedColor);
    onColorUsed(selectedColor);
    const hsl = hexToHsl(selectedColor);
    setHue(hsl.h);
    setSaturation(hsl.s);
    setBrightness(hsl.l);
  };

  // Calculate hue indicator position on wheel
  const wheelRadius = 60;
  const indicatorRadius = wheelRadius - 12;
  const hueRad = ((hue - 90) * Math.PI) / 180;
  const hueX = Math.cos(hueRad) * indicatorRadius;
  const hueY = Math.sin(hueRad) * indicatorRadius;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Color Picker Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-all w-full"
      >
        <div
          className="w-6 h-6 rounded-md border-2 border-gray-300 shadow-inner"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm text-gray-700 flex-1 text-left truncate hidden lg:block">{color}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 lg:w-72 w-64 left-0 lg:left-auto">
          {/* Current Color Preview */}
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
            <div
              className="w-12 h-12 rounded-lg shadow-inner border border-gray-200"
              style={{ backgroundColor: color }}
            />
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Current</p>
              <p className="text-sm font-mono font-medium text-gray-800">{color}</p>
            </div>
          </div>

          {/* Color Wheel & Saturation/Brightness */}
          <div className="flex gap-3 mb-4">
            {/* Color Wheel */}
            <div
              ref={colorWheelRef}
              className="relative w-28 h-28 lg:w-32 lg:h-32 rounded-full cursor-crosshair flex-shrink-0"
              style={{
                background: 'conic-gradient(from 0deg, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))',
              }}
              onMouseDown={handleWheelMouseDown}
              onTouchStart={handleWheelMouseDown}
            >
              {/* White overlay in center */}
              <div className="absolute inset-4 rounded-full bg-white shadow-inner" />
              {/* Hue indicator */}
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg"
                style={{
                  backgroundColor: `hsl(${hue}, 100%, 50%)`,
                  left: `calc(50% + ${hueX}px - 8px)`,
                  top: `calc(50% + ${hueY}px - 8px)`,
                  pointerEvents: 'none',
                }}
              />
            </div>

            {/* Saturation/Brightness Square */}
            <div
              ref={satBrightRef}
              className="relative flex-1 h-28 lg:h-32 rounded-lg cursor-crosshair overflow-hidden"
              style={{
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hue}, 100%, 50%))`,
              }}
              onMouseDown={handleSBMouseDown}
              onTouchStart={handleSBMouseDown}
            >
              {/* Saturation/Brightness indicator */}
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-lg"
                style={{
                  backgroundColor: color,
                  left: `calc(${saturation}% - 8px)`,
                  top: `calc(${100 - brightness}% - 8px)`,
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* Hex Input */}
          <div className="mb-4">
            <label className="text-xs text-gray-500 uppercase tracking-wide mb-1 block">Hex Color</label>
            <input
              type="text"
              value={color}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                  onChange(val);
                  if (val.length === 7) {
                    const hsl = hexToHsl(val);
                    setHue(hsl.h);
                    setSaturation(hsl.s);
                    setBrightness(hsl.l);
                  }
                }
              }}
              className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="#000000"
            />
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Recent</p>
              <div className="flex flex-wrap gap-1">
                {recentColors.slice(0, 10).map((recentColor, idx) => (
                  <button
                    key={`${recentColor}-${idx}`}
                    onClick={() => selectColor(recentColor)}
                    className={`w-6 h-6 rounded-md border-2 transition-all hover:scale-110 ${color === recentColor ? 'border-gray-900 ring-2 ring-gray-400' : 'border-gray-300'
                      }`}
                    style={{ backgroundColor: recentColor }}
                    title={recentColor}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Default Palette */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Palette</p>
            <div className="grid grid-cols-5 gap-1">
              {defaultPalette.map((paletteColor) => (
                <button
                  key={paletteColor}
                  onClick={() => selectColor(paletteColor)}
                  className={`w-full aspect-square rounded-md border-2 transition-all hover:scale-105 ${color === paletteColor ? 'border-gray-900 ring-2 ring-gray-400' : 'border-gray-200'
                    }`}
                  style={{ backgroundColor: paletteColor }}
                  title={paletteColor}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .color-picker-dropdown {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
};

// ========== Main ImageDrawer Component ==========
const ImageDrawer = ({
  imageUrl, className, onImageLoad, bookID, bookContentID, focus,
}) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const activePointerIdRef = useRef(null);
  const touchCountRef = useRef(0);

  const [containerSize, setContainerSize] = useState(0)
  const [strokes, setStrokes] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Tool settings
  const [tool, setTool] = useState('draw');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [opacity, setOpacity] = useState(0.88);
  const [brushSizeDropdownOpen, setBrushSizeDropdownOpen] = useState(false);

  // Recent colors state
  const [recentColors, setRecentColors] = useState([]);

  // ✨ NEW: State for the eraser cursor preview
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 }); // Start off-screen
  const [isCursorVisible, setIsCursorVisible] = useState(false);

  const debouncedStrokes = useDebounce(strokes, 500);

  const defaultColors = [
    '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
    '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'
  ];

  const brushSizeOptions = {
    draw: [1, 2, 3, 4, 5, 8, 10, 12, 15, 20],
    erase: [10, 15, 20, 25, 30, 35, 40, 45, 50]
  };

  // Handler to add color to recent colors when used for drawing
  const handleColorUsed = useCallback((usedColor) => {
    setRecentColors(prev => {
      const filtered = prev.filter(c => c !== usedColor);
      return [usedColor, ...filtered].slice(0, 10);
    });
  }, []);

  // --- API Communication ---
  useEffect(() => {
    const getUserStroke = async (id) => {
      if (!id) return;
      setIsInitialLoad(true);
      try {
        const response = await cabocilAPI.GetUserStroke("", {}, { book_content_id: id });
        if (response.ok) {
          const body = await response.json();
          setStrokes(body.data.strokes || []);
        }
      } catch (error) {
        console.error('Error loading strokes:', error);
      } finally {
        setIsInitialLoad(false);
      }
    };
    getUserStroke(bookContentID);
  }, [bookContentID]);

  useEffect(() => {
    const postUserStroke = async () => {
      if (isInitialLoad || !bookContentID || debouncedStrokes.length === 0) return;
      try {
        await cabocilAPI.PostUserStroke("", {}, {
          book_id: bookID,
          book_content_id: bookContentID,
          image_url: imageUrl,
          strokes: debouncedStrokes
        });
      } catch (error) {
        console.error('Error saving strokes:', error);
      }
    };
    postUserStroke();
  }, [debouncedStrokes, bookID, bookContentID, imageUrl, isInitialLoad]);

  // --- Canvas Setup and Drawing Logic ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    const pixelRatio = window.devicePixelRatio || 1;

    const containerRect = canvas.parentElement.getBoundingClientRect();
    const imageAspectRatio = img.naturalWidth / img.naturalHeight;
    const containerAspectRatio = containerRect.width / containerRect.height;

    let renderedWidth, renderedHeight;
    if (containerAspectRatio > imageAspectRatio) {
      renderedHeight = containerRect.height;
      renderedWidth = renderedHeight * imageAspectRatio;
    } else {
      renderedWidth = containerRect.width;
      renderedHeight = renderedWidth / imageAspectRatio;
    }

    canvas.style.width = `${renderedWidth}px`;
    canvas.style.height = `${renderedHeight}px`;
    canvas.width = renderedWidth * pixelRatio;
    canvas.height = renderedHeight * pixelRatio;
    ctx.scale(pixelRatio, pixelRatio);

    const leftOffset = (containerRect.width - renderedWidth) / 2;
    const topOffset = (containerRect.height - renderedHeight) / 2;
    canvas.style.left = `${leftOffset}px`;
    canvas.style.top = `${topOffset}px`;

    const drawSmoothPath = (stroke) => {
      const points = stroke.points;
      if (points.length < 2) return;

      ctx.beginPath();
      ctx.globalCompositeOperation = stroke.tool === 'erase' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = stroke.color || '#000000';
      ctx.lineWidth = stroke.relativeSize ? stroke.relativeSize * renderedWidth : (stroke.brushSize || 2);
      ctx.globalAlpha = stroke.opacity || 1;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(points[0].x * renderedWidth, points[0].y * renderedHeight);

      if (points.length === 2) {
        ctx.lineTo(points[1].x * renderedWidth, points[1].y * renderedHeight);
      } else {
        for (let i = 1; i < points.length - 1; i++) {
          const p0 = points[i];
          const p1 = points[i + 1];
          const midPointX = (p0.x + p1.x) / 2 * renderedWidth;
          const midPointY = (p0.y + p1.y) / 2 * renderedHeight;

          ctx.quadraticCurveTo(p0.x * renderedWidth, p0.y * renderedHeight, midPointX, midPointY);
        }

        const lastPoint = points[points.length - 1];
        ctx.lineTo(lastPoint.x * renderedWidth, lastPoint.y * renderedHeight);
      }

      ctx.stroke();
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    strokes.forEach(drawSmoothPath);
    if (currentPath.length > 0) {
      drawSmoothPath({
        tool,
        color: tool === 'draw' ? color : undefined,
        relativeSize: brushSize / renderedWidth,
        opacity,
        points: currentPath,
      });
    }

  }, [strokes, currentPath, imageLoaded, tool, color, brushSize, opacity, containerSize]);

  useEffect(() => {
    if (!imageLoaded) return;
    const handleResize = () => setStrokes(prev => [...prev]);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageLoaded]);

  // --- Enhanced Touch/Pointer Event Handlers ---
  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
  };

  const handleTouchStart = useCallback((e) => {
    touchCountRef.current = e.touches.length;
    if (e.touches.length > 1) {
      e.preventDefault();
      if (isDrawing) {
        setIsDrawing(false);
        setCurrentPath([]);
      }
      return;
    }
    e.preventDefault();
    const touch = e.touches[0];
    const coords = getCanvasCoordinates({ clientX: touch.clientX, clientY: touch.clientY });
    if (coords) {
      setCurrentPath([coords]);
      setIsDrawing(true);
      setRedoStack([]);
    }
  }, [isDrawing]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length > 1 || touchCountRef.current > 1) {
      e.preventDefault();
      return;
    }
    if (!isDrawing) return;
    e.preventDefault();
    const touch = e.touches[0];
    const coords = getCanvasCoordinates({ clientX: touch.clientX, clientY: touch.clientY });
    if (coords) {
      setCurrentPath(prev => [...prev, coords]);
    }
  }, [isDrawing]);

  const handleTouchEnd = useCallback((e) => {
    touchCountRef.current = e.touches.length;
    if (e.touches.length > 0) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setIsDrawing(false);
    if (currentPath.length > 0) {
      const canvas = canvasRef.current;
      const renderedWidth = parseFloat(canvas.style.width);
      const newStroke = {
        tool,
        color: tool === 'draw' ? color : undefined,
        relativeSize: brushSize / renderedWidth,
        opacity,
        points: currentPath,
      };
      setStrokes(prev => [...prev, newStroke]);
      if (tool === 'draw') {
        handleColorUsed(color);
      }
    }
    setCurrentPath([]);
  }, [currentPath, tool, color, brushSize, opacity, handleColorUsed]);

  const handlePointerDown = useCallback((e) => {
    if (e.pointerType === 'touch') return;
    if (!e.isPrimary) return;
    e.target.setPointerCapture(e.pointerId);
    activePointerIdRef.current = e.pointerId;
    const coords = getCanvasCoordinates(e);
    if (coords) {
      setCurrentPath([coords]);
      setIsDrawing(true);
      setRedoStack([]);
    }
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (e.pointerType === 'touch') return;
    if (!isDrawing || e.pointerId !== activePointerIdRef.current) return;
    const coords = getCanvasCoordinates(e);
    if (coords) {
      setCurrentPath(prev => [...prev, coords]);
    }
  }, [isDrawing]);

  const handlePointerUp = useCallback((e) => {
    if (e.pointerType === 'touch') return;
    if (e.pointerId !== activePointerIdRef.current) return;
    e.target.releasePointerCapture(e.pointerId);
    activePointerIdRef.current = null;
    setIsDrawing(false);
    if (currentPath.length > 0) {
      const canvas = canvasRef.current;
      const renderedWidth = parseFloat(canvas.style.width);
      const newStroke = {
        tool,
        color: tool === 'draw' ? color : undefined,
        relativeSize: brushSize / renderedWidth,
        opacity,
        points: currentPath,
      };
      setStrokes(prev => [...prev, newStroke]);
      if (tool === 'draw') {
        handleColorUsed(color);
      }
    }
    setCurrentPath([]);
  }, [currentPath, tool, color, brushSize, opacity, handleColorUsed]);

  const handleImageLoad = useCallback((e) => {
    if (onImageLoad) { onImageLoad(e) };
    setImageLoaded(true);
  }, [onImageLoad]);

  // ✨ NEW: Handlers to track the cursor for the eraser preview
  const handlePointerEnter = () => {
    setIsCursorVisible(true);
  };

  const handlePointerLeave = () => {
    setIsCursorVisible(false);
  };

  const handlePointerMoveForCursor = (e) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });
  };

  // --- Toolbar Actions ---
  const undo = useCallback(() => {
    if (strokes.length === 0) return;
    const lastStroke = strokes[strokes.length - 1];
    setRedoStack(prev => [...prev, lastStroke]);
    setStrokes(strokes.slice(0, -1));
  }, [strokes]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const nextStroke = redoStack[redoStack.length - 1];
    setStrokes(prev => [...prev, nextStroke]);
    setRedoStack(redoStack.slice(0, -1));
  }, [redoStack]);

  const clearCanvas = useCallback(() => {
    if (window.confirm("Apakah kamu yakin untuk membersihkan halaman ini?")) {
      setStrokes([]);
      setRedoStack([]);
      setCurrentPath([]);
    }
  }, []);

  async function checkWidth() {
    for (let index = 0; index < 15; index++) {
      if (!focus) { return }
      setContainerSize(containerRef.current?.offsetWidth)
      await sleep(500);
    }
  }

  useEffect(() => {
    if (!focus) { return }
    checkWidth()
  }, [focus])

  const handleBrushSizeChange = (size) => {
    setBrushSize(size);
    setBrushSizeDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.brush-size-dropdown')) {
        setBrushSizeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`flex lg:flex-row flex-col h-full ${className || ''}`}>
      {/* --- Toolbar --- */}
      <div className="bg-white lg:border-r border-b lg:border-b-0 border-gray-200 shadow-sm overflow-auto lg:w-48 lg:min-w-48 lg:max-w-48 lg:h-full max-h-32 lg:max-h-none">
        <div className="lg:p-2 p-0">
          <div className="flex lg:flex-col flex-row lg:gap-6 gap-1 lg:items-stretch items-center flex-nowrap lg:flex-nowrap">
            {/* Tool Selection */}
            <div className="lg:w-full">
              <h3 className="text-sm font-medium text-gray-700 mb-2 hidden lg:block">Tools</h3>
              <div className="flex lg:flex-col flex-row bg-gray-100 rounded-lg p-1 lg:gap-1 gap-0">
                <button
                  onClick={() => { setTool('draw'); setBrushSize(2); setOpacity(0.88) }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors lg:w-full lg:justify-start justify-center ${tool === 'draw'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Pencil size={16} />
                  <span className="lg:inline hidden">Draw</span>
                </button>
                <button
                  onClick={() => { setTool('erase'); setBrushSize(20); setOpacity(1) }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors lg:w-full lg:justify-start justify-center ${tool === 'erase'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Eraser size={16} />
                  <span className="lg:inline hidden">Erase</span>
                </button>
              </div>
            </div>

            {/* Color Selection */}
            {tool === 'draw' && (
              <div className="lg:w-full">
                <h3 className="text-sm font-medium text-gray-700 mb-2 hidden lg:block">Colors</h3>
                <ColorPickerDropdown
                  color={color}
                  onChange={setColor}
                  recentColors={recentColors}
                  onColorUsed={handleColorUsed}
                />
              </div>
            )}

            {/* Brush Controls */}
            <div className="lg:w-full">
              <h3 className="text-sm font-medium text-gray-700 mb-2 hidden lg:block">Brush Settings</h3>
              <div className="flex lg:flex-col flex-row lg:gap-4 gap-3">
                <div className="flex lg:flex-col flex-row lg:items-start items-center lg:gap-2 gap-2">
                  <label className="text-sm font-medium text-gray-700 lg:mb-0">Size</label>
                  <div className="brush-size-dropdown">
                    <select
                      value={brushSize}
                      onChange={(e) => handleBrushSizeChange(e.target.value)}
                      className="w-12 lg:w-full p-1 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    >
                      {brushSizeOptions[tool].map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex lg:flex-col flex-row lg:items-start items-center lg:gap-2 gap-2">
                  <label className="text-sm font-medium text-gray-700 lg:mb-0">Opacity</label>
                  <div className="flex items-center gap-2 lg:w-full">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="lg:flex-1 w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <span className="text-xs text-gray-500 lg:w-12 w-8 text-center">{Math.round(opacity * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="lg:w-full lg:ml-0 ml-auto">
              <h3 className="text-sm font-medium text-gray-700 mb-2 hidden lg:block">Actions</h3>
              <div className="flex lg:flex-col flex-row lg:gap-2 gap-1">
                <button
                  onClick={undo}
                  disabled={strokes.length === 0}
                  className="lg:flex lg:items-center lg:gap-2 lg:px-3 lg:py-2 lg:text-sm lg:font-medium lg:justify-start lg:w-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Undo"
                >
                  <Undo size={18} />
                  <span className="lg:inline hidden">Undo</span>
                </button>
                <button
                  onClick={redo}
                  disabled={redoStack.length === 0}
                  className="lg:flex lg:items-center lg:gap-2 lg:px-3 lg:py-2 lg:text-sm lg:font-medium lg:justify-start lg:w-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Redo"
                >
                  <Redo size={18} />
                  <span className="lg:inline hidden">Redo</span>
                </button>
                <button
                  onClick={clearCanvas}
                  className="lg:flex lg:items-center lg:gap-2 lg:px-3 lg:py-2 lg:text-sm lg:font-medium lg:justify-start lg:w-full p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  title="Clear canvas"
                >
                  <Trash2 size={18} />
                  <span className="lg:inline hidden">Clear</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Enhanced Canvas Container --- */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden select-none bg-background cursor-crosshair"
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onPointerMove={handlePointerMoveForCursor}
        style={{
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Drawing background"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
          onLoad={handleImageLoad}
          draggable="false"
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        />
        {imageLoaded && (
          <canvas
            ref={canvasRef}
            className="absolute"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onContextMenu={(e) => e.preventDefault()}
            onSelectStart={(e) => e.preventDefault()}
            style={{
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none'
            }}
          />
        )}

        {/* ✨ NEW: Eraser cursor preview */}
        {tool === 'erase' && isCursorVisible && (
          <div
            className="absolute rounded-full border border-gray-500 bg-gray-500 bg-opacity-20"
            style={{
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
              width: `${brushSize}px`,
              height: `${brushSize}px`,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none', // Allows clicking through the div
            }}
          />
        )}
      </div>

      {/* --- Styles --- */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default ImageDrawer;