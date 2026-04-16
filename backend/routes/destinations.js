const express = require('express');
const router = express.Router();
const Destination = require('../models/Destination');
const { protect } = require('../middleware/auth');

// GET search destinations (autocomplete / recommended)
router.get('/search', protect, async (req, res) => {
  const { q, category, country, limit = 10 } = req.query;
  const filter = {};

  if (q && q.trim()) {
    // Use MongoDB text search + regex for autocomplete
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { city: { $regex: q, $options: 'i' } },
      { country: { $regex: q, $options: 'i' } },
      { tags: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
    ];
  }

  if (category) filter.category = category;
  if (country) filter.country = { $regex: country, $options: 'i' };

  const destinations = await Destination.find(filter)
    .sort({ isFeatured: -1, averageRating: -1, totalReviews: -1 })
    .limit(parseInt(limit))
    .select('name country city category coverImage averageRating totalReviews entryFee tags isFeatured');

  res.json({ success: true, count: destinations.length, destinations });
});

// GET featured destinations
router.get('/featured', protect, async (req, res) => {
  const destinations = await Destination.find({ isFeatured: true })
    .sort({ averageRating: -1 })
    .limit(12)
    .select('name country city category coverImage averageRating totalReviews entryFee tags');
  res.json({ success: true, destinations });
});

// GET all destinations (paginated)
router.get('/', protect, async (req, res) => {
  const { page = 1, limit = 20, category, country, sort = '-averageRating' } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (country) filter.country = { $regex: country, $options: 'i' };

  const total = await Destination.countDocuments(filter);
  const destinations = await Destination.find(filter)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ success: true, total, page: parseInt(page), pages: Math.ceil(total / limit), destinations });
});

// GET single destination
router.get('/:id', protect, async (req, res) => {
  const dest = await Destination.findById(req.params.id).populate('reviews.user', 'name avatar');
  if (!dest) return res.status(404).json({ success: false, message: 'Destination not found' });
  res.json({ success: true, destination: dest });
});

// POST create destination
router.post('/', protect, async (req, res) => {
  const dest = await Destination.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, destination: dest });
});

// PUT update destination
router.put('/:id', protect, async (req, res) => {
  const dest = await Destination.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: Date.now() }, { new: true });
  if (!dest) return res.status(404).json({ success: false, message: 'Not found' });
  res.json({ success: true, destination: dest });
});

// POST add review
router.post('/:id/reviews', protect, async (req, res) => {
  const { rating, comment } = req.body;
  const dest = await Destination.findById(req.params.id);
  if (!dest) return res.status(404).json({ success: false, message: 'Not found' });

  // Remove existing review by same user
  dest.reviews = dest.reviews.filter(r => r.user?.toString() !== req.user._id.toString());

  dest.reviews.push({ user: req.user._id, userName: req.user.name, rating: parseInt(rating), comment });
  dest.updateRating();
  await dest.save();
  res.json({ success: true, destination: dest });
});

