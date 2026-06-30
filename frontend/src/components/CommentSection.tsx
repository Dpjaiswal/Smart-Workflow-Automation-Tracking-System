import React, { useState, useEffect, useRef } from 'react';
import { Send, User as UserIcon, MessageSquare } from 'lucide-react';
import { API_BASE, useAuth } from '../context/AuthContext';
import { Modal } from './Modal';

interface Comment {
  id: number;
  content: string;
  created_at: string;
  author: { full_name: string; role: string; id: number };
}

interface CommentSectionProps {
  entityType: 'task' | 'ticket';
  entityId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ entityType, entityId, isOpen, onClose }) => {
  const { user, getAuthHeaders } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/comments/${entityType}/${entityId}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error('Failed to fetch comments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, entityType, entityId]);

  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, isOpen]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setPosting(true);
    try {
      const payload = {
        content: newComment.trim(),
        task_id: entityType === 'task' ? entityId : null,
        ticket_id: entityType === 'ticket' ? entityId : null,
      };

      const res = await fetch(`${API_BASE}/api/comments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (e) {
      console.error('Failed to post comment:', e);
    } finally {
      setPosting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Discussion & Activity Feed">
      <div style={{ display: 'flex', flexDirection: 'column', height: '60vh', minHeight: '400px' }}>
        
        {/* Comments Feed */}
        <div style={{ 
          flexGrow: 1, 
          overflowY: 'auto', 
          padding: '16px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading discussion...</div>
          ) : comments.length === 0 ? (
            <div style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', 
              justifyContent: 'center', height: '100%', color: 'var(--text-muted)'
            }}>
              <MessageSquare size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <p>No comments yet. Start the conversation!</p>
            </div>
          ) : (
            comments.map((comment) => {
              const isMe = user?.email && user.email === (comment.author as any).email; // In a real app we'd compare IDs
              // Actually our user object from Context might not have ID in Token easily without decoding, but let's assume standard logic or check role
              return (
                <div key={comment.id} style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  background: 'var(--bg-base)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  maxWidth: '90%',
                  alignSelf: 'flex-start'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ background: 'var(--surface-color)', padding: '4px', borderRadius: '50%' }}>
                      <UserIcon size={14} color="var(--primary)" />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>{comment.author.full_name}</span>
                    <span className={`role-badge role-${comment.author.role}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                      {comment.author.role}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {new Date(comment.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                    {comment.content}
                  </p>
                </div>
              );
            })
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Post Comment Input */}
        <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '8px' }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Type your message here..."
            className="form-input"
            style={{ 
              flexGrow: 1, 
              resize: 'none', 
              height: '48px', 
              paddingTop: '12px',
              background: 'var(--bg-base)'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePostComment(e);
              }
            }}
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={posting || !newComment.trim()}
            style={{ width: '48px', height: '48px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Send size={18} />
          </button>
        </form>

      </div>
    </Modal>
  );
};
