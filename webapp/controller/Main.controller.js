sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/core/Fragment"
], function(Controller, MessageToast, MessageBox, JSONModel, Filter, FilterOperator, Fragment) {
  "use strict";

  return Controller.extend("csv.crud.controller.Main", {
    onInit: function() {
      this._api = "http://localhost:3000/api";
      this._oItemsModel = this.getOwnerComponent().getModel("itemsModel");
      this.onRefresh();
    },

    _setBusy: function(b) {
      this._oItemsModel.setProperty("/busy", b);
    },

    onRefresh: function() {
      var that = this;
      this._setBusy(true);
      fetch(this._api + "/items")
        .then(function(r){ return r.json(); })
        .then(function(items){
          that._oItemsModel.setProperty("/items", items);
          that._oItemsModel.setProperty("/selectedId", null);
        })
        .catch(function(err){
          MessageBox.error("Failed to load items. Is the backend running on :3000?");
          // eslint-disable-next-line no-console
          console.error(err);
        })
        .finally(function(){ that._setBusy(false); });
    },

    onSelect: function(oEvent) {
      var ctx = oEvent.getParameter("listItem").getBindingContext("itemsModel");
      var id = ctx.getObject().id;
      this._oItemsModel.setProperty("/selectedId", id);
    },

    onSearch: function(oEvent) {
      var sQuery = (oEvent.getParameter("newValue") || "").toLowerCase();
      var oTable = this.byId("table");
      var oBinding = oTable.getBinding("items");
      if (!sQuery) {
        oBinding.filter([]);
        return;
      }
      var aFilters = [
        new Filter({ path: "id", operator: FilterOperator.Contains, value1: sQuery }),
        new Filter({ path: "name", operator: FilterOperator.Contains, value1: sQuery })
      ];
      oBinding.filter(new Filter({ filters: aFilters, and: false }));
    },

    onAdd: function() {
      this._openEditDialog({ id: "", name: "", price: 0, quantity: 0 });
    },

    onEdit: function() {
      var id = this._oItemsModel.getProperty("/selectedId");
      if (!id) {
        MessageToast.show("Select a row to edit.");
        return;
      }
      var items = this._oItemsModel.getProperty("/items") || [];
      var obj = items.find(function(i){ return i.id === id; });
      if (obj) {
        // Clone to avoid live editing of table row
        var copy = JSON.parse(JSON.stringify(obj));
        this._openEditDialog(copy);
      }
    },

    onDelete: function() {
      var that = this;
      var id = this._oItemsModel.getProperty("/selectedId");
      if (!id) {
        MessageToast.show("Select a row to delete.");
        return;
      }
      MessageBox.confirm("Delete item with ID " + id + "?", {
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        onClose: function(sAction){
          if (sAction === MessageBox.Action.OK) {
            fetch(that._api + "/items/" + encodeURIComponent(id), { method: "DELETE" })
              .then(function(r){
                if (r.status === 204) {
                  MessageToast.show("Deleted.");
                  that.onRefresh();
                } else {
                  return r.json().then(function(j){ throw new Error(j.error || "Delete failed"); });
                }
              })
              .catch(function(err){
                MessageBox.error(err.message || "Delete failed");
              });
          }
        }
      });
    },

    _openEditDialog: function(data) {
      var that = this;
      if (!this._oEditDialog) {
        Fragment.load({
          name: "csv.crud.view.EditDialog",
          controller: this
        }).then(function(oDialog){
          that.getView().addDependent(oDialog);
          that._oEditDialog = oDialog;
          that._openEditDialog(data);
        });
        return;
      }
      if (!this._oEditModel) {
        this._oEditModel = new JSONModel();
        this.getView().setModel(this._oEditModel, "editModel");
      }
      this._oEditModel.setData(data || { id: "", name: "", price: 0, quantity: 0 });
      this._oEditDialog.open();
    },

    onDialogCancel: function() {
      if (this._oEditDialog) this._oEditDialog.close();
    },

    onDialogSave: function() {
      var that = this;
      var data = this._oEditModel.getData();
      // basic validation
      if (!data.name) {
        MessageToast.show("Name is required.");
        return;
      }
      data.price = Number(data.price || 0);
      data.quantity = Number(data.quantity || 0);

      var isEdit = !!data.id;
      var url = this._api + "/items" + (isEdit ? ("/" + encodeURIComponent(data.id)) : "");
      var method = isEdit ? "PUT" : "POST";
      var payload = JSON.stringify({
        name: data.name,
        price: data.price,
        quantity: data.quantity
      });
      fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: payload
      })
      .then(function(r){
        if (!r.ok) return r.json().then(function(j){ throw new Error(j.error || "Save failed"); });
        return r.json ? r.json() : {};
      })
      .then(function(){
        MessageToast.show("Saved.");
        that.onDialogCancel();
        that.onRefresh();
      })
      .catch(function(err){
        MessageBox.error(err.message || "Save failed");
      });
    }
  });
});
