const express = require('express');
const router = express.Router();
const Photo = require('../models/Photo');
const { protect } = require('../middleware/auth');
const { upload, cloudinary } = require('../middleware/cloudinary');

router.get('/trip/:tripId', protect, async (req, res) => {
  const photos = await Photo.find({ trip: req.params.tripId, user: req.user._id }).sort('-takenAt');
  res.json({ success: true, photos });
});

router.post('/trip/:tripId', protect, upload.array('photos', 20), async (req, res) => {
  const photos = req.files.map(file => ({
    trip: req.params.tripId,
    user: req.user._id,
    url: file.path,
    publicId: file.filename,
    caption: req.body.caption || '',
    location: req.body.location || '',
  }));
  const saved = await Photo.insertMany(photos);
  res.status(201).json({ success: true, photos: saved });
});

router.put('/:id', protect, async (req, res) => {
  const photo = await Photo.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
  res.json({ success: true, photo });
});

router.delete('/:id', protect, async (req, res) => {
  const photo = await Photo.findOne({ _id: req.params.id, user: req.user._id });
  if (photo) {
    await cloudinary.uploader.destroy(photo.publicId);
    await photo.deleteOne();
  }
  res.json({ success: true });
});

module.exports = router;
