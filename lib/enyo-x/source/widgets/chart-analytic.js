/*jshint bitwise:true, indent:2, curly:true, eqeqeq:true, immed:true,
latedef:true, newcap:true, noarg:true, regexp:true, undef:true,
trailing:true, white:true*/
/*global XT:true, XM:true, XV:true, _:true, window: true, enyo:true, nv:true, d3:true, console:true */

(function () {

  /**
    Generic implementation of customizable analytic chart.
    Uses nvd3 for SVG rendering.
  */
  enyo.kind(
    /** @lends XV.SelectableAnalyticChart# */{
    name: "XV.SelectableAnalyticChart",
    published: {
      // these published fields should not be overridden
      processedData: null,
      // this groupByAttr is set to undefined so as to distinguish
      // it from "", which could mean to groupBy all values
      groupByAttr: undefined,
      chartType: "barChart",
      value: null, // the backing collection for chart generation
      model: null, // the backing chart model
      removeIconShowing: false, // show "x" icon to remove chart
      order: null, // order number of the chart

      // these ones can/should be overridden (although some have sensible defaults)
      chartTitle: "_chartTitle".loc(),
      collection: "", // {String} e.g. "XM.IncidentListItemCollection"
      drillDownRecordType: "",
      drillDownAttr: "",
      chartOptions: [],
      groupByOptions: [],
      query: { parameters: [] },
      queryString: "",
      measureCaptions: [],
      measureColors: [],
      measure: "",
      measures: [],
      plotDimension : "",
      chart : function () {
        return nv.models.multiBarChart();
      },
      totalField: "", // what are we summing up in the bar chart (empty means just count)
      cubeMeasures: [ // temporary structure until we have a cube discovery route
        {cube: "Backlog",
         cubename: "SOBYPeriod",
         measures: ["Balance, Backlog", "Days, Booking to Shipment", "Interest, B2S Impact",
                    "Amount, Shipment", "Amount, Booking", "Amount, Cost", "Count, Bookings"],
         measurenames: ["Balance, Orders Unfulfilled", "O2D Days", "Interest, O2D Impact",
                    "Amount, Delivery Gross", "Amount, Order Gross", "Amount, Cost", "Count, Orders"]
        }
      ]
    },
    classes: "selectable-chart",
    components: [
      {kind: "onyx.Popup", name: "spinnerPopup",
        style: "margin-top:40px;margin-left:200px;",
        components: [
        {kind: "onyx.Spinner"},
        {name: "spinnerMessage", content: "_loading".loc() + "..."}
      ]},
      {name: "chartTitleBar", classes: "chart-title-bar", components: [
        {name: "chartTitle", classes: "chart-title"},
        {kind: "onyx.IconButton", name: "removeIcon",
          src: "/assets/remove-icon.png", ontap: "chartRemoved",
          classes: "remove-icon", showing: false}
      ]},

      {name: "chartWrapper", classes: "chart-bottom", components: [
        {name: "chart", components: [
          {name: "svg", tag: "svg"} // this is the DOM element that d3 will take over
        ]},
        {kind: "enyo.FittableColumns", components: [
          {content: "_chartType".loc() + ": ", classes: "xv-picker-label", name: "chartTypeLabel"},
          {kind: "onyx.PickerDecorator", name: "chartPickerDecorator", onSelect: "chartSelected",
            components: [
            {kind: "XV.PickerButton", content: "_chooseOne".loc()},
            {name: "chartPicker", kind: "onyx.Picker"}
          ]},
          {content: "_measure".loc() + ": ", classes: "xv-picker-label"},
          {kind: "onyx.PickerDecorator", onSelect: "measureSelected",
            components: [
            {kind: "XV.PickerButton", content: "_chooseOne".loc()},
            {name: "measurePicker", kind: "onyx.Picker"}
          ]}
        ]}
      ]}
    ],
    events: {
      onChartRemove: "",
      onSearch: "",
      onWorkspace: "",
      onStatusChange: ""
    },
    /**
      Get the grouped data in the JSON format the chart wants. Up to the implementation.
     */
    aggregateData: function (groupedData) {
      return groupedData;
    },
    /**
      Remove this chart from it's parent (if applicable)
    */
    chartRemoved: function (inSender, inEvent) {
      inEvent.model = this.getModel();
      this.doChartRemove(inEvent);
    },
    /**
      Kick off the fetch on the collection as soon as we start.
     */
    create: function () {
      this.inherited(arguments);

      var that = this,
        collection = this.getCollection(),
        Klass = collection ? XT.getObjectByName(collection) : false;

      //
      // Show/Hide remove icon
      //
      this.$.removeIcon.setShowing(this.removeIconShowing);

      //
      // Set the chart title
      //
      this.$.chartTitle.setContent(this.getChartTitle());

      //
      // Make and fetch the collection
      //
      if (!Klass) {
        console.log("Error: cannot find collection", collection);
        return;
      }

      //
      // Populate the chart picker
      //
      _.each(this.getChartOptions(), function (item) {
        item.content = item.content || ("_" + item.name).loc(); // default content
        if (that.getChartOptions().length === 1) {
          // if there's only one option, no need to show the picker
          that.$.chartTypeLabel.setShowing(false);
          that.$.chartPickerDecorator.setShowing(false);
          that.setChartType(item.name);
        }
        that.$.chartPicker.createComponent(item);
      });

      //
      // Populate the Measure picker
      //
      _.each(this.getMeasures(), function (item) {
        item.content = item.content || ("_" + (item.name || "all")).loc(); // default content
        that.$.measurePicker.createComponent(item);
      });

      this.setValue(new Klass());
      
      /**
       * Perform collection's fetch.  This will drive the collection's synch method.
       * On complete, processData will drive processDataChanged which calls plot.
       */
      this.getValue().fetch({
        data : {mdx : this.getQueryString()},
        success: function (collection, results) {
          // Hide the scrim
          that.$.spinnerPopup.hide();
          // Set the values in the pickers, initialize model
          that.modelChanged();
          // Set the order of the chart
          that.orderChanged();
          // Save the data results
          that.processData();
        }
      });
    },
    /**
      When the  value changes, set the selected value
      in the picker widget and re-process the data.
    */
    chartTypeChanged: function () {
      var that = this,
        selected = _.find(this.$.chartPicker.controls, function (option) {
          return option.name === that.getChartType();
        });
      if (selected) {
        this.$.chartPicker.setSelected(selected);
      }
      this.$.svg.setContent("");
      this.plot(this.getChartType());
      //this.processData();
    },
    /**
      A new  value was selected in the picker. Set
      the published  attribute and the model.
    */
    chartSelected: function (inSender, inEvent) {
      this.setChartType(inEvent.originator.name);
    },
    /**
      When the measure value changes, set the selected value
      in the picker widget, fetch the data and re-process the data.
    */
    measureChanged: function () {
      var that = this,
        selected = _.find(this.$.measurePicker.controls, function (option) {
          return option.name === that.getMeasure();
        });
      this.$.measurePicker.setSelected(selected);
      //substitute values in query
      //collection fetch
      this.processData();
    },
    /**
      A new measure was selected in the picker. Set
      the published measure attribute.
    */
    measureSelected: function (inSender, inEvent) {
      this.setMeasure(inEvent.originator.name);
      // heres how we would set the model property
      //this.getModel().set("measure", inEvent.originator.name);
    },
    /**
      Set the  values from the model. Set binding
      on the new model.
    */
    modelChanged: function () {
      var model = this.getModel(), K = XM.Model,
        filter = model.get("filter") ? model.get("filter") : "all";
      this.setGroupByAttr(model.get("groupBy"));
      this.setBindings('on');
    },
    orderChanged: function () {
      this.getModel().set("order", this.getOrder());
    },
    /**
      Make the chart using v3 and nv.d3, working off our this.processedData.
     */
    plot: function (type) {
      // up to the implementation
    },
    
    processedDataChanged: function () {
      this.plot(this.getChartType());
    },
    /**
      After render, replot the charts.
    */
    rendered: function () {
      this.inherited(arguments);
      this.processData();
    },
    /**
      Set model bindings on the chart
    */
    setBindings: function (action) {
      action = action || 'on';
      this.model[action]("statusChange", this.statusChanged, this);
    },
    /**
      Bubble a status changed event to the Dashboard so that it
      can control the spinner and save buttons.
    */
    statusChanged: function (model, status, options) {
      var inEvent = {model: model, status: status};
      this.doStatusChange(inEvent);
    }
  });

  enyo.kind(
    /** @lends XV.DrilldownBarChart */{
    name: "XV.DrilldownAnalyticBarChart",
    kind: "XV.SelectableAnalyticChart",
    aggregateData: function (groupedData) {
      var that = this,
        aggregatedData = _.map(groupedData, function (datum, key) {
          var reduction = _.reduce(datum, function (memo, row) {
            // if the total field is not specified, we just count.
            var increment = that.getTotalField() ? row.get(that.getTotalField()) : 1;
            return {
              label: memo.label === 'null' ? "_none".loc() : memo.label || "_none".loc(),
              value: memo.value + increment
            };
          }, {label: key, value: 0});
          return reduction;
        });
      return [{values: aggregatedData}];
    },
    /**
      If the user clicks on a bar we open up the SalesHistory list with the appropriate
      . When the user clicks on an list item we drill down further into the sales
      order.
     */
    drillDown: function (field, key) {
      var that = this,
        recordType = this.getValue().model.prototype.recordType,
        listKind = XV.getList(recordType),
        params = [{
          name: field,
          value: key
        }],
        callback = function (value) {
          // unless explicitly specified, we assume that we want to drill down
          // into the same model that is fuelling the report
          var drillDownRecordType = that.getDrillDownRecordType() ||
              that.getValue().model.prototype.recordType,
            drillDownAttribute = that.getDrillDownAttr() ||
              XT.getObjectByName(drillDownRecordType).prototype.idAttribute,
            id = value.get(drillDownAttribute);

          if (id) {
            that.doWorkspace({workspace: XV.getWorkspace(drillDownRecordType), id: id});
          }
          // TODO: do anything if id is not present?
        };

      // TODO: the parameter widget sometimes has trouble finding our query requests
      this.doSearch({
        list: listKind,
        searchText: "",
        callback: callback,
        parameterItemValues: params,
        conditions: _.union(this.getQuery().parameters, this.getFilterOptionParameters()),
        query: null
      });
    },
    /**
      Make the chart using v3 and nv.d3, working off our this.processedData.
     */
    plot: function () {
      var that = this,
        div = this.$.svg.hasNode();

      //nv.addGraph(function () {
      var chart = nv.models.discreteBarChart()
        .x(function (d) { return d.label; })
        .y(function (d) { return d.value; })
        .valueFormat(d3.format(',.0f'))
        .staggerLabels(true)
        .tooltips(false)
        .showValues(true)
        .width(400);

      chart.yAxis
        .tickFormat(d3.format(',.0f'));
      chart.margin({left: 80});

      d3.select(div)
        .datum(this.getProcessedData())
        .transition().duration(500)
        .call(chart);

      d3.selectAll(".nv-bar").on("click", function (bar, index) {
        that.drillDown(that.getGroupByAttr(), bar.label);
      });

      d3.selectAll("text").style("fill", "white");
        //nv.utils.windowResize(chart.update);
        //return chart;
      //});
    }
  });

  enyo.kind(
    /** @lends XV.TimeSeriesChart # */{
    name: "XV.AnalyticTimeSeriesChart",
    kind: "XV.SelectableAnalyticChart",
    published: {
      dateField: ""
    },
    /**
      This looks really complicated! I'm just binning the
      data into a histogram.
     */
    aggregateData: function (groupedData) {
      var that = this,
        now = new Date().getTime(),
        earliestDate = now, // won't be now for long
        dataPoints = _.reduce(groupedData, function (memo, group) {
          _.each(group, function (item) {
            var dateInt = item.get(that.getDateField()).getTime();
            earliestDate = Math.min(earliestDate, dateInt);
          });
          return memo + group.length;
        }, 0),
        binCount = Math.ceil(Math.sqrt(dataPoints)),
        binWidth = Math.ceil((now - earliestDate) / binCount),
        histoGroup = _.map(groupedData, function (group, groupKey) {
          var binnedData, summedData, hole, findHole, foundData;

          binnedData = _.groupBy(group, function (item) {
            var binNumber = Math.floor((item.get(that.getDateField()).getTime() - earliestDate) / binWidth);
            // we actually want to return the timestamp at the start of the bin, for later use
            return (binNumber * binWidth) + earliestDate;
          });
          summedData = _.map(binnedData, function (bin, binKey) {
            var binTotal = _.reduce(bin, function (memo, value, key) {
              return memo + value.get(that.getTotalField());
            }, 0);
            return {x: binKey, y: binTotal};
          });
          // plug in zeros for missing data. Necessary for nvd3 stacking.
          findHole = function (datum) {
            return datum.x === String(hole);
          };
          for (hole = earliestDate; hole <= now; hole += binWidth) {
            foundData = _.find(summedData, findHole);
            if (!foundData) {
              summedData.push({x: String(hole), y: 0});
            }
          }
          summedData = _.sortBy(summedData, function (data) {
            return data.x;
          });
          groupKey = groupKey === 'null' ? "_none".loc() : groupKey || "_none".loc();
          return {key: groupKey, values: summedData};
        });

      return histoGroup;
    },
    /**
      Process the data from xmla4js format to nvd3 format
     */
    
    processData: function () {
      
      var formattedData = [];
      var collection = this.getValue();
      
      if (collection.models.length > 0) {
      
        var measureNumber = 0;
        for (var propt in collection.models[0].attributes) {

          if (propt.indexOf("[Measures]") !== -1) {
            var values = [];

            for (var i = 0; i < collection.models.length; i++) {
              values.push({ x: collection.models[i].attributes[this.getPlotDimension()],
                y: collection.models[i].attributes[propt]});
            }

            formattedData.push({ values: values,
              key: this.getMeasureCaptions()[measureNumber],
              color: this.getMeasureColors()[measureNumber]});
            measureNumber++;
          }
          //console.log(propt + ': ' + collection.models[0].attributes[propt]);
        }
        //  This will drive processDataChanged which will call plot
        //
        this.setProcessedData(formattedData);
      }
    },
    
    plot: function (type) {
      var navigatorChildren = XT.app.$.postbooks.$.navigator.$.contentPanels.children,
        activePanel = navigatorChildren[navigatorChildren.length - 1],
        thisPanel = this.parent.parent;

      if (thisPanel.name !== activePanel.name) {
        // do not bother rendering if the user has already moved off this panel
        return;
      }

      var that = this,
        div = this.$.svg.hasNode();

      //var chart = nv.models.multiBarChart()
      //  .stacked(true).height(180);
      var chartFunc = this.getChart();
      var chart = chartFunc(type).height(180);

      chart.xAxis
        .tickFormat(d3.format(', f'));

      chart.yAxis
        .tickFormat(d3.format(', f'));

      chart.margin({left: 80});
      
      console.log("plotting : " + this.getProcessedData().toString());
      
      d3.select(div)
        .datum(this.getProcessedData())
        .transition().duration(500)
        .call(chart);

      // helpful reading: https://github.com/mbostock/d3/wiki/Selections
      d3.selectAll("text").style("fill", "white");
    },
  });

}());
