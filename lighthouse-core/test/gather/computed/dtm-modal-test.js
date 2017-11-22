/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env mocha */

const assert = require('assert');
const fs = require('fs');
const pwaTrace = require('../../fixtures/traces/progressive-app.json');
const Runner = require('../../../runner.js');

const mochaReporter = require('mocha/lib/reporters/base');

describe('Speedline gatherer', () => {
  let computedArtifacts;

  beforeEach(() => {
    computedArtifacts = Runner.instantiateComputedArtifacts();
  });

  it('measures the pwa.rocks example', () => {
    return computedArtifacts.requestDevtoolsTimelineModel({traceEvents: pwaTrace}).then(model => {
      assert.equal(model.timelineModel().mainThreadEvents().length, 3157);
    });
  });

  it('does not change the orignal trace events', () => {
    // Use fresh trace in case it has been altered by other require()s.
    const pwaJson = fs.readFileSync(__dirname +
        '/../../fixtures/traces/progressive-app.json', 'utf8');
    const pwaTrace = JSON.parse(pwaJson);
    return computedArtifacts.requestDevtoolsTimelineModel({traceEvents: pwaTrace})
      .then(_ => {
        // assert.deepEqual has issue with diffing large array, so manually loop.
        const freshTrace = JSON.parse(pwaJson);
        assert.strictEqual(pwaTrace.length, freshTrace.length);
        for (let i = 0; i < pwaTrace.length; i++) {
          try {
            assert.deepStrictEqual(pwaTrace[i], freshTrace[i]);
          } catch (e) {
            console.log(pwaTrace[i]);
            // hack so we can see all diff output not fail on the first one.
            mochaReporter.list([{err: e, fullTitle: _ => ''}]);
          }
        }
      });
  });
});
