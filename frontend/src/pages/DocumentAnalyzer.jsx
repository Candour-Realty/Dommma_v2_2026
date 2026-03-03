import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, FileText, Sparkles, Loader2, Shield, AlertTriangle,
  CheckCircle, DollarSign, Scale, ChevronDown, ChevronUp
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DocumentAnalyzer = () => {
  const [text, setText] = useState('');
  const [docType, setDocType] = useState('lease');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`${API}/ai/analyze-document`, {
        document_text: text,
        document_type: docType
      });
      setResult(res.data.analysis);
    } catch (e) {
      console.error(e);
      alert('Analysis failed. Please try again.');
    }
    setLoading(false);
  };

  const fairnessColor = (score) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const toggle = (section) => setExpandedSection(expandedSection === section ? null : section);

  return (
    <div className="min-h-screen bg-[#F5F5F0] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#1A2F3A] flex items-center gap-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            <Scale className="text-[#1A2F3A]" />
            Lease Analyzer
          </h1>
          <p className="text-gray-600 mt-2">
            AI-powered lease & rental document review for BC Residential Tenancy Act compliance
          </p>
        </div>
        {!result ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex gap-2">
                  {['lease', 'rental agreement', 'contract'].map(type => (
                    <button key={type} onClick={() => setDocType(type)}
                      className={`px-4 py-2 rounded-full text-sm capitalize ${docType === type ? 'bg-[#1A2F3A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={16}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1A2F3A] focus:ring-2 focus:ring-[#1A2F3A]/10 outline-none resize-none font-mono text-sm"
                placeholder="Paste your lease or rental agreement text here...&#10;&#10;Example:&#10;RESIDENTIAL TENANCY AGREEMENT&#10;Between Landlord: John Smith&#10;And Tenant: Jane Doe&#10;&#10;1. The monthly rent shall be $2,500 CAD...&#10;2. The security deposit of $2,500 shall be held...&#10;..."
                data-testid="document-text-input"
              />

              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-400">{text.length} characters</p>
                <button 
                  onClick={analyze} 
                  disabled={!text.trim() || loading}
                  className="px-8 py-3 bg-[#1A2F3A] text-white rounded-xl hover:bg-[#2C4A52] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                  data-testid="analyze-document-btn"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {loading ? 'Analyzing...' : 'Analyze Document'}
                </button>
              </div>
            </div>

            <div className="bg-white/50 rounded-2xl p-6 text-center">
              <Scale className="mx-auto mb-3 text-gray-400" size={32} />
              <p className="text-sm text-gray-500">Our AI reviews your document for fairness, red flags, and compliance with BC Residential Tenancy Act.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6" data-testid="document-analysis-result">
            <button onClick={() => setResult(null)} className="text-sm text-[#1A2F3A] hover:underline flex items-center gap-1">
              <ArrowLeft size={14} /> Analyze Another Document
            </button>

            {/* Fairness Score */}
            <div className="bg-white rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-500 mb-2">Fairness Score</p>
              <p className={`text-6xl font-bold ${fairnessColor(result.fairness_score)}`} style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {result.fairness_score || '?'}<span className="text-2xl text-gray-400">/10</span>
              </p>
              <p className="text-gray-500 mt-2">{result.fairness_score >= 7 ? 'Renter-Friendly' : result.fairness_score >= 4 ? 'Average' : 'Review Carefully'}</p>
            </div>

            {/* Summary */}
            {result.summary && (
              <div className="bg-white rounded-2xl p-6">
                <h3 className="font-semibold text-[#1A2F3A] mb-2">Summary</h3>
                <p className="text-gray-600">{result.summary}</p>
              </div>
            )}

            {/* Key Terms */}
            {result.key_terms?.length > 0 && (
              <div className="bg-white rounded-2xl overflow-hidden">
                <button onClick={() => toggle('terms')} className="w-full flex items-center justify-between p-6">
                  <h3 className="font-semibold text-[#1A2F3A]">Key Terms ({result.key_terms.length})</h3>
                  {expandedSection === 'terms' ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {expandedSection === 'terms' && (
                  <div className="px-6 pb-6 space-y-3">
                    {result.key_terms.map((t, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-[#F5F5F0] rounded-xl">
                        <div>
                          <p className="font-medium text-[#1A2F3A] text-sm">{t.term}</p>
                          <p className="text-xs text-gray-500">{t.value}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${t.assessment === 'fair' || t.assessment === 'standard' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {t.assessment}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Red Flags */}
            {result.red_flags?.length > 0 && (
              <div className="bg-red-50 rounded-2xl p-6">
                <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2"><AlertTriangle size={18} /> Red Flags</h3>
                <ul className="space-y-2">
                  {result.red_flags.map((f, i) => <li key={i} className="text-red-600 text-sm">• {f}</li>)}
                </ul>
              </div>
            )}

            {/* Green Flags */}
            {result.green_flags?.length > 0 && (
              <div className="bg-green-50 rounded-2xl p-6">
                <h3 className="font-semibold text-green-700 mb-3 flex items-center gap-2"><CheckCircle size={18} /> Green Flags</h3>
                <ul className="space-y-2">
                  {result.green_flags.map((f, i) => <li key={i} className="text-green-600 text-sm">• {f}</li>)}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div className="bg-white rounded-2xl p-6">
                <h3 className="font-semibold text-[#1A2F3A] mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {result.recommendations.map((r, i) => <li key={i} className="text-gray-600 text-sm flex items-start gap-2"><span className="text-[#1A2F3A] mt-0.5">→</span> {r}</li>)}
                </ul>
              </div>
            )}

            {/* Cost Breakdown */}
            {result.monthly_costs_breakdown && (
              <div className="bg-white rounded-2xl p-6">
                <h3 className="font-semibold text-[#1A2F3A] mb-3 flex items-center gap-2"><DollarSign size={18} /> Monthly Cost Estimate</h3>
                <div className="space-y-2">
                  {Object.entries(result.monthly_costs_breakdown).map(([key, val]) => (
                    <div key={key} className={`flex justify-between py-2 ${key === 'total_estimate' ? 'border-t font-semibold text-[#1A2F3A]' : 'text-gray-600 text-sm'}`}>
                      <span className="capitalize">{key.replace('_', ' ')}</span>
                      <span>${typeof val === 'number' ? val.toLocaleString() : val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentAnalyzer;
