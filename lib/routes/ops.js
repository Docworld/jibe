//
//  ops.js
//
//  - sets up routes for fetching document operations from the db.
//
//  Copyright (c) 2015 Visionist, Inc.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//
var router = require('express').Router(),
    config = require('../config'),
    thinky = require('../helpers/thinky'),
    r      = thinky.r;

// load all document operations for the given room
router.get('/:roomId', function(req, res) {
  r.table('jibe_ops')
    .filter({ name: req.params.roomId })
    .orderBy('v') // order by version
    .run()
  .then(function(result) {
    res.json(result);
  })
  .error(function(error) {
    console.error('Error retrieving operations', error);
    res.send('error');
  });
});

module.exports = router;