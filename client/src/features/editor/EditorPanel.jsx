import { useCallback, useEffect, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import * as Y from 'yjs';
import { useSocket } from '../../context/SocketContext';
import { useRoomStore } from '../../store/roomStore';
import { useEditorStore } from '../../store/editorStore';
import { TbCopy, TbDownload, TbCheck, TbWand, TbPlayerPlay, TbRefresh, TbExternalLink, TbTerminal, TbSparkles, TbX, TbBug, TbShieldCheck, TbGauge, TbLetterCase, TbMessage2 } from 'react-icons/tb';
import toast from 'react-hot-toast';
import { MonacoBinding } from 'y-monaco';
import { Awareness } from 'y-protocols/awareness';
import * as awarenessProtocol from 'y-protocols/awareness';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'c', label: 'C' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'html', label: 'HTML' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
];

const EXT = {
  javascript: 'js', typescript: 'ts', python: 'py', java: 'java',
  cpp: 'cpp', c: 'c', csharp: 'cs', php: 'php', html: 'html', css: 'css', json: 'json', markdown: 'md',
  rust: 'rs', go: 'go',
};

const TEMPLATES = {
  javascript: 'console.log("Hello JavaScript");\n',
  typescript: 'console.log("Hello TypeScript");\n',
  python: 'print("Hello Python")\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello Java");\n    }\n}\n',
  cpp: '#include <iostream>\n\nusing namespace std;\n\nint main() {\n    cout << "Hello C++" << endl;\n    return 0;\n}\n',
  c: '#include <stdio.h>\n\nint main() {\n    printf("Hello C\\n");\n    return 0;\n}\n',
  csharp: 'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        Console.WriteLine("Hello C#");\n    }\n}\n',
  php: '<?php\n\necho "Hello PHP";\n',
  html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Hello HTML</title>\n</head>\n<body>\n    <h1>Hello HTML</h1>\n</body>\n</html>\n',
  json: '{\n    "message": "Hello JSON"\n}\n',
  markdown: '# Hello Markdown\n',
  rust: 'fn main() {\n    println!("Hello Rust");\n}\n',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello Go")\n}\n',
};

// Language display metadata for UI (visual only)
const LANG_META = {
  javascript: { label: 'JavaScript', short: 'JS', color: 'text-yellow-400', dot: 'bg-yellow-400', chip: 'border-yellow-500/30 bg-yellow-500/[0.06] text-yellow-300' },
  typescript: { label: 'TypeScript', short: 'TS', color: 'text-sky-400', dot: 'bg-sky-400', chip: 'border-sky-500/30 bg-sky-500/[0.06] text-sky-300' },
  python: { label: 'Python', short: 'PY', color: 'text-blue-400', dot: 'bg-blue-400', chip: 'border-blue-500/30 bg-blue-500/[0.06] text-blue-300' },
  java: { label: 'Java', short: 'JAVA', color: 'text-orange-400', dot: 'bg-orange-400', chip: 'border-orange-500/30 bg-orange-500/[0.06] text-orange-300' },
  cpp: { label: 'C++', short: 'C++', color: 'text-indigo-400', dot: 'bg-indigo-400', chip: 'border-indigo-500/30 bg-indigo-500/[0.06] text-indigo-300' },
  c: { label: 'C', short: 'C', color: 'text-cyan-400', dot: 'bg-cyan-400', chip: 'border-cyan-500/30 bg-cyan-500/[0.06] text-cyan-300' },
  csharp: { label: 'C#', short: 'C#', color: 'text-violet-400', dot: 'bg-violet-400', chip: 'border-violet-500/30 bg-violet-500/[0.06] text-violet-300' },
  php: { label: 'PHP', short: 'PHP', color: 'text-purple-400', dot: 'bg-purple-400', chip: 'border-purple-500/30 bg-purple-500/[0.06] text-purple-300' },
  html: { label: 'HTML', short: 'HTML', color: 'text-orange-400', dot: 'bg-orange-400', chip: 'border-orange-500/30 bg-orange-500/[0.06] text-orange-300' },
  css: { label: 'CSS', short: 'CSS', color: 'text-blue-400', dot: 'bg-blue-400', chip: 'border-blue-500/30 bg-blue-500/[0.06] text-blue-300' },
  json: { label: 'JSON', short: 'JSON', color: 'text-amber-400', dot: 'bg-amber-400', chip: 'border-amber-500/30 bg-amber-500/[0.06] text-amber-300' },
  markdown: { label: 'Markdown', short: 'MD', color: 'text-slate-300', dot: 'bg-slate-300', chip: 'border-slate-500/30 bg-slate-500/[0.06] text-slate-300' },
  rust: { label: 'Rust', short: 'RS', color: 'text-orange-500', dot: 'bg-orange-500', chip: 'border-orange-500/30 bg-orange-500/[0.06] text-orange-400' },
  go: { label: 'Go', short: 'GO', color: 'text-cyan-400', dot: 'bg-cyan-400', chip: 'border-cyan-500/30 bg-cyan-500/[0.06] text-cyan-300' },
};

