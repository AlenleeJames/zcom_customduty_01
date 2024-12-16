sap.ui.define([
    "sap/m/MessageToast"
], function(MessageToast) {
    'use strict';

    return {
        uploadFields: function(oEvent) {
            MessageToast.show("Custom handler invoked.");
        }
    };
});
