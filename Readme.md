[![NPM](https://nodei.co/npm/koa-undo.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/koa-undo/)

# koa-undo

  Add undo capability for api.

## Installation

```js
$ npm install koa-undo
```

## Example

  Use koa-undo:

```js
var koa = require('koa');
var undo = require('koa-undo');
var route = require('koa-route');
var formidable = require('koa-formidable');

var app = koa();
// use koa-undo
app.use(formidable({
  uploadDir: path.join(__dirname, '/tmp/')
}));
app.use(undo({expired: 500, apis: ['/resource']}));

// require auth

app.use(route.post('/resource', function *(next){
  resource = this.request.body.resource;
  this.body = 'ok';
  yield next;
}));

app.listen(3000);
console.log('listening on port 3000');
```

  Example request:

```
var request = require('superagent');

request
.post('http://localhost:3000/resource')
.set('X-IDENTIFY-KEY', '123')
.send({resource: true})
.end(function (err, res){
  if (err) { console.error(err); }
});

request
.post('http://localhost:3000/undo')
.set('X-IDENTIFY-KEY', '123')
.send({})
.end(function (err, res) {
  if (err) { console.error(err); }
});

```

## Running test

Install dependencies:

```js
$ npm install
```

Start test:

```js
$ npm test
```

## License

  MIT
