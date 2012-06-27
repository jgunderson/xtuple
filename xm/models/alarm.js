/*jshint trailing:true, white:true, indent:2, strict:true, curly:true, plusplus:true
  immed:true, eqeqeq:true, forin:true, latedef:true, newcap:true, noarg:true, undef:true */
/*jslint bitwise: true, nomen: true, indent:2 */
/*global XT:true, XM:true, Backbone:true, _:true, console:true */

(function () {
  "use strict";

  /**
    @class
  
    @extends XM.Document
  */
  XM.Alarm = XM.Document.extend(
  /** @scope XM.Alarm.prototype */ {

    numberPolicy: XM.Document.AUTO_NUMBER,

    initialize: function () {
      XM.Document.prototype.initialize.apply(this, arguments);
      this.on('change:offset change:qualifier change:time', this.alarmDidChange);
    },

    alarmDidChange: function (model, value, options) {
      var status = this.getStatus(),
        K = XT.Model,
        offset, qualifier, time, trigger;
      if (options && options.force || !(status & K.READY)) { return; }
  
      // Recalculate trigger time based on alarm settings
      offset = this.get('offset');
      qualifier = this.get('qualifier');
      time = this.get('time');
      trigger = this.get('trigger');
      if (offset) {
        switch (qualifier) {
        case 'MB':
        case 'MA':
          if (qualifier.indexOf('B') !== -1) {
            trigger.setMinutes(time.getMinutes() - offset);
          } else {
            trigger.setMinutes(time.getMinutes() + offset);
          }
          break;
        case 'HB':
        case 'HA':
          if (qualifier.indexOf('B') !== -1) {
            trigger.setHours(time.getHours() - offset);
          } else {
            trigger.setHours(time.getHours() + offset);
          }
          break;
        default:
          if (qualifier.indexOf('B') !== -1) {
            trigger.setDate(time.getDate() - offset);
          } else {
            trigger.setDate(time.getDate() + offset);
          }
          break;
        }
      } else {
        trigger.setMinutes(time.getMinutes());
      }
    }

  });

}());