// ============================================
// Analytics Controller
// ============================================

const Log = require('../models/Log');
const Document = require('../models/Document');

const getAnalytics = async (req, res, next) => {
  try {
    // Query volume over last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const queryVolume = await Log.aggregate([
      { $match: { action: 'query', timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Department usage
    const deptUsage = await Log.aggregate([
      { $match: { action: 'query' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Access denied count
    const deniedCount = await Log.countDocuments({ status: 'denied' });

    // Total queries
    const totalQueries = await Log.countDocuments({ action: 'query' });

    // Document counts by department
    const docsByDept = await Document.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]);

    // Recent activity
    const recentActivity = await Log.find()
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('userId', 'name role');

    res.json({
      queryVolume,
      departmentUsage: deptUsage,
      deniedCount,
      totalQueries,
      documentsByDepartment: docsByDept,
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAnalytics };
