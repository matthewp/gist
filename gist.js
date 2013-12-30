var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var request = require('superagent');
var rimraf = require('rimraf');

var fetch = function(builder){  
  return function(id, rev, callback){
    if(typeof rev === 'function') {
      callback = rev;
      rev = null;
    }

    var url = builder(id, rev);
    request.get(url)
      .set('User-Agent', 'matthewp')
      .end(function(res){
        if(!res.ok) {
          return callback(new Error(res.text));
        }

        callback(null, res.body);
      });
  };
};

var user = fetch(function(id, rev){
  return 'https://api.github.com/users/' + id + '/gists';
});

var gist = fetch(function(id, rev){
  var base = 'https://api.github.com/gists/';
  return rev ? base + id + '/' + rev : base + id;
});

/*
 * Determine whether the repo string is an id or
 * a user / filename combination.
 */
var parts = function(str){
  var idx = str.indexOf('/');
  if(idx === -1) {
    return {
      type: 'id',
      id: str
    };
  }

  return {
    type: 'repo',
    user: str.substr(0, idx),
    file: str.substr(idx + 1)
  };
};

/*
 * Clear out and prepare a directory for files to be copied in.
 */
var prepareDir = function(dir, callback, errback) {
  if (!fs.existsSync(dir)) {
    return mkdirp(dir, callback);
  }

  rimraf(dir, function(err) {
    if (err)
      return errback(err);
    mkdirp(dir, callback);
  });
};

module.exports = GistLocation;

function GistLocation(options) {
  options = options || {};
  this.log = options.log !== false;
}

GistLocation.prototype = {
  constructor: GistLocation,

  degree: 1,

  /*
   *  Given a gist id and (optionally) file name, get the file
   *  contents and save out to `index.js` in the `outDir`.
   */
  save: function(id, url, file, outDir, callback, errback){
    var save = function(res){
      file = file ? file : Object.keys(res.files)[0];
      var data = res.files[file].content;

      prepareDir(outDir, function(){
        var filename = outDir + path.sep + 'index.js';
        fs.writeFile(filename, data, 'utf8', function(err){
          if(err) return errback(err);

          callback({
            'main': 'index'
          });
        });
      });
    };

    if(id) {
      gist(id, function(err, res){
        if(err) return errback(err);
        save(res);
      });
    } else {
      request.get(url)
        .set('User-Agent', 'matthewp')
        .end(function(err, res){
          if(err) return errback(err);
          save(res.body);
        });
    }
  },

  download: function(repo, version, hash, outDir, callback, errback){
    var info = parts(repo);

    var byId = function(id, file){
      gist(id, function(err, res){
        if(err) return errback(err);

        var version = res.history.filter(function(item){
          return item.version === hash;
        }).map(function(item) { return item.url; })[0];

        if(!version) {
          var err = new Error('Unable to location hash: ' + hash);
          return errback(err);
        }
        return this.save(null, version, file, outDir, callback, errback);
      }.bind(this));
    };


    if(info.type === 'id') {
      // Just save this id.
      if(version === 'master') {
        return this.save(info.id, null, null, outDir, callback, errback);
      }

      return byId.call(this, info.id);
    }

    user(info.user, function(err, res){
      if(err) {
        if(err.message.indexOf('Not Found') !== -1) {
          return callback();
        }

        return errback(err);
      }

      var files = res.filter(function(item){
        var names = Object.keys(item.files);
        return names.indexOf(info.file) !== -1;
      });

      // Not found
      if(!files.length) {
        return callback();
      }

      var id = files[0].id;
      return byId.call(this, id, info.file);
    }.bind(this));
  },

  versions: function(id, callback, errback){
    gist(id, function(err, res){
      if(err) return errback(err);

      var history = res.history;
      history.sort(function(a, b){
        a = new Date(a.committed_at);
        b = new Date(b.committed_at);
        return a < b ? 1 : -1;
      });

      var versions = {};
      history.forEach(function(item){
        versions[item.version.substr(0, 6)] = item.version;
      });
      versions['master'] = history[0].version;

      callback(versions);
    });
  },

  getVersions: function(repo, callback, errback){
    var info = parts(repo);

    if(info.type === 'id') {
      return this.versions(info.id, callback, errback);
    }

    user(info.user, function(err, res){
      if(err) {
        if(err.message.indexOf('Not Found') !== -1) {
          return callback();
        }

        return errback(err);
      }
      
      var files = res.filter(function(item){
        var names = Object.keys(item.files);
        return names.indexOf(info.file) !== -1;
      });

      // Not found
      if(!files.length) {
        return callback();
      }

      var id = files[0].id;
      this.versions(id, callback, errback);
    }.bind(this));
  }
};
