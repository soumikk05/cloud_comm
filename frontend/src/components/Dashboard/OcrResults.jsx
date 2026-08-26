import { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  User,
  Calendar,
  Globe,
  Hash,
  Fingerprint,
  Copy,
  Check,
  Tag,
} from 'lucide-react';
import { Card, Badge } from '../common';

export function OcrResults({ ocr }) {
  const [copiedKey, setCopiedKey] = useState(null);

  if (!ocr) {
    return (
      <Card title="OCR Extraction" subtitle="No OCR data available" icon={FileText}>
        <div className="empty-state">No text detected or OCR module failed.</div>
      </Card>
    );
  }

  const {
    document_type,
    fields = {},
    raw_mrz_text,
    raw_text_lines = [],
    face_detected = false,
  } = ocr;

  const mrzText =
    raw_mrz_text || fields?.raw_mrz_text || (Array.isArray(raw_text_lines) && raw_text_lines.length > 0 ? raw_text_lines.join('\n') : null);

  const getFieldText = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === 'object') {
      if (val.value !== undefined && val.value !== null) return String(val.value);
      return JSON.stringify(val);
    }
    return String(val);
  };

  const rawDocType = getFieldText(document_type) || getFieldText(fields.document_type);
  const rawDocNum = getFieldText(fields.document_number) || getFieldText(fields.doc_number) || getFieldText(fields.license_number) || getFieldText(fields.passport_number);
  const rawName = getFieldText(fields.name) || getFieldText(fields.full_name) || getFieldText(fields.surname);
  const rawNationality = getFieldText(fields.nationality) || getFieldText(fields.country) || getFieldText(fields.state);
  const rawDob = getFieldText(fields.dob) || getFieldText(fields.date_of_birth);
  const rawExpiry = getFieldText(fields.expiry_date) || getFieldText(fields.expiration_date);
  const rawSex = getFieldText(fields.sex) || getFieldText(fields.gender);

  const fieldList = [
    { label: 'Document Type', value: rawDocType, icon: Tag },
    { label: 'Document Number', value: rawDocNum, icon: Hash },
    { label: 'Full Name', value: rawName, icon: User },
    { label: 'Nationality / State', value: rawNationality, icon: Globe },
    { label: 'Date of Birth', value: rawDob, icon: Calendar },
    { label: 'Expiration Date', value: rawExpiry, icon: Calendar },
    { label: 'Sex / Gender', value: rawSex, icon: User },
  ].filter((f) => f.value && f.value.trim() !== '');

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <Card
      title="Neural OCR & Identity Extraction"
      subtitle={rawDocType ? `Detected Document Profile: ${rawDocType}` : 'Extracted Text & Metadata'}
      icon={FileText}
      action={
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Badge
            label={face_detected ? 'Portrait Detected' : 'No Face In Doc'}
            variant={face_detected ? 'pass' : 'neutral'}
          />
          {rawDocType && <Badge label={rawDocType} variant="info" />}
        </div>
      }
    >
      {/* Key Fields Grid */}
      <div className="ocr-grid">
        {fieldList.map(({ label, value, icon: Icon }, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
            className="ocr-field"
            onClick={() => handleCopy(value, label)}
          >
            <div className="ocr-field__label">
              <Icon size={12} className="ocr-field__icon" />
              <span>{label}</span>
            </div>
            <div className="ocr-field__value-row">
              <span className="ocr-field__value">{value}</span>
              <motion.span whileTap={{ scale: 0.8 }} className="ocr-field__copy-btn">
                {copiedKey === label ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Raw MRZ block */}
      {mrzText && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mrz-block"
        >
          <div className="mrz-block__header">
            <div className="mrz-block__title">
              <Fingerprint size={14} className="mrz-block__icon" />
              <span>ICAO 9303 Raw MRZ Stream</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="mrz-block__copy"
              onClick={() => handleCopy(mrzText, 'mrz')}
            >
              {copiedKey === 'mrz' ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedKey === 'mrz' ? 'Copied' : 'Copy MRZ'}</span>
            </motion.button>
          </div>
          <pre className="mrz-block__text">{mrzText}</pre>
        </motion.div>
      )}
    </Card>
  );
}
