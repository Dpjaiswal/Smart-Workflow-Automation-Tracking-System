import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px' 
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{title}</h3>
          <button onClick={onClose} className="icon-btn" style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
