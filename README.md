# Gist endpoint

This is a gist endpoint for [jspm](http://jspm.io).

You may identify a gist either by `user` and `filename` or just by `gist id`. For example [this gist](https://gist.github.com/matthewp/7795772):

```javascript
// By user and filename
require('gist:matthewp/objectis.js');
// Including the version hash
require('gist:matthewp/objectis.js@a9053ea');

// By id
require('gist:8175510');
// Including the version hash
require('gist:8175510@a9053ea');
```
