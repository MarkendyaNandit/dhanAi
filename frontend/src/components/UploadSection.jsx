import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText } from 'lucide-react';

const UploadSection = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const handleFileChange = (selectedFile) => {
    setFile(selectedFile);
  };

  const handleSubmit = () => {
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="upload-container">
      <div className="glass-card">
        <h2 className="section-title">Upload Statement</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Securely upload your bank statement (CSV or TXT) to let AI analyze your financial habits.
        </p>

        <div
          className={`dropzone ${isDragging ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
             <>
               <FileText size={48} className="dropzone-icon" style={{ animation: 'none', color: 'var(--success)' }} />
               <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{file.name}</p>
               <p style={{ fontSize: '0.85rem' }}>{(file.size / 1024).toFixed(1)} KB</p>
               <button 
                className="btn" 
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                style={{ background: 'rgba(255,255,255,0.1)', marginTop: '1rem', padding: '0.5rem 1rem' }}
               >
                 Change File
               </button>
             </>
          ) : (
            <>
              <UploadCloud size={48} className="dropzone-icon" />
              <p><strong>Click to upload</strong> or drag and drop</p>
              <p style={{ fontSize: '0.85rem' }}>CSV, TXT, PDF (max 10MB)</p>
              <input 
                type="file" 
                id="file-upload" 
                style={{ display: 'none' }} 
                onChange={handleChange}
                accept=".csv,.txt,.pdf"
              />
              <button className="btn" onClick={() => document.getElementById('file-upload').click()}>
                Select File
              </button>
            </>
          )}
        </div>

        {file && (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button className="btn" onClick={handleSubmit}>
              Analyze Statement ✨
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadSection;
