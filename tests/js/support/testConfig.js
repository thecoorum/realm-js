////////////////////////////////////////////////////////////////////////////
//
// Copyright 2020 Realm Inc.
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

'use strict';

// If the docker instance has imported this stitch config, it will have written the app id
// back into the config file, so we can read it out again here.
const integrationTestsAppId = `${require("../../../src/object-store/tests/mongodb/stitch.json").app_id}`;
console.log(`tests are using integration tests app id: ${integrationTestsAppId}`);

const integrationAppConfig = {
    id: integrationTestsAppId,
    url: 'http://localhost:9090',
    timeout: 1000,
    app: {
        name: "default",
        version: '0'
    },
};

module.exports = {
    integrationAppConfig
}
