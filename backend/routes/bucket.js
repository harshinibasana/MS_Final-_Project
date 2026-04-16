const express = require('express');
const router  = express.Router();
const BucketItem = require('../models/BucketItem');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req,res) => {
  const items = await BucketItem.find({ user:req.user._id }).sort('-priority createdAt');
  res.json({ success:true, items });
});
router.post('/', protect, async (req,res) => {
  const item = await BucketItem.create({ ...req.body, user:req.user._id });
  res.status(201).json({ success:true, item });
});
router.put('/:id', protect, async (req,res) => {
  const item = await BucketItem.findOneAndUpdate(
    { _id:req.params.id, user:req.user._id }, { $set:req.body }, { new:true }
  );
  if (!item) return res.status(404).json({ success:false, message:'Not found' });
  res.json({ success:true, item });
});
router.delete('/:id', protect, async (req,res) => {
  await BucketItem.findOneAndDelete({ _id:req.params.id, user:req.user._id });
  res.json({ success:true });
});
module.exports = router;