/**
 * Wraps raw code in a full HTML document with runtime error catching.
 * For proper HTML documents (<html> tag present), injects error handler into <head>.
 */
function buildPreviewDocument(code) {
  if (!code || code.trim() === '') return '';

  const errorCatcher = `<script>
(function() {
  window.onerror = function(msg, src, line, col, err) {
    var d = document.createElement('div');
    d.style.cssText = [
      'position:fixed;bottom:0;left:0;right:0;z-index:9999',
      'background:#1a0000;color:#f87171;border-top:2px solid #dc2626',
      'padding:10px 16px;font:13px/1.5 monospace;white-space:pre-wrap',
    ].join(';');
    d.textContent = '\u26A0\uFE0F JS Error: ' + msg + (line ? ' (line ' + line + ')' : '');
    document.body.appendChild(d);
    return false;
  };
  var _origError = console.error;
  console.error = function() {
    var d = document.createElement('div');
    d.style.cssText = [
      'position:fixed;bottom:0;left:0;right:0;z-index:9999',
      'background:#1a0000;color:#f87171;border-top:2px solid #dc2626',
      'padding:10px 16px;font:13px/1.5 monospace;white-space:pre-wrap',
    ].join(';');
    d.textContent = '\u26A0\uFE0F Console Error: ' + Array.from(arguments).join(' ');
    document.body.appendChild(d);
    _origError.apply(console, arguments);
  };
})();
<\/script>`;

  const lc = code.toLowerCase();
  if (lc.includes('<html')) {
    // Full HTML doc — inject error catcher into <head> or prepend to <body>
    if (lc.includes('<head>')) {
      return code.replace(/<head>/i, '<head>\n' + errorCatcher);
    }
    if (lc.includes('<head')) {
      return code.replace(/<head[^>]*>/i, (m) => m + '\n' + errorCatcher);
    }
    return errorCatcher + code;
  }

  // Partial HTML snippet — wrap in a full document
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${errorCatcher}
  <style>body { font-family: system-ui, sans-serif; }</style>
</head>
<body>
${code}
</body>
</html>`;
}

export default function EditorPanel() {
  const { currentRoom, currentSession } = useRoomStore();
  const {
    language, setLanguage,
    theme: editorTheme, setTheme: setEditorTheme,
    fontSize, setFontSize,
  } = useEditorStore();
  const {
    emitEditorSync, emitEditorUpdate, emitEditorAwareness,
    emitLanguageChange, onYjsSync, onYjsUpdate, onYjsAwareness,
    onLanguageChange, isConnected, emitTypingStart, emitTypingStop,
    emitPreviewSync, onPreviewSync,
    emitCodeRun, emitCodeOutput, onCodeRun, onCodeOutput,
  } = useSocket();

  const [editorValue, setEditorValue] = useState('// Start coding here...\n');
  const [saveStatus, setSaveStatus] = useState('saved');
  const [copied, setCopied] = useState(false);

  // Console output state (JavaScript runner)
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState([]);
  const [showConsole, setShowConsole] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState(null);
  const [showReview, setShowReview] = useState(false);

  // HTML Preview state
  const [previewHtml, setPreviewHtml] = useState('');
  const [isHtmlPreviewOpen, setIsHtmlPreviewOpen] = useState(false);
  const [previewLastUser, setPreviewLastUser] = useState(null); // {name, timestamp}
  const isReceivingRemotePreview = useRef(false); // prevent echo loop

  // Yjs + Editor refs
  const ydocRef = useRef(null);
  const editorRef = useRef(null);
  const bindingRef = useRef(null);
  const awarenessRef = useRef(null);
  const isApplyingUpdate = useRef(false);
  const saveTimer = useRef(null);
  const typingTimeoutRef = useRef(null);
  const runCodeRef = useRef(null);
  const [editorReady, setEditorReady] = useState(false);

  // ── HTML Preview: close when switching away from HTML ───────────────────
  useEffect(() => {
    if (language !== 'html') {
      setPreviewHtml('');
      setPreviewLastUser(null);
      setIsHtmlPreviewOpen(false);
    }
  }, [language]);

  // ── Receive remote preview sync from other participants ────────────────
  useEffect(() => {
    if (!onPreviewSync) return;
    const cleanup = onPreviewSync(({ html, userName, timestamp }) => {
      if (!html) return;
      isReceivingRemotePreview.current = true;
      setPreviewHtml(html);
      setIsHtmlPreviewOpen(true);
      setPreviewLastUser({ name: userName, timestamp });
      // reset the flag after a tick so local changes still work
      setTimeout(() => { isReceivingRemotePreview.current = false; }, 100);
    });
    return cleanup;
  }, [onPreviewSync]);

  // ── Receive remote code execution sync ─────────────────────────────────
  useEffect(() => {
    if (!onCodeRun || !onCodeOutput) return;
    
    const cleanRun = onCodeRun(({ language: runLang, userName }) => {
      if (language === runLang) {
        setShowConsole(true);
        setIsRunning(true);
        setOutput([`Executing code... (started by ${userName})`]);
      }
    });

    const cleanOutput = onCodeOutput(({ output: newOutput, language: runLang, userName, executionTime }) => {
      if (language === runLang) {
        setShowConsole(true);
        setIsRunning(false);
        const finalOutput = [...newOutput];
        if (executionTime) {
          finalOutput.push(`\n[Execution time: ${executionTime}ms]`);
        }
        setOutput(finalOutput);
      }
    });

    return () => {
      cleanRun();
      cleanOutput();
    };
  }, [onCodeRun, onCodeOutput, language]);

  // ── Run HTML manually (Run button) ─────────────────────────────────────
  const handleRunHtml = useCallback(() => {
    if (isHtmlPreviewOpen) {
      setIsHtmlPreviewOpen(false);
      setPreviewHtml('');
      setPreviewLastUser(null);
      return;
    }

    const code = editorRef.current?.getValue() || '';
    const html = buildPreviewDocument(code);
    setPreviewHtml(html);
    setIsHtmlPreviewOpen(true);
    if (currentRoom?._id && isConnected && html) {
      emitPreviewSync(currentRoom._id, html);
      toast.success('Preview synced to all participants!', { duration: 1500 });
    }
  }, [currentRoom?._id, isConnected, emitPreviewSync, isHtmlPreviewOpen]);

  const handleRefreshHtml = useCallback(() => {
    const code = editorRef.current?.getValue() || '';
    const html = buildPreviewDocument(code);
    setPreviewHtml(html);
    setIsHtmlPreviewOpen(true);
    if (currentRoom?._id && isConnected && html) {
      emitPreviewSync(currentRoom._id, html);
      toast.success('Preview synced to all participants!', { duration: 1500 });
    }
  }, [currentRoom?._id, isConnected, emitPreviewSync]);

  // ── Yjs setup ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentRoom || !editorReady || !editorRef.current) return;

    const doc = new Y.Doc();
    ydocRef.current = doc;
    const ytext = doc.getText('codestate');

    const awareness = new Awareness(doc);
    awarenessRef.current = awareness;

    // Bind Monaco ↔ Yjs
    bindingRef.current = new MonacoBinding(
      ytext,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      awareness
    );

    // Send state vector to get current document state
    const stateVector = Y.encodeStateVector(doc);
    emitEditorSync(currentRoom._id, 'sv', Array.from(stateVector));

    const handleLocalUpdate = (update, origin) => {
      if (origin !== 'socket' && isConnected) {
        setSaveStatus('saving');
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => setSaveStatus('saved'), 1500);
        emitEditorUpdate(currentRoom._id, Array.from(update));
      }
    };
    doc.on('update', handleLocalUpdate);

    const handleAwarenessUpdate = ({ added, updated, removed }, origin) => {
      if (origin !== 'socket' && isConnected) {
        const changedClients = added.concat(updated).concat(removed);
        const update = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients);
        emitEditorAwareness(currentRoom._id, Array.from(update));
      }
    };
    awareness.on('update', handleAwarenessUpdate);

    const cleanSync = onYjsSync(({ type, data }) => {
      if (type === 'update' && data?.length) {
        try {
          Y.applyUpdate(doc, new Uint8Array(data), 'socket');
          if (ytext.toString() === '') {
            const defaultTemplate = TEMPLATES[language] || '';
            if (defaultTemplate) {
              doc.transact(() => { ytext.insert(0, defaultTemplate); }, 'local');
            }
          }
        } catch (e) { console.warn('Yjs sync error:', e); }
      }
    });

    const cleanUpdate = onYjsUpdate(({ update }) => {
      try { Y.applyUpdate(doc, new Uint8Array(update), 'socket'); }
      catch (e) { console.warn('Yjs update error:', e); }
    });

    const cleanAwareness = onYjsAwareness(({ update }) => {
      try { awarenessProtocol.applyAwarenessUpdate(awareness, new Uint8Array(update), 'socket'); }
      catch (e) { console.warn('Yjs awareness error:', e); }
    });

    const cleanLang = onLanguageChange(({ language: newLang, name }) => {
      setLanguage(newLang);
      toast(`${name} changed language to ${newLang}`, { icon: '📝', duration: 2000 });
    });

    return () => {
      doc.off('update', handleLocalUpdate);
      awareness.off('update', handleAwarenessUpdate);
      cleanSync(); cleanUpdate(); cleanAwareness(); cleanLang();
      bindingRef.current?.destroy();
      doc.destroy();
      clearTimeout(saveTimer.current);
    };
  }, [currentRoom?._id, isConnected, editorReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Editor change handler (typing indicators) ──────────────────────────
  const handleEditorChange = useCallback((value) => {
    setEditorValue(value ?? '');
    emitTypingStart(currentRoom?._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop(currentRoom?._id);
    }, 2000);
  }, [currentRoom?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Format document ─────────────────────────────────────────────────────
  const handleFormat = () => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
  };

  // ── Language change ─────────────────────────────────────────────────────
  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    const tpl = TEMPLATES[lang] || '';

    setLanguage(lang);
    emitLanguageChange(currentRoom._id, lang);

    if (ydocRef.current) {
      const ytext = ydocRef.current.getText('codestate');
      ydocRef.current.transact(() => {
        ytext.delete(0, ytext.length);
        if (tpl) {
          ytext.applyDelta([{ insert: tpl }]);
        }
      }, 'local');
    } else if (editorRef.current) {
      editorRef.current.setValue(tpl);
      setEditorValue(tpl);
    }
  };

  // ── Copy ────────────────────────────────────────────────────────────────
  const handleCopy = () => {
    const val = editorRef.current ? editorRef.current.getValue() : '';
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied!');
  };

  // ── Download ────────────────────────────────────────────────────────────
  const handleDownload = () => {
    const ext = EXT[language] || 'txt';
    const val = editorRef.current ? editorRef.current.getValue() : '';
    const blob = new Blob([val], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `code.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── Terminal Shell Command Handler ──────────────────────────────────────
  const [terminalInput, setTerminalInput] = useState('');

  const handleTerminalSubmit = (e) => {
    if (e.key === 'Enter') {
      const cmd = terminalInput.trim();
      if (!cmd) return;

      let newOutput = [...output];
      newOutput.push(`guest@syncspace:~$ ${cmd}`);

      if (cmd === 'clear') {
        setOutput([]);
        setTerminalInput('');
        return;
      }

      if (cmd === 'help') {
        newOutput.push('Available Shell Commands:');
        newOutput.push('  run    - Execute the code currently in the editor');
        newOutput.push('  clear  - Clear the console terminal screen');
        newOutput.push('  system - Display system connection and mode variables');
        newOutput.push('  help   - Display this shell command manual');
      } else if (cmd === 'run') {
        handleRunCode();
      } else if (cmd === 'system') {
        newOutput.push(`SyncSpace Development Server v1.0.0`);
        newOutput.push(`Connection: ${isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);
        newOutput.push(`Language Config: ${language}`);
        newOutput.push(`Theme Style: ${editorTheme}`);
      } else {
        newOutput.push(`bash: ${cmd}: command not found`);
      }

      setOutput(newOutput);
      setTerminalInput('');
    }
  };

  // ── Open preview in new tab ─────────────────────────────────────────────
  const handleOpenPreviewTab = () => {
    const html = previewHtml || buildPreviewDocument(editorRef.current?.getValue() || '');
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // ── Code Runner (Piston API & Local JS fallback) ────────────────────────
  const handleRunCode = useCallback(async () => {
    if (language === 'html' || language === 'css' || language === 'markdown' || language === 'json') {
      toast.error(`Code execution is not supported for ${language}.`);
      return;
    }

    const val = editorRef.current ? editorRef.current.getValue() : '';
    if (!val.trim()) {
      toast.error('Editor is empty.');
      return;
    }

    setIsRunning(true);
    setShowConsole(true);
    setOutput(['Executing code...']);
    
    // Broadcast execution start
    if (currentRoom?._id && isConnected) {
      emitCodeRun(currentRoom._id, language);
    }

    const startTime = Date.now();
    try {
      // Call our backend execution API
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://syncspace-backend-44cl.onrender.com/api/v1' : 'http://localhost:5000/api/v1');
      const response = await fetch(`${API_URL}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language: language,
          code: val
        })
      });

      if (!response.ok) {
        throw new Error('Failed to execute code on server.');
      }

      const data = await response.json();
      const executionTime = Date.now() - startTime;
      
      const newOutput = [];
      if (data.compile && data.compile.output) {
        newOutput.push('[COMPILE OUTPUT]');
        newOutput.push(...data.compile.output.split('\n'));
      }
      if (data.run && data.run.stderr) {
        newOutput.push(`Runtime Error:\n${data.run.stderr}`);
      }
      if (data.run && data.run.stdout) {
        newOutput.push(...data.run.stdout.split('\n'));
      }
      
      if (newOutput.length === 0) {
        newOutput.push('Code executed successfully with no output.');
      }

      setOutput(newOutput);

      // Broadcast execution output
      if (currentRoom?._id && isConnected) {
        emitCodeOutput(currentRoom._id, newOutput, language, executionTime);
      }
    } catch (err) {
      const errOutput = [`Execution Failed: ${err.message}`];
      setOutput(errOutput);
      if (currentRoom?._id && isConnected) {
        emitCodeOutput(currentRoom._id, errOutput, language, Date.now() - startTime);
      }
    } finally {
      setIsRunning(false);
    }
  }, [language, currentRoom?._id, isConnected, emitCodeRun, emitCodeOutput]);

  useEffect(() => { runCodeRef.current = handleRunCode; }, [handleRunCode]);

  // ── AI Code Reviewer ─────────────────────────────────────────────────────
  const handleReviewCode = useCallback(async () => {
    const val = editorRef.current ? editorRef.current.getValue() : '';
    if (!val.trim()) {
      toast.error('Editor is empty, nothing to review.');
      return;
    }

    setIsReviewing(true);
    setReview(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://syncspace-backend-44cl.onrender.com/api/v1' : 'http://localhost:5000/api/v1');
      const response = await fetch(`${API_URL}/execute/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, code: val }),
      });

      if (!response.ok) throw new Error('Failed to generate AI code review.');
      const data = await response.json();
      setReview(data.review);
      setShowReview(true);
    } catch (err) {
      toast.error(err.message || 'Failed to generate AI code review.');
    } finally {
      setIsReviewing(false);
    }
  }, [language]);

  // ── Render ─────────────────────────────────────────────────────────────
  const isHtml = language === 'html';
  const isExecutable = ['javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp', 'php', 'go', 'rust'].includes(language);
  const langMeta = LANG_META[language] || { label: language, short: language.toUpperCase(), color: 'text-surface-300', dot: 'bg-surface-400', chip: 'border-surface-700 bg-surface-800/60 text-surface-300' };

  return (
    <div className="flex flex-col h-full bg-surface-950 overflow-hidden">

      {/* ── Toolbar ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-surface-900/95 backdrop-blur border-b border-surface-800 px-3 py-2 flex flex-wrap items-center gap-2">

        {/* Left cluster: config selects */}
        <div className="flex items-center gap-1.5 rounded-lg border border-surface-800 bg-surface-950/60 p-1">
          {/* Language chip indicator */}
          <div className={`hidden sm:flex items-center gap-1.5 rounded-md border px-2 py-1 ${langMeta.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${langMeta.dot}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{langMeta.short}</span>
          </div>

          <select
            value={language}
            onChange={handleLanguageChange}
            className="bg-surface-900 border border-surface-800 text-surface-200 rounded-md px-2 py-1 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-primary-500/60 hover:border-surface-700 transition-colors cursor-pointer"
          >
            {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>

          <div className="h-4 w-px bg-surface-800" />

          <select
            value={editorTheme}
            onChange={(e) => setEditorTheme(e.target.value)}
            className="bg-surface-900 border border-surface-800 text-surface-200 rounded-md px-2 py-1 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-primary-500/60 hover:border-surface-700 transition-colors cursor-pointer"
          >
            <option value="vs-dark">Dark</option>
            <option value="light">Light</option>
          </select>

          <div className="h-4 w-px bg-surface-800" />

          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="bg-surface-900 border border-surface-800 text-surface-200 rounded-md px-2 py-1 text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-primary-500/60 hover:border-surface-700 transition-colors cursor-pointer"
          >
            {[12, 13, 14, 15, 16, 18, 20, 22].map((s) => <option key={s} value={s}>{s}px</option>)}
          </select>
        </div>

        {/* Center cluster: primary actions */}
        <div className="flex items-center gap-1.5">
          {(isExecutable || isHtml) && (
            <button
              onClick={isHtml ? handleRunHtml : handleRunCode}
              disabled={isRunning && !isHtml}
              className="group flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold shadow-sm shadow-emerald-950/40 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
            >
              {isHtml && isHtmlPreviewOpen ? (
                <TbX size={13} className="transition-transform group-hover:scale-110" />
              ) : (
                <TbPlayerPlay size={13} className="transition-transform group-hover:scale-110" />
              )}
              <span>{isHtml ? (isHtmlPreviewOpen ? 'Stop HTML' : 'Run HTML') : (isRunning ? 'Running...' : `Run ${langMeta.short}`)}</span>
            </button>
          )}

          <button
            onClick={handleReviewCode}
            disabled={isReviewing}
            className="group flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-b from-violet-600 to-violet-700 hover:from-violet-500 hover:to-violet-600 active:from-violet-700 active:to-violet-800 text-white rounded-lg text-[11px] font-semibold shadow-sm shadow-violet-950/40 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] ring-1 ring-violet-500/30"
          >
            <TbSparkles size={13} className="transition-transform group-hover:rotate-12 group-hover:scale-110" />
            <span>{isReviewing ? 'Reviewing...' : 'Review Code'}</span>
          </button>
        </div>

        {/* Right cluster: status + utility actions */}
        <div className="ml-auto flex items-center gap-1.5 w-full sm:w-auto justify-end flex-wrap">
          {/* Save indicator */}
          <div className={`hidden sm:flex items-center gap-1.5 rounded-md border px-2 py-1 mr-1 transition-colors ${
            saveStatus === 'saving'
              ? 'border-amber-500/30 bg-amber-500/5 text-amber-400'
              : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              saveStatus === 'saving' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
            }`} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              {saveStatus === 'saving' ? 'Saving' : 'Saved'}
            </span>
          </div>

          <div className="flex items-center gap-0.5 rounded-lg border border-surface-800 bg-surface-950/60 p-0.5">
            <button
              onClick={handleFormat}
              title="Format Document"
              className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors"
            >
              <TbWand size={14} />
            </button>
            <button
              onClick={handleCopy}
              title="Copy code"
              className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors"
            >
              {copied ? <TbCheck size={14} className="text-emerald-400" /> : <TbCopy size={14} />}
            </button>
            <button
              onClick={handleDownload}
              title="Download file"
              className="p-1.5 text-surface-400 hover:text-white hover:bg-surface-800 rounded-md transition-colors"
            >
              <TbDownload size={14} />
            </button>
            <div className="h-4 w-px bg-surface-800 mx-0.5" />
            <button
              onClick={() => setShowConsole(!showConsole)}
              title="Toggle Console Terminal"
              className={`p-1.5 rounded-md transition-colors ${
                showConsole
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-surface-400 hover:text-white hover:bg-surface-800'
              }`}
            >
              <TbTerminal size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Main editor + preview area ──────────────────────────── */}
      <div className="flex-1 overflow-hidden relative flex flex-col md:flex-row">

        {/* Left: Monaco Editor + Console */}
        <div className={`flex flex-col overflow-hidden ${isHtml ? 'w-full md:w-1/2 border-b md:border-b-0 md:border-r border-surface-800' : 'flex-1'}`}>
          <div className="flex-1 min-h-0 relative">
            <MonacoEditor
              height="100%"
              language={language}
              theme={editorTheme}
              onChange={handleEditorChange}
              onMount={(editor, monaco) => {
                editorRef.current = editor;
                setEditorReady(true);
                setEditorValue(editor.getValue());
                editor.onDidChangeModelContent(() => {
                  setEditorValue(editor.getValue());
                });
                // Ctrl+Enter shortcut
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                  const currentLang = useEditorStore.getState().language;
                  const isExecutableLang = ['javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp', 'php', 'go', 'rust'].includes(currentLang);
                  if (isExecutableLang) {
                    runCodeRef.current?.();
                  } else if (currentLang === 'html') {
                    handleRunHtml();
                  }
                });
              }}
              options={{
                fontSize,
                minimap: { enabled: false },
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                padding: { top: 12, bottom: 12 },
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
              }}
            />
          </div>

          {/* Console output (JS runner) */}
          {showConsole && (
            <div className="h-44 border-t border-surface-800 bg-[#0a0e17] flex flex-col flex-shrink-0 text-white font-mono text-[11px]">

              {/* Console header — language aware */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-surface-900/80 border-b border-surface-800 flex-shrink-0 backdrop-blur">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                    <span className="h-2 w-2 rounded-full bg-surface-700" />
                    <span className="h-2 w-2 rounded-full bg-surface-700" />
                    <span className="h-2 w-2 rounded-full bg-surface-700" />
                  </div>

                  <div className="hidden sm:block h-3.5 w-px bg-surface-800 flex-shrink-0" />

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <TbTerminal size={12} className={langMeta.color} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-surface-300">
                      Terminal
                    </span>
                  </div>

                  {/* Language indicator chip */}
                  <div className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 flex-shrink-0 ${langMeta.chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${langMeta.dot}`} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">
                      {langMeta.label}
                    </span>
                  </div>

                  {/* Running state chip */}
                  {isRunning && (
                    <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/[0.06] px-2 py-0.5 flex-shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300">
                        Running
                      </span>
                    </div>
                  )}

                  {/* Connection chip */}
                  <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-2 py-0.5 flex-shrink-0">
                    <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-surface-600'}`} />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400/90">
                      {isConnected ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setOutput([])}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowConsole(false)}
                    className="p-1 rounded-md text-surface-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    title="Close console"
                  >
                    <TbX size={13} />
                  </button>
                </div>
              </div>

              {/* Console output */}
              <div className="flex-1 p-3 overflow-y-auto space-y-0.5 select-text selection:bg-primary-500/30 scrollbar-thin scrollbar-thumb-surface-800 scrollbar-track-transparent">
                {output.length === 0 ? (
                  <div className="flex flex-col gap-1.5 text-surface-500">
                    <div className="flex items-center gap-2 italic">
                      <span className="h-1.5 w-1.5 rounded-full bg-surface-700" />
                      <span>
                        Ready — no output yet. Click{' '}
                        <span className="not-italic font-semibold text-surface-400">Run</span> or type{' '}
                        <span className="not-italic font-semibold text-surface-400">'run'</span> below.
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pl-3.5 text-[10px]">
                      <span className="text-surface-600">Active language:</span>
                      <span className={`flex items-center gap-1 font-semibold ${langMeta.color}`}>
                        <span className={`h-1 w-1 rounded-full ${langMeta.dot}`} />
                        {langMeta.label}
                      </span>
                    </div>
                  </div>
                ) : (
                  output.map((line, idx) => {
                    let cls = 'text-white';
                    if (line.startsWith('[ERROR]')) cls = 'text-red-400';
                    else if (line.startsWith('[WARN]')) cls = 'text-amber-400';
                    else if (line.startsWith('[INFO]')) cls = 'text-sky-400';
                    else if (line.startsWith('=>')) cls = 'text-emerald-400 font-semibold';
                    else if (line.startsWith('Runtime Error:')) cls = 'text-red-400 font-semibold border-l-2 border-red-500 pl-2 py-0.5 bg-red-950/15 rounded-r';
                    else if (line.startsWith('[COMPILE OUTPUT]')) cls = 'text-sky-400 font-semibold';
                    else if (line.startsWith('guest@syncspace:~$')) cls = 'text-primary-400 font-semibold';
                    else if (line.startsWith('Execution Failed:')) cls = 'text-red-400 font-semibold';
                    else if (line.startsWith('[Execution time:')) cls = 'text-surface-500 italic';
                    return (
                      <div key={idx} className={`${cls} whitespace-pre-wrap leading-relaxed`}>{line}</div>
                    );
                  })
                )}
              </div>

              {/* Interactive terminal command input — language aware prompt */}
              <div className="flex items-center gap-2 px-3 py-2 border-t border-surface-800 bg-[#070b12] flex-shrink-0">
                <div className={`flex items-center gap-1.5 flex-shrink-0 select-none`}>
                  <span className="text-emerald-400 font-semibold text-[11px]">
                    guest@syncspace<span className="text-surface-500">:</span><span className="text-sky-400">~</span><span className="text-surface-500">$</span>
                  </span>
                  <span className={`hidden sm:inline-flex items-center gap-1 rounded border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider ${langMeta.chip}`}>
                    <span className={`h-1 w-1 rounded-full ${langMeta.dot}`} />
                    {langMeta.short}
                  </span>
                </div>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleTerminalSubmit}
                  className="flex-1 bg-transparent border-none outline-none text-white font-mono text-[11px] p-0 focus:ring-0 placeholder:text-surface-700"
                  placeholder={`Type 'run' to execute ${langMeta.label}...`}
                />
              </div>
            </div>
          )}
        </div>

        {/* AI Code Review side panel */}
        {showReview && review && (
          <div className="w-full md:w-96 flex-shrink-0 h-full bg-surface-925 border-l border-surface-800 flex flex-col">

            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-surface-800 bg-surface-900/60 backdrop-blur">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/30 to-violet-500/10 border border-violet-500/25">
                  <TbSparkles size={15} className="text-violet-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[13px] font-semibold tracking-tight text-white truncate">
                    AI Code Review
                  </h3>
                  <p className="text-[10px] text-surface-500 truncate">
                    Analysis for <span className={langMeta.color}>{langMeta.label}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReview(false)}
                className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
              >
                <TbX size={15} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-surface-800 scrollbar-track-transparent">

              {/* Summary card */}
              <div className="rounded-xl border border-surface-800 bg-gradient-to-br from-surface-900 to-surface-900/40 p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-400">
                    Summary
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-px text-[9px] font-bold uppercase tracking-wider ${langMeta.chip}`}>
                    <span className={`h-1 w-1 rounded-full ${langMeta.dot}`} />
                    {langMeta.short}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-surface-300">{review.summary}</p>
                <p className="mt-2 text-[10px] text-surface-500">
                  Generated by{' '}
                  <span className="font-semibold text-surface-400">
                    {review.generatedBy === 'openai' ? 'OpenAI' : 'local heuristic check'}
                  </span>
                </p>
              </div>

              {/* Suggestions */}
              {(review.suggestions || []).length === 0 ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 text-center">
                  <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                    <TbShieldCheck size={18} className="text-emerald-400" />
                  </div>
                  <p className="text-xs font-semibold text-emerald-400">Code looks clean</p>
                  <p className="mt-1 text-[11px] text-surface-500">No suggestions or issues detected.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-surface-500">
                      Suggestions
                    </span>
                    <span className="rounded-full bg-surface-800 px-1.5 py-0.5 text-[10px] font-semibold text-surface-400">
                      {review.suggestions.length}
                    </span>
                  </div>

                  {(review.suggestions || []).map((s, idx) => {
                    const icons = {
                      bug: <TbBug size={13} className="text-red-400" />,
                      security: <TbShieldCheck size={13} className="text-amber-400" />,
                      performance: <TbGauge size={13} className="text-sky-400" />,
                      naming: <TbLetterCase size={13} className="text-violet-400" />,
                      missing_comment: <TbMessage2 size={13} className="text-emerald-400" />,
                    };
                    const accent = {
                      bug: 'border-l-red-500/60',
                      security: 'border-l-amber-500/60',
                      performance: 'border-l-sky-500/60',
                      naming: 'border-l-violet-500/60',
                      missing_comment: 'border-l-emerald-500/60',
                    };
                    const bg = {
                      bug: 'bg-red-500/[0.04]',
                      security: 'bg-amber-500/[0.04]',
                      performance: 'bg-sky-500/[0.04]',
                      naming: 'bg-violet-500/[0.04]',
                      missing_comment: 'bg-emerald-500/[0.04]',
                    };

                    return (
                      <div
                        key={idx}
                        className={`rounded-lg border border-surface-800 border-l-2 ${accent[s.category] || 'border-l-surface-700'} ${bg[s.category] || 'bg-surface-900'} p-3 transition-colors hover:border-surface-700`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 flex-shrink-0">
                            {icons[s.category] || <TbSparkles size={13} className="text-surface-400" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-surface-500">
                                Line {s.line ?? '—'}
                              </span>
                              {s.category && (
                                <span className="rounded-full bg-surface-800/80 px-1.5 py-px text-[9px] font-medium uppercase tracking-wide text-surface-400">
                                  {s.category.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs font-semibold leading-snug text-surface-100">
                              {s.issue}
                            </p>
                            <p className="mt-1.5 text-[11px] leading-relaxed text-surface-400">
                              {s.suggestion}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}

        {/* Right: Live HTML/CSS/JS Preview */}
        {isHtml && isHtmlPreviewOpen && (
          <div className="w-full md:w-1/2 flex flex-col h-full bg-white relative">

            {/* Preview header (browser-style) */}
            <div className="flex-shrink-0 h-10 bg-surface-100 border-b border-surface-200 px-3 flex items-center justify-between">

              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                </div>

                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-surface-200 shadow-sm min-w-0 max-w-[240px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-[10px] font-medium text-surface-600 truncate">
                    localhost<span className="text-surface-400">/preview</span>
                  </span>
                </div>

                <span className="hidden md:inline text-[10px] font-semibold uppercase tracking-[0.08em] text-surface-500">
                  Live Preview
                </span>

                <span className="hidden lg:inline-flex items-center gap-1 rounded border border-orange-500/30 bg-orange-500/[0.06] px-1.5 py-px text-[9px] font-bold uppercase tracking-wider text-orange-500">
                  <span className="h-1 w-1 rounded-full bg-orange-400" />
                  HTML
                </span>

                {previewLastUser && (
                  <span className="hidden xl:inline-flex items-center gap-1 text-[10px] text-surface-400 truncate">
                    ·
                    <span className="text-primary-600 font-medium truncate">{previewLastUser.name}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={handleRefreshHtml}
                  title="Refresh preview & sync to all"
                  className="p-1.5 text-surface-500 hover:text-surface-800 hover:bg-surface-200 rounded-md transition-colors"
                >
                  <TbRefresh size={14} />
                </button>
                <button
                  onClick={handleOpenPreviewTab}
                  title="Open in new tab"
                  className="p-1.5 text-surface-500 hover:text-surface-800 hover:bg-surface-200 rounded-md transition-colors"
                >
                  <TbExternalLink size={14} />
                </button>
              </div>
            </div>

            {/* iframe preview */}
            <div className="flex-1 overflow-hidden relative bg-white">
              {previewHtml ? (
                <iframe
                  key={previewHtml.length} // force re-mount on significant changes
                  title="live-preview"
                  srcDoc={previewHtml}
                  className="w-full h-full border-none"
                  sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-surface-400 text-sm p-6 text-center bg-surface-50">
                  <div className="w-16 h-16 mb-4 rounded-2xl bg-white border border-surface-200 shadow-sm flex items-center justify-center">
                    <TbPlayerPlay size={26} className="text-surface-300" />
                  </div>
                  <p className="font-semibold text-surface-600 mb-1">HTML Preview</p>
                  <p className="text-xs text-surface-500 max-w-[260px]">
                    Run HTML to see the output here.
                  </p>
                  <p className="text-xs text-surface-400 mt-1.5 max-w-[260px]">
                    Preview updates when you run it again.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
