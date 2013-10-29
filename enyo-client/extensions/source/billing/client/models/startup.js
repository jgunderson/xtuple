/*jshint indent:2, curly:true, eqeqeq:true, immed:true, latedef:true,
newcap:true, noarg:true, regexp:true, undef:true, strict:true, trailing:true,
white:true*/
/*global XT:true, XM:true, Backbone:true, _:true, console:true */

(function () {
  "use strict";

  XT.extensions.billing.initStartup = function () {
    XT.cacheCollection("XM.bankAccountRelations", "XM.BankAccountRelationCollection");
    XT.cacheCollection("XM.incidentCategories", "XM.IncidentCategoryCollection");
  };

}());
