const express = require('express');
const router  = express.Router();
const User        = require('../models/User');
const Trip        = require('../models/Trip');
const Expense     = require('../models/Expense');
const TripPlan    = require('../models/TripPlan');
const HotelBooking= require('../models/HotelBooking');
const PackingItem = require('../models/PackingItem');
const Photo       = require('../models/Photo');
const CarRental   = require('../models/CarRental');
const Place       = require('../models/Place');
const { protect } = require('../middleware/auth');

const isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ success:false, message:'Admin access required' });
  next();
};

// ── OVERVIEW STATS ─────────────────────────────────────────────────────────
router.get('/stats', protect, isAdmin, async (req, res) => {
  const [userCount, tripCount, expAgg, planCount, hotelCount] = await Promise.all([
    User.countDocuments(),
    Trip.countDocuments(),
    Expense.aggregate([{ $group:{ _id:null, total:{ $sum:'$amount' } } }]),
    TripPlan.countDocuments(),
    HotelBooking.countDocuments(),
  ]);
  const recentUsers = await User.find().sort('-createdAt').limit(8).select('name email role createdAt avatar');
  const recentTrips = await Trip.find().sort('-createdAt').limit(8).populate('user','name email');
  const tripsByStatus = await Trip.aggregate([{ $group:{ _id:'$status', count:{ $sum:1 } } }]);
  const expByCategory = await Expense.aggregate([{ $group:{ _id:'$category', total:{ $sum:'$amount' }, count:{ $sum:1 } } }]);
  res.json({ success:true, stats:{
    users:userCount, trips:tripCount, plans:planCount, hotels:hotelCount,
    totalSpent: expAgg[0]?.total || 0,
    recentUsers, recentTrips, tripsByStatus, expByCategory,
  }});
});

// ── ALL USERS ───────────────────────────────────────────────────────────────
router.get('/users', protect, isAdmin, async (req, res) => {
  const { search, role } = req.query;
  const filter = {};
  if (role && role !== 'all') filter.role = role;
  if (search) filter.$or = [
    { name:{ $regex:search, $options:'i' } },
    { email:{ $regex:search, $options:'i' } },
  ];
  const users = await User.find(filter).select('-password').sort('-createdAt');
  const withStats = await Promise.all(users.map(async u => {
    const [trips, expenses, plans] = await Promise.all([
      Trip.countDocuments({ user:u._id }),
      Expense.aggregate([{ $match:{ user:u._id } },{ $group:{ _id:null, total:{ $sum:'$amount' }, count:{ $sum:1 } } }]),
      TripPlan.countDocuments({ user:u._id }),
    ]);
    return { ...u.toJSON(), tripCount:trips, expenseTotal:expenses[0]?.total||0, expenseCount:expenses[0]?.count||0, planCount:plans };
  }));
  res.json({ success:true, users:withStats });
});

// ── USER FULL ACTIVITY ──────────────────────────────────────────────────────
router.get('/users/:id/activity', protect, isAdmin, async (req, res) => {
  const uid = req.params.id;
  const [user, trips, expenses, plans, hotels, packing, photos, rentals, places] = await Promise.all([
    User.findById(uid).select('-password'),
    Trip.find({ user:uid }).sort('-createdAt'),
    Expense.find({ user:uid }).sort('-date').limit(100),
    TripPlan.find({ user:uid }).sort('-createdAt').limit(100),
    HotelBooking.find({ user:uid }).sort('-createdAt').limit(50),
    PackingItem.find({ user:uid }).sort('-createdAt').limit(100),
    Photo.find({ user:uid }).sort('-createdAt').limit(50),
    CarRental.find({ user:uid }).sort('-createdAt').limit(50),
    Place.find({ user:uid }).sort('-createdAt').limit(50),
  ]);
  if (!user) return res.status(404).json({ success:false, message:'User not found' });
  const totalSpent = expenses.reduce((s,e) => s+e.amount, 0);
  res.json({ success:true, user, trips, expenses, plans, hotels, packing, photos, rentals, places, totalSpent });
});

