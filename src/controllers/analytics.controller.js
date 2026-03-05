const { analyticsService } = require('../services');

const getAnalytics = async (req, res) => {
  const analytics = await analyticsService.getAnalytics(req.query);
  res.send(analytics);
};

module.exports = {
  getAnalytics,
};
