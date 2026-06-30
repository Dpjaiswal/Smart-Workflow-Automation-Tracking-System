import React, { useState, useEffect } from 'react';
import { Paperclip, Download, Trash, File as FileIcon, UploadCloud, X } from 'lucide-react';
import { API_BASE, useAuth } from '../context/AuthContext';
import { Modal } from './Modal';

interface Attachment {
  id: number;
  filename: string;
  file_path: string;
  content_type: string;
  created_at: string;
  uploaded_by?: { full_name: string };
}

interface AttachmentManagerProps {
  entityType: 'task' | 'ticket' | 'approval';
  entityId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({ entityType, entityId, isOpen, onClose }) => {
  const { getAuthHeaders } = useAuth();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchAttachments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/attachments/${entityType}/${entityId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAttachments(data);
      }
    } catch (e) {
      console.error('Failed to fetch attachments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAttachments();
    }
  }, [isOpen, entityType, entityId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append(`${entityType}_id`, entityId.toString());

    setUploading(true);
    try {
      const headers = getAuthHeaders();
      // Remove Content-Type so browser sets it with boundary for multipart
      delete headers['Content-Type']; 

      const res = await fetch(`${API_BASE}/api/attachments/`, {
        method: 'POST',
        headers,
        body: formData
      });
      if (res.ok) {
        fetchAttachments();
      }
    } catch (e) {
      console.error('Upload failed:', e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Attachments & Documents">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Upload Zone */}
        <div style={{
          border: '2px dashed var(--border-color)',
          borderRadius: '8px',
          padding: '24px',
          textAlign: 'center',
          backgroundColor: 'rgba(255,255,255,0.02)',
          cursor: 'pointer',
          position: 'relative'
        }}>
          <UploadCloud size={32} color="var(--primary)" style={{ marginBottom: '12px' }} />
          <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>Click to Upload File</h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Support images, pdfs, and documents up to 10MB.</p>
          <input 
            type="file" 
            onChange={handleFileUpload} 
            disabled={uploading}
            style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              opacity: 0, cursor: 'pointer'
            }} 
          />
          {uploading && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--secondary)' }}>
              Uploading... Please wait.
            </div>
          )}
        </div>

        {/* Attachments List */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
            Attached Files ({attachments.length})
          </h4>
          
          {loading ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading...</div>
          ) : attachments.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
              No attachments found for this {entityType}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {attachments.map(att => (
                <div key={att.id} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '12px', background: 'var(--bg-base)', borderRadius: '6px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--surface-color)', padding: '8px', borderRadius: '4px' }}>
                      <FileIcon size={16} color="var(--primary)" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }} title={att.filename}>
                        {att.filename}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Uploaded by {att.uploaded_by?.full_name} on {new Date(att.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <a 
                    href={`${API_BASE}${att.file_path}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ padding: '6px', minWidth: 'auto', background: 'transparent', border: 'none' }}
                    title="Download"
                  >
                    <Download size={16} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </Modal>
  );
};
