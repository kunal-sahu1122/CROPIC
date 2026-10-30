import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { 
  UploadCloud, Leaf, AlertTriangle, Activity, FileCheck, ArrowLeft, 
  Download, CheckCircle, LogOut, XCircle, Clock, Volume2, VolumeX 
} from 'lucide-react';
import './App.css';
import ClaimForm from './components/ClaimForm';
import OfficerDashboard from './components/OfficerDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AuthProvider, useAuth } from './context/AuthContext';

function FarmerDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('scan');
  
  // Existing scan states
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimId, setClaimId] = useState(null);
  const [claimPayload, setClaimPayload] = useState(null);
  const fileInputRef = useRef(null);

  // Text to Speech states
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsLang, setTtsLang] = useState('hi');
  const audioRef = useRef(null);

  // Cleanup audio playback on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // New claims history states
  const [claims, setClaims] = useState([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [claimsError, setClaimsError] = useState('');

  const fetchClaims = async () => {
    setLoadingClaims(true);
    setClaimsError('');
    try {
      const response = await axios.get('http://localhost:8000/api/claims');
      if (response.data.success) {
        setClaims(response.data.claims);
      }
    } catch (err) {
      console.error(err);
      setClaimsError('Failed to load claims history.');
    } finally {
      setLoadingClaims(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'claims') {
      fetchClaims();
    }
  }, [activeTab]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('active');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('active');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('active');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile.type.match('image.*')) {
      setError('Please select a valid image file (JPG/PNG).');
      return;
    }
    setError(null);
    setFile(selectedFile);
    
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('http://localhost:8000/api/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError('Failed to analyze image. Ensure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setTtsPlaying(false);
    setTtsLoading(false);
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setShowClaimForm(false);
    setClaimSuccess(false);
    setClaimId(null);
    setClaimPayload(null);
  };

  const handlePlayTTS = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setTtsPlaying(false);
      return;
    }

    setTtsLoading(true);
    try {
      const crop = result.crop_type || '';
      const disease = result.damage_type || '';
      const severity = result.severity_percentage || 0;
      const risk = result.overall_assessment || '';
      
      const url = `http://localhost:8000/api/text-to-speech?crop_type=${encodeURIComponent(crop)}&damage_type=${encodeURIComponent(disease)}&severity=${severity}&risk=${encodeURIComponent(risk)}&lang=${ttsLang}`;
      
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.oncanplaythrough = () => {
        setTtsLoading(false);
        setTtsPlaying(true);
        audio.play().catch(e => {
          console.error("Audio play failed", e);
          setTtsPlaying(false);
          audioRef.current = null;
        });
      };

      audio.onended = () => {
        setTtsPlaying(false);
        audioRef.current = null;
      };

      audio.onerror = () => {
        setTtsLoading(false);
        setTtsPlaying(false);
        audioRef.current = null;
        alert("Failed to play voice report. Please check if backend is running.");
      };
    } catch (error) {
      console.error(error);
      setTtsLoading(false);
      setTtsPlaying(false);
    }
  };

  const handleDownloadAIReport = async () => {
    try {
      const crop = result.crop_type || '';
      const disease = result.damage_type || '';
      const severity = result.severity_percentage || 0;
      const risk = result.overall_assessment || '';
      
      const response = await axios.post('http://localhost:8000/api/reports/ai', {
        crop_type: crop,
        damage_type: disease,
        severity_percentage: severity,
        overall_assessment: risk,
        image_path: preview
      }, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `crop_report_${crop.toLowerCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PDF report", error);
      alert("Failed to download AI report. Please try again.");
    }
  };

  const handleDownloadClaimReceiptById = async (targetClaimId) => {
    if (!targetClaimId) return;
    try {
      const response = await axios.get(`http://localhost:8000/api/reports/claim/${targetClaimId}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `claim_receipt_${targetClaimId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download receipt", error);
      alert("Failed to download claim receipt.");
    }
  };

  const getTimelineSteps = (status) => {
    const steps = [
      { label: "Submitted", statusClass: "pending", checked: false },
      { label: "Under Review", statusClass: "pending", checked: false },
      { label: "Inspection", statusClass: "pending", checked: false },
      { label: "Decision", statusClass: "pending", checked: false }
    ];

    const currentStatus = status || "Submitted";

    if (currentStatus === "Submitted") {
      steps[0].statusClass = "active";
    } else if (currentStatus === "Under Review") {
      steps[0].checked = true;
      steps[0].statusClass = "completed";
      steps[1].statusClass = "active";
    } else if (currentStatus === "Inspection Pending") {
      steps[0].checked = true;
      steps[0].statusClass = "completed";
      steps[1].checked = true;
      steps[1].statusClass = "completed";
      steps[2].statusClass = "active";
    } else if (currentStatus === "Approved") {
      steps[0].checked = true;
      steps[0].statusClass = "completed";
      steps[1].checked = true;
      steps[1].statusClass = "completed";
      steps[2].checked = true;
      steps[2].statusClass = "completed";
      steps[3].statusClass = "approved";
      steps[3].label = "Approved";
    } else if (currentStatus === "Rejected") {
      steps[0].checked = true;
      steps[0].statusClass = "completed";
      steps[1].checked = true;
      steps[1].statusClass = "completed";
      steps[2].checked = true;
      steps[2].statusClass = "completed";
      steps[3].statusClass = "rejected";
      steps[3].label = "Rejected";
    } else if (currentStatus === "Completed") {
      steps[0].checked = true;
      steps[0].statusClass = "completed";
      steps[1].checked = true;
      steps[1].statusClass = "completed";
      steps[2].checked = true;
      steps[2].statusClass = "completed";
      steps[3].checked = true;
      steps[3].statusClass = "completed-success";
      steps[3].label = "Completed";
    }
    return steps;
  };

  return (
    <div className="app-container">
      {/* Welcome & Navigation Header Bar */}
      <div className="farmer-header-bar">
        <div className="farmer-welcome">
          <span>Logged in as: <strong>{user?.name}</strong></span>
          <span className="role-tag" style={{ marginLeft: '0.75rem', background: 'rgba(82, 183, 136, 0.15)', color: '#52b788' }}>
            Farmer
          </span>
        </div>
        <div className="farmer-nav-actions">
          <div className="farmer-tabs">
            <button 
              className={`farmer-tab ${activeTab === 'scan' ? 'active' : ''}`}
              onClick={() => setActiveTab('scan')}
            >
              Scan Crop
            </button>
            <button 
              className={`farmer-tab ${activeTab === 'claims' ? 'active' : ''}`}
              onClick={() => setActiveTab('claims')}
            >
              My Claims
            </button>
          </div>
          <button className="btn-logout" onClick={logout}>
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <header className="header">
        <h1>CROPIC</h1>
        <p>AI-Based Real-Time Crop Analytics for PMFBY</p>
      </header>

      <main className="main-content">
        {activeTab === 'scan' && (
          <>
            {!preview && !result && !loading && !showClaimForm && !claimSuccess && (
              <div className="upload-section">
                <div 
                  className="dropzone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current.click()}
                >
                  <UploadCloud className="upload-icon" />
                  <p>Drag & drop a crop image here</p>
                  <span>or click to browse from device</span>
                  <input 
                    type="file" 
                    className="file-input" 
                    ref={fileInputRef} 
                    onChange={handleFileInput}
                    accept="image/png, image/jpeg, image/jpg"
                  />
                </div>
                {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
              </div>
            )}

            {preview && !result && !loading && !showClaimForm && !claimSuccess && (
              <div className="upload-section">
                <div className="image-preview-container" style={{ width: '100%', maxWidth: '600px', marginBottom: '2rem' }}>
                  <img src={preview} alt="Selected crop" />
                </div>
                <div className="action-buttons" style={{ width: '100%', maxWidth: '600px' }}>
                  <button className="btn btn-secondary" onClick={resetState}>
                    <ArrowLeft size={20} /> Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleAnalyze}>
                    Analyze Image <Activity size={20} />
                  </button>
                </div>
                {error && <div style={{ color: 'red', marginTop: '1rem', fontWeight: 'bold' }}>{error}</div>}
              </div>
            )}

            {loading && (
              <div className="loading-container">
                <div className="spinner"></div>
                <h2>Analyzing Crop Health...</h2>
                <p style={{ color: '#666', marginTop: '0.5rem' }}>Running YOLOv8 & MobileNetV2 Models</p>
              </div>
            )}

            {result && !loading && !showClaimForm && !claimSuccess && (
              <div className="dashboard">
                <div className="image-preview-container">
                  <img src={preview} alt="Analyzed crop" />
                  
                  {result.bounding_boxes && result.bounding_boxes.map((box, idx) => {
                    const [x, y, w, h, label] = box;
                    return (
                      <div 
                        key={idx} 
                        className="bounding-box"
                        style={{
                          left: `${(x - w/2) * 100}%`,
                          top: `${(y - h/2) * 100}%`,
                          width: `${w * 100}%`,
                          height: `${h * 100}%`
                        }}
                      >
                        <span className="box-label">{label}</span>
                      </div>
                    )
                  })}
                </div>

                <div className="results-panel">
                  <h2>Analysis Report</h2>
                  
                  <div className="result-card">
                    <div className="icon-wrapper icon-crop">
                      <Leaf size={28} />
                    </div>
                    <div className="result-info">
                      <h3>Crop Type</h3>
                      <p>{result.crop_type}</p>
                    </div>
                  </div>

                  <div className="result-card">
                    <div className="icon-wrapper icon-disease">
                      <AlertTriangle size={28} />
                    </div>
                    <div className="result-info">
                      <h3>Damage Detected</h3>
                      <p>{result.damage_type}</p>
                    </div>
                  </div>

                  <div className="result-card" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
                      <div className="icon-wrapper icon-severity">
                        <Activity size={28} />
                      </div>
                      <div className="result-info" style={{ flex: 1 }}>
                        <h3>Damage Severity</h3>
                        <p>{result.severity_percentage}%</p>
                      </div>
                    </div>
                    <div className={`severity-bar-container severity-${result.overall_assessment}`}>
                      <div className="severity-bar" style={{ width: `${result.severity_percentage}%` }}></div>
                    </div>
                  </div>

                  <div className="result-card">
                    <div className="icon-wrapper icon-assessment">
                      <FileCheck size={28} />
                    </div>
                    <div className="result-info">
                      <h3>Overall Assessment</h3>
                      <p>{result.overall_assessment} Risk</p>
                    </div>
                  </div>

                  {/* TTS Voice Report Section */}
                  <div className="tts-voice-section" style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    marginTop: '0.5rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', letterSpacing: '0.3px' }}>
                        AUDIO REPORT / आवाज़ में रिपोर्ट:
                      </span>
                      {/* Language Selection Toggle */}
                      <div className="tts-lang-toggle" style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px' }}>
                        <button 
                          className={`lang-btn ${ttsLang === 'hi' ? 'active' : ''}`}
                          onClick={() => setTtsLang('hi')}
                          style={{
                            background: ttsLang === 'hi' ? 'var(--primary-color)' : 'transparent',
                            border: 'none',
                            color: '#fff',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.25s ease'
                          }}
                        >
                          हिन्दी (HI)
                        </button>
                        <button 
                          className={`lang-btn ${ttsLang === 'en' ? 'active' : ''}`}
                          onClick={() => setTtsLang('en')}
                          style={{
                            background: ttsLang === 'en' ? 'var(--primary-color)' : 'transparent',
                            border: 'none',
                            color: '#fff',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                            transition: 'all 0.25s ease'
                          }}
                        >
                          English (EN)
                        </button>
                      </div>
                    </div>

                    <button 
                      className={`btn ${ttsPlaying ? 'btn-danger' : 'btn-primary'}`}
                      onClick={handlePlayTTS}
                      disabled={ttsLoading}
                      style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: ttsPlaying ? '#dc3545' : 'linear-gradient(135deg, #2d6a4f 0%, #1b4332 100%)',
                        border: 'none',
                        boxShadow: 'none',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      {ttsLoading ? (
                        <>
                          <div className="btn-spinner" style={{ width: '16px', height: '16px' }}></div>
                          <span>लोड हो रहा है / Loading...</span>
                        </>
                      ) : ttsPlaying ? (
                        <>
                          <VolumeX size={18} />
                          <span>आवाज़ बंद करें / Stop Listening</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={18} />
                          <span>रिपोर्ट सुनें / Listen Report</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="action-buttons">
                    <button className="btn btn-secondary" onClick={resetState}>
                      <ArrowLeft size={20} /> New Scan
                    </button>
                    <button className="btn btn-primary" onClick={handleDownloadAIReport}>
                      <Download size={20} /> Download PDF
                    </button>
                    <button className="btn btn-claim-action" onClick={() => setShowClaimForm(true)}>
                      File Insurance Claim <FileCheck size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showClaimForm && (
              <ClaimForm 
                aiResult={result} 
                imagePreview={preview} 
                onCancel={() => setShowClaimForm(false)} 
                onSubmitSuccess={(claimId, payload) => {
                  setClaimId(claimId);
                  setClaimPayload(payload);
                  setClaimSuccess(true);
                  setShowClaimForm(false);
                }} 
              />
            )}

            {claimSuccess && claimPayload && (
              <div className="claim-success-screen glass-panel">
                <div className="success-icon-wrapper">
                  <CheckCircle size={64} className="success-icon" />
                </div>
                <h2>Claim Submitted Successfully!</h2>
                <p className="claim-id-text">Claim ID: <span>{claimId}</span></p>
                
                <div className="summary-card">
                  <h3>Claim Summary</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span>Farmer Name:</span>
                      <strong>{claimPayload.farmer_details.farmer_name}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Mobile:</span>
                      <strong>{claimPayload.farmer_details.mobile}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Crop & Stage:</span>
                      <strong>{claimPayload.crop_details.crop_name} ({claimPayload.crop_details.crop_stage})</strong>
                    </div>
                    <div className="summary-item">
                      <span>Area:</span>
                      <strong>{claimPayload.crop_details.field_area}</strong>
                    </div>
                    <div className="summary-item">
                      <span>AI Disease:</span>
                      <strong>{claimPayload.ai_damage_details.disease}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Severity:</span>
                      <strong>{claimPayload.ai_damage_details.severity}%</strong>
                    </div>
                  </div>
                </div>

                  <button className="btn btn-primary" onClick={() => handleDownloadClaimReceiptById(claimId)}>
                    <Download size={20} /> Download Receipt
                  </button>
                  <button className="btn btn-primary" onClick={resetState} style={{ background: '#2d6a4f', borderColor: '#2d6a4f' }}>
                    Done <FileCheck size={20} />
                  </button>
                </div>
            )}
          </>
        )}

        {/* Claims History Tab */}
        {activeTab === 'claims' && (
          <div className="claims-history-container">
            <h2>Your Insurance Claims</h2>
            
            {loadingClaims ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading claim history...</p>
              </div>
            ) : claimsError ? (
              <div style={{ color: '#ff858d', textAlign: 'center', padding: '2rem' }}>
                <AlertTriangle size={32} style={{ marginBottom: '1rem' }} />
                <p>{claimsError}</p>
                <button className="btn btn-primary" style={{ maxWidth: '160px', margin: '1rem auto 0' }} onClick={fetchClaims}>
                  Retry
                </button>
              </div>
            ) : claims.length === 0 ? (
              <div className="no-claims-farmer">
                <h3>No claims submitted yet</h3>
                <p>Once you scan a crop and file a claim, it will show up here.</p>
                <button className="btn btn-primary" style={{ maxWidth: '200px', margin: '0 auto' }} onClick={() => setActiveTab('scan')}>
                  Scan Now
                </button>
              </div>
            ) : (
              <div className="claims-grid-farmer">
                {claims.map((claim) => (
                  <div key={claim.claim_id} className="claim-card-farmer">
                    <div className="claim-card-header">
                      <div>
                        <h3>{claim.crop_details.crop_name}</h3>
                        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>ID: {claim.claim_id}</span>
                      </div>
                      <button 
                        className="btn-download-receipt-small"
                        onClick={() => handleDownloadClaimReceiptById(claim.claim_id)}
                        title="Download Receipt PDF"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#52b788',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Download size={16} />
                      </button>
                    </div>
                    <div className="claim-card-body">
                      <div className="body-row">
                        <label>AI Severity:</label>
                        <val style={{ fontWeight: '700', color: claim.ai_damage_details.severity >= 30 ? '#ff858d' : '#52b788' }}>
                          {claim.ai_damage_details.severity}%
                        </val>
                      </div>
                      <div className="body-row">
                        <label>AI Diagnosis:</label>
                        <val>{claim.ai_damage_details.disease}</val>
                      </div>
                      <div className="body-row">
                        <label>Crop Growth Stage:</label>
                        <val>{claim.crop_details.crop_stage}</val>
                      </div>
                      <div className="body-row">
                        <label>Total Field Area:</label>
                        <val>{claim.crop_details.field_area}</val>
                      </div>
                      <div className="description-box-farmer">
                        <strong>Description:</strong> "{claim.description}"
                      </div>

                      {/* Visual Timeline Component */}
                      <div className="claim-timeline" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed rgba(255,255,255,0.06)' }}>
                        <h4 style={{ fontSize: '0.8rem', color: '#adb5bd', margin: '0 0 0.75rem 0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Claim Processing Timeline
                        </h4>
                        <div className="timeline-steps" style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                          {/* Background Connector Line */}
                          <div className="timeline-connector" style={{ position: 'absolute', top: '10px', left: '15px', right: '15px', height: '2px', background: 'rgba(255,255,255,0.08)', zIndex: 1 }}></div>
                          
                          {getTimelineSteps(claim.status).map((step, idx) => (
                            <div key={idx} className="timeline-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative', flex: 1 }}>
                              {/* Step Node */}
                              <div className={`step-node ${step.statusClass}`} style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                              }}>
                                {step.checked ? "✓" : (idx + 1)}
                              </div>
                              {/* Step Label */}
                              <span className={`step-label ${step.statusClass}`} style={{
                                fontSize: '0.74rem',
                                marginTop: '0.5rem',
                                color: step.statusClass === 'active' ? '#fff' : 'var(--text-muted)',
                                fontWeight: step.statusClass === 'active' ? '600' : 'normal',
                                textAlign: 'center'
                              }}>
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="claim-card-footer">
                      <span className="date-text-farmer">
                        {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                      <span className={`status-badge-table ${
                        claim.status === 'Approved' ? 'status-approved' : 
                        claim.status === 'Rejected' ? 'status-rejected' : 
                        claim.status === 'Under Review' ? 'status-under-review' : 
                        claim.status === 'Inspection Pending' ? 'status-inspection' : 
                        claim.status === 'Completed' ? 'status-completed' : 'status-submitted'
                      }`}>
                        {claim.status === 'Approved' ? <CheckCircle size={12} /> : 
                         claim.status === 'Rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                        <span>{claim.status}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="app-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="loading-container">
          <div className="spinner"></div>
          <h2>Verifying session...</h2>
        </div>
      </div>
    );
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Route Selector based on User Role
function DashboardSelector() {
  const { user } = useAuth();
  
  if (user?.role === 'officer') {
    return <OfficerDashboard />;
  }
  
  return <FarmerDashboard />;
}

// Main App Router Config
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardSelector />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
