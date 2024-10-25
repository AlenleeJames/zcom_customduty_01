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
                    invoicePosting = oModel.bindContext("/PostSupplierInvoice(...)"),
                    oDateFormat = DateFormat.getDateInstance({
                        pattern: "yyyy-MM-dd"
                    }), sInvoices = [], invoiceObjects = [];
                this.busyDialog.open();
                postingModelData.forEach((element) => {
                    const invoiceParty = element.OverFreightVendor;
                    if (!sInvoices.includes(invoiceParty)) {
                        sInvoices.push(element.OverFreightVendor);
                        const oPayloadObject = {
                            "FiscalYear": new Date().getFullYear().toString(),
                            "CompanyCode": "IN10",
                            "DocumentDate": oDateFormat.format(new Date()),
                            "PostingDate": oDateFormat.format(new Date()),
                            "SupplierInvoiceIDByInvcgParty": "FREIGHT",
                            "InvoicingParty": element.OverFreightVendor,
                            "DocumentCurrency": "INR",
                            "InvoiceGrossAmount": element.OverFreightperitem,
                            "BusinessPlace": "MH01",
                            "TaxDeterminationDate": oDateFormat.format(new Date()),
                            "TaxReportingDate": oDateFormat.format(new Date()),
                            "TaxFulfillmentDate": oDateFormat.format(new Date()),
                            "to_SuplrInvcItemPurOrdRef": [
                                {
                                    "SupplierInvoiceItem": "1",
                                    "PurchaseOrder": element.PurchaseOrder,
                                    "PurchaseOrderItem": element.PurchaseorderItem.toString(),
                                    "Plant": FieldMappings.getData().SelectionFields.Plant,
                                    "TaxCode": "K1",
                                    "DocumentCurrency": "INR",
                                    "SupplierInvoiceItemAmount": element.OverFreightperitem,
                                    "PurchaseOrderQuantityUnit": element.Unit,
                                    "QuantityInPurchaseOrderUnit": element.Quantity,
                                    "PurchaseOrderPriceUnit": element.Unit,
                                    "QtyInPurchaseOrderPriceUnit": element.Quantity,
                                    "SuplrInvcDeliveryCostCndnType": "ZFR1",
                                    "FreightSupplier": element.OverFreightVendor,
                                    "TaxDeterminationDate": oDateFormat.format(new Date())
                                }
                            ]
                        };
                        invoiceObjects.push(oPayloadObject);
                    } else {
                        invoiceObjects.forEach((sObject) => {
                            if (invoiceParty === sObject.InvoicingParty) {
                                sObject.InvoiceGrossAmount = sObject.InvoiceGrossAmount + element.OverFreightperitem;
                                const existingObjects = sObject.to_SuplrInvcItemPurOrdRef;
                                sObject.to_SuplrInvcItemPurOrdRef.push(
                                    {
                                        "SupplierInvoiceItem": (existingObjects.length + 1).toString(),
                                        "PurchaseOrder": element.PurchaseOrder,
                                        "PurchaseOrderItem": element.PurchaseorderItem.toString(),
                                        "Plant": FieldMappings.getData().SelectionFields.Plant,
                                        "TaxCode": "K1",
                                        "DocumentCurrency": "INR",
                                        "SupplierInvoiceItemAmount": element.OverFreightperitem,
                                        "PurchaseOrderQuantityUnit": element.Unit,
                                        "QuantityInPurchaseOrderUnit": element.Quantity,
                                        "PurchaseOrderPriceUnit": element.Unit,
                                        "QtyInPurchaseOrderPriceUnit": element.Quantity,
                                        "SuplrInvcDeliveryCostCndnType": "ZFR1",
                                        "FreightSupplier": element.OverFreightVendor,
                                        "TaxDeterminationDate": oDateFormat.format(new Date())
                                    }
                                )
                            }
                        })
                    }
                });
                invoicePosting.setParameter("InvoiceData", invoiceObjects[0]);
                invoicePosting.execute().then(() => {
                    const sResponse = invoicePosting.getBoundContext().getObject();
                    this.busyDialog.close();
                }).catch((error) => {
                    const oMessage = error.message, sResponse = invoicePosting.getBoundContext().getObject(),
                        MessageModel = this.getView().getModel("MessageModel").getData(),
                        errorObject = {
                            type: "Error",
                            title: "Error Message",
                            subtitle: "Overfrieght Invoice Generation",
                            description: oMessage
                        };
                    MessageModel.messages.push(errorObject);
                    MessageModel.messagesLength = MessageModel.messages.length;
                    this.getView().getModel("MessageModel").refresh(true);
                    this.busyDialog.close();
                });
            }
        });
    });
