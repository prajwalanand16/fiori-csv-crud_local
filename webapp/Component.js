sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
  "use strict";
  return UIComponent.extend("csv.crud.Component", {
    metadata: { manifest: "json" },
    init: function () {
      UIComponent.prototype.init.apply(this, arguments);
      // Create a model to hold items and selection
      var oModel = new JSONModel({ items: [], selectedId: null, busy: false });
      this.setModel(oModel, "itemsModel");
    }
  });
});
