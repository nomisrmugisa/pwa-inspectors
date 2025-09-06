import React, { useRef, useState, useEffect, useCallback } from 'react';

const CustomSignatureCanvas = ({ onSignatureChange, existingSignature = null, disabled = false }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [lastPoint, setLastPoint] = useState(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 500;
      canvas.height = 200;
      
      // Set drawing properties
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      console.log('📝 Custom canvas initialized:', canvas.width, 'x', canvas.height);
    }
  }, []);

  // Load existing signature
  useEffect(() => {
    if (existingSignature && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setIsEmpty(false);
      };
      
      img.src = existingSignature;
    }
  }, [existingSignature]);

  // Get mouse/touch position relative to canvas
  const getEventPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  // Start drawing
  const startDrawing = useCallback((e) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDrawing(true);
    
    const pos = getEventPos(e);
    setLastPoint(pos);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [disabled, getEventPos]);

  // Draw line
  const draw = useCallback((e) => {
    if (!isDrawing || disabled) return;
    
    e.preventDefault();
    const pos = getEventPos(e);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    setLastPoint(pos);
  }, [isDrawing, disabled, getEventPos]);

  // Stop drawing
  const stopDrawing = useCallback((e) => {
    if (!isDrawing) return;
    
    e.preventDefault();
    setIsDrawing(false);
    setLastPoint(null);
    setIsEmpty(false);
    
    // Get signature data and notify parent
    const canvas = canvasRef.current;
    const signatureDataURL = canvas.toDataURL('image/png');
    
    if (onSignatureChange) {
      onSignatureChange(signatureDataURL);
    }
    
    console.log('📝 Signature stroke completed');
  }, [isDrawing, onSignatureChange]);

  // Clear signature
  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    setIsEmpty(true);
    
    if (onSignatureChange) {
      onSignatureChange(null);
    }
  }, [onSignatureChange]);

  return (
    <div className="signature-capture-container">
      <div className="signature-header">
        <h4 style={{ margin: '0 0 12px 0', color: '#495057', fontSize: '16px' }}>
          📝 Interviewee Signature
        </h4>
        <p style={{ margin: '0 0 16px 0', color: '#6c757d', fontSize: '14px' }}>
          Please provide your signature to confirm the information provided during this inspection.
        </p>
      </div>

      <div className="signature-canvas-container" style={{
        border: '2px solid #e9ecef',
        borderRadius: '8px',
        backgroundColor: '#ffffff',
        padding: '16px',
        marginBottom: '16px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <canvas
          ref={canvasRef}
          style={{
            border: '1px dashed #ced4da',
            borderRadius: '4px',
            cursor: disabled ? 'not-allowed' : 'crosshair',
            touchAction: 'none',
            width: '100%',
            maxWidth: '500px',
            height: 'auto',
            display: 'block',
            margin: '0 auto'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        
        {isEmpty && !disabled && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#adb5bd',
            fontSize: '14px',
            pointerEvents: 'none',
            textAlign: 'center'
          }}>
            ✍️ Sign here
          </div>
        )}
      </div>

      <div className="signature-actions" style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        alignItems: 'center'
      }}>
        <div className="signature-status" style={{
          flex: 1,
          fontSize: '14px',
          color: isEmpty ? '#dc3545' : '#28a745',
          fontWeight: '500'
        }}>
          {isEmpty ? '❌ Signature required' : '✅ Signature captured'}
        </div>
        
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled || isEmpty}
          style={{
            padding: '8px 16px',
            border: '1px solid #6c757d',
            backgroundColor: 'white',
            color: '#6c757d',
            borderRadius: '4px',
            cursor: disabled || isEmpty ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: disabled || isEmpty ? 0.5 : 1
          }}
        >
          🗑️ Clear
        </button>
      </div>
    </div>
  );
};

export default CustomSignatureCanvas;
