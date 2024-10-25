sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/BusyDialog",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Token"
],
    function (BaseController, JSONModel, BusyDialog, Filter, FilterOperator, Token) {
        "use strict";

        return BaseController.extend("customduty.ui.invoiceposting.controller.InvoicePosting", {

            onInit: function () {
                this.getOwnerComponent().getRouter().getRoute("InvoicePosting").attachMatched(this.onRouteMatched,this);
            },

            onRouteMatched: function(){
                const finalModel = sap.ui.getCore().getModel("FinalModel");
                if(finalModel){
                    this.getView().setModel(finalModel,"InvoicePostingModel");
                this.getView().getModel("InvoicePostingModel").refresh(true);
                }
                
            },
            onPersoButtonPress : function(oEvent){
                this.getPersoController(this,"idInvoicePostingTable").openDialog({});
            }
        });
    });
