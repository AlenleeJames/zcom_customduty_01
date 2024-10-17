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

        return BaseController.extend("customduty.ui.invoiceposting.controller.SelectionScreen", {

            onInit: function () {
                //Initializing local json model for fields check
                this.getView().setModel(
                    new JSONModel({
                        isChaFileFilled: false,
                        isPlantFilled: false,
                        isCustomVendorFilled: false,
                        isLocalVendorFilled: false,
                        isInsuranceVendorFilled: false
                    }),
                    "uploadChaFileModel"
                );
                this.getView().setModel(new JSONModel([]), "InvoiceModel");
                this.getView().setModel(new JSONModel([]), "ChaFileModel");
                this.busyDialog = new BusyDialog();
            },

            onAfterRendering: function () {
                const BENumber = this.byId("idSSVBENumberMultiInput");
                // add validator
                const fnValidator = function (args) {
                    var text = args.text;
                    return new Token({ key: text, text: text });
                };
                BENumber.addValidator(fnValidator);
            },
            /* 
                fn to check input fields and update local json property value
            */
            onInputChange: function (oEvent) {
                const oSource = oEvent.getSource(),
                    sId = oSource.getId(),
                    sValue = oSource.getValue(),
                    fieldProperty = oSource.data("CHAModelProperty");
                if (sId.includes("fileUploader")) {
                    this.file = oEvent.getParameter("files")[0];
                    sValue.length > 0 ? this.setModelProperty("uploadChaFileModel", "isChaFileFilled", true)
                        : this.setModelProperty("uploadChaFileModel", "isChaFileFilled", false);
                } else {
                    if (fieldProperty !== undefined)
                        sValue.length > 0 ? this.setModelProperty("uploadChaFileModel", fieldProperty, true)
                            : this.setModelProperty("uploadChaFileModel", fieldProperty, false);
                }
                this.getView().getModel("uploadChaFileModel").refresh(true);
            },
            /* 
                fn to check input fields and update local json property value
            */
            onSubmitFile: function (e) {
                const oFileUploader = this.getView().byId("fileUploader");
                if (oFileUploader.getValue() === "") {
                    MessageToast.show("Please Choose any File");
                    return;
                }
                sap.ui.core.BusyIndicator.show(0);
                if (this.file && window.FileReader) {
                    let reader = new FileReader(), excelSheetsData = [];
                    reader.onload = (e) => {
                        // getting the array buffer excel file content
                        let xlsx_content = e.currentTarget.result;

                        let workbook = XLSX.read(xlsx_content, { type: 'binary' });
                        // here reading only the excel file sheet- Sheet1
                        var excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets["Sheet1"], {
                            header: 0,
                            defval: ""
                        });

                        workbook.SheetNames.forEach(function (sheetName) {
                            // appending the excel file data to the global variable
                            excelSheetsData.push(XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]));
                        });
                        //fn to process excel data into local model for displaying unique Invoice ID data
                        this.processUniqueInvoiceData(excelData);
                        this.constructChaFileModel(excelData);
                        sap.ui.core.BusyIndicator.hide();

                    }
                    reader.readAsArrayBuffer(this.file);
                }
            },
            /* 
                fn to read excel array data and to create unique invoice list data
            */
            processUniqueInvoiceData: function (excelData) {
                const BETokens = this.byId("idSSVBENumberMultiInput").getTokens(),
                    POVendorValue = this.byId("idSSVPOVendorInput").getValue(),
                    OverseasVendorValue = this.byId("idSSVOverseasVendorInput").getValue();
                let uniqInvoices = [], invoiceList = [];
                if (BETokens.length > 0) {
                    BETokens.forEach((BENumber) => {
                        excelData.forEach((sItem) => {
                            const chaObjectKeys = Object.keys(sItem);
                            if (BENumber.getKey() === sItem[chaObjectKeys[1]].toString())
                                if (!uniqInvoices.includes(sItem[chaObjectKeys[8]].toString())) {
                                    uniqInvoices.push(sItem[chaObjectKeys[8]].toString());
                                    invoiceList.push({
                                        "InvoiceId": sItem[chaObjectKeys[8]].toString(),
                                        "TotalAmount": "",
                                        "CurrencyCode": "",
                                        "OverseasFreightAmount": "",
                                        "POVendor": POVendorValue,
                                        "ExchangeRate": "",
                                        "OverseasFreightVendor": OverseasVendorValue,
                                        "ForeignCurrency": "",
                                        "POVendorEditable": POVendorValue.length > 0 ? false : true,
                                        "OverseasFreightVendorEditable": OverseasVendorValue.length > 0 ? false : true
                                    });
                                }
                        })
                    });
                    if (uniqInvoices.length === 0)
                        sap.m.MessageToast.show("No Data matched for provided BE Numbers");
                } else {
                    excelData.forEach((sItem) => {
                        const chaObjectKeys = Object.keys(sItem);
                        if (!uniqInvoices.includes(sItem[chaObjectKeys[8]].toString())) {
                            uniqInvoices.push(sItem[chaObjectKeys[8]].toString());
                            invoiceList.push({
                                "InvoiceId": sItem[chaObjectKeys[8]].toString(),
                                "TotalAmount": "",
                                "CurrencyCode": "",
                                "OverseasFreightAmount": "",
                                "POVendor": POVendorValue,
                                "ExchangeRate": "",
                                "OverseasFreightVendor": OverseasVendorValue,
                                "ForeignCurrency": "",
                                "POVendorEditable": POVendorValue.length > 0 ? false : true,
                                "OverseasFreightVendorEditable": OverseasVendorValue.length > 0 ? false : true
                            });
                        }
                    });
                }
                uniqInvoices.length > 0 ? this.byId("idValidateBtn").setEnabled(true) : this.byId("idValidateBtn").setEnabled(false);;
                this.getView().getModel("InvoiceModel").setData(invoiceList);
                this.getView().getModel("InvoiceModel").refresh(true);
            },
            constructChaFileModel: function (excelData) {
                const chaFileData = [],
                    fieldMappingData = this.getView().getModel("FieldMappings").getData().ChaFileFields;
                excelData.forEach((oRecord) => {
                    const ObjectKeys = Object.keys(oRecord),
                        chaFileObject = {};
                    fieldMappingData.forEach((mappingObject) => {
                        chaFileObject[mappingObject.Property] = oRecord[ObjectKeys[mappingObject.Position]];
                    });
                    chaFileData.push(chaFileObject);
                })
                this.getView().getModel("ChaFileModel").setData(chaFileData);
            },
            /* 
                fn to reset all values and data in selection screen 
            */
            onClearForm: function () {

                // Clearing all the forms
                this.getById("idSSVPlantInput").setValue("");
                this.getById("idSSVBENumberMultiInput").setTokens([]);
                //this.getById("idSSVBENumberInputTo").setValue("");
                this.getById("idSSVPOVendorInput").setValue("");
                this.getById("idSSVCustomVendortInput").setValue("");
                this.getById("idSSVOverseasVendorInput").setValue("");
                this.getById("idSSVLocalVendortInput").setValue("");
                this.getById("idSSVInsuranceVendortInput").setValue("");
                this.getById("fileUploader").setValue("");
                // Setting the model for Upload Button Active or not
                this.setModelProperty("uploadChaFileModel", "isChaFileFilled", false);
                this.setModelProperty("uploadChaFileModel", "isPlantFilled", false);
                this.setModelProperty("uploadChaFileModel", "isInsuranceVendorFilled", false);
                this.setModelProperty("uploadChaFileModel", "isCustomVendorFilled", false);
                this.setModelProperty("uploadChaFileModel", "isLocalVendorFilled", false);
                this.getView().getModel("uploadChaFileModel").refresh(true);
                // Reset Excel processing data
                this.excelSheetsData = [];
                this.getView().getModel("InvoiceModel").setData([]);
                this.getView().getModel("InvoiceModel").refresh(true);
                this.byId("idValidateBtn").setEnabled(false);
                this.byId("idProceedToInvoicePosting").setEnabled(false);
            },

            onSuggestionItemSelected: function (oEvent) {
                const oSource = oEvent.getSource(),
                    sKey = oSource.getSelectedKey(),
                    sInputId = oSource.getId(),
                    fieldProperty = oEvent.getSource().data("CHAModelProperty");
                this.byId(sInputId).setValue(sKey);
                if (fieldProperty !== undefined) {
                    this.setModelProperty("uploadChaFileModel", fieldProperty, true);
                    this.getView().getModel("uploadChaFileModel").refresh(true);
                }
            },

            onInputValueHelpDialog: function (oEvent) {
                const sInputId = oEvent.getSource().getId().split("SelectionScreen--")[1],
                    ValueHelpConfig = this.getView().getModel("FieldMappings").getData().ValueHelpConfig;
                let valueHelpObject = null;
                ValueHelpConfig.forEach((sObject) => {
                    if (sObject.InputId === sInputId) {
                        valueHelpObject = sObject;
                    }
                })
                if (valueHelpObject !== null)
                    this.loadValueHelpDialog(valueHelpObject.Columns, valueHelpObject.EntityPath, this, valueHelpObject.FragmentName);
            },

            onValidateInvoiceModel: function () {
                const oModel = this.getView().getModel(),
                    sInputIds = ["idSSVPlantInput", "idSSVPOVendorInput", "idSSVCustomVendortInput", "idSSVOverseasVendorInput", "idSSVLocalVendortInput", "idSSVInsuranceVendortInput"],
                    sFilters = [];
                this.busyDialog.open();
                sInputIds.forEach((sId) => {
                    const sValue = this.getView().byId(sId).getValue(),
                        filterProperty = this.getView().byId(sId).data("FilterProperty");
                    if (sValue.length > 0) {
                        sFilters.push(new Filter(filterProperty, FilterOperator.EQ, sValue))
                    }
                });
                const CustInvMMContext = oModel.bindList("/ZA_MM_CustomDutyInvDetails").filter(sFilters);
                CustInvMMContext.requestContexts().then((sReponse) => {
                    if (sReponse.length > 0) {
                        const CustInvData = [];
                        sReponse.forEach((sContext) => {
                            CustInvData.push(sContext.getObject())
                        })
                        this.byId("idProceedToInvoicePosting").setEnabled(true);
                    }
                    this.busyDialog.close();
                });
            },
            onProceedToInvoicePostingScreen: function () {
                const FieldMappings = this.getOwnerComponent().getModel("FieldMappings"),
                    oRouter = this.getOwnerComponent().getRouter();
                // Setting the Plant anf Po Number for Upload result File header
                FieldMappings.getData().SelectionFields.Plant = this.getById("idSSVPlantInput").getValue();
                FieldMappings.getData().SelectionFields.POVendor = this.getById("idSSVPOVendorInput").getValue();
                FieldMappings.refresh(true);
                oRouter.navTo("InvoicePosting");
            }
        });
    });
