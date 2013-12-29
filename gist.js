var path = require('path');
var request = require('superagent');

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

module.exports = GistLocation;

function GistLocation(options) {
  options = options || {};
  this.log = options.log !== false;
}

GistLocation.prototype = {
  construct: GistLocation,

  download: function(repo, version, hash, outDir, callback, errback){

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
      return this.versions(id, callback, errback);
    }

    user(info.user, function(err, res){
      if(err) {
        return errback(err);
      }
      
      var files = res.filter(function(item){
        var names = Object.keys(item.files);
        return names.indexOf(info.file) !== -1;
      });

      if(!files.length) {
        var err = new Error('Unable to file the file ' + info.file);
        return errback(err);
      }

      var id = files[0].id;
      this.versions(id, callback, errback);
    }.bind(this));
  }
}
