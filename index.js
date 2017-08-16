var appConfig = require(__dirname + '/config.json');
var validator = require('node-validator');
var winston = require('winston');
var watch = require('node-watch');
var cf = require('cloudflare')({
  email: appConfig.cloudflareEmail,
  key: appConfig.cloudflareKey
});

var logger = new(winston.Logger)({
  transports: [
    new(winston.transports.Console)({
      level: 'info',
      colorize: true,
    }),
    new(winston.transports.File)({
      filename: 'applog.log',
      maxsize: 5242880,
      level: 'debug'
    })
  ]
});

//Validate the confifg file
validateConfig(appConfig);

for (var currentSite in appConfig.sites) {
  site = appConfig.sites[currentSite];
  logger.log('info', 'Watching for changes in: ' + site.dir);
  watch(site.dir, {
    recursive: true
  }, function(evt, name) {
    if (evt === 'update') {
      logger.log('debug','File updated: '+name);
      
      fileDetail = getFileDetail(name);
      
      var cloudflareOpts = {files:[fileDetail.webFileName]};
      
      cf.zones.purgeCache(fileDetail.site.cloudflareZone, cloudflareOpts).then(function (resp) {
        console.log(resp);
      });
    }
  });
}

function getFileDetail(watchFile) {
  for (var currentSite in appConfig.sites) {
    site = appConfig.sites[currentSite];

    var re = new RegExp('(' + site.dir + ')([a-zA-Z_.\/]+)',"gi");
    var matches = re.exec(watchFile);
    
    if (matches != null){
      baseFileName = matches[2];
      webFileName = site.url + baseFileName;
      fileDetail = {'site':site, 'baseFileName':baseFileName, 'webFileName':webFileName};
      return fileDetail;
    } else {
      logger.log('warn', 'Unable to detect base file name of changed file: '+ watchFile);
    }
  }
}

function regexEscape(str) {
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
}

function validateConfig(appConfig) {
  var checkChild = validator.isObject()
    .withRequired('url', validator.isString())
    .withRequired('dir', validator.isString())
    .withRequired('cloudflareZone', validator.isString())
    .withOptional('ignored', validator.isArray({
      min: 1
    }));

  var check = validator.isObject()
    .withRequired('cloudflareEmail', validator.isString({
      regex: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/
    }))
    .withRequired('cloudflareKey', validator.isString())
    .withRequired('sites', validator.isArray(checkChild, {
      min: 1
    }));

  validator.run(check, appConfig, function(errorCount, errors) {
    if (errorCount > 0) {
      logger.log('error', 'Error in config.json, please see config.json.sample');
      logger.log('error', errors);
      die();
    }
  });
}