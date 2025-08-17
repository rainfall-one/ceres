const apostrophe = require('apostrophe');

(async () => {
  const apos = await apostrophe({
    shortName: 'jetstream-cms',
    baseUrl: process.env.BASE_URL || 'http://localhost:4001',
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://mongo:27017/apostrophe-cms'
    },
    // You may need to dynamically require modules or load from config
    // For now, this expects modules/index.js or adapt as needed
    modules: require('./modules')
  });
})();
