// dns-test.js
const dns = require('dns');

dns.setServers(['8.8.8.8']);

dns.promises.resolveSrv('_mongodb._tcp.maindb.1uicrln.mongodb.net')
  .then(console.log)
  .catch(console.error);