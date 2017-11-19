/**
 * @license Copyright 2017 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/* eslint-env mocha */
const BootupTime = require('../../audits/bootup-time.js');
const DevtoolsTimelineGather = require('../../gather/computed/devtools-timeline-model');
const assert = require('assert');
const {groups} = require('../../lib/task-groups');

const devtoolsTimelineGather = new DevtoolsTimelineGather({});

// sadly require(file) is not working correctly.
// traceParser parser returns preact trace data the same as JSON.parse
// fails when require is used
const acceptableTrace = require('../fixtures/traces/progressive-app-m60.json');
const errorTrace = require('../fixtures/traces/airhorner_no_fcp.json');

describe('Performance: bootup-time audit', () => {
  it('should compute the correct BootupTime values', () => {
    const artifacts = {
      requestDevtoolsTimelineModel: trace => devtoolsTimelineGather.compute_(trace),
      traces: {
        [BootupTime.DEFAULT_PASS]: acceptableTrace,
      },
    };

    return BootupTime.audit(artifacts).then(output => {
      assert.equal(output.details.items.length, 8);
      assert.equal(output.score, true);
      assert.equal(Math.round(output.rawValue), 176);

      const roundedValueOf = name => {
        const value = output.extendedInfo.value[name];
        const roundedValue = {};
        Object.keys(value).forEach(key => roundedValue[key] = Math.round(value[key] * 10) / 10);
        return roundedValue;
      };

      assert.deepEqual(roundedValueOf('https://www.google-analytics.com/analytics.js'), {[groups.scripting]: 40.1, [groups.scriptParseCompile]: 9.6, [groups.styleLayout]: 0.2});
      assert.deepEqual(roundedValueOf('https://pwa.rocks/script.js'), {[groups.scripting]: 31.8, [groups.styleLayout]: 5.5, [groups.scriptParseCompile]: 1.3});
      assert.deepEqual(roundedValueOf('https://www.googletagmanager.com/gtm.js?id=GTM-Q5SW'), {[groups.scripting]: 25, [groups.scriptParseCompile]: 5.5, [groups.styleLayout]: 1.2});
      assert.deepEqual(roundedValueOf('https://www.google-analytics.com/plugins/ua/linkid.js'), {[groups.scripting]: 25.2, [groups.scriptParseCompile]: 1.2});
      assert.deepEqual(roundedValueOf('https://www.google-analytics.com/cx/api.js?experiment=jdCfRmudTmy-0USnJ8xPbw'), {[groups.scriptParseCompile]: 3, [groups.scripting]: 1.2});
      assert.deepEqual(roundedValueOf('https://www.google-analytics.com/cx/api.js?experiment=qvpc5qIfRC2EMnbn6bbN5A'), {[groups.scriptParseCompile]: 2.5, [groups.scripting]: 1});
      assert.deepEqual(roundedValueOf('https://pwa.rocks/'), {[groups.parseHTML]: 14.2, [groups.scripting]: 6.1, [groups.scriptParseCompile]: 1.2});
      assert.deepEqual(roundedValueOf('https://pwa.rocks/0ff789bf.js'), {[groups.parseHTML]: 0});
    });
  });

  it('should get no data when no events are present', () => {
    const artifacts = {
      requestDevtoolsTimelineModel: trace => devtoolsTimelineGather.compute_(trace),
      traces: {
        [BootupTime.DEFAULT_PASS]: errorTrace,
      },
    };

    return BootupTime.audit(artifacts)
      .then(output => {
        assert.equal(output.details.items.length, 0);
        assert.equal(output.score, true);
        assert.equal(Math.round(output.rawValue), 0);
      });
  });
});
