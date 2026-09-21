import { useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line, Rect, Circle, Arrow, Text, Transformer, Group } from 'react-konva';
import { useWhiteboardStore } from '../../store/whiteboardStore';
import { useSocket } from '../../context/SocketContext';
import { useRoomStore } from '../../store/roomStore';
import { useMeetingStore } from '../../store/meetingStore';
import {
  TbMouse, TbPencil, TbSquare, TbCircle, TbArrowUpRight,
  TbLine, TbLetterT, TbEraser, TbArrowBackUp, TbArrowForwardUp,
  TbTrash, TbDownload, TbZoomIn, TbZoomOut,
  TbHandGrab, TbNote, TbFileImport,
  TbChevronLeft, TbChevronDown, TbSettings, TbPalette,
  TbMinus, TbPlus, TbHistory, TbAlertTriangle, TbColorSwatch,
  TbPhoto, TbBraces, TbMaximize,
} from 'react-icons/tb';
import toast from 'react-hot-toast';

const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899','#ffffff','#000000','#64748b'];

const ZOOM_PRESETS = [
  { label: '50%', value: 0.5 },
  { label: '100%', value: 1 },
  { label: '200%', value: 2 },
];

function genId() { return Math.random().toString(36).slice(2, 9); }

const WB_STYLES = `
  .wb-no-scrollbar::-webkit-scrollbar { display: none; }
  .wb-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

  @keyframes wb-panel-in {
    from { opacity: 0; transform: translateY(-4px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .wb-panel-in { animation: wb-panel-in 200ms cubic-bezier(.4,0,.2,1); }

  @keyframes wb-dropdown-in {
    from { opacity: 0; transform: translateY(-6px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  .wb-dropdown-in { animation: wb-dropdown-in 160ms cubic-bezier(.4,0,.2,1); }

  @keyframes wb-cursor-in {
    from { opacity: 0; transform: translate(8px, -4px) scale(0.9); }
    to   { opacity: 1; transform: translate(8px, -4px) scale(1); }
  }
  .wb-cursor-in { animation: wb-cursor-in 200ms cubic-bezier(.4,0,.2,1) both; }

  @keyframes wb-slide-in-left {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .wb-section { animation: wb-slide-in-left 260ms cubic-bezier(.4,0,.2,1) both; }
  .wb-section-1 { animation-delay: 30ms; }
  .wb-section-2 { animation-delay: 70ms; }
  .wb-section-3 { animation-delay: 110ms; }
  .wb-section-4 { animation-delay: 150ms; }

  .wb-toolbar-btn {
    transition: background-color 150ms ease, color 150ms ease, transform 150ms ease, box-shadow 150ms ease;
  }
  .wb-toolbar-btn:active { transform: scale(0.92); }

  .wb-color-swatch {
    transition: transform 150ms cubic-bezier(.4,0,.2,1), box-shadow 150ms ease;
  }
  .wb-color-swatch:hover { transform: scale(1.14); }

  input[type="range"].wb-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      rgb(99 102 241) 0%,
      rgb(129 140 248) var(--wb-fill, 20%),
      rgb(30 41 59) var(--wb-fill, 20%),
      rgb(30 41 59) 100%
    );
    outline: none;
  }
  input[type="range"].wb-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: rgb(129 140 248);
    border: 2px solid rgb(15 23 42);
    box-shadow: 0 0 0 1px rgb(99 102 241 / 0.7), 0 2px 8px rgba(0,0,0,0.55);
    cursor: pointer;
    transition: transform 120ms ease, box-shadow 120ms ease;
  }
  input[type="range"].wb-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
    box-shadow: 0 0 0 1px rgb(99 102 241 / 0.9), 0 0 14px rgba(99,102,241,0.65);
  }
  input[type="range"].wb-slider::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: rgb(129 140 248);
    border: 2px solid rgb(15 23 42);
    cursor: pointer;
  }

  @media (prefers-reduced-motion: reduce) {
    .wb-panel-in, .wb-cursor-in, .wb-section, .wb-dropdown-in,
    .wb-toolbar-btn, .wb-color-swatch,
    input[type="range"].wb-slider::-webkit-slider-thumb {
      animation: none !important;
      transition: none !important;
    }
  }
`;

