
/**
 * Store users' undo context
 * 
 * @type {Object}
 */
var undos = {};

/**
 * Expose `undo`
 *
 * @param {Object} options Config object for undo
 * @example
 * {
 *   expired: 3000
 * }
 */
module.exports = function (options) {
  var apis = (options || {}).apis;
  var expired = (options || {}).expired || 3000;

  return function* (next) {
    var context = this;
    var path = context.path;
    var needUndo = false;
    
    if (apis && Array.isArray(apis) && apis.length) {
      needUndo = apis.filter(function (api) {
        return path === api;
      }).length;
    }

    if (!needUndo && path !== '/undo') { return yield next; }

    var method = context.method;
    /**
     * Can not undo get request.
     */
    if (method === 'GET') { return yield next; }
    /**
     * 'x-identify-key' is used to identify the user of this request,
     * one user can not undo another's request.
     */
    var user = context.header['x-identify-key'];
    if (!user) { return yield next; }

    var undoObj = undos[user];
    if (undoObj) {
      clearTimeout(undoObj.timeoutId);
      if (path === '/undo' && method === 'POST') {
        undoObj.delayFn.call(undoObj.context, true);
        context.body = 'done';
        return;
      } else if (undoObj.delayFn) {
        undoObj.delayFn.call(undoObj.context, false);
      }
    }
    var undo = yield delayNext(user, expired, context);
    if (!undo) { return yield next; }
    this.body = 'undo';
  };
};

/**
 * Block the logic for specified ms.
 *
 * @param {String} user The user's identity
 * @param {String} expired The expired ms
 * @param {Object} context The koa context object
 * @api private
 */
function delayNext(user, expired, context) {
  return function (callback) {
    var delayFn = function (undo) {
      delete undos[user];
      callback(null, undo);
    };
    var timeoutId = setTimeout(delayFn, expired);
    undos[user] = {
      timeoutId: timeoutId,
      delayFn: delayFn,
      context: context
    };
  };
}