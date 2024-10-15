sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
],
    function (BaseController, JSONModel) {
        "use strict";

        return BaseController.extend("customduty.ui.invoiceposting.controller.SelectionScreen", {
            
            onInit: function () {
                //Initializing local json model for fields check
                this.getView().setModel(
                    new JSONModel({
                        isChaFileFilled: false,
                        isPlantFilled: false,
                        isCustomVendorFieldFilled: false,
                        isLocalVendorFieldFilled: false,
                        isInsuranceVendorFieldFilled: false
                    }),
                    "uploadChaFileModel"
                );
                this.getView().setModel(new JSONModel([]), "ChaFileData");
            },
            /* 
                fn to check input fields and update local json property value
            */
            onInputChange: function (oEvent) {
                const oSource = oEvent.getSource(),
                    sId = oSource.getId(),
                    sValue = oSource.getValue();
                if (sId.includes("fileUploader")) {
                    this.file = oEvent.getParameter("files")[0];
                    sValue.length > 0
                        ? this.setModelProperty(
                            "uploadChaFileModel",
                            "isChaFileFilled",
                            true
                        )
                        : this.setModelProperty(
                            "uploadChaFileModel",
                            "isChaFileFilled",
                            false
                        );
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
                        var excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets["Sheet1"]);

                        workbook.SheetNames.forEach(function (sheetName) {
                            // appending the excel file data to the global variable
                            excelSheetsData.push(XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]));
                        });
                        //fn to process excel data into local model for displaying unique Invoice ID data
                        this.processUniqueInvoiceData(excelData);
                        sap.ui.core.BusyIndicator.hide();
                        this.byId("idValidateBtn").setEnabled(true);
                    }
                    reader.readAsArrayBuffer(this.file);
                }
            },
            /* 
                fn to reset all values and data in selection screen 
            */
            onClearForm: function () {

                // Clearing all the forms
                this.getById("idSelectionScreenViewPlantMultiInput").setTokens([]);
                this.getById("idSelectionScreenViewBENumberInputFrom").setValue("");
                this.getById("idSelectionScreenViewBENumberInputTo").setValue("");
                this.getById("idSelectionScreenViewPOVendorMultiInput").setTokens([]);
                this.getById("idSelectionScreenViewCustomVendortMultiInput").setTokens([]);
                this.getById("idSelectionScreenViewOverseasVendorMultiInput").setTokens([]);
                this.getById("idSelectionScreenViewLocalVendortMultiInput").setTokens([]);
                this.getById("idSelectionScreenViewInsuranceVendortMultiInput").setTokens([]);
                this.getById("fileUploader").setValue("");
                // Setting the model for Upload Button Active or not
                this.setModelProperty("uploadChaFileModel", "isPoVendFieldFilled", false);
                this.setModelProperty("uploadChaFileModel", "isChaVendFieldFilled", false);
                this.setModelProperty("uploadChaFileModel", "isPlantFieldFilled", false);
                this.setModelProperty("uploadChaFileModel", "isChaFileFilled", false);
                this.setModelProperty("uploadChaFileModel", "isPlantFilled", false);
                this.setModelProperty("uploadChaFileModel", "isPOVendor", false);
                this.setModelProperty("uploadChaFileModel", "isChaVendor", false);
                this.getView().getModel("uploadChaFileModel").refresh(true);
                // Reset Excel processing data
                this.excelSheetsData = [];
                this.getView().getModel("ChaFileData").setData([]);
                this.getView().getModel("ChaFileData").refresh(true);
            },
            /* 
                fn to read excel array data and to create unique invoice list data
            */
            processUniqueInvoiceData: function (excelData) {
                let uniqInvoices = [], invoiceList = [];
                excelData.forEach((sItem) => {
                    if (!uniqInvoices.includes(sItem["Invoice Number"].toString())) {
                        uniqInvoices.push(sItem["Invoice Number"].toString());
                        invoiceList.push({
                            "InvoiceId": sItem["Invoice Number"].toString(),
                            "TotalAmount": sItem["Total Amount"],
                            "CurrencyCode": sItem["Invoice Currency"],
                            "OverseasFreightAmount": sItem["Overseas Freight Amount\r\n\r\n(in FC)"],
                            "POVendor": "",
                            "ExchangeRate": "",
                            "OverseasFreightVendor": "",
                            "ForeignCurrency": ""
                        });
                    }
                });
                this.getView().getModel("ChaFileData").setData(invoiceList);
                this.getView().getModel("ChaFileData").refresh(true);
            }
        });
    });
