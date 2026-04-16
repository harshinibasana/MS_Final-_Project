import React, { useState, useEffect, useCallback } from 'react';
import { photosAPI } from '../../utils/api';
import { useDropzone } from 'react-dropzone';
import { Trash2, Upload, Image, X } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './tabs.css';

export default function PhotosTab({ tripId }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    photosAPI.getByTrip(tripId).then(res => setPhotos(res.data.photos));
  }, [tripId]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      acceptedFiles.forEach(f => formData.append('photos', f));
      const res = await photosAPI.upload(tripId, formData);
      setPhotos(prev => [...res.data.photos, ...prev]);
      toast.success(`${acceptedFiles.length} photo${acceptedFiles.length > 1 ? 's' : ''} uploaded!`);
    } catch { toast.error('Upload failed. Check Cloudinary configuration.'); }
    finally { setUploading(false); }
  }, [tripId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, multiple: true });

  const handleDelete = async (id) => {
    await photosAPI.delete(id);
    setPhotos(photos.filter(p => p._id !== id));
    if (selected?._id === id) setSelected(null);
    toast.success('Photo deleted');
  };

  return (
    <div className="photos-tab">
      <div {...getRootProps()} className={`dropzone-area ${isDragActive ? 'drag-active' : ''}`}>
        <input {...getInputProps()} />
        <div className="dropzone-icon"><Upload size={36} /></div>
        {uploading ? (
          <div className="dropzone-text">Uploading...</div>
        ) : (
          <>
            <div className="dropzone-text">{isDragActive ? 'Drop photos here!' : 'Drag & drop photos or click to upload'}</div>
            <div className="dropzone-sub">Supports JPG, PNG, WEBP · Multiple files allowed</div>
          </>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="empty-state"><Image size={48} className="empty-icon" /><p>No photos yet. Upload your travel memories!</p></div>
      ) : (
        <div className="photos-grid">
          {photos.map(photo => (
            <div key={photo._id} className="photo-item" onClick={() => setSelected(photo)}>
              <img src={photo.url} alt={photo.caption || 'Travel photo'} loading="lazy" />
              <div className="photo-item-overlay">
                <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); handleDelete(photo._id); }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="photo-modal" onClick={() => setSelected(null)}>
          <div className="photo-modal-content" onClick={e => e.stopPropagation()}>
            <button className="photo-modal-close" onClick={() => setSelected(null)}><X size={20} /></button>
            <img src={selected.url} alt={selected.caption || ''} />
            {selected.caption && <div className="photo-modal-caption">{selected.caption}</div>}
            {selected.location && <div className="photo-modal-location">📍 {selected.location}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
