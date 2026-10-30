import React, { useState, useRef } from 'react';
import axios from 'axios';
import { User, Phone, MapPin, Calendar, Mic, MicOff, Send, X, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './ClaimForm.css';

function ClaimForm({ aiResult, imagePreview, onCancel, onSubmitSuccess }) {
  const { user } = useAuth();
  // Form States
  const [farmerName, setFarmerName] = useState(user?.name || '');
  const [mobile, setMobile] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  
  const [cropStage, setCropStage] = useState('');
  const [fieldArea, setFieldArea] = useState('');
  
  const [description, setDescription] = useState('');
  const [damageDate, setDamageDate] = useState(new Date().toISOString().split('T')[0]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Voice STT local states
  const [voiceLang, setVoiceLang] = useState('hi-IN');
  const [voiceError, setVoiceError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef(null);

  // AI autofill data (computed or static)
  const disease = aiResult?.damage_type || 'No Damage';
  const severity = aiResult?.severity_percentage || 0;
  const risk = aiResult?.overall_assessment || 'Low';
  const cropName = aiResult?.crop_type || 'Unknown';
  // Claim is eligible if damage severity is >= 30%
  const claimEligible = severity >= 30;

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening || isConnecting) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.abort();
        } catch (e) {
          console.error(e);
        }
        recognitionRef.current = null;
      }
      setIsListening(false);
      setIsConnecting(false);
      setInterimTranscript('');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.abort();
      } catch (e) {
        console.error(e);
      }
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Use continuous to listen to multiple phrases
    recognition.interimResults = true; // Show results immediately as user is speaking
    recognition.lang = voiceLang;

    let baseText = description;

    recognition.onstart = () => {
      console.log(`Speech Recognition started: lang=${voiceLang}`);
      setIsConnecting(false);
      setIsListening(true);
      setVoiceError('');
      setInterimTranscript('');
    };

    recognition.onend = () => {
      console.log("Speech Recognition ended");
      setIsListening(false);
      setIsConnecting(false);
      setInterimTranscript('');
    };

    recognition.onerror = (e) => {
      console.log("Speech Error:", e.error);
      setIsListening(false);
      setIsConnecting(false);
      setInterimTranscript('');

      if (e.error === 'not-allowed') {
        setVoiceError('Mic permission blocked. Check browser settings.');
      } else if (e.error === 'no-speech') {
        setVoiceError('No speech heard. Speak closer to mic.');
      } else if (e.error === 'network') {
        setVoiceError('Network error. Check internet connection / VPN.');
      } else if (e.error === 'aborted') {
        setVoiceError('Mic aborted. Ensure no other app is using it.');
      } else {
        setVoiceError(`Error: ${e.error}`);
      }
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscriptText = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscriptText += transcript;
        }
      }

      console.log("Speech Transcript - Final:", finalTranscript, "Interim:", interimTranscriptText);

      if (interimTranscriptText) {
        setInterimTranscript(interimTranscriptText);
      }

      if (finalTranscript) {
        baseText = baseText ? baseText.trim() + ' ' + finalTranscript.trim() : finalTranscript.trim();
        setDescription(baseText);
        setInterimTranscript(''); // Clear the temporary interim words once finalized
      }
    };

    try {
      setIsConnecting(true);
      setVoiceError('');
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error("Failed to start speech recognition", err);
      setIsConnecting(false);
      setVoiceError("Failed to open microphone.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validations
    if (!farmerName.trim()) return setFormError('Farmer Name is required.');
    if (!mobile.trim() || mobile.length !== 10) return setFormError('Please enter a valid 10-digit mobile number.');
    if (!state.trim()) return setFormError('State is required.');
    if (!district.trim()) return setFormError('District is required.');
    if (!village.trim()) return setFormError('Village is required.');
    if (!cropStage.trim()) return setFormError('Crop Stage is required.');
    if (!fieldArea.trim()) return setFormError('Field Area is required.');
    if (!description.trim()) return setFormError('Damage description is required.');

    setSubmitting(true);

    const claimPayload = {
      farmer_details: {
        farmer_name: farmerName,
        mobile: mobile,
        state: state,
        district: district,
        village: village
      },
      crop_details: {
        crop_name: cropName,
        crop_stage: cropStage,
        field_area: fieldArea
      },
      ai_damage_details: {
        disease: disease,
        severity: severity,
        risk: risk,
        claim_eligible: claimEligible
      },
      description: description,
      damage_date: damageDate,
      additional_notes: additionalNotes,
      image_path: imagePreview || ''
    };

    try {
      const response = await axios.post('http://localhost:8000/api/submit-claim', claimPayload);
      if (response.data.success) {
        onSubmitSuccess(response.data.claim_id, claimPayload);
      } else {
        setFormError('Failed to submit claim. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.detail || 'Error connecting to backend server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="claim-form-container">
      <div className="form-header-row">
        <h2>Submit Insurance Claim / Complaint</h2>
        <button className="btn-close" onClick={onCancel} title="Go Back">
          <X size={20} />
        </button>
      </div>

      <div className="claim-grid">
        {/* Left column: AI Auto-fill details card */}
        <div className="form-sidebar">
          <div className="preview-card glass-panel">
            <h3>AI Detection Summary</h3>
            {imagePreview && (
              <div className="thumbnail-container">
                <img src={imagePreview} alt="Crop preview" />
              </div>
            )}
            
            <div className="sidebar-metrics">
              <div className="metric-row">
                <span>Crop Type:</span>
                <strong>{cropName}</strong>
              </div>
              <div className="metric-row">
                <span>Detected Disease:</span>
                <strong>{disease}</strong>
              </div>
              <div className="metric-row">
                <span>Severity:</span>
                <span className="severity-badge">{severity}%</span>
              </div>
              <div className="metric-row">
                <span>Risk Level:</span>
                <span className={`risk-badge risk-${risk.toLowerCase()}`}>{risk}</span>
              </div>
            </div>

            <div className={`eligibility-box ${claimEligible ? 'eligible' : 'not-eligible'}`}>
              <AlertTriangle className="eligibility-icon" size={20} />
              <div>
                <h4>{claimEligible ? 'Eligible for Claim' : 'Low Severity'}</h4>
                <p>
                  {claimEligible 
                    ? 'Severity exceeds 30% threshold. Recommended for instant insurance dispatch.' 
                    : 'Severity is below the standard 30% PMFBY claim threshold.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Form details input */}
        <form className="main-form glass-panel" onSubmit={handleSubmit}>
          {formError && (
            <div className="form-error-alert">
              <AlertTriangle size={18} />
              <span>{formError}</span>
            </div>
          )}

          {/* Section 1: Farmer Details */}
          <div className="form-section">
            <div className="section-title">
              <User size={18} className="section-icon" />
              <span>1. Farmer Details</span>
            </div>
            
            <div className="input-group-row">
              <div className="input-wrapper">
                <label>Farmer Full Name *</label>
                <input 
                  type="text" 
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                />
              </div>
              <div className="input-wrapper">
                <label>Mobile Number (10 digits) *</label>
                <input 
                  type="tel" 
                  pattern="[0-9]{10}"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>
            </div>

            <div className="input-group-row three-cols">
              <div className="input-wrapper">
                <label>State *</label>
                <input 
                  type="text" 
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Punjab"
                  required
                />
              </div>
              <div className="input-wrapper">
                <label>District *</label>
                <input 
                  type="text" 
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g. Ludhiana"
                  required
                />
              </div>
              <div className="input-wrapper">
                <label>Village *</label>
                <input 
                  type="text" 
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="e.g. Gill"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Crop Details */}
          <div className="form-section">
            <div className="section-title">
              <FileText size={18} className="section-icon" />
              <span>2. Crop & Land Details</span>
            </div>
            
            <div className="input-group-row">
              <div className="input-wrapper">
                <label>Crop Name (Auto-filled) *</label>
                <input 
                  type="text" 
                  value={cropName} 
                  disabled 
                  className="disabled-input"
                />
              </div>
              <div className="input-wrapper">
                <label>Crop Stage *</label>
                <select 
                  value={cropStage}
                  onChange={(e) => setCropStage(e.target.value)}
                  required
                >
                  <option value="">Select Stage</option>
                  <option value="Sowing">Sowing</option>
                  <option value="Vegetative">Vegetative (Growth)</option>
                  <option value="Flowering">Flowering</option>
                  <option value="Harvesting">Harvesting</option>
                </select>
              </div>
              <div className="input-wrapper">
                <label>Field Area (in Acres) *</label>
                <input 
                  type="text" 
                  value={fieldArea}
                  onChange={(e) => setFieldArea(e.target.value)}
                  placeholder="e.g. 4.5 Acres"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Complaint Narrative */}
          <div className="form-section">
            <div className="section-title">
              <MapPin size={18} className="section-icon" />
              <span>3. Damage details & Description</span>
            </div>
            
            <div className="input-wrapper">
              <label>Damage Observation Date *</label>
              <div className="date-input-wrapper">
                <Calendar size={16} className="date-icon" />
                <input 
                  type="date" 
                  value={damageDate}
                  onChange={(e) => setDamageDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-wrapper" style={{ marginTop: '1rem' }}>
              <label>Tell us what happened *</label>
              <div className="voice-textarea-container">
                <textarea 
                  value={description + (interimTranscript ? ' ' + interimTranscript : '')}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe crop damage conditions (e.g. 'Peele dhabbe patton par dikh rahe hain, fasal kharab ho rahi hai')"
                  rows={4}
                  required
                />
                <div className="stt-toolbar">
                  {/* Left: language selection */}
                  <div className="stt-lang-toggle-small">
                    <button
                      type="button"
                      className={`stt-lang-btn-small ${voiceLang === 'hi-IN' ? 'active' : ''}`}
                      onClick={() => setVoiceLang('hi-IN')}
                    >
                      हिन्दी
                    </button>
                    <button
                      type="button"
                      className={`stt-lang-btn-small ${voiceLang === 'en-IN' ? 'active' : ''}`}
                      onClick={() => setVoiceLang('en-IN')}
                    >
                      EN
                    </button>
                  </div>

                  {/* Right: status and mic button */}
                  <div className="stt-right-controls">
                    {voiceError && (
                      <span className="stt-error-text-small" title={voiceError}>
                        ⚠️ {voiceError}
                      </span>
                    )}
                    {isConnecting && (
                      <span className="stt-listening-text-small" style={{ color: '#d97706' }}>
                        🔌 Connecting... / जुड़ रहा है...
                      </span>
                    )}
                    {isListening && (
                      <span className="stt-listening-text-small">
                        🎤 Speak now / बोलें...
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`btn-mic-small ${isListening ? 'listening' : ''} ${isConnecting ? 'connecting' : ''}`}
                      title={isListening ? "Stop Speaking / बोलना बंद करें" : "Start Speaking / बोलना शुरू करें"}
                    >
                      {isListening || isConnecting ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="input-wrapper" style={{ marginTop: '1rem' }}>
              <label>Additional Notes / Remarks</label>
              <textarea 
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Any special remarks or extra instructions..."
                rows={2}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="btn-spinner"></div> Submitting Claim...
                </>
              ) : (
                <>
                  Submit Claim <Send size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClaimForm;
