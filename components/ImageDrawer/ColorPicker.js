import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';

const DEFAULT_PALETTE = [
  '#000000', '#404040', '#808080', '#c0c0c0', '#ffffff',
  '#ff0000', '#ff4500', '#ff8c00', '#ffa500', '#ffd700',
  '#ffff00', '#9acd32', '#32cd32', '#00fa9a', '#00ffff',
  '#00bfff', '#4169e1', '#0000ff', '#8a2be2', '#9400d3',
];

// Color conversion utilities
const hslToHex = (h, s, l) => {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const hexToHsl = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 100, l: 50 };
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
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

export default function ColorPicker({ color, onChange, recentColors = [], onColorUsed }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hsl, setHsl] = useState({ h: 0, s: 100, l: 50 });
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [isDragging, setIsDragging] = useState(null); // 'wheel' | 'sb' | null
  
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const wheelRef = useRef(null);
  const sbRef = useRef(null);

  const wheelSize = 80;
  const indicatorRadius = (wheelSize / 2) - 10;

  // Calculate wheel indicator position
  const wheelIndicator = useMemo(() => {
    const rad = ((hsl.h - 90) * Math.PI) / 180;
    return {
      x: Math.cos(rad) * indicatorRadius,
      y: Math.sin(rad) * indicatorRadius,
    };
  }, [hsl.h, indicatorRadius]);

  // Update HSL when color prop changes
  useEffect(() => {
    if (isOpen && color) {
      setHsl(hexToHsl(color));
    }
  }, [isOpen, color]);

  // Position dropdown within viewport
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + 4;
    
    if (left + 220 > window.innerWidth) left = window.innerWidth - 228;
    if (top + 320 > window.innerHeight) top = rect.top - 324;
    
    setDropdownPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current?.contains(e.target) || buttonRef.current?.contains(e.target)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Unified drag handler
  const handleDrag = useCallback((e, type) => {
    const ref = type === 'wheel' ? wheelRef : sbRef;
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;

    if (type === 'wheel') {
      const x = clientX - rect.left - rect.width / 2;
      const y = clientY - rect.top - rect.height / 2;
      let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      const newH = Math.round(angle);
      setHsl(prev => ({ ...prev, h: newH }));
      onChange(hslToHex(newH, hsl.s, hsl.l));
    } else {
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
      const newS = Math.round((x / rect.width) * 100);
      const newL = Math.round(100 - (y / rect.height) * 100);
      setHsl(prev => ({ ...prev, s: newS, l: newL }));
      onChange(hslToHex(hsl.h, newS, newL));
    }
  }, [hsl, onChange]);

  // Global drag listeners
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMove = (e) => handleDrag(e, isDragging);
    const handleUp = () => setIsDragging(null);
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, handleDrag]);

  const selectColor = (selectedColor) => {
    onChange(selectedColor);
    onColorUsed?.(selectedColor);
    setHsl(hexToHsl(selectedColor));
  };

  const handleHexInput = (val) => {
    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
      onChange(val);
      if (val.length === 7) setHsl(hexToHsl(val));
    }
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 transition-all"
      >
        <div className="w-5 h-5 rounded border border-gray-400" style={{ backgroundColor: color }} />
        <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white rounded-lg shadow-2xl border border-gray-200 p-3"
          style={{ top: dropdownPosition.top, left: dropdownPosition.left, width: 220 }}
        >
          {/* Current Color + Hex Input */}
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
            <div className="w-8 h-8 rounded border border-gray-300 flex-shrink-0" style={{ backgroundColor: color }} />
            <input
              type="text"
              value={color}
              onChange={(e) => handleHexInput(e.target.value)}
              className="flex-1 px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="#000000"
            />
          </div>

          {/* Color Wheel & Saturation/Brightness */}
          <div className="flex gap-2 mb-3">
            <div
              ref={wheelRef}
              className="relative rounded-full cursor-crosshair flex-shrink-0"
              style={{
                width: wheelSize, height: wheelSize,
                background: 'conic-gradient(from 0deg, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))',
              }}
              onMouseDown={(e) => { e.preventDefault(); setIsDragging('wheel'); handleDrag(e, 'wheel'); }}
              onTouchStart={(e) => { setIsDragging('wheel'); handleDrag(e, 'wheel'); }}
            >
              <div className="absolute inset-3 rounded-full bg-white" />
              <div
                className="absolute w-3 h-3 rounded-full border-2 border-white shadow pointer-events-none"
                style={{
                  backgroundColor: `hsl(${hsl.h}, 100%, 50%)`,
                  left: `calc(50% + ${wheelIndicator.x}px - 6px)`,
                  top: `calc(50% + ${wheelIndicator.y}px - 6px)`,
                }}
              />
            </div>
            <div
              ref={sbRef}
              className="relative flex-1 rounded cursor-crosshair overflow-hidden"
              style={{
                height: wheelSize,
                background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsl.h}, 100%, 50%))`,
              }}
              onMouseDown={(e) => { e.preventDefault(); setIsDragging('sb'); handleDrag(e, 'sb'); }}
              onTouchStart={(e) => { setIsDragging('sb'); handleDrag(e, 'sb'); }}
            >
              <div
                className="absolute w-3 h-3 rounded-full border-2 border-white shadow pointer-events-none"
                style={{
                  backgroundColor: color,
                  left: `calc(${hsl.s}% - 6px)`,
                  top: `calc(${100 - hsl.l}% - 6px)`,
                }}
              />
            </div>
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div className="mb-2">
              <p className="text-[10px] text-gray-500 uppercase mb-1">Recent</p>
              <div className="flex flex-wrap gap-1">
                {recentColors.slice(0, 8).map((rc, idx) => (
                  <button
                    key={`${rc}-${idx}`}
                    onClick={() => selectColor(rc)}
                    className={`w-5 h-5 rounded border transition-all hover:scale-110 ${color === rc ? 'border-gray-900 ring-1 ring-gray-400' : 'border-gray-300'}`}
                    style={{ backgroundColor: rc }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Palette */}
          <div>
            <p className="text-[10px] text-gray-500 uppercase mb-1">Palette</p>
            <div className="grid grid-cols-10 gap-0.5">
              {DEFAULT_PALETTE.map((pc) => (
                <button
                  key={pc}
                  onClick={() => selectColor(pc)}
                  className={`w-full aspect-square rounded-sm border transition-all hover:scale-110 ${color === pc ? 'border-gray-900 ring-1 ring-gray-400' : 'border-gray-200'}`}
                  style={{ backgroundColor: pc }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
