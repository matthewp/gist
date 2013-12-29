var GistLocation = require('./gist');
var gist = new GistLocation();

function test(a1, a2) {
 var args = 
 gist.getVersions.apply(gist, a1.concat([function(versions){
  console.log(versions);

  gist.download.apply(gist, a2.concat([function(res){
    console.log(res);
  }, function(err){
    console.error(err);            
  }]));
}, function(err){
  console.error('Get versions', err);               
}]));
 
}

test(['matthewp/framework.js'], ['matthewp/framework.js', 'master', 'adca60ebab5e16aa556da1855fc9debd0df5e514', 'test-repo']);

test(['8175510'], ['8175510', 'master', null, 'test-repo2']);
