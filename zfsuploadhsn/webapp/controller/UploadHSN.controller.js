sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/BusyDialog",
    "sap/ui/core/format/NumberFormat",
    "sap/m/MessageToast",
    "sap/ui/export/Spreadsheet",
    "sap/ui/export/library",
    "sap/ui/model/json/JSONModel"
], (Controller, BusyDialog, NumberFormat, MessageToast, Spreadsheet, exportLibrary, JSONModel) => {
    "use strict";

    return Controller.extend("customduty.ui.uploadhsn.controller.UploadHSN", {
        onInit() {
            this.getView().setModel(
                new JSONModel({
                    isHsnFileFilled: false,
                    isEditEnabled: false
                }),
                "uploadHSAModel"
            );
            this.busyDialog = new BusyDialog();
            this.modifiedTaxObjects = [];
            this.contextID = [];
        },

        /* 
            fn to check input fields and update local json property value
        */
        onInputChange: function (oEvent) {
            const oSource = oEvent.getSource(),
                sId = oSource.getId(),
                vModel = this.getView().getModel("uploadHSAModel"),
                sValue = oSource.getValue();
            if (sId.includes("fileUploader")) {
                this.file = oEvent.getParameter("files")[0];
                vModel.setProperty("/isHsnFileFilled",true);
                vModel.updateBindings(true);
            } 
            //this.getView().getModel("uploadChaFileModel").refresh(true);
        },
        /* 
            fn to check input fields and update local json property value
         */
        onSubmitFile: function () {
            const oFileUploader = this.getView().byId("fileUploader");
            if (oFileUploader.getValue() === "") {
                MessageToast.show("Please Choose any File");
                return;
            }
            //sap.ui.core.BusyIndicator.show(0);
            if (this.file && window.FileReader) {
                let reader = new FileReader(), excelSheetsData = [];
                reader.onload = (e) => {

                    if (this.file.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
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
                    } else {
                        let json_content = new TextDecoder("utf-8").decode(e.target.result);
                        excelData = JSON.parse(json_content).data;
                    }
                    this.readAndInsertHSNData(excelData);
                }
                reader.readAsArrayBuffer(this.file);
            }
        },
        /* 
            fn to read excel data and insert data into backend table
         */
        readAndInsertHSNData: function (eData) {
            const oModel = this.getView().getModel("V4"),
                uploadBinding = oModel.bindList("/UploadHSN", null, null, null, {
                    $$updateGroupId: "CreateUploadHSNRecord"
                }),
                oNumberFormat = NumberFormat.getFloatInstance({
                    minFractionDigits: 0
                }),
                uiTable = this.getView().byId("idHSNTablePreview");

            if (eData.length > 0) {
                this.busyDialog.open();
                eData.forEach((sRecord) => {
                    const oPayload = {}, taxRate = oNumberFormat.format(sRecord["Tax Rate"].toString());
                    oPayload.SupplierCountry = sRecord["Supplier Country"];
                    oPayload.HSNCode = sRecord["HSN Code"].toString();
                    oPayload.TaxRate = isNaN(Number(taxRate.replaceAll(",", ""))) ? 0 : Number(taxRate.replaceAll(",", ""));
                    oPayload.TaxCode = sRecord["Tax Code"].toString();
                    uploadBinding.create(oPayload, true);
                    // oModel.create("/UploadHSN", oPayload, {
                    //     groupId: "CreateUploadHSNRecord",
                    //     refreshAfterChange: true
                    // }, this)
                })

                // let oPromise = new Promise((resolve, reject) => {
                //     oModel.submitChanges({
                //         groupId: "CreateUploadHSNRecord",
                //         success: function (oData) {
                //             // if (oData.__batchResponses[1]._imported) {
                //             //     MessageToast.show("Entries Created successfully");
                //             //     this.getView().byId("idHSNTablePreview").rebindTable(true);
                //             // } else
                //             //     MessageToast.show("Failed to create");
                //             MessageToast.show("Entries Created successfully");
                //             this.busyDialog.close();
                //             resolve();
                //         }.bind(this),
                //         error: function () {
                //             this.busyDialog.close();
                //             MessageBox.error("Failed to create");
                //             reject();
                //         }.bind(this)
                //     }, this);
                // })
                oModel.submitBatch("CreateUploadHSNRecord")
                    .then((oData) => {
                        const hasChanges = oModel.hasPendingChanges(),
                            oResponse = uploadBinding.getContexts();
                        if (!hasChanges) {
                            uiTable.rebindTable(true);
                            MessageToast.show("Entries Created successfully");
                        }
                        this.busyDialog.close();
                    }).catch(() => {
                        MessageBox.error("Failed to create");
                    })

            }

        },

        onDeleteHSNRecords: function (oEvent) {
            const oModel = this.getView().getModel(),
                sContexts = oEvent.getSource().getParent().getParent().getTable().getSelectedContexts();
            if (sContexts.length > 0) {
                this.busyDialog.open();
                sContexts.forEach((context) => {
                    const sPath = context.getPath();
                    oModel.remove(sPath, {
                        groupId: "DeleteUploadHSNRecord",
                        refreshAfterChange: true
                    }, this)
                });
                oModel.submitChanges({
                    groupId: "DeleteUploadHSNRecord",
                    success: function (oData) {
                        this.busyDialog.close();
                    }.bind(this),
                    error: function () {
                        this.busyDialog.close();
                        MessageBox.error("Failed to Delete");
                    }.bind(this)
                }, this);
            } else
                MessageToast.show("Please select atleast one record to delete");
        },

        onDownloadTemplate: function () {
            let aCols, oSettings, oSheet,
                EdmType = exportLibrary.EdmType;
            aCols = [
                {
                    label: 'Supplier Country',
                    type: EdmType.String,
                    property: 'SupplierCountry'
                },
                {
                    label: 'HSN Code',
                    type: EdmType.String,
                    property: 'HSNCode'
                },
                {
                    label: 'Tax Rate',
                    type: EdmType.Number,
                    property: 'TaxRate'
                },
                {
                    label: 'Tax Code',
                    type: EdmType.String,
                    property: 'TaxCode'
                }
            ];

            oSettings = {
                workbook: {
                    columns: aCols,
                    context: {
                        sheetName: "Sheet1"
                    }
                },
                dataSource: [{}],
                fileName: 'HSN File.xlsx'
            };
            oSheet = new Spreadsheet(oSettings);
            oSheet.build().finally(function () {
                oSheet.destroy();
            });
        },

        onEditTaxDetails: function (oEvent) {
            const sIcon = oEvent.getSource().getIcon(),
                vModel = this.getView().getModel("uploadHSAModel");
            if (sIcon.includes("edit")) {
                vModel.setProperty("/isEditEnabled", true);
                vModel.updateBindings(true);
                oEvent.getSource().setIcon("sap-icon://display");
            } else {
                vModel.setProperty("/isEditEnabled", false);
                vModel.updateBindings(true);
                oEvent.getSource().setIcon("sap-icon://edit");
            }
        },

        onTaxInputChange: function (oEvent) {
            const sValue = oEvent.getParameter("value"),
                sPath = oEvent.getSource().getBindingContext().getPath(),
                sProperty = oEvent.getSource().getCustomData()[0].getValue(),
                oTaxObject = oEvent.getSource().getBindingContext().getObject();
            if (this.contextID.includes(oTaxObject.ID)) {

                this.modifiedTaxObjects.forEach((selObject) => {
                    if (selObject.ID === oTaxObject.ID)
                        selObject[sProperty] = sValue;
                })
            } else {
                let oTaxCodeValue = {
                    ID: oTaxObject.ID,
                    sPath: sPath
                };
                oTaxCodeValue[sProperty] = sValue;
                this.modifiedTaxObjects.push(oTaxCodeValue);
                this.contextID.push(oTaxObject.ID);
            }
        },

        onSaveTaxDetails: function () {
            const oModel = this.getView().getModel("V4"),
                vModel = this.getView().getModel("uploadHSAModel"),
                cInputId = this.getView().byId("idEditTaxToggle"),
                oNumberFormat = NumberFormat.getFloatInstance({
                    minFractionDigits: 0
                });
            if (this.modifiedTaxObjects.length > 0) {
                this.busyDialog.open();
                this.modifiedTaxObjects.forEach((oTaxObject) => {
                    const cTaxBindingContext = oModel.bindContext("/UploadHSN('" + oTaxObject.ID + "')", undefined, {
                        $$updateGroupId: "UpdateHSNRecord"
                    });
                    if (oTaxObject.TaxRate) {
                        const sTaxRateFormatedValue = oNumberFormat.format(oTaxObject.TaxRate),
                            iTaxRateFinalValue = isNaN(Number(sTaxRateFormatedValue.replaceAll(",", ""))) ? 0 : Number(sTaxRateFormatedValue.replaceAll(",", ""));;
                        cTaxBindingContext.getBoundContext().setProperty("TaxRate", iTaxRateFinalValue);
                    }
                    if (oTaxObject.TaxCode)
                        cTaxBindingContext.getBoundContext().setProperty("TaxCode", oTaxObject.TaxCode);
                });
                oModel.submitBatch("UpdateHSNRecord")
                    .then(() => {
                        const hasChanges = oModel.hasPendingChanges();
                        this.modifiedTaxObjects = [];
                        this.contextID = [];
                        vModel.setProperty("/isEditEnabled", false);
                        vModel.updateBindings(true);
                        cInputId.setIcon("sap-icon://edit");
                        MessageToast.show("Entries Modified Successfully");
                        this.busyDialog.close();
                    }).catch(() => {
                        this.busyDialog.close();
                        MessageToast.show("Failed to Update");
                    })
            } else {
                MessageToast.show("No changes to update!");
            }
        }
    });
});