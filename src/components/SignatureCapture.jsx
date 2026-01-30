import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignatureCapture = ({ onSignatureChange, existingSignature = null, disabled = false }) => {
  const sigCanvas = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [signatureData, setSignatureData] = useState(existingSignature);

  // Load existing signature if provided
  useEffect(() => {
    if (existingSignature && sigCanvas.current) {
      try {
        sigCanvas.current.fromDataURL(existingSignature);
        setIsEmpty(false);
        setSignatureData(existingSignature);
      } catch (error) {
        console.warn('Failed to load existing signature:', error);
      }
    }
  }, [existingSignature]);

  // Initialize canvas and prevent any dimension changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sigCanvas.current) {
        const canvas = sigCanvas.current.getCanvas();

        // Set fixed dimensions
        canvas.width = 500;
        canvas.height = 200;
        canvas.style.width = '500px';
        canvas.style.height = '200px';
        canvas.style.maxWidth = '100%';

        console.log('📝 Canvas dimensions locked:', canvas.width, 'x', canvas.height);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleSignatureEnd = () => {
    if (sigCanvas.current) {
      // Ensure canvas dimensions are maintained after each stroke
      const canvas = sigCanvas.current.getCanvas();
      if (canvas.width !== 500 || canvas.height !== 200) {
        console.log('📝 Restoring canvas dimensions after stroke');
        // Save current drawing
        const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);

        // Reset dimensions
        canvas.width = 500;
        canvas.height = 200;
        canvas.style.width = '500px';
        canvas.style.height = '200px';

        // Restore drawing
        canvas.getContext('2d').putImageData(imageData, 0, 0);
      }

      const signatureDataURL = sigCanvas.current.toDataURL('image/png');
      const canvasIsEmpty = sigCanvas.current.isEmpty();

      setIsEmpty(canvasIsEmpty);
      setSignatureData(canvasIsEmpty ? null : signatureDataURL);

      // Notify parent component
      if (onSignatureChange) {
        onSignatureChange(canvasIsEmpty ? null : signatureDataURL);
      }
    }
  };

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
      setSignatureData(null);
      
      if (onSignatureChange) {
        onSignatureChange(null);
      }
    }
  };

  return (
    <div className="signature-capture-container" style={{
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <div className="signature-header">
        <h4 style={{ margin: '0 0 12px 0', color: '#495057', fontSize: '16px', textAlign: 'center' }}>
          📝 Interviewee Signature
        </h4>
        <p style={{ margin: '0 0 16px 0', color: '#6c757d', fontSize: '14px', textAlign: 'center' }}>
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
        <div style={{ width: '500px', maxWidth: '100%', margin: '0 auto' }}>
          <SignatureCanvas
            ref={sigCanvas}
            canvasProps={{
              width: 500,
              height: 200,
              className: 'signature-canvas'
            }}
            backgroundColor="rgba(255,255,255,1)"
            penColor="black"
            minWidth={1}
            maxWidth={3}
            onEnd={handleSignatureEnd}
            disabled={disabled}
          />
        </div>
        
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
        justifyContent: 'center',
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

      {/* Signature preview when captured */}
      {!isEmpty && signatureData && (
        <div className="signature-preview" style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '6px'
        }}>
          <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '8px' }}>
            Signature Preview:
          </div>
          <img 
            src={signatureData} 
            alt="Signature preview" 
            style={{
              maxWidth: '200px',
              height: 'auto',
              border: '1px solid #dee2e6',
              borderRadius: '4px',
              backgroundColor: 'white'
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SignatureCapture;
