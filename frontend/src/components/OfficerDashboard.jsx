import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LogOut, Eye, CheckCircle, XCircle, Clock, Filter, Phone, MapPin, Calendar, AlertTriangle, FileText, ChevronRight, X, Leaf } from 'lucide-react';
import './OfficerDashboard.css';

function OfficerDashboard() {
  const { user, logout } = useAuth();
  const [claims, setClaims] = useState([]);
  const [filteredClaims, setFilteredClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterState, setFilterState] = useState('');
  const [filterCrop, setFilterCrop] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('http://localhost:8000/api/claims');
      if (response.data.success) {
        setClaims(response.data.claims);
        setFilteredClaims(response.data.claims);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch claims database. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  useEffect(() => {
    let result = claims;
    
    // Filter status
    if (filterStatus !== 'All') {
      result = result.filter(c => c.status === filterStatus);
    }
    
    // Filter State
    if (filterState.trim() !== '') {
      result = result.filter(c => 
        c.farmer_details?.state && 
        c.farmer_details.state.toLowerCase().includes(filterState.toLowerCase())
      );
    }
    
    // Filter Crop
    if (filterCrop.trim() !== '') {
      result = result.filter(c => 
        c.crop_details?.crop_name && 
        c.crop_details.crop_name.toLowerCase().includes(filterCrop.toLowerCase())
      );
    }
    
    setFilteredClaims(result);
  }, [filterStatus, filterState, filterCrop, claims]);

  const handleExportExcel = async () => {
    try {
      let url = 'http://localhost:8000/api/reports/export-claims?';
      const params = [];
      if (filterStatus !== 'All') {
        params.push(`status=${encodeURIComponent(filterStatus)}`);
      }
      if (filterState.trim() !== '') {
        params.push(`state=${encodeURIComponent(filterState)}`);
      }
      if (filterCrop.trim() !== '') {
        params.push(`crop=${encodeURIComponent(filterCrop)}`);
      }
      url += params.join('&');
      
      const response = await axios.get(url, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'claims_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Failed to export claims to Excel", error);
      alert("Failed to export claims database to Excel.");
    }
  };

  const handleAction = async (claimId, newStatus) => {
    setActionLoading(true);
    try {
      const response = await axios.post(`http://localhost:8000/api/claims/${claimId}/action`, {
        action: newStatus
      });
      if (response.data.success) {
        // Refetch claims and update selected claim state to show updated status in modal
        await fetchClaims();
        setSelectedClaim(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || `Failed to update claim status to ${newStatus}.`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Approved': return 'status-approved';
      case 'Rejected': return 'status-rejected';
      case 'Under Review': return 'status-under-review';
      case 'Inspection Pending': return 'status-inspection';
      case 'Completed': return 'status-completed';
      default: return 'status-submitted';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle size={14} />;
      case 'Rejected': return <XCircle size={14} />;
      case 'Under Review': return <Clock size={14} />;
      case 'Inspection Pending': return <AlertTriangle size={14} />;
      case 'Completed': return <CheckCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="officer-dashboard-container">
      {/* Header */}
      <header className="officer-header">
        <div className="brand-header">
          <Leaf className="brand-logo" size={28} />
          <div>
            <h1>CROPIC</h1>
            <p>Insurance Officer Control Panel</p>
          </div>
        </div>
        <div className="user-profile-header">
          <div className="user-details">
            <span>Welcome, <strong>{user?.name}</strong></span>
            <span className="role-tag">Insurance Officer</span>
          </div>
          <button className="btn-logout-officer" onClick={logout} title="Log Out">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="officer-main">
        <div className="dashboard-summary-cards">
          <div className="summary-card total">
            <h3>Total Claims</h3>
            <p>{claims.length}</p>
          </div>
          <div className="summary-card pending">
            <h3>Pending Review</h3>
            <p>{claims.filter(c => c.status === 'Submitted' || !c.status).length}</p>
          </div>
          <div className="summary-card approved">
            <h3>Approved Claims</h3>
            <p>{claims.filter(c => c.status === 'Approved' || c.status === 'Completed').length}</p>
          </div>
          <div className="summary-card rejected">
            <h3>Rejected Claims</h3>
            <p>{claims.filter(c => c.status === 'Rejected').length}</p>
          </div>
        </div>

        {/* Filters and Search toolbar */}
        <div className="filter-bar-wrapper">
          <div className="filter-bar">
            <div className="filter-title">
              <Filter size={18} />
              <span>Status:</span>
            </div>
            <div className="filter-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['All', 'Submitted', 'Under Review', 'Inspection Pending', 'Approved', 'Rejected', 'Completed'].map((status) => (
                <button
                  key={status}
                  className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status === 'Submitted' ? 'Pending' : status}
                </button>
              ))}
            </div>
          </div>
          
          <div className="search-filters-row">
            <div className="search-inputs-container">
              <div className="search-input-group">
                <label>Filter by State</label>
                <input 
                  type="text" 
                  value={filterState} 
                  onChange={(e) => setFilterState(e.target.value)} 
                  placeholder="e.g. Punjab"
                />
              </div>
              
              <div className="search-input-group">
                <label>Filter by Crop</label>
                <input 
                  type="text" 
                  value={filterCrop} 
                  onChange={(e) => setFilterCrop(e.target.value)} 
                  placeholder="e.g. Wheat"
                />
              </div>
            </div>
            
            <button 
              className="btn-export-excel" 
              onClick={handleExportExcel}
            >
              <FileText size={18} /> Export Excel
            </button>
          </div>
        </div>

        {/* Claims Table/List */}
        {loading ? (
          <div className="officer-loading">
            <div className="officer-spinner"></div>
            <p>Fetching crop insurance claims...</p>
          </div>
        ) : error ? (
          <div className="officer-error-panel">
            <AlertTriangle size={32} />
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchClaims}>Retry</button>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="no-claims-panel glass-panel">
            <FileText size={48} className="empty-icon" />
            <h3>No claims found</h3>
            <p>There are currently no claims matching the '{filterStatus}' filter.</p>
          </div>
        ) : (
          <div className="claims-table-wrapper glass-panel">
            <table className="claims-table">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Farmer Details</th>
                  <th>Location</th>
                  <th>Crop & Stage</th>
                  <th>AI Severity & Disease</th>
                  <th>Submission Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => (
                  <tr key={claim.claim_id}>
                    <td className="claim-id-col">
                      <code>{claim.claim_id}</code>
                    </td>
                    <td>
                      <div className="farmer-cell">
                        <strong>{claim.farmer_details.farmer_name}</strong>
                        <span>{claim.farmer_details.mobile}</span>
                      </div>
                    </td>
                    <td>
                      <div className="location-cell">
                        <span>{claim.farmer_details.village}, {claim.farmer_details.district}</span>
                        <span className="state-tag">{claim.farmer_details.state}</span>
                      </div>
                    </td>
                    <td>
                      <div className="crop-cell">
                        <strong>{claim.crop_details.crop_name}</strong>
                        <span>Stage: {claim.crop_details.crop_stage}</span>
                      </div>
                    </td>
                    <td>
                      <div className="ai-cell">
                        <span className={`severity-badge severity-${claim.ai_damage_details.risk.toLowerCase()}`}>
                          {claim.ai_damage_details.severity}%
                        </span>
                        <span className="disease-name">{claim.ai_damage_details.disease}</span>
                      </div>
                    </td>
                    <td>
                      <span className="date-tag">
                        {claim.created_at ? new Date(claim.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge-table ${getStatusBadgeClass(claim.status)}`}>
                        {getStatusIcon(claim.status)}
                        <span>{claim.status === 'Submitted' ? 'Pending' : claim.status}</span>
                      </span>
                    </td>
                    <td>
                      <button className="btn-review" onClick={() => setSelectedClaim(claim)}>
                        <span>Review</span>
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Review Modal */}
      {selectedClaim && (
        <div className="modal-overlay" onClick={() => setSelectedClaim(null)}>
          <div className="review-modal glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Crop Damage Claim</h2>
              <button className="modal-close-btn" onClick={() => setSelectedClaim(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-grid">
              {/* Left Column: Image and AI metrics */}
              <div className="modal-left-col">
                <div className="modal-image-container">
                  {selectedClaim.image_path ? (
                    <img src={selectedClaim.image_path} alt="Crop damage" />
                  ) : (
                    <div className="no-image-placeholder">
                      <Leaf size={48} />
                      <span>No Image Uploaded</span>
                    </div>
                  )}
                </div>

                <div className="metrics-box">
                  <h3>AI Diagnostics Summary</h3>
                  <div className="metrics-grid">
                    <div className="metric-item">
                      <span>Detected Crop</span>
                      <strong>{selectedClaim.crop_details.crop_name}</strong>
                    </div>
                    <div className="metric-item">
                      <span>Condition / Disease</span>
                      <strong className="disease-text">{selectedClaim.ai_damage_details.disease}</strong>
                    </div>
                    <div className="metric-item">
                      <span>Damage Severity</span>
                      <strong className="severity-text">{selectedClaim.ai_damage_details.severity}%</strong>
                    </div>
                    <div className="metric-item font-highlight">
                      <span>Risk Assessment</span>
                      <span className={`risk-tag risk-${selectedClaim.ai_damage_details.risk.toLowerCase()}`}>
                        {selectedClaim.ai_damage_details.risk} Risk
                      </span>
                    </div>
                  </div>

                  <div className={`eligibility-alert ${selectedClaim.ai_damage_details.claim_eligible ? 'eligible' : 'not-eligible'}`}>
                    <AlertTriangle size={18} />
                    <span>
                      {selectedClaim.ai_damage_details.claim_eligible
                        ? 'Damage exceeds PMFBY 30% threshold. Automated approval recommended.'
                        : 'Damage is below the 30% PMFBY threshold. Review manually.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Farmer & claim narrative */}
              <div className="modal-right-col">
                <div className="review-section">
                  <div className="section-title-row">
                    <FileText size={18} className="section-icon" />
                    <h4>Claim Details</h4>
                  </div>
                  <div className="details-list">
                    <div className="detail-item">
                      <span>Claim ID:</span>
                      <code>{selectedClaim.claim_id}</code>
                    </div>
                    <div className="detail-item">
                      <span>Submitted Date:</span>
                      <strong>{selectedClaim.created_at ? new Date(selectedClaim.created_at).toLocaleString() : 'N/A'}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Damage Observation Date:</span>
                      <div className="icon-text">
                        <Calendar size={14} />
                        <strong>{selectedClaim.damage_date}</strong>
                      </div>
                    </div>
                    <div className="detail-item">
                      <span>Crop Growth Stage:</span>
                      <strong>{selectedClaim.crop_details.crop_stage}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Total Field Area:</span>
                      <strong>{selectedClaim.crop_details.field_area}</strong>
                    </div>
                  </div>
                </div>

                <div className="review-section">
                  <div className="section-title-row">
                    <Phone size={18} className="section-icon" />
                    <h4>Farmer Information</h4>
                  </div>
                  <div className="details-list">
                    <div className="detail-item">
                      <span>Farmer Name:</span>
                      <strong>{selectedClaim.farmer_details.farmer_name}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Contact Mobile:</span>
                      <div className="icon-text">
                        <Phone size={14} />
                        <strong>{selectedClaim.farmer_details.mobile}</strong>
                      </div>
                    </div>
                    <div className="detail-item">
                      <span>Location:</span>
                      <div className="icon-text">
                        <MapPin size={14} />
                        <strong>
                          {selectedClaim.farmer_details.village}, {selectedClaim.farmer_details.district}, {selectedClaim.farmer_details.state}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="review-section text-block">
                  <h4>Farmer Statement / Incident Report</h4>
                  <div className="statement-box">
                    <p>"{selectedClaim.description}"</p>
                  </div>
                  {selectedClaim.additional_notes && (
                    <div className="notes-box">
                      <h5>Additional Notes:</h5>
                      <p>{selectedClaim.additional_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions-footer">
              <div className="current-status-footer">
                <span>Current Status:</span>
                <span className={`status-badge-table ${getStatusBadgeClass(selectedClaim.status)}`}>
                  {getStatusIcon(selectedClaim.status)}
                  <span>{selectedClaim.status === 'Submitted' ? 'Pending' : selectedClaim.status}</span>
                </span>
              </div>
              
              <div className="action-buttons-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="status-dropdown-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label htmlFor="modal-status-select" style={{ fontSize: '0.85rem', color: '#adb5bd', fontWeight: '500' }}>
                    Update Status:
                  </label>
                  <select
                    id="modal-status-select"
                    value={selectedClaim.status}
                    onChange={(e) => handleAction(selectedClaim.claim_id, e.target.value)}
                    disabled={actionLoading}
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '10px',
                      color: '#fff',
                      padding: '0.6rem 2rem 0.6rem 1rem',
                      cursor: 'pointer',
                      outline: 'none',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23adb5bd\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center',
                      backgroundSize: '14px'
                    }}
                  >
                    <option value="Submitted">Submitted (Pending)</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Inspection Pending">Inspection Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <button className="btn btn-secondary" onClick={() => setSelectedClaim(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfficerDashboard;
