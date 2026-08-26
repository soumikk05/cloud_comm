import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  FileText,
  Camera,
  Search,
  ScanFace,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Zap,
  Lock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { UploadZone } from './UploadZone';
import { Spinner } from '../common';
import { AnimatedText } from '../common/AnimatedBg';

export function UploadPage({ onAnalyze, loading, status, error }) {
  const [docFile, setDocFile] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);

  const handleSubmit = () => {
    if (!docFile) return;
    onAnalyze(docFile, selfieFile);
  };

  const docTypes = [
    { label: 'Passport', icon: FileText, desc: 'ICAO Doc 9303' },
    { label: 'Visa Stamp', icon: Fingerprint, desc: 'Type A & B' },
    { label: 'National ID', icon: Lock, desc: 'Biometric Smart Cards' },
    { label: 'Driver License', icon: Zap, desc: 'State / Gov IDs' },
  ];

  return (
    <div className="upload-page">
      {/* Loading overlay with scanning effect */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="loading-overlay"
          >
            <Spinner size="lg" />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="loading-overlay__text"
            >
              {status || 'Neural Pipeline Executing…'}
            </motion.div>
            <div className="loading-overlay__sub">
              Running OCR extraction, MRZ checksum validation, ELA tampering forensics
              {selfieFile ? ', and deep 512d face embeddings' : ''}.
            </div>
            <div className="loading-overlay__steps">
              <motion.div
                className="loading-overlay__step"
                animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
              >
                <FileText size={14} />
                <span>OCR Extract</span>
              </motion.div>
              <motion.div
                className="loading-overlay__step"
                animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              >
                <CheckCircle2 size={14} />
                <span>MRZ Checksum</span>
              </motion.div>
              <motion.div
                className="loading-overlay__step"
                animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
              >
                <AlertTriangle size={14} />
                <span>ELA Forensics</span>
              </motion.div>
              {selfieFile && (
                <motion.div
                  className="loading-overlay__step"
                  animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 }}
                >
                  <ScanFace size={14} />
                  <span>Face 512d</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="upload-page__hero">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          className="upload-page__hero-icon-wrap"
        >
          <ShieldAlert className="upload-page__hero-icon" size={54} />
        </motion.div>

        <h1 className="upload-page__title">
          <AnimatedText text="Verify Identity Documents" delay={0.1} />
          <br />
          <span className="upload-page__hero-accent">
            <AnimatedText text="with Multimodal AI Forensics" delay={0.4} />
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="upload-page__hero-desc"
        >
          Upload passports, visas, or IDs for deep forensic analysis — neural OCR extraction,
          algorithmic MRZ validation, error level analysis (ELA) tampering detection, and biometric face verification.
        </motion.p>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="error-banner"
          >
            <AlertTriangle size={18} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload grid */}
      <div className="upload-page__grid">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="upload-page__grid-item"
        >
          <div className="upload-page__section-label">
            <FileText size={16} className="upload-page__section-icon" />
            <span>Document Scan</span>
            <span className="upload-page__required-tag">Required</span>
          </div>
          <UploadZone
            label="Drop ID or Passport Image"
            hint="Passport, Visa, or National ID • PNG, JPG, BMP"
            icon={FileText}
            file={docFile}
            onFileChange={setDocFile}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="upload-page__grid-item"
        >
          <div className="upload-page__section-label">
            <Camera size={16} className="upload-page__section-icon" />
            <span>Live Selfie Photo</span>
            <span className="upload-page__optional-tag">Optional</span>
          </div>
          <UploadZone
            label="Drop Selfie for Facial Match"
            hint="Verifies live portrait against document photo"
            icon={ScanFace}
            file={selfieFile}
            onFileChange={setSelfieFile}
          />
        </motion.div>
      </div>

      {/* Supported document types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="upload-page__doc-types"
      >
        {docTypes.map((item, idx) => {
          const ItemIcon = item.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -3, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="upload-page__doc-type"
            >
              <ItemIcon size={15} className="upload-page__doc-icon" />
              <span className="upload-page__doc-name">{item.label}</span>
              <span className="upload-page__doc-spec">{item.desc}</span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="upload-page__actions"
      >
        <motion.button
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="btn btn--primary btn--lg"
          disabled={!docFile || loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <>
              <Spinner size="sm" />
              <span>Analyzing Document…</span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              <span>Launch Forensic Analysis</span>
              <ArrowRight size={18} />
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}
