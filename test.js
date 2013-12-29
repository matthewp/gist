/*var GistLocation = require('./gist');
var gist = new GistLocation();

gist.getVersions('matthewp/framework.js', function(res){
  console.log(JSON.stringify(res));
});

return;*/
var github = require('./github');

github = new github({
  baseDir: '.',
  log: true,
  tmpDir: '.',
  username: '',
  password: ''
});

github.getVersions('twbs/bootstrap', function(versions) {
  console.log(versions);
  github.download('twbs/bootstrap', 'v3.0.0', 'e8a1df5f060bf7e6631554648e0abde150aedbe4', 'test-repo', function() {
    console.log('done');
  }, function(err) {
    console.log(err);
  });
});
