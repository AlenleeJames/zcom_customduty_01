sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/BusyDialog",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Token",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/format/NumberFormat"
],
    function (BaseController, JSONModel, BusyDialog, Filter, FilterOperator, Token, MessageToast, MessageBox, DateFormat, NumberFormat) {
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
            /* 
                fn to initialize Multi input token validator
            */
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
                    OverseasVendorValue = this.byId("idSSVOverseasVendorInput").getValue(),
                    defaultObject = {
                        "LocalFreightAmount": "",
                        "InsuranceAmount": "",
                        "OverseasFreightAmount": "",
                        "MiscAmount": "",
                        "ForeignCurrency": "",
                        "ExchangeRate": "",
                        "OverseasFreightVendor": OverseasVendorValue,
                        "POVendor": POVendorValue,
                        "OverseasFreightVendorEditable": OverseasVendorValue.length > 0 ? false : true,
                        "POVendorEditable": POVendorValue.length > 0 ? false : true,
                        "LocalFreightAmountVS": "None",
                        "InsuranceAmountVS": "None",
                        "OverseasFreightAmountVS": "None",
                        "MiscAmountVS": "None",
                        "ForeignCurrencyVS": "None",
                        "ExchangeRateVS": "None",
                        "OverseasFreightVendorVS": "None",
                        "POVendorVS": "None"
                    },
                    uniqInvoices = [], invoiceList = [];
                if (BETokens.length > 0) {
                    BETokens.forEach((BENumber) => {
                        excelData.forEach((sItem) => {
                            const chaObjectKeys = Object.keys(sItem);
                            let selObject = {};
                            if (BENumber.getKey() === sItem[chaObjectKeys[1]].toString())
                                if (!uniqInvoices.includes(sItem[chaObjectKeys[8]].toString())) {
                                    uniqInvoices.push(sItem[chaObjectKeys[8]].toString());
                                    selObject.InvoiceId = sItem[chaObjectKeys[8]].toString();
                                    Object.keys(defaultObject).forEach((defObject) => {
                                        selObject[defObject] = defaultObject[defObject];
                                    })
                                    invoiceList.push(selObject);
                                }
                        });
                    });
                    if (uniqInvoices.length === 0)
                        MessageToast.show("No Data matched for provided BE Numbers");
                } else {
                    excelData.forEach((sItem) => {
                        const chaObjectKeys = Object.keys(sItem);
                        let selObject = {};
                        if (!uniqInvoices.includes(sItem[chaObjectKeys[8]].toString())) {
                            uniqInvoices.push(sItem[chaObjectKeys[8]].toString());
                            selObject.InvoiceId = sItem[chaObjectKeys[8]].toString();
                            Object.keys(defaultObject).forEach((defObject) => {
                                selObject[defObject] = defaultObject[defObject];
                            });
                            invoiceList.push(selObject);
                        }
                    });
                }
                uniqInvoices.length > 0 ? this.byId("idValidateBtn").setEnabled(true) : this.byId("idValidateBtn").setEnabled(false);
                this.getView().getModel("InvoiceModel").setData(invoiceList);
                this.getView().getModel("InvoiceModel").refresh(true);
            },
            /* 
                fn to read all chaFile data and store in local model
            */
            constructChaFileModel: function (excelData) {
                const chaFileData = [], fieldErrors = [],
                    fieldMappingData = this.getView().getModel("FieldMappings").getData().ChaFileFields;
                excelData.forEach((oRecord) => {
                    const ObjectKeys = Object.keys(oRecord),
                        chaFileObject = {};
                    fieldMappingData.forEach((mappingObject) => {
                        let sValue = "";
                        if (mappingObject.Position !== null)
                            sValue = oRecord[ObjectKeys[mappingObject.Position]];
                        if (mappingObject.Type === "Date") {
                            const calDays = Math.floor(sValue - 25569), oDateFormat = DateFormat.getDateInstance({
                                pattern: "yyyy-MM-dd"
                            });
                            if (isNaN(calDays)) {
                                const sDate = new Date(sValue);
                                if (isNaN(sDate.getTime()))
                                    fieldErrors.push(mappingObject.ColumnName);
                                else
                                    chaFileObject[mappingObject.Property] = oDateFormat.format(sDate);
                            } else
                                chaFileObject[mappingObject.Property] = oDateFormat.format(new Date(calDays * 86400 * 1000));
                        } else if (mappingObject.Type === "Decimal") {
                            if (mappingObject.Scale === 0) {
                                chaFileObject[mappingObject.Property] = isNaN(parseInt(sValue)) ? 0 : parseInt(sValue);
                            } else {
                                const oNumberFormat = NumberFormat.getFloatInstance({
                                    minFractionDigits: 1, maxFractionDigits: 3
                                }), formattedValue = oNumberFormat.format(sValue.toString());
                                chaFileObject[mappingObject.Property] = isNaN(Number(formattedValue.replaceAll(",", ""))) ? 0 : Number(formattedValue.replaceAll(",", ""));
                            }
                        } else
                            chaFileObject[mappingObject.Property] = sValue.toString();
                    });
                    chaFileData.push(chaFileObject);
                });
                if (fieldErrors.length > 0) {
                    const columns = fieldErrors.join(" , ");
                    MessageBox.error("Please enter correct format values for the columns " + fieldErrors + " and Re-upload again");
                    this.getView().getModel("ChaFileModel").setData([]);
                    this.byId("idValidateBtn").setEnabled(false);
                }
                else
                    this.getView().getModel("ChaFileModel").setData(chaFileData);
            },

            /* 
                fn to set value for input fields via suggestion selection
            */
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
            /* 
                fn to read and display valuehelp dialog for input fields
            */
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
            /* 
                fn to read s4 data and update PO, PO item number and hsn code system values
            */
            onValidateInvoiceModel: function () {
                const oModel = this.getView().getModel(),
                    sInputIds = ["idSSVPlantInput", "idSSVPOVendorInput", "idSSVCustomVendortInput", "idSSVOverseasVendorInput", "idSSVLocalVendortInput", "idSSVInsuranceVendortInput"],
                    sFilters = [],
                    chaFileData = this.getView().getModel("ChaFileModel").getData();
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
                        });
                        chaFileData.forEach((chaFileRecord) => {
                            const chaFileMaterial = chaFileRecord.Material;
                            CustInvData.forEach((MMCustDutyRecord) => {
                                if (chaFileMaterial === MMCustDutyRecord.Material) {
                                    chaFileRecord.PurchaseOrder = MMCustDutyRecord.PurchaseorderNumber;
                                    chaFileRecord.PurchaseorderItem = isNaN(Number(MMCustDutyRecord.POItemNumber)) ? 0 : Number(MMCustDutyRecord.POItemNumber);
                                    chaFileRecord.HSNCodeSystem = MMCustDutyRecord.HSNCode;
                                }
                            });
                        })
                        this.getView().getModel("ChaFileModel").refresh(true);
                        this.byId("idProceedToInvoicePosting").setEnabled(true);
                    } else
                        MessageBox.information("No data matched for the provided values")
                    this.busyDialog.close();
                });
            },
            /* 
                fn to construct final output data to send for calcualtion and on success
                send to output screen for displaying data in table
            */
            onProceedToInvoicePostingScreen: function () {
                const FieldMappings = this.getOwnerComponent().getModel("FieldMappings"),
                    oRouter = this.getOwnerComponent().getRouter(),
                    toContinue = this.validateInvoiceTableFields();
                this.busyDialog.open();
                if (toContinue) {
                    const sObjects = [], finalData = new JSONModel(),
                        oModel = this.getView().getModel(),
                        calculateDutyContext = oModel.bindContext("/calculateDuty(...)"),
                        chaFileData = this.getView().getModel("ChaFileModel").getData(),
                        invoiceTableData = this.getView().getModel("InvoiceModel").getData();
                    chaFileData.forEach((chaFileRecord) => {
                        const chaFileInvoice = chaFileRecord.InvoiceNumber;
                        invoiceTableData.forEach((invoiceRecord) => {
                            if (chaFileInvoice === invoiceRecord.InvoiceId) {
                                chaFileRecord.DomesticFreightAmount = Number(invoiceRecord.LocalFreightAmount);
                                chaFileRecord.InsuranceAmount = Number(invoiceRecord.InsuranceAmount);
                                chaFileRecord.OverseasFreightAmount = Number(invoiceRecord.OverseasFreightAmount);
                                chaFileRecord.MiscCharges = Number(invoiceRecord.MiscAmount);
                                chaFileRecord.FreightCurrency_code = invoiceRecord.ForeignCurrency;
                                chaFileRecord.FreightExrate = Number(invoiceRecord.ExchangeRate);
                                chaFileRecord.OverFreightVendor = invoiceRecord.OverseasFreightVendor;
                                chaFileRecord.InsuranceVendor = invoiceRecord.POVendor;
                                sObjects.push(chaFileRecord);
                            }
                        })
                    });
                    if (sObjects.length > 0) {
                        // Setting the Plant anf Po Number for Upload result File header
                        FieldMappings.getData().SelectionFields.Plant = this.getById("idSSVPlantInput").getValue();
                        FieldMappings.getData().SelectionFields.POVendor = this.getById("idSSVPOVendorInput").getValue();
                        FieldMappings.refresh(true);
                        calculateDutyContext.setParameter("fileData", sObjects);
                        calculateDutyContext.execute().then(() => {
                            const sResponse = calculateDutyContext.getBoundContext().getObject();
                            finalData.setData(sResponse.value);
                            sap.ui.getCore().setModel(finalData, "FinalModel");
                            this.busyDialog.close();
                            oRouter.navTo("InvoicePosting");
                        });
                    }

                } else {
                    MessageToast.show("Please Fill all mandatory fields");
                    this.busyDialog.close();
                }

            },
            /* 
                fn to validate all input fields from Invoice table 
            */
            validateInvoiceTableFields: function () {
                const InvoiceModel = this.getView().getModel("InvoiceModel").getData(),
                    mandFields = ["LocalFreightAmount", "InsuranceAmount", "OverseasFreightAmount", "MiscAmount", "ForeignCurrency", "ExchangeRate",
                        "OverseasFreightVendor", "POVendor"];
                let proceedToPost = true;
                // Check all mandatory values from table 
                InvoiceModel.forEach((sRecord) => {
                    mandFields.forEach((sProperty) => {
                        if (sRecord[sProperty].length === 0) {
                            sRecord[sProperty + "VS"] = "Error";
                            proceedToPost = false;
                        }
                    });
                });
                this.getView().getModel("InvoiceModel").updateBindings(true);
                return proceedToPost;
            },
            /* 
                fn to set valuestate for all input fields in Invoice table
            */
            onInvoiceTableInputChange: function (oEvent) {
                const oSoruce = oEvent.getSource(), sValue = oSoruce.getValue();
                if (sValue.length > 0)
                    oSoruce.setValueState("None");
                else
                    oSoruce.setValueState("Error");
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
                this.getView().getModel("ChaFileModel").setData([]);
                this.getView().getModel("ChaFileModel").refresh(true);
                sap.ui.getCore().getModel("FinalModel").setData([]);
                this.byId("idValidateBtn").setEnabled(false);
                this.byId("idProceedToInvoicePosting").setEnabled(false);
            },
        });
    });
