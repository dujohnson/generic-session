/**!
 * koa-generic-session - lib/store.js
 * Copyright(c) 2014
 * MIT Licensed
 *
 * Authors:
 *   dead_horse <dead_horse@qq.com> (http://deadhorse.me)
 */

'use strict';

/**
 * Module dependencies.
 */

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const EventEmitter = require('events').EventEmitter;
const debug = require('debug')('koa-generic-session:store');
const copy = require('copy-to');

const defaultOptions = {
  prefix: 'koa:sess:'
};

class Store extends EventEmitter {
  constructor(client, options) {
    super();
    this.client = client;
    this.options = options;
    copy(options).and(defaultOptions).to(this.options);

    // delegate client connect / disconnect event
    if (typeof client.on === 'function') {
      client.on('disconnect', this.emit.bind(this, 'disconnect'));
      client.on('connect', this.emit.bind(this, 'connect'));
    }
  }

  get(sid) {
    var _this = this;

    return _asyncToGenerator(function* () {
      sid = _this.options.prefix + sid;
      debug('GET %s', sid);
      const data = yield _this.client.get(sid);
      if (!data) {
        debug('GET empty');
        return null;
      }
      if (data && data.cookie && typeof data.cookie.expires === 'string') {
        // make sure data.cookie.expires is a Date
        data.cookie.expires = new Date(data.cookie.expires);
      }
      debug('GOT %j', data);
      return data;
    })();
  }

  set(sid, sess) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      let ttl = typeof _this2.options.ttl === 'function' ? _this2.options.ttl(sess) : _this2.options.ttl;
      if (!ttl) {
        const maxAge = sess.cookie && sess.cookie.maxAge;
        if (typeof maxAge === 'number') {
          ttl = maxAge;
        }
        // if has cookie.expires, ignore cookie.maxAge
        if (sess.cookie && sess.cookie.expires) {
          ttl = Math.ceil(sess.cookie.expires.getTime() - Date.now());
        }
      }

      sid = _this2.options.prefix + sid;
      debug('SET key: %s, value: %s, ttl: %d', sid, sess, ttl);
      yield _this2.client.set(sid, sess, ttl);
      debug('SET complete');
    })();
  }

  destroy(sid) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      sid = _this3.options.prefix + sid;
      debug('DEL %s', sid);
      yield _this3.client.destroy(sid);
      debug('DEL %s complete', sid);
    })();
  }
}

module.exports = Store;