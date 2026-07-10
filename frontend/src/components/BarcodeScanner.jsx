import { useState, useRef, useEffect, useCallback } from 'react';
import { barcodeAPI } from '../services/api';
import './BarcodeScanner.css';

const MAX_HISTORY = 10;

export default function BarcodeScanner() {
  const [mode, setMode] = useState('manual'); // manual | camera | batch
  const [inputCode, setInputCode] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [result, setResult] = useState(null);
  const [batchResults, setBatchResults] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  // ─── Manual lookup ──────────────────────────────────────────────────────────
  const handleLookup = useCallback(async (code) => {
    const c = (code || inputCode).trim();
    if (!c) return;
    setLoading(true);
    setError('');
    setResult(null);
    setQrImage(null);
    try {
      const { data } = await barcodeAPI.lookup(c);
      setResult(data.product);
      addToHistory(data.product);
    } catch (err) {
      setError(err.response?.data?.message || 'Product not found');
    } finally {
      setLoading(false);
    }
  }, [inputCode]);

  // ─── QR generation ──────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!result) return;
    setLoading(true);
    try {
      const { data } = await barcodeAPI.generate(result.id);
      setQrImage(data.qr_code);
    } catch (err) {
      setError('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrImage) return;
    const a = document.createElement('a');
    a.href = qrImage;
    a.download = `qr-${result?.sku || 'product'}.png`;
    a.click();
  };

  // ─── Batch lookup ────────────────────────────────────────────────────────────
  const handleBatchLookup = async () => {
    const codes = batchInput.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    if (!codes.length) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await barcodeAPI.batchLookup(codes);
      setBatchResults(data);
    } catch (err) {
      setError('Batch lookup failed');
    } finally {
      setLoading(false);
    }
  };

  // ─── Camera scanning ─────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      startScanning();
    } catch {
      setCameraError('Camera access denied or not available. Please use manual input.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    setCameraActive(false);
  };

  const startScanning = () => {
    scanIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Try jsQR if available (loaded globally)
      if (window.jsQR) {
        const code = window.jsQR(imageData.data, canvas.width, canvas.height);
        if (code) {
          stopCamera();
          setInputCode(code.data);
          handleLookup(code.data);
        }
      }
    }, 300);
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // ─── History ─────────────────────────────────────────────────────────────────
  const addToHistory = (product) => {
    setScanHistory(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, MAX_HISTORY);
    });
  };

  return (
    <div className="bs-container">
      {/* Header */}
      <div className="bs-header">
        <div className="bs-header-title">
          <span className="bs-icon">📱</span>
          <div>
            <h2>Barcode & QR Scanner</h2>
            <p>Lookup products by barcode, SKU, or scan with camera</p>
          </div>
        </div>
        <div className="bs-mode-tabs">
          {[['manual', '⌨️ Manual'], ['camera', '📷 Camera'], ['batch', '📋 Batch']].map(([m, label]) => (
            <button
              key={m}
              className={`bs-mode-btn ${mode === m ? 'active' : ''}`}
              onClick={() => { setMode(m); setError(''); setResult(null); }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bs-body">
        {/* Left panel */}
        <div className="bs-left">
          {/* ── MANUAL ── */}
          {mode === 'manual' && (
            <div className="bs-panel">
              <h3 className="bs-panel-title">Manual Lookup</h3>
              <p className="bs-hint">Enter a barcode, SKU, or product name</p>
              <div className="bs-input-row">
                <input
                  className="bs-input"
                  type="text"
                  placeholder="e.g. LP-001 or Laptop Pro"
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLookup()}
                  autoFocus
                />
                <button className="bs-btn-primary" onClick={() => handleLookup()} disabled={loading}>
                  {loading ? <span className="bs-spinner" /> : '🔍 Lookup'}
                </button>
              </div>
              {error && <div className="bs-error">{error}</div>}
            </div>
          )}

          {/* ── CAMERA ── */}
          {mode === 'camera' && (
            <div className="bs-panel">
              <h3 className="bs-panel-title">Camera Scanner</h3>
              {cameraError && <div className="bs-error">{cameraError}</div>}
              <div className="bs-camera-wrap">
                <video ref={videoRef} className={`bs-video ${cameraActive ? 'active' : ''}`} muted playsInline />
                <canvas ref={canvasRef} className="bs-canvas" />
                {cameraActive && <div className="bs-scan-line" />}
                {!cameraActive && (
                  <div className="bs-camera-placeholder">
                    <span>📷</span>
                    <p>Camera not active</p>
                  </div>
                )}
              </div>
              <div className="bs-camera-controls">
                {!cameraActive
                  ? <button className="bs-btn-primary" onClick={startCamera}>▶ Start Camera</button>
                  : <button className="bs-btn-danger" onClick={stopCamera}>⏹ Stop</button>
                }
              </div>
              <div className="bs-divider">or enter manually</div>
              <div className="bs-input-row">
                <input
                  className="bs-input"
                  type="text"
                  placeholder="Type code here"
                  value={inputCode}
                  onChange={e => setInputCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLookup()}
                />
                <button className="bs-btn-primary" onClick={() => handleLookup()} disabled={loading}>
                  {loading ? <span className="bs-spinner" /> : '🔍'}
                </button>
              </div>
              {error && <div className="bs-error">{error}</div>}
            </div>
          )}

          {/* ── BATCH ── */}
          {mode === 'batch' && (
            <div className="bs-panel">
              <h3 className="bs-panel-title">Batch Lookup</h3>
              <p className="bs-hint">Enter one code per line (barcode or SKU)</p>
              <textarea
                className="bs-textarea"
                rows={8}
                placeholder={'LP-001\nOC-002\nWM-003'}
                value={batchInput}
                onChange={e => setBatchInput(e.target.value)}
              />
              <button className="bs-btn-primary bs-btn-full" onClick={handleBatchLookup} disabled={loading}>
                {loading ? <span className="bs-spinner" /> : '🔄 Batch Lookup'}
              </button>
              {error && <div className="bs-error">{error}</div>}
              {batchResults && (
                <div className="bs-batch-summary">
                  <span className="bs-badge-found">{batchResults.found} found</span>
                  <span className="bs-badge-miss">{batchResults.total - batchResults.found} not found</span>
                </div>
              )}
              {batchResults?.results && (
                <div className="bs-batch-list">
                  {batchResults.results.map((r, i) => (
                    <div key={i} className={`bs-batch-item ${r.found ? 'found' : 'miss'}`}>
                      <span className="bs-batch-code">{r.code}</span>
                      {r.found
                        ? <span className="bs-batch-name">{r.product.name} <em>({r.product.sku})</em> — {r.product.current_stock} units</span>
                        : <span className="bs-batch-name bs-not-found">Not found</span>
                      }
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Result card ── */}
          {result && mode !== 'batch' && (
            <div className="bs-result-card">
              <div className="bs-result-header">
                <h3>{result.name}</h3>
                <span className={`bs-stock-badge ${result.current_stock <= result.reorder_level ? 'low' : 'ok'}`}>
                  {result.current_stock} units
                </span>
              </div>
              <div className="bs-result-grid">
                <div className="bs-result-field"><span>SKU</span><strong>{result.sku}</strong></div>
                <div className="bs-result-field"><span>Category</span><strong>{result.category}</strong></div>
                <div className="bs-result-field"><span>Price</span><strong>${result.price?.toFixed(2)}</strong></div>
                <div className="bs-result-field"><span>Reorder Level</span><strong>{result.reorder_level}</strong></div>
              </div>
              <div className="bs-result-actions">
                <button className="bs-btn-secondary" onClick={handleGenerate} disabled={loading}>
                  {loading ? <span className="bs-spinner" /> : '📲 Generate QR'}
                </button>
                {qrImage && (
                  <button className="bs-btn-secondary" onClick={downloadQR}>📥 Download QR</button>
                )}
              </div>
              {qrImage && (
                <div className="bs-qr-preview">
                  <img src={qrImage} alt="QR Code" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right panel — scan history */}
        <div className="bs-right">
          <div className="bs-history-panel">
            <div className="bs-history-header">
              <h3>Scan History</h3>
              {scanHistory.length > 0 && (
                <button className="bs-clear-btn" onClick={() => setScanHistory([])}>Clear</button>
              )}
            </div>
            {scanHistory.length === 0
              ? <div className="bs-history-empty"><span>🕐</span><p>No scans yet</p></div>
              : scanHistory.map((p, i) => (
                <div
                  key={i}
                  className="bs-history-item"
                  onClick={() => { setResult(p); setMode('manual'); setInputCode(p.sku); }}
                >
                  <div className="bs-history-icon">📦</div>
                  <div className="bs-history-info">
                    <strong>{p.name}</strong>
                    <span>{p.sku} · {p.current_stock} units</span>
                  </div>
                  <div className={`bs-history-dot ${p.current_stock <= p.reorder_level ? 'red' : 'green'}`} />
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}
