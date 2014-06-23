/*jshint trailing:true, white:true, indent:2, strict:true, curly:true,
  immed:true, eqeqeq:true, forin:true, latedef:true,
  newcap:true, noarg:true, undef:true */
/*global XT:true, XM:true, XV:true, describe:true, it:true, setTimeout:true,
  console:true, before:true, after:true, module:true, require:true */

(function () {
  "use strict";

  var zombieAuth = require("../../lib/zombie_auth"),
    _ = require("underscore"),
    async = require("async"),
    submodels,
    smoke = require("../../lib/smoke"),
    assert = require("chai").assert,
    gridRow,
    gridBox,
    workspace,
    skipIfSiteCal,
    primeSubmodels = function (done) {
      var submodels = {};
      async.series([
        function (callback) {
          submodels.customerModel = new XM.SalesCustomer();
          submodels.customerModel.fetch({number: "TTOYS", success: function () {
            assert.equal(submodels.customerModel.get("shiptos").length, 3);
            callback();
          }});
        },
        function (callback) {
          submodels.itemModel = new XM.ItemRelation();
          submodels.itemModel.fetch({number: "BTRUCK1", success: function () {
            callback();
          }});
        },
        function (callback) {
          submodels.siteModel = new XM.SiteRelation();
          submodels.siteModel.fetch({code: "WH1", success: function () {
            callback();
          }});
        }
      ], function (err) {
        done(err, submodels);
      });
    };

  describe('Sales Order Workspace', function () {
    this.timeout(20 * 1000);

    //
    // We'll want to have TTOYS, BTRUCK1, and WH1 onhand and ready for the test to work.
    //
    before(function (done) {
      zombieAuth.loadApp(function () {
        primeSubmodels(function (err, submods) {
          submodels = submods;
          done();
        });
        if (XT.extensions.manufacturing && XT.session.settings.get("UseSiteCalendar")) {skipIfSiteCal = true; }
      });
    });

    describe('User selects to create a sales order', function () {
      it('User navigates to Sales Order-New and selects to create a new Sales order', function (done) {
        smoke.navigateToNewWorkspace(XT.app, "XV.SalesOrderList", function (workspaceContainer) {
          workspace = workspaceContainer.$.workspace;

          assert.equal(workspace.value.recordType, "XM.SalesOrder");
          //
          // Set the customer from the appropriate workspace quantityWidget
          //
          var createHash = {
            customer: submodels.customerModel
          };
          // TODO: why is the first shipto getting stripped out of TTOYS by now?
          //assert.equal(submodels.customerModel.get("shiptos").length, 3);
          //assert.equal(submodels.customerModel.getDefaultShipto().getValue("address.city"), "Alexandoria");
          smoke.setWorkspaceAttributes(workspace, createHash);
          //assert.equal(workspace.value.getValue("shipto.address.city"), "Alexandria");
          // In sales order, setting the line item fields will set off a series
          // of asynchronous calls. Once the "total" field is computed, we
          // know that the workspace is ready to save.
          // It's good practice to set this trigger *before* we change the line
          // item fields, so that we're 100% sure we're ready for the responses.
          workspace.value.once("change:total", function () {
            done();
            /* The following save was moved to the second test
            smoke.saveWorkspace(workspace, function (err, model) {
              assert.isNull(err);
              // TODO: sloppy
              setTimeout(function () {
                smoke.deleteFromList(XT.app, model, done);
              }, 2000);
            });*/
          });

          //
          // Set the line item fields
          //
          // Be sure that there are no rows
          gridBox = workspace.$.salesOrderLineItemBox;
          assert.equal(gridBox.liveModels().length, 0);

          gridBox.newItem();
          gridRow = gridBox.$.editableGridRow;

          gridRow.$.itemSiteWidget.doValueChange({value: {item: submodels.itemModel, site: submodels.siteModel}});
          gridRow.$.quantityWidget.doValueChange({value: 5});

          // Verify that there is currently one row
          assert.equal(gridBox.liveModels().length, 1);
        });
      });
      it('Supply list should have action to open Item Workbench', function (done) {
        if (!XT.extensions.inventory) {
          done();
          return;
        }
        var verify,
          action = _.find(gridBox.$.supplyList.actions, function (action) {
            return action.name === "openItemWorkbench";
          }),
          prereq = action.prerequisite;
        gridBox.$.supplyButton.bubble("ontap");
        gridBox.$.supplyList.select(0);

        gridBox.$.supplyList.value.models[0][prereq](function (hasPriv) {
          assert.isTrue(hasPriv);
          if (hasPriv) {
            gridBox.$.supplyList.actionSelected(null, {action: {method: "openItemWorkbench"}, index: 0});

            setTimeout(function () {
              assert.equal(XT.app.$.postbooks.getActive().$.workspace.kind, "XV.ItemWorkbenchWorkspace");
              XT.app.$.postbooks.getActive().doPrevious();
              assert.equal(XT.app.$.postbooks.getActive().$.workspace.kind, "XV.SalesOrderWorkspace");
              done();
            }, 3000);
          } else {done(); }
        });
      });
      it('adding a second line item should not copy the item', function (done) {
        workspace.value.once("change:total", done());

        gridRow.$.itemSiteWidget.$.privateItemSiteWidget.$.input.focus();
        // Add a new item, check that row exists, and make sure the itemSiteWidget doesn't copy irrelevantly
        gridBox.newItem();
        assert.equal(gridBox.liveModels().length, 2);
        assert.notEqual(submodels.itemModel.id, gridRow.$.itemSiteWidget.$.privateItemSiteWidget.$.input.value);

        // The intention was to delete the above line after verifying that the item doesn't copy but ran into 
        // many issues so just populating with same data and saving it with 2 line items.
        gridRow.$.itemSiteWidget.doValueChange({value: {item: submodels.itemModel, site: submodels.siteModel}});
        gridRow.$.quantityWidget.doValueChange({value: 5});

        /* Delete the line item
        workspace.value.get("lineItems").models[1].destroy({
              success: function () {
                gridBox.setEditableIndex(null);
                gridBox.$.editableGridRow.hide();
                gridBox.valueChanged();
              }
            });
        */
      });
      // XXX - skip test if site calendar is enabled -
      // temporary until second notifyPopup (_nextWorkingDate) is handled in test (TODO).

      //it('changing the Schedule Date updates the line item\'s schedule date', function (done) {
      (skipIfSiteCal ? it.skip : it)(
        'changing the Schedule Date updates the line item\'s schedule date', function (done) {
        var getDowDate = function (dow) {
            var date = new Date(),
              currentDow = date.getDay(),
              distance = dow - currentDow;
            date.setDate(date.getDate() + distance);
            return date;
          },
          newScheduleDate = getDowDate(0); // Sunday from current week

        var handlePopup = function () {
          assert.equal(workspace.value.get("scheduleDate"), newScheduleDate);
          // Confirm to update all line items
          XT.app.$.postbooks.notifyTap(null, {originator: {name: "notifyYes"}});
          // And verify that they were all updated with the new date
          setTimeout(function () {
            _.each(workspace.value.get("lineItems").models, function (model) {
              assert.equal(newScheduleDate, model.get("scheduleDate"));
            });
            done();
          }, 3000);
        };

        workspace.value.once("change:scheduleDate", handlePopup);
        workspace.value.set("scheduleDate", newScheduleDate);
      });
      it('save, then delete order', function (done) {
        assert.equal(workspace.value.status, XM.Model.READY_NEW);
        smoke.saveWorkspace(workspace, function (err, model) {
          assert.isNull(err);
          // TODO: sloppy
          setTimeout(function () {
            smoke.deleteFromList(XT.app, model, done);
          }, 4000);
        }, true);
      });
    });
  });
}());