export default function WhiteboardPanel({ height = 500 }) {
  const { currentRoom } = useRoomStore();
  const { presenterId, followPresenterId } = useMeetingStore();
  const { emitWhiteboardEvent, onCursorMove, emitCursorMove } = useSocket();

  const {
    tool, setTool, color, setColor, strokeWidth, setStrokeWidth,
    shapes, addShape, updateShape, updateShapeNoHistory, deleteShapes, clearCanvas,
    zoom, setZoom, selectedIds, setSelectedIds, undo, redo,
  } = useWhiteboardStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShapeId, setCurrentShapeId] = useState(null);
  const [textInput, setTextInput] = useState(null);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [stageSize, setStageSize] = useState({ width: 800, height });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const stageRef = useRef(null);
  const containerRef = useRef(null);
  const trRef = useRef(null);
  const cursorThrottleRef = useRef(null);
  const exportMenuRef = useRef(null);

  const handleUndo = () => {
    undo();
    setTimeout(() => {
      const currentShapes = useWhiteboardStore.getState().shapes;
      emitWhiteboardEvent(currentRoom?._id, { type: 'set_state', shapes: currentShapes });
    }, 0);
  };

  const handleRedo = () => {
    redo();
    setTimeout(() => {
      const currentShapes = useWhiteboardStore.getState().shapes;
      emitWhiteboardEvent(currentRoom?._id, { type: 'set_state', shapes: currentShapes });
    }, 0);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height: h } = entries[0].contentRect;
      setStageSize({ width, height: h });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Close export menu on outside click
  useEffect(() => {
    if (!exportMenuOpen) return;
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handler);
    };
  }, [exportMenuOpen]);

  // Remote cursors
  useEffect(() => {
    const clean = onCursorMove(({ userId, name, x, y }) => {
      setRemoteCursors((prev) => ({ ...prev, [userId]: { name, x, y } }));

      if (presenterId && followPresenterId === presenterId && userId === presenterId) {
        setPan(() => ({
          x: stageSize.width / 2 - x * zoom,
          y: stageSize.height / 2 - y * zoom,
        }));
      }
    });
    return clean;
  }, [onCursorMove, presenterId, followPresenterId, stageSize.width, stageSize.height, zoom]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); handleRedo(); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          deleteShapes(selectedIds);
          emitWhiteboardEvent(currentRoom?._id, { type: 'delete', ids: selectedIds });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedIds, undo, redo, deleteShapes, emitWhiteboardEvent, currentRoom]);

  // Transformer update
  useEffect(() => {
    if (trRef.current && selectedIds.length > 0) {
      const nodes = selectedIds.map((id) => stageRef.current?.findOne(`#${id}`)).filter(Boolean);
      trRef.current.nodes(nodes);
      trRef.current.getLayer()?.batchDraw();
    } else {
      trRef.current?.nodes([]);
    }
  }, [selectedIds, shapes]);

  const getScaledPos = (stage, point) => ({
    x: (point.x - stage.x()) / stage.scaleX(),
    y: (point.y - stage.y()) / stage.scaleY(),
  });

  const handleMouseDown = useCallback((e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    if (e.target === stage) setSelectedIds([]);
    if (tool === 'select' || tool === 'hand') return;

    setIsDrawing(true);
    const pos = getScaledPos(stage, point);
    const id = genId();

    let shape = null;
    if (tool === 'pen') {
      shape = { id, type: 'line', points: [pos.x, pos.y], stroke: color, strokeWidth, lineCap: 'round', lineJoin: 'round', tension: 0.4 };
    } else if (tool === 'eraser') {
      shape = { id, type: 'line', points: [pos.x, pos.y], stroke: '#1e1b4b', strokeWidth: strokeWidth * 4, lineCap: 'round', lineJoin: 'round', globalCompositeOperation: 'destination-out', isEraser: true };
    } else if (tool === 'rect') {
      shape = { id, type: 'rect', x: pos.x, y: pos.y, width: 1, height: 1, stroke: color, strokeWidth, fill: 'transparent' };
    } else if (tool === 'circle') {
      shape = { id, type: 'circle', x: pos.x, y: pos.y, radius: 1, stroke: color, strokeWidth, fill: 'transparent' };
    } else if (tool === 'line') {
      shape = { id, type: 'straightLine', points: [pos.x, pos.y, pos.x, pos.y], stroke: color, strokeWidth, lineCap: 'round' };
    } else if (tool === 'arrow') {
      shape = { id, type: 'arrow', points: [pos.x, pos.y, pos.x, pos.y], stroke: color, strokeWidth, fill: color, pointerLength: 12, pointerWidth: 10 };
    } else if (tool === 'text') {
      setTextInput({ x: point.x, y: point.y, sceneX: pos.x, sceneY: pos.y, value: '' });
      return;
    } else if (tool === 'sticky') {
      setTextInput({ x: point.x, y: point.y, sceneX: pos.x, sceneY: pos.y, value: '', isSticky: true });
      return;
    }

    if (shape) {
      addShape(shape);
      setCurrentShapeId(id);
      emitWhiteboardEvent(currentRoom?._id, { type: 'add', shape });
    }
  }, [tool, color, strokeWidth, addShape, emitWhiteboardEvent, currentRoom, setSelectedIds]);

  const handleMouseMove = useCallback((e) => {
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    if (!point) return;

    if (!cursorThrottleRef.current) {
      emitCursorMove?.(currentRoom?._id, point.x, point.y, tool);
      cursorThrottleRef.current = setTimeout(() => { cursorThrottleRef.current = null; }, 50);
    }

    if (!isDrawing || !currentShapeId) return;
    const pos = getScaledPos(stage, point);
    const shape = useWhiteboardStore.getState().shapes.find((s) => s.id === currentShapeId);
    if (!shape) return;

    if (shape.type === 'line') {
      updateShapeNoHistory(currentShapeId, { points: [...shape.points, pos.x, pos.y] });
    } else if (shape.type === 'rect') {
      updateShapeNoHistory(currentShapeId, { width: pos.x - shape.x, height: pos.y - shape.y });
    } else if (shape.type === 'circle') {
      const r = Math.hypot(pos.x - shape.x, pos.y - shape.y);
      updateShapeNoHistory(currentShapeId, { radius: r });
    } else if (shape.type === 'straightLine' || shape.type === 'arrow') {
      updateShapeNoHistory(currentShapeId, { points: [shape.points[0], shape.points[1], pos.x, pos.y] });
    }
  }, [isDrawing, currentShapeId, updateShapeNoHistory, emitCursorMove, currentRoom, tool]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentShapeId) { setIsDrawing(false); return; }
    setIsDrawing(false);
    const shape = useWhiteboardStore.getState().shapes.find((s) => s.id === currentShapeId);
    if (shape) {
      updateShape(currentShapeId, shape);
      emitWhiteboardEvent(currentRoom?._id, { type: 'update', shape });
    }
    setCurrentShapeId(null);
  }, [isDrawing, currentShapeId, updateShape, emitWhiteboardEvent, currentRoom]);

  const handleShapeClick = (e, shapeId) => {
    if (tool !== 'select') return;
    e.cancelBubble = true;
    setSelectedIds([shapeId]);
  };

  const handleShapeDragEnd = (e, shapeId) => {
    const shape = { ...useWhiteboardStore.getState().shapes.find((s) => s.id === shapeId), x: e.target.x(), y: e.target.y() };
    updateShape(shapeId, shape);
    emitWhiteboardEvent(currentRoom?._id, { type: 'update', shape });
  };

  const handleShapeTransformEnd = (e, shapeId) => {
    const target = e.target;
    const shape = useWhiteboardStore.getState().shapes.find((s) => s.id === shapeId);
    if (!shape) return;

    let updatedShape = { ...shape };
    const scaleX = target.scaleX();
    const scaleY = target.scaleY();

    updatedShape.x = target.x();
    updatedShape.y = target.y();

    if (shape.type === 'rect') {
      updatedShape.width = (shape.width || 1) * scaleX;
      updatedShape.height = (shape.height || 1) * scaleY;
    } else if (shape.type === 'circle') {
      updatedShape.radius = (shape.radius || 1) * Math.max(scaleX, scaleY);
    } else if (shape.type === 'text') {
      updatedShape.fontSize = (shape.fontSize || 18) * Math.max(scaleX, scaleY);
    } else if (shape.type === 'sticky') {
      updatedShape.width = (shape.width || 150) * scaleX;
      updatedShape.height = (shape.height || 150) * scaleY;
    } else if (shape.type === 'line' || shape.type === 'straightLine' || shape.type === 'arrow') {
      const newPoints = [];
      for (let i = 0; i < shape.points.length; i += 2) {
        newPoints.push(shape.points[i] * scaleX);
        newPoints.push(shape.points[i + 1] * scaleY);
      }
      updatedShape.points = newPoints;
    }

    target.scaleX(1);
    target.scaleY(1);

    updateShape(shapeId, updatedShape);
    emitWhiteboardEvent(currentRoom?._id, { type: 'update', shape: updatedShape });
  };

  const handleStageDragEnd = (e) => {
    if (e.target === e.target.getStage()) setPan({ x: e.target.x(), y: e.target.y() });
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(useWhiteboardStore.getState().shapes, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'whiteboard.json';
    a.click();
    toast.success('Exported JSON');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          useWhiteboardStore.getState().setShapes(imported);
          emitWhiteboardEvent(currentRoom?._id, { type: 'set_state', shapes: imported });
          toast.success('Imported JSON successfully');
        }
      } catch { toast.error('Invalid JSON file'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput?.value.trim()) { setTextInput(null); return; }
    const id = genId();
    let shape;
    if (textInput.isSticky) {
      shape = { id, type: 'sticky', x: textInput.sceneX, y: textInput.sceneY, text: textInput.value, fill: '#fef08a', stroke: '#eab308' };
    } else {
      shape = { id, type: 'text', x: textInput.sceneX, y: textInput.sceneY, text: textInput.value, fill: color, fontSize: 18, fontFamily: 'Inter, sans-serif' };
    }
    addShape(shape);
    emitWhiteboardEvent(currentRoom?._id, { type: 'add', shape });
    setTextInput(null);
  };

  const handleClear = () => {
    if (!window.confirm('Clear canvas? This cannot be undone.')) return;
    clearCanvas();
    emitWhiteboardEvent(currentRoom?._id, { type: 'clear' });
  };

  const handleExport = () => {
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 });
    const a = document.createElement('a'); a.href = uri; a.download = 'whiteboard.png'; a.click();
    toast.success('Exported PNG');
  };

  const renderShape = (shape) => {
    const common = {
      id: shape.id,
      onClick: (e) => handleShapeClick(e, shape.id),
      draggable: tool === 'select',
      onDragEnd: (e) => handleShapeDragEnd(e, shape.id),
      onTransformEnd: (e) => handleShapeTransformEnd(e, shape.id),
    };
    if (shape.type === 'line') return <Line key={shape.id} {...common} points={shape.points} stroke={shape.stroke} strokeWidth={shape.strokeWidth} lineCap={shape.lineCap} lineJoin={shape.lineJoin} tension={shape.tension || 0} globalCompositeOperation={shape.isEraser ? 'destination-out' : 'source-over'} />;
    if (shape.type === 'rect') return <Rect key={shape.id} {...common} x={shape.x} y={shape.y} width={shape.width} height={shape.height} stroke={shape.stroke} strokeWidth={shape.strokeWidth} fill={shape.fill || 'transparent'} />;
    if (shape.type === 'circle') return <Circle key={shape.id} {...common} x={shape.x} y={shape.y} radius={shape.radius} stroke={shape.stroke} strokeWidth={shape.strokeWidth} fill={shape.fill || 'transparent'} />;
    if (shape.type === 'straightLine') return <Line key={shape.id} {...common} points={shape.points} stroke={shape.stroke} strokeWidth={shape.strokeWidth} lineCap="round" />;
    if (shape.type === 'text') return <Text key={shape.id} {...common} x={shape.x} y={shape.y} text={shape.text} fill={shape.fill} fontSize={shape.fontSize} fontFamily={shape.fontFamily} />;
    if (shape.type === 'sticky') {
      return (
        <Group key={shape.id} {...common} x={shape.x} y={shape.y}>
          <Rect width={shape.width || 150} height={shape.height || 150} fill={shape.fill} stroke={shape.stroke} strokeWidth={1} cornerRadius={4} shadowColor="black" shadowBlur={4} shadowOffset={{ x: 2, y: 2 }} shadowOpacity={0.15} />
          <Text width={shape.width || 150} height={shape.height || 150} text={shape.text} fill="#1e293b" align="center" verticalAlign="middle" padding={10} wrap="char" fontSize={16} fontFamily="Inter, sans-serif" />
        </Group>
      );
    }
    if (shape.type === 'arrow') return <Arrow {...common} points={shape.points} stroke={shape.stroke} fill={shape.fill || shape.stroke} strokeWidth={shape.strokeWidth} pointerLength={shape.pointerLength || 12} pointerWidth={shape.pointerWidth || 10} />;
    return null;
  };

  const toolBtn = (id, icon, label) => {
    const active = tool === id;
    return (
      <button
        key={id}
        title={label}
        onClick={() => setTool(id)}
        aria-label={label}
        aria-pressed={active}
        className={`wb-toolbar-btn group relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 ${
          active
            ? 'bg-primary-600 text-white shadow-md shadow-primary-950/60'
            : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-100'
        }`}
      >
        {icon}
        {active && (
          <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-primary-400/40" />
        )}
      </button>
    );
  };

  const sep = <span className="mx-0.5 h-5 w-px flex-shrink-0 bg-slate-800/90" />;

  const sliderPercent = ((strokeWidth - 1) / (30 - 1)) * 100;

  const toolLabels = {
    select: 'Select',
    hand: 'Pan',
    pen: 'Pen',
    line: 'Line',
    arrow: 'Arrow',
    rect: 'Rectangle',
    circle: 'Circle',
    text: 'Text',
    sticky: 'Sticky Note',
    eraser: 'Eraser',
  };

  return (
    <div className="relative flex h-full w-full select-none flex-col overflow-hidden bg-[#0b0f19]">
      <style>{WB_STYLES}</style>

      {/* TOP TOOLBAR + EXPORT DROPDOWN */}
      <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-2 sm:top-4">
        <div className="pointer-events-auto flex max-w-full items-center gap-1.5">

          {/* Tool group */}
          <div
            className="wb-panel-in flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/80 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl wb-no-scrollbar"
            style={{
              boxShadow:
                'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 20px 40px -20px rgba(0,0,0,0.8)',
            }}
          >
            {toolBtn('select', <TbMouse size={16} strokeWidth={2} />, 'Select (V)')}
            {toolBtn('hand', <TbHandGrab size={16} strokeWidth={2} />, 'Pan (H)')}
            {sep}
            {toolBtn('pen', <TbPencil size={16} strokeWidth={2} />, 'Pen (P)')}
            {toolBtn('line', <TbLine size={16} strokeWidth={2} />, 'Line')}
            {toolBtn('arrow', <TbArrowUpRight size={16} strokeWidth={2} />, 'Arrow')}
            {sep}
            {toolBtn('rect', <TbSquare size={16} strokeWidth={2} />, 'Rectangle')}
            {toolBtn('circle', <TbCircle size={16} strokeWidth={2} />, 'Circle')}
            {sep}
            {toolBtn('text', <TbLetterT size={16} strokeWidth={2} />, 'Text')}
            {toolBtn('sticky', <TbNote size={16} strokeWidth={2} />, 'Sticky Note')}
            {sep}
            {toolBtn('eraser', <TbEraser size={16} strokeWidth={2} />, 'Eraser')}
          </div>

          {/* Export button */}
          <div ref={exportMenuRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setExportMenuOpen((v) => !v)}
              title="Export / Import"
              aria-label="Export / Import"
              aria-haspopup="menu"
              aria-expanded={exportMenuOpen}
              className={`wb-panel-in group flex h-11 items-center gap-1.5 rounded-xl border px-3 text-[12px] font-semibold shadow-2xl shadow-black/60 backdrop-blur-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 active:scale-[0.97] ${
                exportMenuOpen
                  ? 'border-primary-500/50 bg-primary-500/[0.12] text-primary-200'
                  : 'border-slate-800/80 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:bg-slate-900 hover:text-white'
              }`}
              style={{
                boxShadow: exportMenuOpen
                  ? 'inset 0 1px 0 0 rgba(255,255,255,0.06), 0 20px 40px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.15)'
                  : 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 20px 40px -20px rgba(0,0,0,0.8)',
              }}
            >
              <TbDownload
                size={15}
                strokeWidth={2.2}
                className={`transition-transform duration-200 ${
                  exportMenuOpen ? 'translate-y-0' : 'group-hover:translate-y-0.5'
                }`}
              />
              <span className="hidden sm:inline">Export</span>
              <TbChevronDown
                size={13}
                strokeWidth={2.6}
                className={`flex-shrink-0 transition-transform duration-200 ${
                  exportMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {exportMenuOpen && (
              <div
                role="menu"
                className="wb-dropdown-in absolute right-0 top-full z-30 mt-2 w-[200px] origin-top-right overflow-hidden rounded-xl border border-slate-800/90 bg-slate-900/95 shadow-2xl shadow-black/70 backdrop-blur-xl"
                style={{
                  boxShadow:
                    'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 24px 48px -12px rgba(0,0,0,0.85)',
                }}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

                <div className="px-2 py-1.5">
                  <p className="mb-1 px-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Download
                  </p>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { handleExport(); setExportMenuOpen(false); }}
                    className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[12px] font-medium text-slate-300 outline-none transition-colors hover:bg-slate-800/80 hover:text-white focus-visible:bg-slate-800 focus-visible:text-white"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-emerald-500/[0.12] text-emerald-400 ring-1 ring-emerald-500/20">
                      <TbPhoto size={12} strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">PNG Image</span>
                      <span className="block truncate text-[10px] text-slate-500">
                        Raster snapshot
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => { handleExportJSON(); setExportMenuOpen(false); }}
                    className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[12px] font-medium text-slate-300 outline-none transition-colors hover:bg-slate-800/80 hover:text-white focus-visible:bg-slate-800 focus-visible:text-white"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-sky-500/[0.12] text-sky-400 ring-1 ring-sky-500/20">
                      <TbBraces size={12} strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">JSON Data</span>
                      <span className="block truncate text-[10px] text-slate-500">
                        Full shape data
                      </span>
                    </span>
                  </button>
                </div>

                <div className="mx-2 h-px bg-slate-800/80" />

                <div className="px-2 py-1.5">
                  <p className="mb-1 px-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Upload
                  </p>

                  <label
                    role="menuitem"
                    className="group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[12px] font-medium text-slate-300 outline-none transition-colors hover:bg-slate-800/80 hover:text-white focus-within:bg-slate-800 focus-within:text-white"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-violet-500/[0.12] text-violet-400 ring-1 ring-violet-500/20">
                      <TbFileImport size={12} strokeWidth={2.2} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">Import JSON</span>
                      <span className="block truncate text-[10px] text-slate-500">
                        Restore from file
                      </span>
                    </span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => { handleImportJSON(e); setExportMenuOpen(false); }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SETTINGS PANEL */}
      {panelCollapsed ? (
        <button
          onClick={() => setPanelCollapsed(false)}
          title="Show Canvas Settings"
          aria-label="Show Canvas Settings"
          className="wb-panel-in absolute left-3 top-[68px] z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800/80 bg-slate-900/85 text-slate-400 shadow-2xl shadow-black/50 backdrop-blur-xl transition-all hover:border-primary-500/40 hover:text-primary-400 sm:left-4"
        >
          <TbSettings size={18} strokeWidth={2} />
        </button>
      ) : (
        <div
          className="wb-panel-in absolute left-3 top-[68px] z-20 flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/85 text-white shadow-2xl shadow-black/60 backdrop-blur-xl sm:left-4"
          style={{
            width: 'min(272px, calc(100vw - 1.5rem))',
            maxHeight: 'calc(100% - 88px)',
            boxShadow:
              'inset 0 1px 0 0 rgba(255,255,255,0.04), 0 24px 48px -12px rgba(0,0,0,0.8)',
          }}
        >
          {/* Header */}
          <div className="relative flex flex-shrink-0 items-center justify-between gap-2 border-b border-slate-800/80 bg-slate-950/50 px-3 py-3">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

            <div className="flex min-w-0 items-center gap-2.5">
              <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500/25 to-primary-700/10 ring-1 ring-primary-500/30">
                <TbPalette size={14} className="text-primary-300" strokeWidth={2.2} />
                <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-semibold leading-tight tracking-[-0.005em] text-slate-100">
                  Canvas Settings
                </p>
                <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">
                  Active · <span className="text-primary-400">{toolLabels[tool] || tool}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setPanelCollapsed(true)}
              title="Minimize Panel"
              aria-label="Minimize Panel"
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <TbChevronLeft size={14} strokeWidth={2.4} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto wb-no-scrollbar">

            {/* STROKE COLOR */}
            <div className="wb-section wb-section-1 border-b border-slate-800/60 px-3.5 py-3.5">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <TbColorSwatch size={11} className="text-slate-500" strokeWidth={2.4} />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Stroke Color
                  </p>
                </div>
                <span
                  className="h-4 w-4 flex-shrink-0 rounded-full ring-1 ring-slate-700"
                  style={{ background: color }}
                  title={color}
                />
              </div>

              <div className="grid grid-cols-6 gap-2">
                {COLORS.map((c) => {
                  const isSelected = color === c;
                  const isLight = c === '#ffffff';
                  const isDark = c === '#000000';
                  return (
                    <button
                      key={c}
                      title={c}
                      onClick={() => setColor(c)}
                      aria-label={`Color ${c}`}
                      aria-pressed={isSelected}
                      className={`wb-color-swatch relative h-6 w-6 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                        isSelected ? 'scale-110' : ''
                      }`}
                      style={{
                        background: c,
                        boxShadow: isSelected
                          ? '0 0 0 2px rgb(15 23 42), 0 0 0 4px rgb(99 102 241), 0 0 14px rgba(99,102,241,0.55)'
                          : isLight || isDark
                          ? '0 0 0 1px rgb(71 85 105)'
                          : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
                      }}
                    >
                      {isSelected && (
                        <span
                          className="pointer-events-none absolute inset-0 flex items-center justify-center"
                          style={{ color: isLight ? '#0f172a' : '#ffffff' }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-slate-800/80 bg-slate-950/50 p-2">
                <label className="relative flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-slate-800 transition-transform hover:scale-105">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    title="Custom color"
                  />
                  <span
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      background:
                        'conic-gradient(from 0deg, #ef4444, #f97316, #eab308, #22c55e, #3b82f6, #8b5cf6, #ec4899, #ef4444)',
                    }}
                  />
                  <span className="pointer-events-none absolute inset-[3px] rounded-full bg-slate-900" />
                  <span
                    className="pointer-events-none absolute inset-[6px] rounded-full ring-1 ring-slate-900/60"
                    style={{ background: color }}
                  />
                </label>

                <div className="min-w-0 flex-1">
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                    Custom Color
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-200">
                    {color}
                  </p>
                </div>
              </div>
            </div>

            {/* STROKE WIDTH */}
            <div className="wb-section wb-section-2 border-b border-slate-800/60 px-3.5 py-3.5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-primary-400" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Stroke Width
                  </p>
                </div>
                <span className="rounded-md border border-primary-500/30 bg-primary-500/[0.10] px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-primary-300">
                  {strokeWidth}px
                </span>
              </div>

              <div className="mb-2.5 flex h-8 items-center justify-center rounded-lg border border-slate-800/80 bg-slate-950/50 px-3">
                <div
                  className="rounded-full"
                  style={{
                    width: '100%',
                    height: Math.min(strokeWidth, 20),
                    background: color,
                    boxShadow: '0 0 8px rgba(99,102,241,0.15)',
                  }}
                />
              </div>

              <input
                type="range"
                min={1}
                max={30}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="wb-slider w-full"
                aria-label="Stroke width"
                style={{ '--wb-fill': `${sliderPercent}%` }}
              />

              <div className="mt-2 flex items-center justify-between text-[9.5px] font-medium text-slate-600">
                <span>Thin</span>
                <span>Thick</span>
              </div>
            </div>

            {/* HISTORY */}
            <div className="wb-section wb-section-3 border-b border-slate-800/60 px-3.5 py-3.5">
              <div className="mb-2.5 flex items-center gap-1.5">
                <TbHistory size={11} className="text-slate-500" strokeWidth={2.4} />
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  History
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleUndo}
                  title="Undo (Ctrl+Z)"
                  aria-label="Undo"
                  className="group flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 py-2 text-[11px] font-semibold text-slate-300 outline-none transition-all hover:border-slate-700 hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500/40 active:scale-[0.97]"
                >
                  <TbArrowBackUp
                    size={13}
                    strokeWidth={2.2}
                    className="transition-transform duration-150 group-hover:-translate-x-0.5"
                  />
                  <span>Undo</span>
                </button>

                <button
                  onClick={handleRedo}
                  title="Redo (Ctrl+Y)"
                  aria-label="Redo"
                  className="group flex items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 py-2 text-[11px] font-semibold text-slate-300 outline-none transition-all hover:border-slate-700 hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500/40 active:scale-[0.97]"
                >
                  <TbArrowForwardUp
                    size={13}
                    strokeWidth={2.2}
                    className="transition-transform duration-150 group-hover:translate-x-0.5"
                  />
                  <span>Redo</span>
                </button>
              </div>
            </div>

            {/* ZOOM */}
            <div className="wb-section wb-section-4 border-b border-slate-800/60 px-3.5 py-3.5">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <TbMaximize size={11} className="text-slate-500" strokeWidth={2.4} />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Zoom
                  </p>
                </div>
                <button
                  onClick={() => setZoom(1)}
                  className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 transition-colors hover:text-primary-400"
                  title="Reset zoom to 100%"
                >
                  Reset
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 p-1">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  title="Zoom out"
                  aria-label="Zoom out"
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-slate-400 outline-none transition-colors hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500/40"
                >
                  <TbMinus size={13} strokeWidth={2.6} />
                </button>

                <div className="relative flex-1 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-200"
                    style={{ width: `${((zoom - 0.5) / (4 - 0.5)) * 100}%` }}
                  />
                </div>

                <span className="flex-shrink-0 select-none min-w-[42px] text-center text-[11px] font-bold tabular-nums text-slate-200">
                  {Math.round(zoom * 100)}%
                </span>

                <button
                  onClick={() => setZoom(Math.min(4, zoom + 0.25))}
                  title="Zoom in"
                  aria-label="Zoom in"
                  className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-slate-400 outline-none transition-colors hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-primary-500/40"
                >
                  <TbPlus size={13} strokeWidth={2.6} />
                </button>
              </div>

              <div className="mt-2 flex items-center gap-1">
                {ZOOM_PRESETS.map((preset) => {
                  const active = Math.abs(zoom - preset.value) < 0.01;
                  return (
                    <button
                      key={preset.label}
                      onClick={() => setZoom(preset.value)}
                      className={`flex-1 rounded-md border py-1 text-[10px] font-semibold tabular-nums outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary-500/40 ${
                        active
                          ? 'border-primary-500/40 bg-primary-500/[0.10] text-primary-300'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DANGER ZONE */}
            <div className="px-3.5 py-3.5">
              <div className="mb-2.5 flex items-center gap-1.5">
                <TbAlertTriangle size={11} className="text-red-400/80" strokeWidth={2.4} />
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-red-400/80">
                  Danger Zone
                </p>
              </div>

              <button
                onClick={handleClear}
                className="group flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-900/40 bg-red-950/20 py-2 text-[11px] font-semibold text-red-400 outline-none transition-all hover:border-red-800/60 hover:bg-red-900/25 hover:text-red-300 focus-visible:ring-2 focus-visible:ring-red-500/40 active:scale-[0.97]"
                title="Clear Canvas"
              >
                <TbTrash
                  size={13}
                  strokeWidth={2.2}
                  className="transition-transform duration-150 group-hover:scale-110"
                />
                <span>Clear Canvas</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CANVAS */}
      <div
        ref={containerRef}
        className="relative flex-1 w-full h-full overflow-hidden"
        style={{
          backgroundColor: '#0b0f19',
          backgroundImage:
            'radial-gradient(circle, rgba(148,163,184,0.09) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0',
        }}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          x={pan.x}
          y={pan.y}
          draggable={tool === 'hand'}
          onDragEnd={handleStageDragEnd}
          scaleX={zoom}
          scaleY={zoom}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          style={{
            cursor:
              tool === 'eraser'
                ? 'cell'
                : tool === 'text' || tool === 'sticky'
                ? 'text'
                : tool === 'hand'
                ? 'grab'
                : tool === 'select'
                ? 'default'
                : 'crosshair',
          }}
        >
          <Layer>
            {shapes.map(renderShape)}
            <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => newBox} />
          </Layer>
        </Stage>

        {/* Remote cursors */}
        {Object.entries(remoteCursors).map(([userId, cursor]) => (
          <div
            key={userId}
            className="wb-cursor-in pointer-events-none absolute z-10 flex items-center gap-1.5"
            style={{ left: cursor.x, top: cursor.y }}
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-indigo-500/25 blur-md" />
              <div className="relative h-2.5 w-2.5 rounded-full bg-indigo-400 ring-4 ring-indigo-500/20" />
            </div>
            <span
              className="whitespace-nowrap rounded-full border border-indigo-400/30 bg-indigo-600/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-2xl backdrop-blur-sm"
              style={{
                boxShadow:
                  '0 1px 0 0 rgba(255,255,255,0.15) inset, 0 4px 12px -4px rgba(0,0,0,0.6)',
              }}
            >
              {cursor.name}
            </span>
          </div>
        ))}

        {/* Text / Sticky input overlay */}
        {textInput && (
          <form
            onSubmit={handleTextSubmit}
            style={{
              position: 'absolute',
              left: textInput.x,
              top: textInput.y,
              zIndex: 20,
            }}
          >
            <input
              autoFocus
              type="text"
              value={textInput.value}
              onChange={(e) =>
                setTextInput((p) => ({ ...p, value: e.target.value }))
              }
              onBlur={handleTextSubmit}
              className="min-w-[120px] border-b-2 border-primary-500 bg-transparent px-1 text-lg outline-none placeholder:text-slate-600"
              style={{
                color,
                fontFamily: 'Inter, sans-serif',
                fontSize: 18,
              }}
              placeholder="Type here..."
            />
          </form>
        )}
      </div>
    </div>
  );
}