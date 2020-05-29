////////////////////////////////////////////////////////////////////////////
//
// Copyright 2016 Realm Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
////////////////////////////////////////////////////////////////////////////

/* eslint-env es6, node */

'use strict';

const Realm = require('realm');
const TestCase = require('./asserts');
const Utils = require('./test-utils');
const isNodeProcess = typeof process === 'object' && process + '' === '[object process]';
const AppConfig = require('./support/testConfig');

const require_method = require;
function node_require(module) {
    return require_method(module);
}
let appConfig = AppConfig.integrationAppConfig;

let fs, jwt, rosDataDir;
if (isNodeProcess) {
  fs = node_require('fs');
  jwt = node_require('jsonwebtoken');
  rosDataDir = process.env.ROS_DATA_DIR || '../realm-object-server-data';
}

function assertIsUser(user) {
  TestCase.assertType(user, 'object');
  TestCase.assertType(user.token, 'string');
  TestCase.assertType(user.identity, 'string');
  TestCase.assertInstanceOf(user, Realm.User);
}

function assertIsSameUser(value, user) {
  assertIsUser(value);
  TestCase.assertEqual(value.token, user.token);
  TestCase.assertEqual(value.identity, user.identity);
}

function assertIsError(error, message) {
  TestCase.assertInstanceOf(error, Error, 'The API should return an Error');
  if (message) {
    TestCase.assertEqual(error.message, message);
  }
}

function assertIsAuthError(error, code, title) {
  TestCase.assertInstanceOf(error, Realm.Sync.AuthError, 'The API should return an AuthError');
  if (code) {
    TestCase.assertEqual(error.code, code);
  }
  if (title) {
    TestCase.assertEqual(error.title, title);
  }
}

function signToken(userId) {
  return jwt.sign({userId}, fs.readFileSync(`${rosDataDir}/keys/jwt.pem`), {
    expiresIn: "1d",
    algorithm: "RS256",
  });
}

module.exports = {

  // tests also logIn() and currentUser()
  testLogout() {
    let app = new Realm.App(appConfig);
    let credentials = Realm.Credentials.anonymous();

    return app.logIn(credentials).then(user => {
      assertIsUser(user);

      assertIsSameUser(user, app.currentUser());
      user.logOut();

      // Is now logged out.
      TestCase.assertNull(app.currentUser());
    });
  },

  testEmailPasswordMissingUsername() {
    TestCase.assertThrows(() => Realm.Credentials.emailPassword(undefined, 'password'));
  },

  testEmailPasswordMissingPassword() {
    const username = Utils.uuid();
    TestCase.assertThrows(() => Realm.Credentials.emailPassword(username, undefined));
  },

  testLoginNonExistingUser() {
    let app = new Realm.App(appConfig);
    let credentials = Realm.Credentials.emailPassword('foo', 'pass');
    return app.logIn(credentials).then((user) => {
      throw new Error("Login should have failed");
    }).catch(err => {
      TestCase.assertEqual(err.message, "invalid username/password");
    });
  },

  testAll() {
    let app = new Realm.App(appConfig);
    const all = app.allUsers();
    TestCase.assertArrayLength(Object.keys(all), 0);

    let credentials = Realm.Credentials.anonymous();
    return app.logIn(credentials).then(user1 => {
      const all = app.allUsers();
      TestCase.assertArrayLength(Object.keys(all), 1);
      assertIsSameUser(all[user1.identity], user1);

      return app.logIn(Realm.Credentials.anonymous()).then(user2 => {
        let all = app.allUsers();
        TestCase.assertArrayLength(Object.keys(all), 2);
        // NOTE: the list of users is in latest-first order.
        assertIsSameUser(all[user2.identity], user2);
        assertIsSameUser(all[user1.identity], user1);

        user2.logOut();
        all = app.allUsers();
        TestCase.assertArrayLength(Object.keys(all), 1);
        assertIsSameUser(all[user1.identity], user1);

        user1.logOut();
        all = app.allUsers();
        TestCase.assertArrayLength(Object.keys(all), 0);
      });
    });
  },

  testCurrent() {
    let app = new Realm.App(appConfig);
    TestCase.assertNull(app.currentUser());

    let firstUser;
    return app.logIn(Realm.Credentials.anonymous()).then(user1 => {
      assertIsSameUser(app.currentUser(), user1);
      firstUser = user1;
      return app.logIn(Realm.Credentials.anonymous());
    }).then(user2 => {
      // the most recently logged in user is considered current
      assertIsSameUser(app.currentUser(), user2);
      user2.logOut();
      // auto change back to another logged in user
      assertIsSameUser(app.currentUser(), firstUser);

      firstUser.logOut();
      TestCase.assertNull(app.currentUser());
    });
  },
};
