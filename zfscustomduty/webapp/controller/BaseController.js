sap.ui.define(
    [
      "sap/ui/core/mvc/Controller",
      "sap/ui/core/UIComponent"
    ],
    function (Controller, UIComponent) {
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
        }

      });
    }
  );
  