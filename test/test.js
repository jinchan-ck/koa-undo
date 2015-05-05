var koa = require('koa');
var path = require('path');
var assert = require('assert');
var route = require('koa-route');
var request = require('supertest');
var formidable = require('koa-formidable');

var undo = require('..');

var resource, resource01;

describe('Koa Undo', function(){

  var app = koa();
  app.use(formidable({
    uploadDir: path.join(__dirname, '/tmp/')
  }));

  app.use(undo({expired: 500, apis: ['/resource', '/resource01']}));
  app.use(route.post('/resource', function *(next){
    resource = this.request.body.resource;
    this.body = 'ok';
    yield next;
  }));
  app.use(route.get('/resource', function *(next) {
    this.body = resource;
    yield next;
  }));

  app.use(route.post('/resource01', function *(next){
    console.log('Logic api');
    resource01 = this.request.body.resource01;
    this.body = 'ok';
    yield next;
  }));
  app.use(route.get('/resource01', function *(next) {
    this.body = resource01;
    yield next;
  }));

  var server = app.listen();

  describe('when request logic api (do not call undo api)', function(){
    resource = false;
    it('should get ok', function(done){
      request(server)
      .post('/resource')
      .set('X-IDENTIFY-KEY', '123')
      .send({resource: true})
      .expect(200)
      .expect('ok')
      .end(done);
    });

    it('should get modified resource when calling non-undo api', function (done) {
      request(server)
      .get('/resource')
      .expect(200)
      .expect('true')
      .end(done);
    });
  });

  describe('when call the logic api following undo api ', function () {
    resource01 = false;
    it('should get undo when the api was undo', function(done){
      request(server)
      .post('/resource01')
      .set('X-IDENTIFY-KEY', '123')
      .send({resource01: true})
      .expect(200)
      .end(function (err, res){
        if (err) { console.error(err); }
        assert.equal('undo', res.text);
      });

      request(server)
      .post('/undo')
      .set('X-IDENTIFY-KEY', '123')
      .send({})
      .expect(200)
      .expect('done')
      .end(done);
    });

    it('should get original resource01', function (done) {
      request(server)
      .get('/resource01')
      .set('X-IDENTIFY-KEY', '123')
      .expect(200)
      .expect('false')
      .end(done);
    });
  });

});