// ── UPDATE USER ROLE ────────────────────────────────────────────────────────
router.put('/users/:id/role', protect, isAdmin, async (req, res) => {
  if (req.params.id === req.user._id.toString())
    return res.status(400).json({ success:false, message:"Can't change your own role" });
  const user = await User.findByIdAndUpdate(req.params.id, { role:req.body.role }, { new:true }).select('-password');
  res.json({ success:true, user });
});

// ── DELETE USER ─────────────────────────────────────────────────────────────
router.delete('/users/:id', protect, isAdmin, async (req, res) => {
  if (req.params.id === req.user._id.toString())
    return res.status(400).json({ success:false, message:"Can't delete yourself" });
  await User.findByIdAndDelete(req.params.id);
  await Trip.deleteMany({ user:req.params.id });
  await Expense.deleteMany({ user:req.params.id });
  await TripPlan.deleteMany({ user:req.params.id });
  res.json({ success:true, message:'User and all their data deleted' });
});

// ── ALL TRIPS ───────────────────────────────────────────────────────────────
router.get('/trips', protect, isAdmin, async (req, res) => {
  const { search, status, userId } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (userId) filter.user = userId;
  if (search) filter.$or = [
    { title:{ $regex:search, $options:'i' } },
    { destination:{ $regex:search, $options:'i' } },
  ];
  const trips = await Trip.find(filter).populate('user','name email avatar').sort('-createdAt').limit(200);
  const withExpenses = await Promise.all(trips.map(async t => {
    const exps = await Expense.find({ trip:t._id });
    const plans = await TripPlan.find({ trip:t._id });
    return { ...t.toJSON(), totalSpent:exps.reduce((s,e)=>s+e.amount,0), expenseCount:exps.length, planCount:plans.length };
  }));
  res.json({ success:true, trips:withExpenses });
});

// ── DELETE TRIP ─────────────────────────────────────────────────────────────
router.delete('/trips/:id', protect, isAdmin, async (req, res) => {
  await Trip.findByIdAndDelete(req.params.id);
  await Expense.deleteMany({ trip:req.params.id });
  await TripPlan.deleteMany({ trip:req.params.id });
  res.json({ success:true, message:'Trip deleted' });
});

// ── ACTIVITY FEED (all users, recent actions) ───────────────────────────────
router.get('/activity', protect, isAdmin, async (req, res) => {
  const limit = parseInt(req.query.limit)||50;
  const [trips, expenses, plans, hotels] = await Promise.all([
    Trip.find().populate('user','name email avatar').sort('-createdAt').limit(limit),
    Expense.find().populate('user','name email avatar').sort('-createdAt').limit(limit),
    TripPlan.find().populate('user','name email avatar').sort('-createdAt').limit(limit),
    HotelBooking.find().populate('user','name email avatar').sort('-createdAt').limit(limit),
  ]);
  // Merge and sort by date
  const feed = [
    ...trips.map(t => ({ type:'trip', action:'created trip', label:t.title, sub:`${t.destination} · ${t.status}`, user:t.user, date:t.createdAt, color:'#3B82F6', icon:'✈️' })),
    ...expenses.map(e => ({ type:'expense', action:'added expense', label:e.title, sub:`$${e.amount} · ${e.category}`, user:e.user, date:e.createdAt, color:'#E8614D', icon:'💸' })),
    ...plans.map(p => ({ type:'plan', action:'added plan', label:p.title, sub:`${p.category} · ${p.status}`, user:p.user, date:p.createdAt, color:'#6B8F71', icon:'📋' })),
    ...hotels.map(h => ({ type:'hotel', action:'booked hotel', label:h.hotelName||'Hotel', sub:`${h.checkIn?new Date(h.checkIn).toDateString():''}`, user:h.user, date:h.createdAt, color:'#F5A623', icon:'🏨' })),
  ].sort((a,b) => new Date(b.date)-new Date(a.date)).slice(0,100);
  res.json({ success:true, feed });
});

module.exports = router;
