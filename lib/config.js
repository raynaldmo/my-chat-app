module.exports = {
  development : {
    mode : "development",
    mongoDbUri : "mongodb://192.168.0.252:27017/mdh-chat"
  },
  production : {
    mode : "production",
    mongoDbUri : process.env.MONGOLAB_URI
  }
};