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
    'sap/m/Popover'
],
    function (BaseController, JSONModel, BusyDialog, MessageItem, MessageView, Button, DateFormat, NumberFormat, Bar, Title, Popover) {
        "use strict";

        return BaseController.extend("customduty.ui.invoiceposting.controller.InvoicePosting", {

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
                this.getOwnerComponent().getRouter().getRoute("InvoicePosting").attachMatched(this.onRouteMatched, this);
            },

            onRouteMatched: function () {
                const finalModel = sap.ui.getCore().getModel("FinalModel"),
                    MessageModel = this.getView().getModel("MessageModel");
                if (finalModel) {
                    this.getView().setModel(finalModel, "InvoicePostingModel");
                    this.getView().getModel("InvoicePostingModel").refresh(true);
                }
                MessageModel.setData({
                    messagesLength: 0,
                    messages: []
                })

            },
            onPersoButtonPress: function (oEvent) {
                this.getPersoController(this, "idInvoicePostingTable").openDialog({});
            },
            handlePopoverPress: function (oEvent) {
                this.oMessageView.navigateBack();
                this._oPopover.openBy(oEvent.getSource());
            },
            handleInvoicePosting: function () {
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
