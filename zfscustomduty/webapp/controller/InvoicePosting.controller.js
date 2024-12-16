sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/BusyDialog",
    'sap/m/MessageItem',
    'sap/m/MessageView',
    'sap/m/Button',
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/format/NumberFormat",
    'sap/m/Bar',
    'sap/m/Title',
    'sap/m/Popover',
    "sap/ui/core/routing/History",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "customduty/ui/invoiceposting/utils/formatter",
    "sap/m/MessageBox",
    'sap/ui/export/library',
	'sap/ui/export/Spreadsheet'
],
    function (BaseController, JSONModel, BusyDialog, MessageItem, MessageView, Button, DateFormat, NumberFormat, Bar, Title, Popover, History, MessageToast, Fragment, formatter, MessageBox, exportLibrary, Spreadsheet) {
        "use strict";
        var EdmType = exportLibrary.EdmType;
        return BaseController.extend("customduty.ui.invoiceposting.controller.InvoicePosting", {
            formatter: formatter,
            onInit: function () {
                this.busyDialog = new BusyDialog();
                const that = this;
                this.getView().setModel(new JSONModel({
                    messagesLength: 0,
                    messages: []
                }), "MessageModel");
                const oMessageTemplate = new MessageItem({
                    type: '{type}',
                    title: '{title}',
                    description: '{description}',
                    subtitle: '{subtitle}',
                    counter: '{counter}',
                    markupDescription: "{markupDescription}"
                });
                this.oMessageView = new MessageView({
                    showDetailsPageHeader: false,
                    itemSelect: function () {
                        oBackButton.setVisible(true);
                    },
                    items: {
                        path: "/messages/",
                        template: oMessageTemplate
                    }
                });
                const oBackButton = new Button({
                    icon: "sap-icon://nav-back",
                    visible: false,
                    press: function () {
                        that.oMessageView.navigateBack();
                        that._oPopover.focus();
                        this.setVisible(false);
                    }
                });

                this.oMessageView.setModel(this.getView().getModel("MessageModel"));

                const oCloseButton = new Button({
                    text: "Close",
                    press: function () {
                        that._oPopover.close();
                    }
                }).addStyleClass("sapUiTinyMarginEnd"),
                    oPopoverFooter = new Bar({
                        contentRight: oCloseButton
                    }),
                    oPopoverBar = new Bar({
                        contentLeft: [oBackButton],
                        contentMiddle: [
                            new Title({ text: "Messages" })
                        ]
                    });

                this._oPopover = new Popover({
                    customHeader: oPopoverBar,
                    contentWidth: "440px",
                    contentHeight: "440px",
                    verticalScrolling: false,
                    modal: true,
                    content: [this.oMessageView],
                    footer: oPopoverFooter
                });

                this.getView().setModel(
                    new JSONModel({
                        OverallText: "",
                        OverallState: "None",
                        OverallIcon: "",
                        CustomText: "",
                        CustomState: "None",
                        CustomIcon: "",
                        OveraSeasText: "",
                        OverSeasState: "None",
                        OverSeastIcon: "",
                        DomesticText: "",
                        DomesticState: "None",
                        DomesticIcon: "",
                        InvoiceNumber: "",
                        OverallStatus: "",
                        DomesticVendor: "",
                        OverSeasVendor: "",
                        CustomVendor: "",
                        CustomVendInvStat: "",
                        DomesticVendInvStat: "",
                        OverSeasVendInvStat: "",
                        Plant: "",
                        POVendor: "",
                        ID: ""
                    }),
                    "ObjectStaus"
                );
                this.getView().setModel(new JSONModel([]), "LogData");
                this.getView().setModel(new JSONModel([]), "ValidLogData");
                this.getOwnerComponent().getRouter().getRoute("InvoicePosting").attachMatched(this.onRouteMatched, this);
            },

            onRouteMatched: function (oEvent) {
                // const finalModel = sap.ui.getCore().getModel("FinalModel"),
                //     MessageModel = this.getView().getModel("MessageModel");
                // if (finalModel) {    
                //     this.getView().setModel(finalModel, "InvoicePostingModel");
                //     this.getView().getModel("InvoicePostingModel").refresh(true);
                // }
                // MessageModel.setData({
                //     messagesLength: 0,
                //     messages: []
                // });

                const oModel = this.getOwnerComponent().getModel();  // Assumes model is set in manifest.json
                this.getView().setModel(oModel);
                this.transactionID = oEvent.getParameter("arguments").transactionId;
                var aSelectedInvoice = "/CustomDutyHdr(" + this.transactionID + ")/to_CustomDutyItem"
                var oItemTable = this.getView().byId("idInvoicePostingTable");
                oItemTable.bindRows({
                    path: aSelectedInvoice
                });
                this.setHeaderInfo();
            },

            createColumnConfig: function() {
                var aCols = [];
    
                aCols.push({
                    property: 'BENo',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'BEDate',
                    type: EdmType.Date
                });

                aCols.push({
                    property: 'ASN',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'ProductDescription',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'InvoiceNumber',
                    type: EdmType.String
                });               

                aCols.push({
                    label: 'ExcRateforInvoice',
                    type: EdmType.Number,
                    property: 'ExcRateforInvoice',
                    scale: 2
                });

                aCols.push({
                    property: 'TermsofInvoice',
                    type: EdmType.String
                });  

                aCols.push({
                    label: 'InvoiceValueFC',
                    type: EdmType.Number,
                    property: 'InvoiceValueFC',
                    scale: 2
                });

                aCols.push({
                    property: 'HSNCodefromCHA',
                    type: EdmType.String
                }); 

                aCols.push({
                    label: 'Quantity',
                    type: EdmType.Number,
                    property: 'Quantity',
                    scale: 2
                });
                
                aCols.push({
                    property: 'Unit',
                    type: EdmType.String
                }); 

                aCols.push({
                    label: 'UnitPrice',
                    type: EdmType.Number,
                    property: 'UnitPrice',
                    scale: 2
                });

                aCols.push({
                    label: 'AssessableValue',
                    type: EdmType.Number,
                    property: 'AssessableValue',
                    scale: 2
                });
                
    
                aCols.push({
                    property: 'ItemSrNo',
                    type: EdmType.String
                });

                aCols.push({
                    label: 'RateofBCDPercent',
                    type: EdmType.Number,
                    property: 'RateofBCDPercent',
                    scale: 2
                });

                aCols.push({
                    label: 'BCDAmount',
                    type: EdmType.Number,
                    property: 'BCDAmount',
                    scale: 2
                });

                aCols.push({
                    label: 'SocWelSurDutyAmt',
                    type: EdmType.Number,
                    property: 'SocWelSurDutyAmt',
                    scale: 2
                });

                aCols.push({
                    label: 'IGSTRateDutyPer',
                    type: EdmType.Number,
                    property: 'IGSTRateDutyPer',
                    scale: 2
                });

                aCols.push({
                    label: 'IGST',
                    type: EdmType.Number,
                    property: 'IGST',
                    scale: 2
                });

                aCols.push({
                    label: 'TotalBCD',
                    type: EdmType.Number,
                    property: 'TotalBCD',
                    scale: 2
                });
              
                aCols.push({
                    property: 'CountryOfOrigin',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'PortofOrigin',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'HAWB_HBLDate',
                    type: EdmType.Date
                });

                aCols.push({
                    property: 'Invoicedate',
                    type: EdmType.Date
                });

                aCols.push({
                    property: 'InvoiceCurrency',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'FreightCurrency',
                    type: EdmType.String
                });

                aCols.push({
                    label: 'FreightAmount',
                    type: EdmType.Number,
                    property: 'FreightAmount',
                    scale: 2
                });

                aCols.push({
                    property: 'InsuranceCurrency',
                    type: EdmType.String
                });

                aCols.push({
                    label: 'InsuranceAmtCHA',
                    type: EdmType.Number,
                    property: 'InsuranceAmtCHA',
                    scale: 2
                });

                aCols.push({
                    label: 'MiscAmountCHA',
                    type: EdmType.Number,
                    property: 'MiscAmountCHA',
                    scale: 2
                });

                aCols.push({
                    property: 'Material',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'PurchaseOrder',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'PurchaseorderItem',
                    type: EdmType.String
                });

                aCols.push({
                    label: 'OverFreightperitem1',
                    type: EdmType.Number,
                    property: 'OverFreightperitem1',
                    scale: 2
                });

                aCols.push({
                    label: 'OverFreightperitem2',
                    type: EdmType.Number,
                    property: 'OverFreightperitem2',
                    scale: 2
                });

                aCols.push({
                    label: 'DomesticFreightperitem1',
                    type: EdmType.Number,
                    property: 'DomesticFreightperitem1',
                    scale: 2
                });

                aCols.push({
                    label: 'DomesticFreightperitem2',
                    type: EdmType.Number,
                    property: 'DomesticFreightperitem2',
                    scale: 2
                });

                
                aCols.push({
                    property: 'CustomInvoiceVendor',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'CustomInvoice',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'OverFreightVendor',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'OverFreighInvoice',
                    type: EdmType.String
                });


                aCols.push({
                    property: 'DomFreightVendor',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'DomFreightInvoice',
                    type: EdmType.String
                });

               
                aCols.push({
                    label: 'OverseasFrtAmtCALC1',
                    type: EdmType.Number,
                    property: 'OverseasFrtAmtCALC1',
                    scale: 2
                });

                aCols.push({
                    label: 'OverseasFrtAmtCALC2',
                    type: EdmType.Number,
                    property: 'OverseasFrtAmtCALC2',
                    scale: 2
                });

                aCols.push({
                    label: 'DomesticFrtAmtCALC1',
                    type: EdmType.Number,
                    property: 'DomesticFrtAmtCALC1',
                    scale: 2
                });

                aCols.push({
                    label: 'DomesticFrtAmtCALC2',
                    type: EdmType.Number,
                    property: 'DomesticFrtAmtCALC2',
                    scale: 2
                });

                aCols.push({
                    label: 'TotalIGST',
                    type: EdmType.Number,
                    property: 'TotalIGST',
                    scale: 2
                });

                aCols.push({
                    label: 'TotalAmount',
                    type: EdmType.Number,
                    property: 'TotalAmount',
                    scale: 2
                });

                aCols.push({
                    label: 'InvoiceValueINR',
                    type: EdmType.Number,
                    property: 'InvoiceValueINR',
                    scale: 2
                });

                aCols.push({
                    label: 'FreightPercentage',
                    type: EdmType.Number,
                    property: 'FreightPercentage',
                    scale: 2
                });

                aCols.push({
                    label: 'FreightExrate',
                    type: EdmType.Number,
                    property: 'FreightExrate',
                    scale: 2
                });

                aCols.push({
                    property: 'HSNCodefromCHA',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'HSNCodeSystem',
                    type: EdmType.String
                });

                aCols.push({
                    label: 'OpenPOQty',
                    type: EdmType.Number,
                    property: 'OpenPOQty',
                    scale: 2
                });

                aCols.push({
                    property: 'OverseasFrtAmtTAX1',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'OverseasFrtAmtTAX2',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'DomesticFrtAmtTAX1',
                    type: EdmType.String
                });

                aCols.push({
                    property: 'DomesticFrtAmtTAX2',
                    type: EdmType.String
                });
    
                return aCols;
            },
    
            onExport: function() {
                var aCols, oRowBinding, oSettings, oSheet, oTable;
    
                if (!this._oTable) {
                    this._oTable = this.byId('idInvoicePostingTable');
                }
    
                oTable = this._oTable;
                oRowBinding = oTable.getBinding('rows');
                aCols = this.createColumnConfig();
    
                oSettings = {
                    workbook: {
                        columns: aCols,
                        hierarchyLevel: 'Level'
                    },
                    dataSource: oRowBinding,
                    fileName: 'Table export sample.xlsx',
                    worker: false // We need to disable worker because we are using a MockServer as OData Service
                };
    
                oSheet = new Spreadsheet(oSettings);
                oSheet.build().finally(function() {
                    oSheet.destroy();
                });
            },

            onDisplayLog: function () {
                this.busyDialog.open();
                const selectedHdr = "/CustomDutyHdr(" + this.transactionID + ")?$expand=to_CustomDutyLog";  // Add $expand for related entity
                this.getOwnerComponent().getModel().bindContext(selectedHdr).requestObject().then((oData) => {
                    this.busyDialog.close();
                    if (oData.to_CustomDutyLog.length > 0) {
                        this.getView().getModel("LogData").setData(oData.to_CustomDutyLog);
                        this.getView().getModel("LogData").refresh();
                        this.onOpenLogDialog();
                    } else {
                        MessageToast.show("No data found");
                    }
                }).catch((error) => {
                    this.busyDialog.close();
                    MessageToast.show(error);
                    console.error("Error loading data:", error);
                });
            },

            onDisplayValidLog: function () {
                this.busyDialog.open();
                const selectedHdr = "/CustomDutyHdr(" + this.transactionID + ")?$expand=to_ValidationLog";  // Add $expand for related entity
                this.getOwnerComponent().getModel().bindContext(selectedHdr).requestObject().then((oData) => {
                    this.busyDialog.close();
                    if (oData.to_ValidationLog.length > 0) {
                        this.getView().getModel("LogData").setData(oData.to_ValidationLog);
                        this.getView().getModel("ValidLogData").setData(oData.to_ValidationLog);
                        this.getView().getModel("LogData").refresh();
                        this.onOpenLogDialog();
                    } else {
                        MessageToast.show("No data found");
                    }
                }).catch((error) => {
                    this.busyDialog.close();
                    MessageToast.show(error);
                    console.error("Error loading data:", error);
                });
            },

            onOpenLogDialog: function () {
                // Check if the dialog is already created
                if (!this.oDispLogDialog) {
                    // Load the fragment if not already created
                    this.oDispLogDialog = Fragment.load({
                        name: "customduty.ui.invoiceposting.view.fragments.DisplayLog",  // path to your fragment
                        controller: this
                    }).then(function (oFragment) {
                        // Set the fragment dialog to the current view
                        this.oDispLogDialog = oFragment;
                        this.getView().addDependent(this.oDispLogDialog);
                        this.oDispLogDialog.open();  // Open the dialog
                    }.bind(this));
                } else {
                    this.oDispLogDialog.open();
                }
            },

            onCloseLogDialog: function () {
                this.oDispLogDialog.close();  // Close the dialog
            },

            setChafileInfo: function () {
                return new Promise((resolve) => {
                    const oModel = this.getOwnerComponent().getModel();  // Assumes model is set in manifest.json
                    this.getView().setModel(oModel);
                    this.transactionID = oEvent.getParameter("arguments").transactionId;
                    var aSelectedInvoice = "/CustomDutyHdr(" + this.transactionID + ")/to_CustomDutyItem"
                    var oItemTable = this.getView().byId("idInvoicePostingTable");
                    oItemTable.bindRows({
                        path: aSelectedInvoice
                    });
                    resolve(true);
                });
            },

            setHeaderInfo: function () {
                const oStatus = this.getView().byId("idoverobjectStatus");
                var selectedHdr = "/CustomDutyHdr(" + this.transactionID + ")";
                this.getOwnerComponent().getModel().bindContext(selectedHdr).requestObject().then((oData) => {
                    const aData = oData;
                    this.getView().getModel("ObjectStaus").setData(aData);
                    this.setModelProperty("ObjectStaus", "OverallText", aData.OverallStatus);

                    this.setModelProperty("ObjectStaus", "InvoiceNumber", aData.InvoiceNumber);
                    this.setModelProperty("ObjectStaus", "Plant", aData.Plant);
                    this.setModelProperty("ObjectStaus", "POVendor", aData.POVendor);

                    this.setModelProperty("ObjectStaus", "OverSeasVendor", aData.OverSeasVendor);
                    this.setModelProperty("ObjectStaus", "DomesticVendor", aData.DomesticVendor);
                    this.setModelProperty("ObjectStaus", "CustomVendor", aData.CustomVendor);

                    if (aData.CustomVendInvStat == 'Saved') {
                        this.setModelProperty("ObjectStaus", "CustomState", 'Information');
                    } else if (aData.CustomVendInvStat == 'Success') {
                        this.setModelProperty("ObjectStaus", "CustomState", 'Success');
                    } else if (aData.CustomVendInvStat == 'Error') {
                        this.setModelProperty("ObjectStaus", "CustomState", 'Error');
                    } else {
                        this.setModelProperty("ObjectStaus", "CustomState", 'None');
                    }

                    if (aData.DomesticVendInvStat == 'Saved') {
                        this.setModelProperty("ObjectStaus", "DomesticState", 'Information');
                    } else if (aData.DomesticVendInvStat == 'Success') {
                        this.setModelProperty("ObjectStaus", "DomesticState", 'Success');
                    } else if (aData.DomesticVendInvStat == 'Error') {
                        this.setModelProperty("ObjectStaus", "DomesticState", 'Error');
                    } else {
                        this.setModelProperty("ObjectStaus", "DomesticState", 'None');
                    }

                    if (aData.OverSeasVendInvStat == 'Saved') {
                        this.setModelProperty("ObjectStaus", "OverSeasState", 'Information');
                    } else if (aData.OverSeasVendInvStat == 'Success') {
                        this.setModelProperty("ObjectStaus", "OverSeasState", 'Success');
                    } else if (aData.OverSeasVendInvStat == 'Error') {
                        this.setModelProperty("ObjectStaus", "OverSeasState", 'Error');
                    } else {
                        this.setModelProperty("ObjectStaus", "OverSeasState", 'None');
                    }

                    if (aData.OverallStatus == 'Saved') {
                        oStatus.removeStyleClass("customObjStatusIcon");
                        this.setModelProperty("ObjectStaus", "OverallState", 'Information');
                        this.setModelProperty("ObjectStaus", "OverallIcon", 'sap-icon://information');
                    } else if (aData.OverallStatus == 'Completed') {
                        oStatus.removeStyleClass("customObjStatusIcon");
                        this.setModelProperty("ObjectStaus", "OverallState", 'Success');
                        this.setModelProperty("ObjectStaus", "OverallIcon", 'sap-icon://sys-enter-2');
                    } else if (aData.OverallStatus == 'In Progress') {
                        oStatus.addStyleClass("customObjStatusIcon");
                        this.setModelProperty("ObjectStaus", "OverallState", 'Warning');
                        this.setModelProperty("ObjectStaus", "OverallIcon", 'sap-icon://synchronize');
                        this.pollToGetLatestStaus();
                    }

                }).catch((oError) => {
                    console.error("Error fetching data:", oError);
                });
            },

            pollToGetLatestStaus: function () {
                const intervalId = setInterval(() => {
                    const oStatus = this.getView().byId("idoverobjectStatus");
                    var selectedHdr = "/CustomDutyHdr(" + this.transactionID + ")";
                    this.getOwnerComponent().getModel().bindContext(selectedHdr).requestObject().then((oData) => {
                        const aData = oData;
                        this.getView().getModel("ObjectStaus").setData(aData);
                        this.setModelProperty("ObjectStaus", "OverallText", aData.OverallStatus);
                        if (aData.OverallStatus == 'Saved') {
                            oStatus.removeStyleClass("customObjStatusIcon");
                            this.setModelProperty("ObjectStaus", "OverallState", 'Information');
                            this.setModelProperty("ObjectStaus", "OverallIcon", 'sap-icon://information');
                        } else if (aData.OverallStatus == 'Completed') {
                            oStatus.removeStyleClass("customObjStatusIcon");
                            this.setModelProperty("ObjectStaus", "OverallState", 'Success');
                            this.setModelProperty("ObjectStaus", "OverallIcon", 'sap-icon://sys-enter-2');
                            this.getOwnerComponent().getModel().refresh();
                            clearInterval(intervalId);
                        } else if (aData.OverallStatus == 'In Progress') {
                            oStatus.addStyleClass("customObjStatusIcon");
                            this.setModelProperty("ObjectStaus", "OverallState", 'Warning');
                            this.setModelProperty("ObjectStaus", "OverallIcon", 'sap-icon://synchronize');
                        }

                        this.setModelProperty("ObjectStaus", "InvoiceNumber", aData.InvoiceNumber);
                        this.setModelProperty("ObjectStaus", "Plant", aData.Plant);
                        this.setModelProperty("ObjectStaus", "POVendor", aData.POVendor);

                        this.setModelProperty("ObjectStaus", "OverSeasVendor", aData.OverSeasVendor);
                        this.setModelProperty("ObjectStaus", "DomesticVendor", aData.DomesticVendor);
                        this.setModelProperty("ObjectStaus", "CustomVendor", aData.CustomVendor);

                        if (aData.CustomVendInvStat == 'Saved') {
                            this.setModelProperty("ObjectStaus", "CustomState", 'Information');
                        } else if (aData.CustomVendInvStat == 'Success') {
                            this.setModelProperty("ObjectStaus", "CustomState", 'Success');
                        } else if (aData.CustomVendInvStat == 'Error') {
                            this.setModelProperty("ObjectStaus", "CustomState", 'Error');
                        } else {
                            this.setModelProperty("ObjectStaus", "CustomState", 'None');
                        }

                        if (aData.DomesticVendInvStat == 'Saved') {
                            this.setModelProperty("ObjectStaus", "DomesticState", 'Information');
                        } else if (aData.DomesticVendInvStat == 'Success') {
                            this.setModelProperty("ObjectStaus", "DomesticState", 'Success');
                        } else if (aData.DomesticVendInvStat == 'Error') {
                            this.setModelProperty("ObjectStaus", "DomesticState", 'Error');
                        } else {
                            this.setModelProperty("ObjectStaus", "DomesticState", 'None');
                        }

                        if (aData.OverSeasVendInvStat == 'Saved') {
                            this.setModelProperty("ObjectStaus", "OverSeasState", 'Information');
                        } else if (aData.OverSeasVendInvStat == 'Success') {
                            this.setModelProperty("ObjectStaus", "OverSeasState", 'Success');
                        } else if (aData.OverSeasVendInvStat == 'Error') {
                            this.setModelProperty("ObjectStaus", "OverSeasState", 'Error');
                        } else {
                            this.setModelProperty("ObjectStaus", "OverSeasState", 'None');
                        }

                    }).catch((oError) => {
                        console.error("Error fetching data:", oError);
                    });
                }, 5000); // Poll every 5 seconds
            },
            onPersoButtonPress: function (oEvent) {
                this.getPersoController(this, "idInvoicePostingTable").openDialog({});
            },
            handlePopoverPress: function (oEvent) {
                this.oMessageView.navigateBack();
                this._oPopover.openBy(oEvent.getSource());
            },

            // Function to show the confirmation dialog
            showDeleteConfirmationDialog: function () {
                return new Promise((resolve) => {
                    // Create the dialog
                    const oDialog = new sap.m.Dialog({
                        title: "Confirmation",
                        type: sap.m.DialogType.Message,
                        content: new sap.m.Text({ text: "Do you want to delete data?" }),
                        beginButton: new sap.m.Button({
                            text: "Yes",
                            press: function () {
                                // Action for Yes button                                
                                oDialog.close();
                                resolve(true); // Resolve the promise with true
                            }
                        }),
                        endButton: new sap.m.Button({
                            text: "No",
                            press: function () {
                                // Action for No button
                                sap.m.MessageToast.show("Action cancelled.");
                                oDialog.close();
                                resolve(false); // Resolve the promise with false
                            }
                        }),
                        afterClose: function () {
                            oDialog.destroy(); // Clean up the dialog after closing
                        }
                    });

                    // Open the dialog
                    oDialog.open();
                });
            },

            onDeleteCustomData: function () {
                this.showDeleteConfirmationDialog().then((toProceed) => {
                    if (toProceed) {
                        //Delete Data
                        this.busyDialog.open();
                        const oModel = this.getView().getModel();
                        const deleteDuty = oModel.bindContext("/DeleteCustomDuty(...)");
                        deleteDuty.setParameter("ID", this.transactionID);
                        deleteDuty.execute().then(() => {
                            const sResponseDuty = deleteDuty.getBoundContext().getObject();
                            if (sResponseDuty.value == true) {
                                MessageToast.show("Deleted Successfully");

                                const history = History.getInstance();
                                const previousHash = history.getPreviousHash();

                                if (previousHash !== undefined) {
                                    window.history.go(-1);
                                } else {
                                    const oRouter = this.getOwnerComponent().getRouter()
                                    oRouter.navTo("SelectionScreen");
                                }

                            }
                            this.busyDialog.close();
                        }).catch((oError) => {
                            MessageToast.show(oError);
                            this.busyDialog.close();
                        });
                    }
                });
            },

            handleInvoicePosting: function () {
                this.busyDialog.open();
                const selectedHdr = "/CustomDutyHdr(" + this.transactionID + ")?$expand=to_ValidationLog";  // Add $expand for related entity
                this.getOwnerComponent().getModel().bindContext(selectedHdr).requestObject().then((oData) => {
                    this.busyDialog.close();
                    var validationError = '';
                    if (oData.to_ValidationLog.length > 0) {
                        var validationLog = oData.to_ValidationLog;
                        const errorItem = validationLog.find(item => item.type === 'Error');
                        if (errorItem) {
                            validationError = 'X';
                        }
                    }                    
                    if (validationError) {
                        MessageBox.error("Validation errors found. Please check log for details");
                    } else {
                        //Save Data
                        this.busyDialog.open();
                        const oModel = this.getOwnerComponent().getModel();
                        const InvoicePOST = oModel.bindContext("/PostInvoice(...)");
                        InvoicePOST.setParameter("ID", this.transactionID);
                        InvoicePOST.execute().then(() => {
                            this.busyDialog.close();
                            this.setHeaderInfo();
                            this.pollToGetLatestStaus();
                        }).catch((error) => {
                            //const oMessage = error.message, sResponse = invoicePosting.getBoundContext().getObject(),
                            //MessageModel = this.getView().getModel("MessageModel").getData();
                            MessageToast.show(error);
                            this.busyDialog.close();
                        }, this);
                    }

                }).catch((error) => {
                    this.busyDialog.close();
                    MessageToast.show(error);
                    console.error("Error loading data:", error);
                });
            },

            handleInvoicePosting1: function () {
                const postingModelData = this.getView().getModel("InvoicePostingModel").getData(),
                    FieldMappings = this.getOwnerComponent().getModel("FieldMappings"),
                    oModel = this.getView().getModel(),
                    invoicePosting = oModel.bindContext("/PostSupplierInvoice(...)", undefined, {
                        $$groupId: "InvoicePostingGroup"
                    }),
                    oDateFormat = DateFormat.getDateInstance({
                        pattern: "yyyy-MM-dd"
                    }), sInvoices = [], invoiceVendors = [], invoiceObjects = [],
                    invoiceType = ["Custom", "OverseasFreight", "DomesticFreight", "AdditionalFrieght", "Misc"];
                this.busyDialog.open();
                postingModelData.forEach((element) => {
                    const invoiceNumber = element.InvoiceNumber;
                    if (!sInvoices.includes(invoiceNumber)) {
                        sInvoices.push(element.InvoiceNumber);
                        const oPayloadHeaderObject = {
                            "BENo": element.BENo,
                            "InvoiceNumber": element.InvoiceNumber,
                            "SupplierInvoice": "",
                            "Status": "",
                            "Message": "",
                            "FiscalYear": new Date().getFullYear().toString(),
                            "CompanyCode": "IN10",
                            "DocumentDate": oDateFormat.format(new Date()),
                            "PostingDate": oDateFormat.format(new Date()),
                            "DocumentCurrency": "INR",
                            "BusinessPlace": "MH01",
                            "TaxDeterminationDate": oDateFormat.format(new Date()),
                            "TaxReportingDate": oDateFormat.format(new Date()),
                            "TaxFulfillmentDate": oDateFormat.format(new Date())
                        }, oPayloadItemObject = {
                            "SupplierInvoiceItem": "1",
                            "PurchaseOrder": element.PurchaseOrder,
                            "PurchaseOrderItem": element.PurchaseorderItem.toString(),
                            "Plant": FieldMappings.getData().SelectionFields.Plant,
                            "TaxCode": "K1",
                            "DocumentCurrency": "INR",
                            "PurchaseOrderQuantityUnit": element.Unit,
                            "QuantityInPurchaseOrderUnit": element.Quantity,
                            "PurchaseOrderPriceUnit": element.Unit,
                            "QtyInPurchaseOrderPriceUnit": element.Quantity,
                            "SuplrInvcDeliveryCostCndnType": "",
                            "TaxDeterminationDate": oDateFormat.format(new Date())
                        };
                        invoiceType.forEach((sType) => {
                            const aHeaderObjectkeys = Object.keys(oPayloadHeaderObject),
                                aItemObjectKeys = Object.keys(oPayloadItemObject);
                            if (sType === "Custom") {
                                let oCustomVendor = {};
                                aHeaderObjectkeys.forEach((sHeaderKey) => {
                                    oCustomVendor[sHeaderKey] = oPayloadHeaderObject[sHeaderKey];
                                });
                                oCustomVendor.to_SuplrInvcItemPurOrdRef = [{}];
                                aItemObjectKeys.forEach((sItemKey) => {
                                    oCustomVendor.to_SuplrInvcItemPurOrdRef[0][sItemKey] = oPayloadItemObject[sItemKey];
                                });
                                oCustomVendor.SupplierInvoiceIDByInvcgParty = element.BENo;
                                oCustomVendor.InvoiceGrossAmount = element.BCDAmount;
                                oCustomVendor.InvoicingParty = element.CustomInvoiceVendor;
                                oCustomVendor.to_SuplrInvcItemPurOrdRef[0].SupplierInvoiceItemAmount = element.BCDAmount;
                                oCustomVendor.to_SuplrInvcItemPurOrdRef[0].SuplrInvcDeliveryCostCndnType = "JCDB";
                                oCustomVendor.to_SuplrInvcItemPurOrdRef[0].FreightSupplier = element.CustomInvoiceVendor;
                                //oCustomVendor.to_SuplrInvcItemPurOrdRef[0].IN_CustomDutyAssessableValue = element.AssessableValue;
                                invoiceObjects.push(oCustomVendor);
                            } if (sType === "OverseasFreight") {
                                let oOverseasVendor = {};
                                aHeaderObjectkeys.forEach((sHeaderKey) => {
                                    oOverseasVendor[sHeaderKey] = oPayloadHeaderObject[sHeaderKey];
                                });
                                oOverseasVendor.to_SuplrInvcItemPurOrdRef = [{}];
                                aItemObjectKeys.forEach((sItemKey) => {
                                    oOverseasVendor.to_SuplrInvcItemPurOrdRef[0][sItemKey] = oPayloadItemObject[sItemKey];
                                });
                                oOverseasVendor.SupplierInvoiceIDByInvcgParty = element.BENo;
                                oOverseasVendor.InvoiceGrossAmount = element.OverFreightperitem;
                                oOverseasVendor.InvoicingParty = element.OverFreightVendor;
                                oOverseasVendor.to_SuplrInvcItemPurOrdRef[0]["SupplierInvoiceItemAmount"] = element.OverFreightperitem;
                                oOverseasVendor.to_SuplrInvcItemPurOrdRef[0].SuplrInvcDeliveryCostCndnType = "ZFR2";
                                oOverseasVendor.to_SuplrInvcItemPurOrdRef[0]["FreightSupplier"] = element.OverFreightVendor;
                                invoiceObjects.push(oOverseasVendor);
                            } if (sType === "DomesticFreight") {
                                let oDomesticVendor = {};
                                aHeaderObjectkeys.forEach((sHeaderKey) => {
                                    oDomesticVendor[sHeaderKey] = oPayloadHeaderObject[sHeaderKey];
                                });
                                oDomesticVendor.to_SuplrInvcItemPurOrdRef = [{}];
                                aItemObjectKeys.forEach((sItemKey) => {
                                    oDomesticVendor.to_SuplrInvcItemPurOrdRef[0][sItemKey] = oPayloadItemObject[sItemKey];
                                });
                                oDomesticVendor.SupplierInvoiceIDByInvcgParty = element.BENo;
                                oDomesticVendor.InvoiceGrossAmount = element.DomesticFreightperitem;
                                oDomesticVendor.InvoicingParty = element.DomFreightVendor;
                                oDomesticVendor.to_SuplrInvcItemPurOrdRef[0]["SupplierInvoiceItemAmount"] = element.DomesticFreightperitem;
                                oDomesticVendor.to_SuplrInvcItemPurOrdRef[0].SuplrInvcDeliveryCostCndnType = "ZFR1";
                                oDomesticVendor.to_SuplrInvcItemPurOrdRef[0]["FreightSupplier"] = element.DomFreightVendor;
                                invoiceObjects.push(oDomesticVendor);
                            } if (sType === "AdditionalFrieght") {
                                let oAdditionalVendor = {};
                                aHeaderObjectkeys.forEach((sHeaderKey) => {
                                    oAdditionalVendor[sHeaderKey] = oPayloadHeaderObject[sHeaderKey];
                                });
                                oAdditionalVendor.to_SuplrInvcItemPurOrdRef = [{}];
                                aItemObjectKeys.forEach((sItemKey) => {
                                    oAdditionalVendor.to_SuplrInvcItemPurOrdRef[0][sItemKey] = oPayloadItemObject[sItemKey];
                                });
                                oAdditionalVendor.SupplierInvoiceIDByInvcgParty = element.BENo;
                                oAdditionalVendor.InvoiceGrossAmount = element.Inschargesperitem;
                                oAdditionalVendor.InvoicingParty = element.InsuranceVendor;
                                oAdditionalVendor.to_SuplrInvcItemPurOrdRef[0]["SupplierInvoiceItemAmount"] = element.Inschargesperitem;
                                oAdditionalVendor.to_SuplrInvcItemPurOrdRef[0].SuplrInvcDeliveryCostCndnType = "FVA1";
                                oAdditionalVendor.to_SuplrInvcItemPurOrdRef[0]["FreightSupplier"] = element.InsuranceVendor;
                                invoiceObjects.push(oAdditionalVendor);
                            } if (sType === "Misc") {
                                let oMiscVendor = {};
                                aHeaderObjectkeys.forEach((sHeaderKey) => {
                                    oMiscVendor[sHeaderKey] = oPayloadHeaderObject[sHeaderKey];
                                });
                                oMiscVendor.to_SuplrInvcItemPurOrdRef = [{}];
                                aItemObjectKeys.forEach((sItemKey) => {
                                    oMiscVendor.to_SuplrInvcItemPurOrdRef[0][sItemKey] = oPayloadItemObject[sItemKey];
                                });
                                oMiscVendor.SupplierInvoiceIDByInvcgParty = element.BENo;
                                oMiscVendor.InvoiceGrossAmount = element.Miscchargesperitem;
                                oMiscVendor.InvoicingParty = element.MiscChargesVen;
                                oMiscVendor.to_SuplrInvcItemPurOrdRef[0]["SupplierInvoiceItemAmount"] = element.Miscchargesperitem;
                                oMiscVendor.to_SuplrInvcItemPurOrdRef[0].SuplrInvcDeliveryCostCndnType = "ZMIS";
                                oMiscVendor.to_SuplrInvcItemPurOrdRef[0]["FreightSupplier"] = element.MiscChargesVen;
                                invoiceObjects.push(oMiscVendor);
                            }
                        })

                    } else {
                        invoiceObjects.forEach((sObject) => {
                            if (invoiceNumber === sObject.InvoiceNumber) {
                                const oSubObject = {
                                    "SupplierInvoiceItem": "",
                                    "PurchaseOrder": element.PurchaseOrder,
                                    "PurchaseOrderItem": element.PurchaseorderItem.toString(),
                                    "Plant": FieldMappings.getData().SelectionFields.Plant,
                                    "TaxCode": "K1",
                                    "DocumentCurrency": "INR",
                                    "SupplierInvoiceItemAmount": "",
                                    "PurchaseOrderQuantityUnit": element.Unit,
                                    "QuantityInPurchaseOrderUnit": element.Quantity,
                                    "PurchaseOrderPriceUnit": element.Unit,
                                    "QtyInPurchaseOrderPriceUnit": element.Quantity,
                                    "SuplrInvcDeliveryCostCndnType": "ZFR1",
                                    "FreightSupplier": "",
                                    "TaxDeterminationDate": oDateFormat.format(new Date())
                                },
                                    aSubItemObjectKeys = Object.keys(oSubObject);
                                if (element.CustomInvoiceVendor === sObject.InvoicingParty) {
                                    sObject.InvoiceGrossAmount = sObject.InvoiceGrossAmount + element.BCDAmount;
                                    let existingObjects = sObject.to_SuplrInvcItemPurOrdRef,
                                        oSubCustomVendor = {};
                                    aSubItemObjectKeys.forEach((sItemKey) => {
                                        oSubCustomVendor[sItemKey] = oSubObject[sItemKey];
                                    });
                                    oSubCustomVendor.SupplierInvoiceItem = (existingObjects.length + 1).toString();
                                    oSubCustomVendor.FreightSupplier = element.CustomInvoiceVendor;
                                    oSubCustomVendor.SupplierInvoiceItemAmount = element.BCDAmount;
                                    oSubCustomVendor.SuplrInvcDeliveryCostCndnType = "JCDB";
                                    sObject.to_SuplrInvcItemPurOrdRef.push(oSubCustomVendor);
                                }
                                if (element.OverFreightVendor === sObject.InvoicingParty) {
                                    sObject.InvoiceGrossAmount = sObject.InvoiceGrossAmount + element.OverFreightperitem;
                                    let existingObjects = sObject.to_SuplrInvcItemPurOrdRef,
                                        oSubOverseasVendorObject = {};
                                    aSubItemObjectKeys.forEach((sItemKey) => {
                                        oSubOverseasVendorObject[sItemKey] = oSubObject[sItemKey];
                                    });
                                    oSubOverseasVendorObject.SupplierInvoiceItem = (existingObjects.length + 1).toString();
                                    oSubOverseasVendorObject.FreightSupplier = element.OverFreightVendor;
                                    oSubOverseasVendorObject.SupplierInvoiceItemAmount = element.OverFreightperitem;
                                    oSubOverseasVendorObject.SuplrInvcDeliveryCostCndnType = "ZFR2";
                                    sObject.to_SuplrInvcItemPurOrdRef.push(oSubOverseasVendorObject);
                                }
                                if (element.DomFreightVendor === sObject.InvoicingParty) {
                                    sObject.InvoiceGrossAmount = sObject.InvoiceGrossAmount + element.DomesticFreightperitem;
                                    const existingObjects = sObject.to_SuplrInvcItemPurOrdRef,
                                        oSubDomesticVendorObject = {};
                                    aSubItemObjectKeys.forEach((sItemKey) => {
                                        oSubDomesticVendorObject[sItemKey] = oSubObject[sItemKey];
                                    });
                                    oSubDomesticVendorObject.SupplierInvoiceItem = (existingObjects.length + 1).toString();
                                    oSubDomesticVendorObject.FreightSupplier = element.DomFreightVendor;
                                    oSubDomesticVendorObject.SupplierInvoiceItemAmount = element.DomesticFreightperitem;
                                    oSubDomesticVendorObject.SuplrInvcDeliveryCostCndnType = "ZFR1";
                                    sObject.to_SuplrInvcItemPurOrdRef.push(oSubDomesticVendorObject);
                                }
                                if (element.InsuranceVendor === sObject.InvoicingParty) {
                                    sObject.InvoiceGrossAmount = sObject.InvoiceGrossAmount + element.Inschargesperitem;
                                    const existingObjects = sObject.to_SuplrInvcItemPurOrdRef,
                                        oSubAddInvVendorOject = {};
                                    aSubItemObjectKeys.forEach((sItemKey) => {
                                        oSubAddInvVendorOject[sItemKey] = oSubObject[sItemKey];
                                    });
                                    oSubAddInvVendorOject.SupplierInvoiceItem = (existingObjects.length + 1).toString();
                                    oSubAddInvVendorOject.FreightSupplier = element.InsuranceVendor;
                                    oSubAddInvVendorOject.SupplierInvoiceItemAmount = element.Inschargesperitem;
                                    oSubAddInvVendorOject.SuplrInvcDeliveryCostCndnType = "FVA1";
                                    sObject.to_SuplrInvcItemPurOrdRef.push(oSubAddInvVendorOject);
                                }
                                if (element.MiscChargesVen === sObject.InvoicingParty) {
                                    sObject.InvoiceGrossAmount = sObject.InvoiceGrossAmount + element.Miscchargesperitem;
                                    const existingObjects = sObject.to_SuplrInvcItemPurOrdRef,
                                        oSubMiscInvoiceObject = {};
                                    aSubItemObjectKeys.forEach((sItemKey) => {
                                        oSubMiscInvoiceObject[sItemKey] = oSubObject[sItemKey];
                                    });
                                    oSubMiscInvoiceObject.SupplierInvoiceItem = (existingObjects.length + 1).toString();
                                    oSubMiscInvoiceObject.FreightSupplier = element.MiscChargesVen;
                                    oSubMiscInvoiceObject.SupplierInvoiceItemAmount = element.Miscchargesperitem;
                                    oSubMiscInvoiceObject.SuplrInvcDeliveryCostCndnType = "ZMIS";
                                    sObject.to_SuplrInvcItemPurOrdRef.push(oSubMiscInvoiceObject);
                                }
                            }
                        })
                    }
                });
                invoicePosting.setParameter("InvoiceData", invoiceObjects);
                invoicePosting.execute();

                //const createPromise = new Promise(function(resolved,rejected){
                oModel.submitBatch("InvoicePostingGroup")
                    .then((response) => {
                        const oResponse = invoicePosting.getBoundContext().getObject(),
                            MessageModel = this.getView().getModel("MessageModel").getData();
                        if (oResponse.value.length > 0) {
                            oResponse.value.forEach((oInvoiceObject) => {
                                if (oInvoiceObject.Status === "Error") {
                                    const errorObject = {
                                        type: "Error",
                                        title: "Error Message",
                                        subtitle: oInvoiceObject.InvoicingParty,
                                        description: oInvoiceObject.Message
                                    };
                                    MessageModel.messages.push(errorObject);
                                }
                            });
                            MessageModel.messagesLength = MessageModel.messages.length;
                            this.getView().getModel("MessageModel").refresh(true);
                        }
                        this.busyDialog.close();
                        //resolved();
                    }, this).catch((error) => {
                        const oMessage = error.message, sResponse = invoicePosting.getBoundContext().getObject(),
                            MessageModel = this.getView().getModel("MessageModel").getData();
                        if (sResponse.value.length > 0) {
                            sResponse.value.forEach((oInvoiceObject) => {
                                if (oInvoiceObject.Status === "Error") {
                                    const errorObject = {
                                        type: "Error",
                                        title: "Error Message",
                                        subtitle: oInvoiceObject.InvoicingParty,
                                        description: oInvoiceObject.Message
                                    };
                                    MessageModel.messages.push(errorObject);
                                }
                            });
                            MessageModel.messagesLength = MessageModel.messages.length;
                            this.getView().getModel("MessageModel").refresh(true);
                        }
                        MessageModel.messages.push(errorObject);
                        MessageModel.messagesLength = MessageModel.messages.length;
                        this.getView().getModel("MessageModel").refresh(true);
                        this.busyDialog.close();
                        //rejected();
                    }, this);
                //}).bind(this)

            }
        });
    });
