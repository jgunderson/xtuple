// ==========================================================================
// Project:   XT` Strings
// Copyright: ©2011 OpenMFG LLC, d/b/a xTuple
// ==========================================================================
/*globals XT */

// Place strings you want to localize here.  In your app, use the key and
// localize it using "key string".loc().  HINT: For your key names, use the
// english string with an underscore in front.  This way you can still see
// how your UI will look and you'll notice right away when something needs a
// localized string added to this file!
//

(function () {
  "use strict";

  var lang = XT.stringsFor("en_US", {
    "_backflushMaterials": "Backflush Materials",
    "_closeWorkOrderAfterPosting": "Close Work Order After Posting",
    "_postProduction": "Post Production",
    "_qtyIssued": "Qty Issued",
    "_quantityReceived": "Qty Received",
    "_qtyRequired": "Qty Required",
    "_qtyToPost": "Qty to Post",
    "_scrapOnPost": "Scrap on Post"
  });

  if (typeof exports !== 'undefined') {
    exports.language = lang;
  }
}());