// DELETE destination
router.delete('/:id', protect, async (req, res) => {
  await Destination.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// POST seed sample destinations
router.post('/seed/sample', protect, async (req, res) => {
  const count = await Destination.countDocuments();
  if (count > 0) return res.json({ success: true, message: 'Already seeded', count });

  const samples = [
    { name: 'Eiffel Tower', country: 'France', city: 'Paris', category: 'landmark', description: 'Iconic iron lattice tower on the Champ de Mars in Paris, one of the most recognizable structures in the world.', entryFee: { adult: 26, child: 13, currency: 'EUR', isFree: false }, averageRating: 4.7, totalReviews: 1240, tags: ['iconic', 'romantic', 'views', 'paris'], isFeatured: true, bestTimeToVisit: 'April–June or September–October', visitDuration: '2–3 hours', coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600' },
    { name: 'Colosseum', country: 'Italy', city: 'Rome', category: 'landmark', description: 'Ancient amphitheater in the centre of Rome, one of the greatest works of architecture and engineering.', entryFee: { adult: 16, child: 0, currency: 'EUR', isFree: false }, averageRating: 4.8, totalReviews: 2100, tags: ['ancient', 'history', 'rome', 'architecture'], isFeatured: true, bestTimeToVisit: 'March–May or September–October', visitDuration: '2–4 hours', coverImage: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600' },
    { name: 'Mount Fuji', country: 'Japan', city: 'Fujinomiya', category: 'mountain', description: 'Japan\'s highest mountain and active volcano, a UNESCO World Heritage Site.', entryFee: { adult: 1000, child: 0, currency: 'JPY', isFree: false, notes: 'Climbing fee (July–Sept only)' }, averageRating: 4.9, totalReviews: 890, tags: ['mountain', 'hiking', 'japan', 'nature', 'iconic'], isFeatured: true, bestTimeToVisit: 'July–August for climbing, October for foliage', visitDuration: 'Full day', coverImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600' },
    { name: 'Machu Picchu', country: 'Peru', city: 'Cusco Region', category: 'landmark', description: '15th-century Inca citadel set high in the Andes Mountains, a UNESCO World Heritage Site.', entryFee: { adult: 152, child: 77, currency: 'PEN', isFree: false }, averageRating: 4.9, totalReviews: 1560, tags: ['inca', 'history', 'hiking', 'andes', 'ancient'], isFeatured: true, bestTimeToVisit: 'May–September (dry season)', visitDuration: 'Full day', coverImage: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=600' },
    { name: 'Bali Sacred Monkey Forest', country: 'Indonesia', city: 'Ubud', category: 'park', description: 'Nature reserve and temple complex home to over 1,000 Balinese long-tailed macaques.', entryFee: { adult: 80000, child: 60000, currency: 'IDR', isFree: false }, averageRating: 4.4, totalReviews: 670, tags: ['nature', 'animals', 'bali', 'temple', 'wildlife'], isFeatured: false, bestTimeToVisit: 'April–October', visitDuration: '1–2 hours', coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600' },
    { name: 'Santorini Caldera', country: 'Greece', city: 'Santorini', category: 'landmark', description: 'Stunning volcanic archipelago with iconic blue-domed churches and dramatic cliffside villages.', entryFee: { adult: 0, child: 0, isFree: true, notes: 'Free to explore. Cable car has a fee.' }, averageRating: 4.8, totalReviews: 980, tags: ['island', 'romantic', 'views', 'sunset', 'greece'], isFeatured: true, bestTimeToVisit: 'May–June or September', visitDuration: 'Multiple days', coverImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600' },
    { name: 'Louvre Museum', country: 'France', city: 'Paris', category: 'museum', description: 'World\'s largest art museum and historic monument, home to the Mona Lisa and Venus de Milo.', entryFee: { adult: 17, child: 0, currency: 'EUR', isFree: false, notes: 'Free for under 18 and EU residents under 26' }, averageRating: 4.7, totalReviews: 1890, tags: ['art', 'museum', 'paris', 'culture', 'history'], isFeatured: true, bestTimeToVisit: 'Weekday mornings, avoid Tuesdays (closed)', visitDuration: '3–6 hours', coverImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600' },
    { name: 'Great Barrier Reef', country: 'Australia', city: 'Cairns', category: 'beach', description: 'World\'s largest coral reef system, a UNESCO World Heritage Site with extraordinary marine biodiversity.', entryFee: { adult: 6.50, child: 3.25, currency: 'AUD', isFree: false, notes: 'Environmental Management Charge per day' }, averageRating: 4.9, totalReviews: 740, tags: ['snorkeling', 'diving', 'nature', 'ocean', 'australia'], isFeatured: true, bestTimeToVisit: 'June–October (dry season)', visitDuration: 'Full day or multi-day', coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600' },
    { name: 'Petra', country: 'Jordan', city: 'Ma\'an Governorate', category: 'landmark', description: 'Famous archaeological city featuring rock-cut architecture and water conduit systems.', entryFee: { adult: 50, child: 0, currency: 'JOD', isFree: false, notes: 'Multi-day passes available' }, averageRating: 4.8, totalReviews: 1120, tags: ['ancient', 'desert', 'archaeology', 'jordan', 'wonder'], isFeatured: true, bestTimeToVisit: 'March–May or September–November', visitDuration: 'Full day', coverImage: 'https://images.unsplash.com/photo-1579606032821-4d81bf07de9a?w=600' },
    { name: 'Angkor Wat', country: 'Cambodia', city: 'Siem Reap', category: 'temple', description: 'Largest religious monument in the world, a stunning example of Khmer architecture.', entryFee: { adult: 37, child: 0, currency: 'USD', isFree: false, notes: '1-day pass. 3-day ($62) and 7-day ($72) passes available' }, averageRating: 4.9, totalReviews: 1340, tags: ['temple', 'history', 'architecture', 'cambodia', 'sunrise'], isFeatured: true, bestTimeToVisit: 'November–March (dry season)', visitDuration: '1–3 days', coverImage: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600' },
    { name: 'Banff National Park', country: 'Canada', city: 'Banff', category: 'park', description: 'Canada\'s oldest national park, featuring stunning mountain scenery, turquoise lakes and abundant wildlife.', entryFee: { adult: 10.50, child: 0, currency: 'CAD', isFree: false, notes: 'Per day fee. Discovery Pass for frequent visitors' }, averageRating: 4.8, totalReviews: 860, tags: ['nature', 'mountains', 'hiking', 'canada', 'lake', 'wildlife'], isFeatured: true, bestTimeToVisit: 'June–August (summer) or December–March (skiing)', visitDuration: 'Multiple days', coverImage: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=600' },
    { name: 'Amalfi Coast', country: 'Italy', city: 'Amalfi', category: 'landmark', description: 'Dramatic stretch of coastline along the southern edge of Italy\'s Sorrentine Peninsula.', entryFee: { adult: 0, child: 0, isFree: true, notes: 'Free to explore. Individual attractions have fees.' }, averageRating: 4.7, totalReviews: 1020, tags: ['coastal', 'italy', 'scenic', 'romantic', 'cliffs'], isFeatured: true, bestTimeToVisit: 'May–June or September', visitDuration: 'Multiple days', coverImage: 'https://images.unsplash.com/photo-1633321088355-d38690fe8006?w=600' },
    { name: 'Grand Canyon', country: 'United States', city: 'Arizona', category: 'park', description: 'A steep-sided canyon carved by the Colorado River, one of the Seven Natural Wonders of the World.', entryFee: { adult: 35, child: 0, currency: 'USD', isFree: false, notes: 'Per vehicle fee, valid 7 days' }, averageRating: 4.9, totalReviews: 2200, tags: ['canyon', 'nature', 'usa', 'hiking', 'views', 'wonder'], isFeatured: true, bestTimeToVisit: 'March–May or September–November', visitDuration: 'Full day to multiple days', coverImage: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600' },
    { name: 'Sagrada Família', country: 'Spain', city: 'Barcelona', category: 'landmark', description: 'Gaudi\'s unfinished masterpiece, a UNESCO-listed basilica that has been under construction since 1882.', entryFee: { adult: 26, child: 0, currency: 'EUR', isFree: false, notes: 'Tower access costs more. Book online in advance' }, averageRating: 4.8, totalReviews: 1650, tags: ['architecture', 'gaudi', 'barcelona', 'church', 'art'], isFeatured: true, bestTimeToVisit: 'Weekday mornings in spring or fall', visitDuration: '1–2 hours', coverImage: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600' },
  ];

  await Destination.insertMany(samples.map(d => ({ ...d, isVerified: true })));
  res.json({ success: true, message: `${samples.length} destinations seeded` });
});

module.exports = router;
