
//
//  timestamps.js
//
//  - Simulated class that generates timestamps on the left side of the CodeMirror editor
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

function Timestamps (data) {
  this.client     = data.client;
  this.container  = data.container;
  this.codemirror = data.codemirror;
  this.format     = typeof data.format !== 'undefined' ? data.format : 'YYYY-MM-DD';
  this.lines      = [];
  this.colors     = [];

  /*
   *  Draws the timestamps into the given container.
   */
  this.draw = function (lines) {
    this.generateTimestamps (lines);
  };

  /*
   *  Returns a timestamp string based on the format.
   */
  this.getMoment = function (timestamp) {
    return moment (timestamp).format (this.format);
  };

  /*
   *  Attaches color to specific user.
   */
  this.addAuthorColorCoding = function (author) {
    if (!(author.id in this.colors)) {
      this.colors[author.id] = author.color;
    }
  };

  /*
   *  Populates colors array with all users in room.
   */
  this.processAuthorColorCoding = function (authors) {
    for (var i = 0; i < authors.length; i++) {
      this.addAuthorColorCoding (authors[i]);
    }
  };

  /*
   *  Draws the timestamps into its given container.
   */
  this.generateTimestamps = function (lines) {
    var content = '';
    var timestamps = [];
    var compare_date  = '';

    for (var i = 0; i < lines.length; i++) {
      var timestamp = $('<div>');

      var line = this.codemirror.getLineHandle (i);
      var date = this.getMoment (lines[i].timestamp);

      if (line.text.replace(/\s+/g, '') !== '') {
        content += '<div class="timestamp" style="height: ' + line.height + 'px; border-right: 2.75px solid ' + this.colors[lines[i].client] + '" data-line="' + i + '" data-author="' + lines[i].client + '">';
        if (date !== compare_date) {
          content += '<p>' + date + '</p>';
          compare_date = date;
        }
        content += '</div>';
      } else {
        content += '<div class="blank-div" style="height: ' + line.height + 'px;"></div>';
        compare_date = '';
      }
    }

    $(this.container).html (content);
    this.activateTooltips ();
  };

  /*
   *  Draws the timestamps into its given container.
   */
  this.activateTooltips = function () {
    $('.timestamp')
      .mouseenter (function () {
        $(this).attr ('data-toggle', 'tooltip')
               .attr ('data-placement', 'top')
               .attr ('title', $(this).data ('author'));

       $('[data-toggle="tooltip"]').tooltip ({
         container: 'body'
       });
      })
      .mouseleave (function () {
        $(this).removeAttr ('data-toggle')
               .removeAttr ('data-placement')
               .removeAttr ('title');
      });
  };
}
