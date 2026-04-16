import React, { useState, useEffect } from 'react';
import { destinationsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { X, MapPin, Clock, Globe, Star, DollarSign, Ticket, Phone, ExternalLink, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import './DestinationModal.css';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export default function DestinationModal({ destId, onClose }) {
  const { user } = useAuth();
  const [dest, setDest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    destinationsAPI.getOne(destId).then(res => {
      setDest(res.data.destination);
      const existing = res.data.destination.reviews?.find(r => r.user?._id === user?._id || r.user === user?._id);
      if (existing) { setMyRating(existing.rating); setComment(existing.comment); }
    }).finally(() => setLoading(false));
  }, [destId]);

  const handleSubmitReview = async () => {
    if (!myRating) return toast.error('Please select a rating');
    setSubmitting(true);
    try {
      const res = await destinationsAPI.addReview(destId, { rating: myRating, comment });
      setDest(res.data.destination);
      toast.success('Review submitted!');
    } catch { toast.error('Failed to submit review'); }
    finally { setSubmitting(false); }
  };

  if (!dest && loading) return (
    <div className="dest-modal-overlay" onClick={onClose}>
      <div className="dest-modal" onClick={e => e.stopPropagation()}>
        <div className="dest-modal-skeleton" />
      </div>
    </div>
  );

  if (!dest) return null;

  const CAT_ICONS = { landmark: '🏛️', museum: '🎨', beach: '🏖️', mountain: '⛰️', park: '🌳', temple: '⛩️', castle: '🏰', market: '🛒', cultural: '🎭', adventure: '🧗', other: '📍' };

  return (
    <div className="dest-modal-overlay" onClick={onClose}>
      <div className="dest-modal" onClick={e => e.stopPropagation()}>
        <button className="dest-modal-close" onClick={onClose}><X size={20} /></button>

        {/* Hero Image */}
        <div className="dest-modal-hero" style={{ backgroundImage: dest.coverImage ? `url(${dest.coverImage})` : 'linear-gradient(135deg, #0A4D6E, #1A7FA8)' }}>
          <div className="dest-modal-hero-overlay" />
          <div className="dest-modal-hero-content">
            <div className="dest-modal-cat">{CAT_ICONS[dest.category]} {dest.category}</div>
            <h2>{dest.name}</h2>
            <div className="dest-modal-location"><MapPin size={14} /> {dest.city ? `${dest.city}, ` : ''}{dest.country}</div>
            <div className="dest-modal-rating-summary">
              <div className="dest-modal-stars">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={16} fill={s <= Math.round(dest.averageRating) ? '#F5A623' : 'transparent'} color="#F5A623" />
                ))}
              </div>
              <span>{dest.averageRating?.toFixed(1) || '—'}</span>
              <span className="dest-modal-review-count">({dest.totalReviews} reviews)</span>
            </div>
          </div>
        </div>

        <div className="dest-modal-body">
          {/* Entry Fee Card */}
          <div className="dest-info-section">
            <div className="dest-fee-card">
              <div className="dest-fee-header">
                <Ticket size={18} />
                <h3>Entry Fees</h3>
                {dest.entryFee?.isFree && <span className="badge-free">FREE ENTRY</span>}
              </div>
              {dest.entryFee?.isFree ? (
                <p className="fee-free-text">✅ This destination is free to visit!</p>
              ) : (
                <div className="fee-grid">
                  {dest.entryFee?.adult > 0 && (
                    <div className="fee-item">
                      <div className="fee-item-label">Adult</div>
                      <div className="fee-item-value">{dest.entryFee.currency || 'USD'} {dest.entryFee.adult}</div>
                    </div>
                  )}
                  {dest.entryFee?.child > 0 && (
                    <div className="fee-item">
                      <div className="fee-item-label">Child</div>
                      <div className="fee-item-value">{dest.entryFee.currency || 'USD'} {dest.entryFee.child}</div>
                    </div>
                  )}
                  {dest.entryFee?.senior > 0 && (
                    <div className="fee-item">
                      <div className="fee-item-label">Senior</div>
                      <div className="fee-item-value">{dest.entryFee.currency || 'USD'} {dest.entryFee.senior}</div>
                    </div>
                  )}
                </div>
              )}
              {dest.entryFee?.notes && <p className="fee-notes">ℹ️ {dest.entryFee.notes}</p>}
            </div>

            {/* Quick Info */}
            <div className="dest-quick-info">
              {dest.visitDuration && (
                <div className="quick-info-item">
                  <Clock size={15} />
                  <div>
                    <div className="quick-info-label">Visit Duration</div>
                    <div className="quick-info-value">{dest.visitDuration}</div>
                  </div>
                </div>
              )}
              {dest.bestTimeToVisit && (
                <div className="quick-info-item">
                  <Star size={15} />
                  <div>
                    <div className="quick-info-label">Best Time to Visit</div>
                    <div className="quick-info-value">{dest.bestTimeToVisit}</div>
                  </div>
                </div>
              )}
              {dest.website && (
                <div className="quick-info-item">
                  <Globe size={15} />
                  <div>
                    <div className="quick-info-label">Website</div>
                    <a href={dest.website} target="_blank" rel="noreferrer" className="quick-info-link">
                      Visit website <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              )}
              {dest.phone && (
                <div className="quick-info-item">
                  <Phone size={15} />
                  <div>
                    <div className="quick-info-label">Phone</div>
                    <div className="quick-info-value">{dest.phone}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {dest.description && (
            <div className="dest-section">
              <h4>About</h4>
              <p className="dest-description">{dest.description}</p>
            </div>
          )}

          {/* Tips */}
          {dest.tips?.length > 0 && (
            <div className="dest-section">
              <h4>💡 Travel Tips</h4>
              <ul className="dest-tips">
                {dest.tips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          )}

          {/* Opening Hours */}
          {dest.openingHours && Object.values(dest.openingHours).some(d => d?.open) && (
            <div className="dest-section">
              <h4>🕐 Opening Hours</h4>
              <div className="hours-grid">
                {DAYS.map((day, i) => {
                  const h = dest.openingHours[day];
                  return h ? (
                    <div key={day} className={`hours-row ${h.closed ? 'closed' : ''}`}>
                      <span className="hours-day">{DAY_LABELS[i]}</span>
                      <span className="hours-time">{h.closed ? 'Closed' : `${h.open} - ${h.close}`}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {dest.tags?.length > 0 && (
            <div className="dest-section">
              <div className="dest-tags-full">
                {dest.tags.map(t => <span key={t} className="dest-tag-full">#{t}</span>)}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="dest-section">
            <h4>Reviews <span className="review-count-badge">{dest.totalReviews}</span></h4>

            {/* Write Review */}
            <div className="write-review">
              <p className="write-review-label">Rate this destination</p>
              <div className="star-input">
                {[1,2,3,4,5].map(s => (
                  <Star
                    key={s}
                    size={28}
                    fill={(hoverRating || myRating) >= s ? '#F5A623' : 'transparent'}
                    color="#F5A623"
                    className="star-clickable"
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setMyRating(s)}
                  />
                ))}
              </div>
              <textarea
                className="form-input review-textarea"
                placeholder="Share your experience..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
              />
              <button className="btn btn-primary btn-sm" onClick={handleSubmitReview} disabled={submitting}>
                <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>

            {/* Existing Reviews */}
            <div className="reviews-list">
              {dest.reviews?.slice(0, 8).map((r, i) => (
                <div key={i} className="review-item">
                  <div className="review-avatar">{r.userName?.[0]?.toUpperCase() || '?'}</div>
                  <div className="review-content">
                    <div className="review-header">
                      <span className="review-name">{r.userName || 'Anonymous'}</span>
                      <div className="review-stars">
                        {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= r.rating ? '#F5A623' : 'transparent'} color="#F5A623" />)}
                      </div>
                    </div>
                    {r.comment && <p className="review-comment">{r.comment}</p>}
                  </div>
                </div>
              ))}
              {dest.reviews?.length === 0 && <p className="no-reviews">No reviews yet. Be the first!</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
