sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/UIComponent",
    "sap/m/SearchField",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
  ],
  function (Controller, UIComponent, SearchField, JSONModel, Fragment, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("customduty.ui.invoiceposting.BaseController", {
      // just this.getRouter() ...
      getRouter: function () {
        return UIComponent.getRouterFor(this);
      },

      // just this.getModel() ...
      getModel: function (sName) {
        return this.getView().getModel(sName);
      },

      // just this.setModel() ...
      setModel: function (oModel, sName) {
        return this.getView().setModel(oModel, sName);
      },

      setModelProperty: function (sName, sPropertyName, oValue) {
        this.getView().getModel(sName).setProperty(`/${sPropertyName}`, oValue);
        this.getView().getModel(sName).refresh(true);
      },

      // just this.getResoureBundle() ...
      getResourceBundle: function () {
        return this.getOwnerComponent().getModel("i18n").getResourceBundle();
      },

      getById: function (sId) {
        return this.getView().byId(sId);
      },

      loadValueHelpDialog: function (columns, sPath, View, fragmentName) {
        let that = this;
        this.busyDialog.open();
        this._oBasicSearchField = new SearchField();
        if (!that.oValueHelpDialog) {
          that.oValueHelpDialog = Fragment.load({
            name: "customduty.ui.invoiceposting.view.fragments." + fragmentName,
            controller: this
          }).then(function (oDialog) {
            let oFilterBar = oDialog.getFilterBar();
            that.oValueHelpDialog = oDialog;
            that.getView().addDependent(oDialog);

            // Set Basic Search for FilterBar
            oFilterBar.setFilterBarExpanded(false);
            oFilterBar.setBasicSearch(that._oBasicSearchField);

            // Trigger filter bar search when the basic search is fired
            that._oBasicSearchField.attachSearch(function () {
              oFilterBar.search();
            });
            let oColumnModel = new JSONModel();
            oColumnModel.setData(columns);
            oDialog.getTableAsync().then(function (oTable) {
              oTable.setModel(that.getView().getModel());
              oTable.setModel(oColumnModel, "columns");
              oTable.setThreshold(20);
              if (oTable.bindRows) {
                oTable.bindAggregation("rows", sPath);
              }

              if (oTable.bindItems) {
                oTable.bindAggregation("items", sPath, function () {
                  return new sap.m.ColumnListItem({
                    cells: columns.cols.map(function (column) {
                      return new sap.m.Label({ text: "{" + column.template + "}" });
                    })
                  });
                });
              }
              oDialog.update();
            });
            //oDialog.setModel(oView.getModel());
            that.busyDialog.close();
            return oDialog.open();
          });
        }

      },

      onFilterBarSearch: function (oEvent) {
        const sSearchQuery = this._oBasicSearchField.getValue(),
          aSelectionSet = oEvent.getParameter("selectionSet"),
          filterPath = [], sFilters = [];
        let aFilters = aSelectionSet.reduce(function (aResult, oControl) {
          if (oControl.getValue()) {
            aResult.push(new Filter({
              path: oControl.getName(),
              operator: FilterOperator.Contains,
              value1: oControl.getValue()
            }));
          }
          filterPath.push(oControl.getName());
          return aResult;
        }, []);
        filterPath.forEach((sPath) => {
          sFilters.push(new Filter({ path: sPath, operator: FilterOperator.Contains, value1: sSearchQuery }))
        })
        aFilters.push(new Filter({
          filters: sFilters,
          and: false
        }));
        this.oValueHelpDialog.getTableAsync().then(function (oTable) {
          if (oTable.bindRows) {
            oTable.getBinding("rows").filter(aFilters);
          }
          if (oTable.bindItems) {
            oTable.getBinding("items").filter(aFilters);
          }

          // This method must be called after binding update of the table.
          this.oValueHelpDialog.update();
        }, this);
      },

      onValueHelpOkPress: function (oEvent) {
        const aTokens = oEvent.getParameter("tokens"),
          inputId = oEvent.getSource().data("InputId"),
          fieldProperty = this.byId(inputId).data("CHAModelProperty");
        this.byId(inputId).setValue(aTokens[0].getKey());
        this.byId(inputId).setValueState("None");
        this.setModelProperty("uploadChaFileModel", fieldProperty, true);
        this.getView().getModel("uploadChaFileModel").refresh(true);
        this.oValueHelpDialog.close();
      },

      onValueHelpCancelPress: function () {
        this.oValueHelpDialog.close();
      },

      onValueHelpAfterClose: function () {
        this.oValueHelpDialog.destroy();
        this.oValueHelpDialog = undefined;
      }

    });
  }
);
