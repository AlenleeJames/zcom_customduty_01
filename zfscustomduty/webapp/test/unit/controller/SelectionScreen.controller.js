/*global QUnit*/

sap.ui.define([
	"customdutyuiinvoiceposting/zfscustomduty/controller/SelectionScreen.controller"
], function (Controller) {
	"use strict";

	QUnit.module("SelectionScreen Controller");

	QUnit.test("I should test the SelectionScreen controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
