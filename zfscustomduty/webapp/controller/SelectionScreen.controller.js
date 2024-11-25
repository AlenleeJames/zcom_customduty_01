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
    "sap/ui/core/format/NumberFormat",
    "sap/ui/Device"
],
    function (BaseController, JSONModel, BusyDialog, Filter, FilterOperator, Token,
        MessageToast, MessageBox, DateFormat, NumberFormat, Device) {
        "use strict";

        return BaseController.extend("customduty.ui.invoiceposting.controller.SelectionScreen", {

            onInit: function () {
                //Initializing local json model for fields check
                this.getView().setModel(
                    new JSONModel({
                        isChaFileFilled: false,
                        isPlantFilled: false,
                        isPOVendorFilled: false,
                        isCustomVendorFilled: false,
                        isLocalVendorFilled: true,
                        isInsuranceVendorFilled: true,
                        isMiscVendorFilled: true
                    }),
                    "uploadChaFileModel"
                );
                this.getView().setModel(new JSONModel([]), "InvoiceModel");
                this.getView().setModel(new JSONModel([]), "InvoiceManage");
                this.getView().setModel(new JSONModel([]), "ChaFileModel");
                this.getView().setModel(new JSONModel([]), "ValidatedModel");
                this.getView().setModel(new JSONModel([]), "MappingData");
                this.getView().setModel(new JSONModel([]), "ManageData");
                this.busyDialog = new BusyDialog();
                this.uniqInvoices = [];

            },

            onBeforeRendering: function () {
                const SidePanel = this.getView().getModel("SidePanel");
                this.getView().setModel(SidePanel, "SidePanel");
                this._setToggleButtonTooltip(!Device.system.desktop);
            },

            onItemSelect: function (oEvent) {
                var oItem = oEvent.getParameter("item");
                this.byId("pageContainer").to(this.getView().createId(oItem.getKey()));
            },

            handleUserNamePress: function (event) {
                var oPopover = new Popover({
                    showHeader: false,
                    placement: PlacementType.Bottom,
                    content: [
                        new Button({
                            text: 'Feedback',
                            type: ButtonType.Transparent
                        }),
                        new Button({
                            text: 'Help',
                            type: ButtonType.Transparent
                        }),
                        new Button({
                            text: 'Logout',
                            type: ButtonType.Transparent
                        })
                    ]
                }).addStyleClass('sapMOTAPopover sapTntToolHeaderPopover');

                oPopover.openBy(event.getSource());
            },

            _setToggleButtonTooltip: function (bLarge) {
                var oToggleButton = this.byId('sideNavigationToggleButton');
                if (bLarge) {
                    oToggleButton.setTooltip('Large Size Navigation');
                } else {
                    oToggleButton.setTooltip('Small Size Navigation');
                }
            },

            onSideNavButtonPress: function () {
                var oToolPage = this.byId("toolPage");
                var bSideExpanded = oToolPage.getSideExpanded();

                this._setToggleButtonTooltip(bSideExpanded);

                oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
            },

            /* 
                fn to initialize Multi input token validator
            */
            onAfterRendering: function () {
                const cMultiInputBENumber = this.byId("idSSVBENumberMultiInput");
                // add validator
                const fnValidator = function (args) {
                    const sText = args.text;
                    return new Token({ key: sText, text: sText });
                };
                cMultiInputBENumber.addValidator(fnValidator);
            },

            onSearch: function (oEvent) {
                this.busyDialog.open();
                const aBENo = this.getView().byId("idBENumberDis").getValue();
                const oModel = this.getView().getModel();

                let selectedHdr = "/CustomDutyHdr"
                const oInvoiceFilter = new sap.ui.model.Filter({
                    path: "BENoKey",
                    operator: "EQ",
                    value1: aBENo
                });

                // Return a promise to handle the asynchronous operation              
                oModel.bindList(selectedHdr, undefined, undefined, [oInvoiceFilter])
                    .requestContexts(0, 1000) // Fetch the first 10 records
                    .then((aContexts) => {
                        // Map the contexts to data objects 
                        const aData = aContexts.map((oContext) => oContext.getObject());
                        if (aData.length > 0) {
                            selectedHdr = "/CustomDutyHdr(" + aData[0].ID + ")?$expand=to_CustomDutyItem";  // Add $expand for related entity
                            this.getOwnerComponent().getModel().bindContext(selectedHdr).requestObject().then((oData) => {
                                this.busyDialog.close();
                                if (oData) {
                                    this.getView().getModel("ManageData").setData(oData);
                                    this.getMappingData()
                                        .then((aData) => {
                                            this.getView().getModel("MappingData").setData(aData);
                                            const aMappedData = this.processManageMapping(aData, oData.to_CustomDutyItem);
                                            //fn to process excel data into local model for displaying unique Invoice ID data                               
                                            this.processUniqueInvoiceData(aMappedData, 'Manage');
                                            //this.constructChaFileModel(aMappedData);
                                            this.busyDialog.close();
                                        })
                                        .catch((oError) => {
                                            MessageToast.show(oError);
                                            this.busyDialog.close();
                                            // Handle the error here
                                        });
                                    this.byId("idProceedToInvoicePostingDis").setEnabled(true);
                                } else {
                                    this.busyDialog.close();
                                    MessageToast.show("No data found");
                                }
                            }).catch((error) => {
                                this.busyDialog.close();
                                console.error("Error loading data:", error);
                            });
                        } else {
                            this.busyDialog.close();
                            MessageToast.show("No data found");
                        }
                    })
                    .catch((oError) => {
                        // Close the busy dialog on error
                        this.busyDialog.close();
                        // Log the error to the console (optional)
                        console.error("Error fetching mapping data:", oError);
                    });
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

                        this.getMappingData()
                            .then((aData) => {
                                console.log("Fetched data:", aData);
                                this.getView().getModel("MappingData").setData(aData);
                                const aMappedData = this.processMapping(aData, excelData);
                                this.getView().getModel("ChaFileModel").setData(aMappedData);
                                //fn to process excel data into local model for displaying unique Invoice ID data                               
                                this.processUniqueInvoiceData(aMappedData, 'Upload');
                                //this.constructChaFileModel(aMappedData);
                                sap.ui.core.BusyIndicator.hide();
                            })
                            .catch((oError) => {
                                console.error("Error fetching data:", oError);
                                // Handle the error here
                            });
                    }
                    reader.readAsArrayBuffer(this.file);
                }
            },

            processManageMapping: function (mappingData, excelData) {
                // Create a new array with users who match the criteria fields
                const mappedData = excelData.map(excelDetails => {
                    const filteredData = {};
                    // Loop through each criteria pair and dynamically rename properties
                    mappingData.forEach(field => {
                        let columnName = field.OutputFields;
                        let columnTypeScale = this.getColumnType(columnName);
                        var formatedData = '';
                        // Rename the InputField based on OutputField
                        //filteredData[field.OutputFields] = excelDetails[field.InputFields];    
                        console.log(field.OutputFields);
                        formatedData = this.formatData(columnTypeScale, excelDetails[field.OutputFields]);
                        filteredData[field.OutputFields] = formatedData;
                    });
                    return filteredData;
                });
                return mappedData;
            },

            processMapping: function (mappingData, excelData) {
                // Create a new array with users who match the criteria fields
                const mappedData = excelData.map(excelDetails => {
                    const filteredData = {};

                    // Loop through each criteria pair and dynamically rename properties
                    mappingData.forEach(field => {
                        let columnName = field.OutputFields;
                        let columnTypeScale = this.getColumnType(columnName);
                        var formatedData = '';
                        if (excelDetails.hasOwnProperty(field.InputFields)) {
                            // Rename the InputField based on OutputField
                            //filteredData[field.OutputFields] = excelDetails[field.InputFields];                        
                            formatedData = this.formatData(columnTypeScale, excelDetails[field.InputFields]);
                            if (field.OutputFields == 'ProductDescription') {
                                const match = excelDetails[field.InputFields].match(/\(([^)]+)\)/);
                                // If match is found, log the content inside the first parentheses
                                if (match) {
                                    filteredData['Material'] = match[1];
                                }
                                filteredData[field.OutputFields] = formatedData;
                            } else if (field.OutputFields == 'Material') {
                            } else {
                                filteredData[field.OutputFields] = formatedData;
                            }

                        } else {
                            if (field.OutputFields != 'Material') {
                                if (columnTypeScale.Type == 'number') {
                                    formatedData = this.formatData(columnTypeScale, 0);
                                } else {
                                    columnTypeScale.Type = 'string';
                                    formatedData = this.formatData(columnTypeScale, '');
                                }
                                filteredData[field.OutputFields] = formatedData;
                            }
                        }
                    });
                    return filteredData;
                });
                return mappedData;
            },

            // Function to find the Type of a given ColumnName
            getColumnType: function (columnName) {
                const fieldMappingData = this.getView().getModel("MappingData").getData();
                const column = fieldMappingData.find(item => item.OutputFields === columnName);
                if (column) {
                    return {
                        Type: column.Type,
                        Scale: column.Scale
                    };
                } else {
                    return `Column "${columnName}" not found.`;
                }
            },

            // Function to format a date if the type is "date"
            formatData: function (columnTypeScale, value) {
                if (columnTypeScale.Type == 'date') {
                    // Split the date string into day, month, year
                    try {
                        const [day, month, year] = value.split('/');
                        return value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                    } catch (error) {
                        return null;
                    }

                } else if (columnTypeScale.Type == 'number') {
                    //return parseFloat(value.toFixed(columnTypeScale.Scale));
                    var formatedNum = parseFloat(parseFloat(value).toFixed(columnTypeScale.Scale));
                    if (formatedNum == 0) {
                        formatedNum = null;
                    }
                    return formatedNum;
                } else {
                    if (value == undefined || value == null) {
                        value = '';
                    }
                    return value.toString();
                }
            },

            getMappingData: function () {
                // Open busy dialog to indicate loading state
                this.busyDialog.open();

                // Get the model from the view
                const oModel = this.getView().getModel();
                const selectedHdr = "/CustomDutyFieldMapping"; // The path to your data

                // Define the filter for the model
                const oInvoiceFilter = new sap.ui.model.Filter({
                    path: "OutputFields",
                    operator: "NE",
                    value1: ''
                });

                // Return a promise to handle the asynchronous operation
                return new Promise((resolve, reject) => {
                    oModel.bindList(selectedHdr, undefined, undefined, [oInvoiceFilter])
                        .requestContexts(0, 1000) // Fetch the first 10 records
                        .then((aContexts) => {
                            // Close the busy dialog on success
                            this.busyDialog.close();

                            // Map the contexts to data objects
                            const aData = aContexts.map((oContext) => oContext.getObject());

                            // Resolve the promise with the fetched data
                            resolve(aData);
                        })
                        .catch((oError) => {
                            // Close the busy dialog on error
                            this.busyDialog.close();

                            // Log the error to the console (optional)
                            console.error("Error fetching mapping data:", oError);

                            // Reject the promise with the error
                            reject(oError);
                        });
                });
            },

            /* 
                fn to read excel array data and to create unique invoice list data
            */
            processUniqueInvoiceData: function (mappedData, process) {
                // Create a new array comparing BENo and BEDate as keys, ensuring uniqueness
                let aBETocken = [];
                const aUniqueBENoInvArray = mappedData.reduce((acc, current) => {
                    // Generate a unique key by combining BENo and BEDate
                    const key = `${current.BENo}-${current.InvoiceNumber}`;
                    // Check if the key already exists in the accumulator
                    if (!acc.some(item => `${item.BENo}-${item.InvoiceNumber}` === key)) {
                        // If the key is unique, push the current object to the accumulator
                        acc.push(current);
                        if (aBETocken.length == 0) {
                            aBETocken.push(new sap.m.Token({
                                key: current.BENo,  // The key or value you want for the token
                                text: current.BENo  // The text that appears in the token
                            }));
                        }
                    }
                    return acc;
                }, []); // Start with an empty array

                if (process == 'Upload') {
                    aUniqueBENoInvArray.length > 0 ? this.byId("idValidateBtn").setEnabled(true) : this.byId("idValidateBtn").setEnabled(false);
                    this.getById("idSSVBENumberMultiInput").setTokens(aBETocken);
                    this.getView().getModel("InvoiceModel").setData(aUniqueBENoInvArray);
                    this.getView().getModel("InvoiceModel").refresh(true);
                } else {
                    this.getView().getModel("InvoiceManage").setData(aUniqueBENoInvArray);
                    this.getView().getModel("InvoiceManage").refresh(true);
                }

            },
            /* 
                fn to read all chaFile data and store in local model
            */
            constructChaFileModel: function (mappedData) {
                const chaFileData = [], fieldErrors = [],
                    fieldMappingData = this.getView().getModel("FieldMappings").getData().ChaFileFields;
                mappedData.forEach((oRecord) => {
                    const ObjectKeys = Object.keys(oRecord),
                        chaFileObject = {};
                    fieldMappingData.forEach((mappingObject) => {
                        let sValue = "";

                        if (mappingObject.Type === "date") {

                        } else if (mappingObject.Type === "number") {
                            if (mappingObject.Scale === 0) {
                                chaFileObject[mappingObject.Property] = isNaN(parseInt(sValue)) ? 0 : parseInt(sValue);
                            } else {
                                const oNumberFormat = NumberFormat.getFloatInstance({
                                    minFractionDigits: 1, maxFractionDigits: 3
                                }), formattedValue = oNumberFormat.format(sValue.toString());
                                if (mappingObject.Property === "InvoiceValueINR") {
                                    const invoiceValue = oRecord[ObjectKeys[10]] * oRecord[ObjectKeys[12]],
                                        formattedInvoiceValue = oNumberFormat.format(invoiceValue.toString());
                                    chaFileObject[mappingObject.Property] = isNaN(Number(formattedInvoiceValue.replaceAll(",", ""))) ? 0 : Number(formattedInvoiceValue.replaceAll(",", ""));
                                } else
                                    chaFileObject[mappingObject.Property] = isNaN(Number(formattedValue.replaceAll(",", ""))) ? 0 : Number(formattedValue.replaceAll(",", ""));
                            }
                        } else
                            chaFileObject[mappingObject.Property] = sValue.toString();
                    });
                    chaFileData.push(chaFileObject);
                });
                if (fieldErrors.length > 0) {
                    const columns = fieldErrors.join(", ");
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
                    sInputIds = ["idSSVPlantInput", "idSSVPOVendorInput"],
                    aStringFilters = [],
                    chaFileData = this.getView().getModel("ChaFileModel").getData();
                this.busyDialog.open();
                sInputIds.forEach((sId) => {
                    const sValue = this.getView().byId(sId).getValue(),
                        filterProperty = this.getView().byId(sId).data("FilterProperty");
                    if (sValue.length > 0) {
                        aStringFilters.push(new Filter(filterProperty, FilterOperator.EQ, sValue))
                    }
                });
                this.uniqInvoices.forEach((invoiceNo) => {
                    aStringFilters.push(new Filter("InvoiceNumber", FilterOperator.EQ, invoiceNo))
                });
                const CustInvMMContext = oModel.bindList("/ZA_MM_CustomDutyInvDetails").filter(aStringFilters);
                CustInvMMContext.requestContexts().then((sReponse) => {
                    if (sReponse.length > 0) {
                        const CustInvData = [], chaFileMatchedRecords = [];
                        sReponse.forEach((sContext) => {
                            CustInvData.push(sContext.getObject())
                        });
                        chaFileData.forEach((chaFileRecord) => {
                            const chaFileMaterial = chaFileRecord.Material;
                            CustInvData.forEach((MMCustDutyRecord) => {
                                //if (chaFileMaterial === MMCustDutyRecord.Material && chaFileRecord.Quantity === MMCustDutyRecord.POQuantity) {
                                if (chaFileMaterial === MMCustDutyRecord.Material && chaFileRecord.InvoiceNumber === MMCustDutyRecord.InvoiceNumber) {
                                    chaFileRecord.PurchaseOrder = MMCustDutyRecord.PurchaseorderNumber;
                                    chaFileRecord.PurchaseorderItem = MMCustDutyRecord.POItemNumber; //isNaN(Number(MMCustDutyRecord.POItemNumber)) ? 0 : Number(MMCustDutyRecord.POItemNumber);
                                    chaFileRecord.HSNCodeSystem = MMCustDutyRecord.HSNCode;
                                    chaFileMatchedRecords.push(chaFileRecord);
                                }
                            });
                        })
                        this.getView().getModel("ValidatedModel").setData(chaFileMatchedRecords);
                        this.byId("idProceedToInvoicePosting").setEnabled(true);
                        MessageToast.show("Validation Successfull");
                    } else
                        MessageBox.information("No data matched for the provided values")
                    this.busyDialog.close();
                });
            },     

            validateExistingInvoiceData: function (InvoiceNumber) {

            },

            // Function to show the confirmation dialog
            showConfirmationDialog: function () {
                return new Promise((resolve) => {
                    // Create the dialog
                    const oDialog = new sap.m.Dialog({
                        title: "Confirmation",
                        type: sap.m.DialogType.Message,
                        content: new sap.m.Text({ text: "Data will be saved for further processing. Do you want to proceed?" }),
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

            calculateCustomDuty: function (process) {
                return new Promise((resolve, reject) => {
                    const oModel = this.getView().getModel();
                    const sObjects = [];
                    const calculateDutyContext = oModel.bindContext("/calculateDuty(...)");
                    let chaFileValidatedData = [],
                        invoiceTableData = [];
                    if (process == 'Upload') {
                        chaFileValidatedData = this.getView().getModel("ValidatedModel").getData();
                        invoiceTableData = this.getView().getModel("InvoiceModel").getData();
                    } else {
                        chaFileValidatedData = this.getView().getModel("ManageData").getData().to_CustomDutyItem;
                        invoiceTableData = this.getView().getModel("InvoiceManage").getData();
                    }

                    chaFileValidatedData.forEach((chaFileRecord) => {
                        const chaFileInvoice = chaFileRecord.InvoiceNumber;
                        invoiceTableData.forEach((invoiceRecord) => {
                            if (chaFileInvoice === invoiceRecord.InvoiceNumber) {
                                chaFileRecord.OverseasFrtAmtCALC1 = Number(invoiceRecord.OverseasFrtAmtCALC1);
                                chaFileRecord.OverseasFrtAmtCALC2 = Number(invoiceRecord.OverseasFrtAmtCALC2);
                                //Stihl Specific
                                //chaFileRecord.FreightExrate = Number(invoiceRecord.ExcRateforInvoice);
                                chaFileRecord.FreightExrate = 1;
                                chaFileRecord.DomesticFrtAmtCALC1 = Number(invoiceRecord.DomesticFrtAmtCALC1);
                                chaFileRecord.DomesticFrtAmtCALC2 = Number(invoiceRecord.DomesticFrtAmtCALC2);

                                chaFileRecord.InsuranceAmTCALC1 = Number(invoiceRecord.InsuranceAmTCALC1);
                                chaFileRecord.InsuranceAmTCALC2 = Number(invoiceRecord.InsuranceAmTCALC2);
                                chaFileRecord.MiscAmountCALC1 = Number(invoiceRecord.MiscAmountCALC1);
                                chaFileRecord.MiscAmountCALC2 = Number(invoiceRecord.MiscAmountCALC2);

                                chaFileRecord.OverseasFrtAmtTAX1 = invoiceRecord.OverseasFrtAmtTAX1;
                                chaFileRecord.OverseasFrtAmtTAX2 = invoiceRecord.OverseasFrtAmtTAX2;
                                chaFileRecord.DomesticFrtAmtTAX1 = invoiceRecord.DomesticFrtAmtTAX1;
                                chaFileRecord.DomesticFrtAmtTAX2 = invoiceRecord.DomesticFrtAmtTAX2;
                                chaFileRecord.MiscAmountTAX1 = invoiceRecord.MiscAmountTAX1;
                                chaFileRecord.MiscAmountTAX2 = invoiceRecord.MiscAmountTAX2;
                                chaFileRecord.InsuranceAmTTAX1 = invoiceRecord.InsuranceAmTTAX1;
                                chaFileRecord.InsuranceAmTTAX1 = invoiceRecord.InsuranceAmTTAX1;

                                chaFileRecord.OverFreightVendor = this.getById("idSSVOverseasVendorInput").getValue();
                                chaFileRecord.InsuranceVendor = this.getById("idSSVInsuranceVendortInput").getValue();
                                chaFileRecord.DomFreightVendor = this.getById("idSSVLocalVendortInput").getValue();
                                chaFileRecord.CustomInvoiceVendor = this.getById("idSSVCustomVendortInput").getValue();
                                chaFileRecord.MiscChargesVen = this.getById("idSSVMiscVendortInput").getValue();
                                sObjects.push(chaFileRecord);
                            }
                        })
                    });
                    if (sObjects.length > 0) {
                        sObjects.forEach(item => {
                            delete item.InvoiceCurrency;
                            delete item.FreightCurrency;
                            delete item.InsuranceCurrency;
                            delete item.OverseasFrtAmtCALC1VS;
                            delete item.OverseasFrtAmtCALC2VS;
                            delete item.DomesticFrtAmtCALC1VS;
                            delete item.DomesticFrtAmtCALC2VS;
                        });
                        calculateDutyContext.setParameter("fileData", sObjects);
                        calculateDutyContext.execute().then(() => {
                            const sResponse = calculateDutyContext.getBoundContext().getObject();
                            const oNumberFormat = NumberFormat.getFloatInstance({
                                minFractionDigits: 1, maxFractionDigits: 2
                            });
                            sResponse.value.forEach((sObject) => {
                                const overFreightItem1 = oNumberFormat.format(sObject.OverFreightperitem1),
                                    domesticFreightItem1 = oNumberFormat.format(sObject.DomesticFreightperitem1),
                                    InsFreightItem1 = oNumberFormat.format(sObject.Inschargesperitem1),
                                    MiscFreightItem1 = oNumberFormat.format(sObject.Miscchargesperitem1),

                                    overFreightItem2 = oNumberFormat.format(sObject.OverFreightperitem2),
                                    domesticFreightItem2 = oNumberFormat.format(sObject.DomesticFreightperitem2),
                                    InsFreightItem2 = oNumberFormat.format(sObject.Inschargesperitem2),
                                    MiscFreightItem2 = oNumberFormat.format(sObject.Miscchargesperitem2);

                                sObject.OverFreightperitem1 = isNaN(Number(overFreightItem1.replaceAll(",", ""))) ? 0 : Number(overFreightItem1.replaceAll(",", ""));
                                sObject.DomesticFreightperitem1 = isNaN(Number(domesticFreightItem1.replaceAll(",", ""))) ? 0 : Number(domesticFreightItem1.replaceAll(",", ""));
                                sObject.Inschargesperitem1 = isNaN(Number(InsFreightItem1.replaceAll(",", ""))) ? 0 : Number(InsFreightItem1.replaceAll(",", ""));
                                sObject.Miscchargesperitem1 = isNaN(Number(MiscFreightItem1.replaceAll(",", ""))) ? 0 : Number(MiscFreightItem1.replaceAll(",", ""));
                                sObject.OverFreightperitem2 = isNaN(Number(overFreightItem2.replaceAll(",", ""))) ? 0 : Number(overFreightItem2.replaceAll(",", ""));
                                sObject.DomesticFreightperitem2 = isNaN(Number(domesticFreightItem2.replaceAll(",", ""))) ? 0 : Number(domesticFreightItem2.replaceAll(",", ""));
                                sObject.Inschargesperitem2 = isNaN(Number(InsFreightItem2.replaceAll(",", ""))) ? 0 : Number(InsFreightItem2.replaceAll(",", ""));
                                sObject.Miscchargesperitem2 = isNaN(Number(MiscFreightItem2.replaceAll(",", ""))) ? 0 : Number(MiscFreightItem2.replaceAll(",", ""));
                            });
                            resolve(sResponse.value);
                        }).catch((oError) => {
                            reject(oError);
                            this.busyDialog.close();
                        });
                    } else {
                        reject(oError);
                        MessageToast.show("Data Issue");
                        this.busyDialog.close();
                    }
                });
            },

            onProceedToInvoicePostingFromManage: function () {
                this.busyDialog.open();
                const toContinue = this.validateInvoiceManageTableFields();
                if (toContinue) {
                    this.calculateCustomDuty('Manage').then((aData) => {
                        const oRouter = this.getOwnerComponent().getRouter(),
                            oModel = this.getView().getModel();
                        const BEobject = this.getView().getModel("ManageData").getData();
                        BEobject.OverallStatus = 'Saved';                       

                        if(BEobject.CustomVendor){
                            if (BEobject.CustomVendInvStat == 'Success' || BEobject.CustomVendInvStat == 'Error') {                                
                            } else if(BEobject.CustomVendInvStat == '' || BEobject.CustomVendInvStat == null) {
                                BEobject.CustomVendInvStat = 'Saved';
                            }
                        }else{
                            BEobject.CustomVendInvStat == ''
                        }

                        if(BEobject.DomesticVendor){
                            if (BEobject.DomesticVendInvStat == 'Success' || BEobject.DomesticVendInvStat == 'Error') {                                
                            } else if(BEobject.DomesticVendInvStat == '' || BEobject.DomesticVendInvStat == null) {
                                BEobject.DomesticVendInvStat = 'Saved';
                            }
                        }else{
                            BEobject.DomesticVendInvStat == ''
                        }

                        if(BEobject.OverSeasVendor){
                            if (BEobject.OverSeasVendInvStat == 'Success' || BEobject.OverSeasVendInvStat == 'Error') {                                
                            } else if(BEobject.OverSeasVendInvStat == '' || BEobject.OverSeasVendInvStat == null) {
                                BEobject.OverSeasVendInvStat = 'Saved';
                            }
                        }else{
                            BEobject.OverSeasVendInvStat == '' 
                        }

                        BEobject.to_CustomDutyItem = [];
                        BEobject.to_CustomDutyItem = aData;
                        delete BEobject.createdAt;
                        delete BEobject.createdBy;
                        delete BEobject.modifiedAt;
                        delete BEobject.modifiedBy;
                        BEobject.to_CustomDutyItem.forEach(item => {
                            delete item.BENoKey_ID;
                        });

                        //Update Data
                        const updateDuty = oModel.bindContext("/UpdateCustomDuty(...)");
                        updateDuty.setParameter("ID", BEobject.ID);
                        updateDuty.setParameter("CustomDutyData", BEobject);
                        updateDuty.execute().then(() => {
                            const sResponseDuty = updateDuty.getBoundContext().getObject();
                            oRouter.navTo("InvoicePosting", {
                                transactionId: sResponseDuty.ID
                            });
                            this.busyDialog.close();
                            this.onClearForm();
                        }).catch((oError) => {
                            this.busyDialog.close();
                        });

                    }).catch((oError) => {
                        this.busyDialog.close();
                    });
                } else {
                    MessageToast.show("Please Fill all mandatory fields");
                    this.busyDialog.close();
                }
            },

            onProceedToInvoicePostingScreen: function () {
                this.busyDialog.open();
                const BENo = this.getView().getModel("ValidatedModel").getData()[0].BENo,
                    oModel = this.getView().getModel();
                var selectedHdr = "/CustomDutyHdr";
                const oInvoiceFilter = new sap.ui.model.Filter({
                    path: "BENoKey",
                    operator: "EQ",
                    value1: BENo
                });
                oModel.bindList(selectedHdr, undefined, undefined, [oInvoiceFilter])
                    .requestContexts(0, 10)
                    .then((aContexts) => {
                        this.busyDialog.close();
                        const aData = aContexts.map((oContext) => oContext.getObject());
                        if (aData.length > 0) {
                            MessageBox.error("BE No. " + BENo + " already exist, Please click on Manage to proceed further");
                        } else {
                            this.busyDialog.close();
                            this.showConfirmationDialog().then((toProceed) => {
                                if (toProceed) {
                                    const oRouter = this.getOwnerComponent().getRouter(),
                                        toContinue = this.validateInvoiceTableFields();
                                    this.busyDialog.open();
                                    if (toContinue) {
                                        this.calculateCustomDuty('Upload').then((aData) => {
                                            const BETokens = this.getById("idSSVBENumberMultiInput").getTokens(), tokenKeys = [];
                                            BETokens.forEach((sToken) => {
                                                tokenKeys.push(sToken.getKey());
                                            });
                                            const CustomDutyData = {};
                                            CustomDutyData.BENoKey = tokenKeys[0];
                                            CustomDutyData.Plant = this.getById("idSSVPlantInput").getValue();
                                            CustomDutyData.POVendor = this.getById("idSSVPOVendorInput").getValue();
                                            CustomDutyData.OverallStatus = 'Saved';
                                            CustomDutyData.CustomVendInv = '';
                                            CustomDutyData.CustomVendor = this.getById("idSSVCustomVendortInput").getValue();
                                            if (CustomDutyData.CustomVendor) {
                                                CustomDutyData.CustomVendInvStat = 'Saved';
                                            }
                                            CustomDutyData.OverSeasVendInv = '';
                                            CustomDutyData.OverSeasVendor = this.getById("idSSVOverseasVendorInput").getValue();
                                            if (CustomDutyData.OverSeasVendor) {
                                                CustomDutyData.OverSeasVendInvStat = 'Saved';
                                            }
                                            CustomDutyData.DomesticVendInv = '';
                                            CustomDutyData.DomesticVendor = this.getById("idSSVLocalVendortInput").getValue();
                                            if (CustomDutyData.DomesticVendor) {
                                                CustomDutyData.DomesticVendInvStat = 'Saved';
                                            }
                                            CustomDutyData.to_CustomDutyItem = aData;
                                            //Save Data
                                            const SaveDuty = oModel.bindContext("/SaveCustomDuty(...)");
                                            SaveDuty.setParameter("CustomDutyData", CustomDutyData);
                                            SaveDuty.execute().then(() => {
                                                const sResponseDuty = SaveDuty.getBoundContext().getObject();
                                                oRouter.navTo("InvoicePosting", {
                                                    transactionId: sResponseDuty.ID
                                                });
                                                this.busyDialog.close();
                                                this.onClearForm();
                                            }).catch((oError) => {
                                                this.busyDialog.close();
                                            });

                                        }).catch((oError) => {
                                            this.busyDialog.close();
                                        });

                                    } else {
                                        MessageToast.show("Please Fill all mandatory fields");
                                        this.busyDialog.close();
                                    }

                                }
                            });
                        }

                    })
                    .catch((oError) => {
                        this.busyDialog.close();
                    });
            },

            validateInvoiceManageTableFields: function () {
                const InvoiceModel = this.getView().getModel("InvoiceManage").getData(),
                    OverSeasVend = this.getById("idSSVOverseasVendorInputDis").getValue(),
                    InsurVendor = this.getById("idSSVInsuranceVendortInputDis").getValue(),
                    LocalVendor = this.getById("idSSVLocalVendortInputDis").getValue(),
                    MiscVendor = this.getById("idSSVMiscVendortInputDis").getValue(),
                    mandFields = [],
                    notMandFeilds = [];

                if (OverSeasVend) {
                    mandFields.push("OverseasFrtAmtCALC1");
                    mandFields.push("OverseasFrtAmtCALC2");
                } else {
                    notMandFeilds.push("OverseasFrtAmtCALC1");
                    notMandFeilds.push("OverseasFrtAmtCALC2");
                }
                if (LocalVendor) {
                    mandFields.push("DomesticFrtAmtCALC1");
                    mandFields.push("DomesticFrtAmtCALC2");
                } else {
                    notMandFeilds.push("DomesticFrtAmtCALC1");
                    notMandFeilds.push("DomesticFrtAmtCALC2");
                }

                //Can use Later for new requirements
                // mandFields = ["LocalFreightAmount", "InsuranceAmount", "OverseasFreightAmount", "MiscAmount", "ForeignCurrency", "ExchangeRate",
                //     "OverseasFreightVendor", "POVendor"];

                let proceedToPost = true;
                // Check all mandatory values from table 
                InvoiceModel.forEach((sRecord) => {
                    mandFields.forEach((sProperty) => {
                        if (sRecord[sProperty] === null) {
                            sRecord[sProperty + "VS"] = "Error";
                            proceedToPost = false;
                        } else {
                            if ((sProperty == 'OverseasFrtAmtCALC1' || sProperty == 'OverseasFrtAmtCALC2') && !OverSeasVend) {
                                this.getById("idSSVOverseasVendorInputDis").setValueState('Error');
                                proceedToPost = false;
                            } else if ((sProperty == 'OverseasFrtAmtCALC1' || sProperty == 'OverseasFrtAmtCALC2') && OverSeasVend) {
                                this.getById("idSSVOverseasVendorInputDis").setValueState('None');
                            }
                            if ((sProperty == 'DomesticFrtAmtCALC1' || sProperty == 'DomesticFrtAmtCALC1') && !OverSeasVend) {
                                this.getById("idSSVLocalVendortInputDis").setValueState('Error');
                                proceedToPost = false;
                            } else if ((sProperty == 'DomesticFrtAmtCALC1' || sProperty == 'DomesticFrtAmtCALC1') && OverSeasVend) {
                                this.getById("idSSVLocalVendortInputDis").setValueState('None');
                            }
                        }
                    });
                    notMandFeilds.forEach((sProperty) => {
                        sRecord[sProperty + "VS"] = "None";
                        if (sRecord[sProperty] == null || sRecord[sProperty] == '') {
                        } else {
                            if ((sProperty == 'OverseasFrtAmtCALC1' || sProperty == 'OverseasFrtAmtCALC2') && !OverSeasVend) {
                                this.getById("idSSVOverseasVendorInputDis").setValueState('Error');
                                proceedToPost = false;
                            } else if ((sProperty == 'OverseasFrtAmtCALC1' || sProperty == 'OverseasFrtAmtCALC2') && OverSeasVend) {
                                this.getById("idSSVOverseasVendorInputDis").setValueState('None');
                            }
                            if ((sProperty == 'DomesticFrtAmtCALC1' || sProperty == 'DomesticFrtAmtCALC1') && !OverSeasVend) {
                                this.getById("idSSVLocalVendortInputDis").setValueState('Error');
                                proceedToPost = false;
                            } else if ((sProperty == 'DomesticFrtAmtCALC1' || sProperty == 'DomesticFrtAmtCALC1') && OverSeasVend) {
                                this.getById("idSSVLocalVendortInputDis").setValueState('None');
                            }
                        }
                    });
                });
                this.getView().getModel("InvoiceManage").updateBindings(true);
                if (!this.getById("idSSVCustomVendortInputDis").getValue()) {
                    proceedToPost = false;
                    this.getById("idSSVCustomVendortInputDis").setValueState('Error');
                } else {
                    this.getById("idSSVCustomVendortInputDis").setValueState('None');
                }
                if (proceedToPost) {
                    this.getById("idSSVOverseasVendorInputDis").setValueState('None');
                    this.getById("idSSVLocalVendortInputDis").setValueState('None');
                }
                return proceedToPost;
            },

            /* 
                fn to validate all input fields from Invoice table 
            */
            validateInvoiceTableFields: function () {
                const InvoiceModel = this.getView().getModel("InvoiceModel").getData(),
                    OverSeasVend = this.getById("idSSVOverseasVendorInput").getValue(),
                    InsurVendor = this.getById("idSSVInsuranceVendortInput").getValue(),
                    LocalVendor = this.getById("idSSVLocalVendortInput").getValue(),
                    MiscVendor = this.getById("idSSVMiscVendortInput").getValue(),
                    mandFields = [],
                    notMandFeilds = [];

                if (OverSeasVend) {
                    mandFields.push("OverseasFrtAmtCALC1");
                    mandFields.push("OverseasFrtAmtCALC2");
                } else {
                    notMandFeilds.push("OverseasFrtAmtCALC1");
                    notMandFeilds.push("OverseasFrtAmtCALC2");
                }
                if (LocalVendor) {
                    mandFields.push("DomesticFrtAmtCALC1");
                    mandFields.push("DomesticFrtAmtCALC2");
                } else {
                    notMandFeilds.push("DomesticFrtAmtCALC1");
                    notMandFeilds.push("DomesticFrtAmtCALC2");
                }

                //Can use Later for new requirements
                // mandFields = ["LocalFreightAmount", "InsuranceAmount", "OverseasFreightAmount", "MiscAmount", "ForeignCurrency", "ExchangeRate",
                //     "OverseasFreightVendor", "POVendor"];

                let proceedToPost = true;
                // Check all mandatory values from table 
                InvoiceModel.forEach((sRecord) => {
                    mandFields.forEach((sProperty) => {
                        if (sRecord[sProperty] === null) {
                            sRecord[sProperty + "VS"] = "Error";
                            proceedToPost = false;
                        } else {
                            if ((sProperty == 'OverseasFrtAmtCALC1' || sProperty == 'OverseasFrtAmtCALC2') && !OverSeasVend) {
                                this.getById("idSSVOverseasVendorInput").setValueState('Error');
                                proceedToPost = false;
                            } else if ((sProperty == 'OverseasFrtAmtCALC1' || sProperty == 'OverseasFrtAmtCALC2') && OverSeasVend) {
                                this.getById("idSSVOverseasVendorInput").setValueState('None');
                            }
                            if ((sProperty == 'DomesticFrtAmtCALC1' || sProperty == 'DomesticFrtAmtCALC1') && !OverSeasVend) {
                                this.getById("idSSVLocalVendortInput").setValueState('Error');
                                proceedToPost = false;
                            } else if ((sProperty == 'DomesticFrtAmtCALC1' || sProperty == 'DomesticFrtAmtCALC1') && OverSeasVend) {
                                this.getById("idSSVLocalVendortInput").setValueState('None');
                            }
                        }
                    });
                    notMandFeilds.forEach((sProperty) => {
                        sRecord[sProperty + "VS"] = "None";
                        if (sRecord[sProperty] == null || sRecord[sProperty] == '') { } else {
                            if ((sProperty == 'OverseasFrtAmtCALC1' || sProperty == 'OverseasFrtAmtCALC2') && !OverSeasVend) {
                                this.getById("idSSVOverseasVendorInput").setValueState('Error');
                                proceedToPost = false;
                            } else if ((sProperty == 'OverseasFrtAmtCALC1' || sProperty == 'OverseasFrtAmtCALC2') && OverSeasVend) {
                                this.getById("idSSVOverseasVendorInput").setValueState('None');
                            }
                            if ((sProperty == 'DomesticFrtAmtCALC1' || sProperty == 'DomesticFrtAmtCALC1') && !OverSeasVend) {
                                this.getById("idSSVLocalVendortInput").setValueState('Error');
                                proceedToPost = false;
                            } else if ((sProperty == 'DomesticFrtAmtCALC1' || sProperty == 'DomesticFrtAmtCALC1') && OverSeasVend) {
                                this.getById("idSSVLocalVendortInput").setValueState('None');
                            }
                        }
                    });
                });
                this.getView().getModel("InvoiceModel").updateBindings(true);
                if (!this.getById("idSSVCustomVendortInput").getValue()) {
                    proceedToPost = false;
                    this.getById("idSSVCustomVendortInput").setValueState('Error');
                } else {
                    this.getById("idSSVCustomVendortInput").setValueState('None');
                }
                if (proceedToPost) {
                    this.getById("idSSVOverseasVendorInput").setValueState('None');
                    this.getById("idSSVLocalVendortInput").setValueState('None');
                }
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
                this.getById("idSSVPOVendorInputDis").setValue("");
                this.getById("idSSVCustomVendortInput").setValue("");
                this.getById("idSSVCustomVendortInputDis").setValue("");
                this.getById("idSSVOverseasVendorInput").setValue("");
                this.getById("idSSVOverseasVendorInputDis").setValue("");
                this.getById("idSSVLocalVendortInput").setValue("");
                this.getById("idSSVLocalVendortInputDis").setValue("");
                this.getById("idSSVInsuranceVendortInput").setValue("");
                this.getById("idSSVMiscVendortInput").setValue("");
                this.getById("idBEInputDis").setValue("");
                this.getById("fileUploader").setValue("");
                // Setting the model for Upload Button Active or not
                this.setModelProperty("uploadChaFileModel", "isChaFileFilled", false);
                this.setModelProperty("uploadChaFileModel", "isPlantFilled", false);
                this.setModelProperty("uploadChaFileModel", "isPOVendorFilled", false);
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


                this.getView().getModel("InvoiceManage").setData([]);
                this.getView().getModel("InvoiceManage").refresh(true);

                this.getView().getModel("ValidatedModel").setData([]);
                this.getView().getModel("ValidatedModel").refresh(true);

                this.getView().getModel("MappingData").setData([]);
                this.getView().getModel("MappingData").refresh(true);
                this.getView().getModel("ManageData").setData([]);
                this.getView().getModel("ManageData").refresh(true);

                this.byId("idValidateBtn").setEnabled(false);
                this.byId("idProceedToInvoicePosting").setEnabled(false);
            },
        });
    });
