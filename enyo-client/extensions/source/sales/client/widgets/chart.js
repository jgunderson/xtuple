/*jshint bitwise:true, indent:2, curly:true, eqeqeq:true, immed:true,
latedef:true, newcap:true, noarg:true, regexp:true, undef:true,
trailing:true, white:true*/
/*global XT:true, XM:true, XV:true, _:true, window: true, enyo:true, nv:true, d3:true, console:true */

(function () {


/*
unused and out of date. if we want to use this, add correct parameters to
filter options
  enyo.kind({
    name: "XV.SalesHistoryBarChart",
    kind: "XV.DrilldownBarChart",
    collection: "XM.SalesHistoryCollection",
    chartTitle: "_salesHistory".loc(),
    drillDownAttr: "orderNumber",
    drillDownRecordType: "XM.SalesOrderRelation",
    filterOptions: [
      { name: "today" },
      { name: "thisWeek" },
      { name: "thisMonth" },
      { name: "thisYear" },
      { name: "twoYears" },
      { name: "fiveYears" }
    ],
    groupByOptions: [
      { name: "customer" },
      { name: "salesRep" }
    ],
    totalField: "totalPrice",
    filterData: filterData
  });
*/

  enyo.kind({
    name: "XV.SalesHistoryTimeSeriesChart",
    kind: "XV.TimeSeriesChart",
    collection: "XM.SalesHistoryCollection",
    chartTitle: "_salesHistory".loc(),
    groupByOptions: [
      { name: "" },
      { name: "customer" },
      { name: "salesRep" }
    ],
    dateField: "shipDate",
    totalField: "totalPrice"
  });

  enyo.kind({
    name: "XV.SalesOrderTimeSeriesChart",
    kind: "XV.TimeSeriesChart",
    collection: "XM.SalesOrderListItemCollection",
    chartTitle: "_bookings".loc(),
    groupByOptions: [
      { name: "" },
      { name: "customer" },
      { name: "salesRep" }
    ],
    dateField: "orderDate",
    totalField: "total"
  });
  
  enyo.kind({
    name: "XV.Period12PlusShipmentsTimeSeriesChart",
    kind: "XV.AnalyticTimeSeriesChart",
    collection: "XM.AnalyticCollection",
    chartTitle: "_shipments".loc() + " 2010",
    measures: [
    ],
    measure: "",
    chartOptions: [
      { name: "barChart" },
      { name: "stackedBarChart" },
      { name: "lineChart" },
      { name: "areaChart" }
    ],
    query : "period12PlusPrevious",
    queryString : "WITH MEMBER [Measures].[Delivery Gross] as 'IIf(IsEmpty([Measures].[Amount, Delivery Gross]), 0.000, [Measures].[Amount, Delivery Gross])'" +
    " MEMBER Measures.[prevKPI] AS ([Measures].[Amount, Delivery Gross] , ParallelPeriod([Delivery Date.Calendar].[2010]))" +
    " MEMBER [Measures].[Delivery Gross Previous Year] AS iif(Measures.[prevKPI] = 0 or Measures.[prevKPI] = NULL or IsEmpty(Measures.[prevKPI]), 0.000, Measures.[prevKPI] )" +
    " select NON EMPTY {[Measures].[Delivery Gross], [Measures].[Delivery Gross Previous Year]} ON COLUMNS," +
    " LastPeriods(12, [Delivery Date.Calendar].[2010].[12]) ON ROWS" +
    " from [SODelivery]",
    measureCaptions : ["Shipment Amount", "Previous Year"],
    measureColors : ['#ff7f0e', '#2ca02c'],
    plotDimension : "[Delivery Date.Calendar].[Period].[MEMBER_CAPTION]",
    chart : function (type) {
        switch (type) {
        case "barChart":
          return nv.models.multiBarChart();
        case "skatterChart":
          return nv.models.scatterChart();
        case "lineChart":
          return nv.models.lineChart();
        case "areaChart":
          return nv.models.stackedAreaChart();
        }
      },
    cube : "SODelivery"
  });
  
  enyo.kind({
    name: "XV.Period12PlusBookingsTimeSeriesChart",
    kind: "XV.AnalyticTimeSeriesChart",
    collection: "XM.AnalyticCollection",
    chartTitle: "_bookings".loc() + " 2010",
    measures: [
    ],
    measure: "",
    chartOptions: [
      { name: "barChart" },
      { name: "stackedBarChart" },
      { name: "lineChart" },
      { name: "areaChart" }
    ],
    query : "period12PlusPrevious",
    queryString : "WITH MEMBER [Measures].[Order Gross] as 'IIf(IsEmpty([Measures].[Amount, Order Gross]), 0.000, [Measures].[Amount, Order Gross])'" +
      " MEMBER Measures.[prevKPI] AS ([Measures].[Amount, Order Gross] , ParallelPeriod([Order Date.Calendar].[2010]))" +
      " MEMBER [Measures].[Order Gross Previous Year] AS iif(Measures.[prevKPI] = 0 or Measures.[prevKPI] = NULL or IsEmpty(Measures.[prevKPI]), 0.000, Measures.[prevKPI] )" +
      " select NON EMPTY {[Measures].[Order Gross], [Measures].[Order Gross Previous Year]} ON COLUMNS," +
      " LastPeriods(12, [Order Date.Calendar].[2010].[12]) ON ROWS" +
      " from [SOOrder]",
    measureCaptions : ["Booking Amount", "Previous Year"],
    measureColors : ['#ff7f0e', '#2ca02c'],
    plotDimension : "[Order Date.Calendar].[Period].[MEMBER_CAPTION]",
    chart : function (type) {
        switch (type) {
        case "barChart":
          return nv.models.multiBarChart();
        case "skatterChart":
          return nv.models.scatterChart();
        case "lineChart":
          return nv.models.lineChart();
        case "areaChart":
          return nv.models.stackedAreaChart();
        }
      },
    cube : "SOOrder"
  });

  enyo.kind({
    name: "XV.Period12PlusBacklogTimeSeriesChart",
    kind: "XV.AnalyticTimeSeriesChart",
    collection: "XM.AnalyticCollection",
    chartTitle: "Backlog 2010",
    measures: [
    ],
    measure: "",
    chartOptions: [
      { name: "barChart" },
      { name: "stackedBarChart" },
      { name: "lineChart" },
      { name: "areaChart" }
    ],
    query : "period12PlusPrevious",
    queryString : "WITH MEMBER [Measures].[Orders Unfulfilled] as 'IIf(IsEmpty([Measures].[Balance, Orders Unfulfilled]), 0.000, [Measures].[Balance, Orders Unfulfilled])'" +
      " MEMBER Measures.[prevKPI] AS ([Measures].[Balance, Orders Unfulfilled] , ParallelPeriod([Fiscal Period.Fiscal Period CL].[2010]))" +
      " MEMBER [Measures].[Orders Unfulfilled Previous Year] AS iif(Measures.[prevKPI] = 0 or Measures.[prevKPI] = NULL or IsEmpty(Measures.[prevKPI]), 0.000, Measures.[prevKPI] )" +
      " select NON EMPTY {[Measures].[Orders Unfulfilled], [Measures].[Orders Unfulfilled Previous Year]} ON COLUMNS," +
      " LastPeriods(12, [Fiscal Period.Fiscal Period CL].[2010].[12]) ON ROWS" +
      " from [SOByPeriod]",
    measureCaptions : ["Backlog Amount", "Previous Year"],
    measureColors : ['#ff7f0e', '#2ca02c'],
    plotDimension : "[Fiscal Period.Fiscal Period CL].[Fiscal Period].[MEMBER_CAPTION]",
    chart : function (type) {
        switch (type) {
        case "barChart":
          return nv.models.multiBarChart();
        case "skatterChart":
          return nv.models.scatterChart();
        case "lineChart":
          return nv.models.lineChart();
        case "areaChart":
          return nv.models.stackedAreaChart();
        }
      },
    cube : "SOByPeriod"
  });

  /*
  enyo.kind({
    name: "XV.QuoteTimeSeriesChart",
    kind: "XV.TimeSeriesChart",
    collection: "XM.QuoteListItemCollection",
    chartTitle: "_quotes".loc(),
    groupByOptions: [
      { name: "" },
      { name: "customer" },
      { name: "salesRep" }
    ],
    dateField: "quoteDate",
    totalField: "total",
  });
  */

}());
