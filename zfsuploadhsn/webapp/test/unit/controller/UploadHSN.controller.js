/*global QUnit*/

sap.ui.define([
	"customdutyuiuploadhsn/zfsuploadhsn/controller/UploadHSN.controller"
], function (Controller) {
	"use strict";

	QUnit.module("UploadHSN Controller");

	QUnit.test("I should test the UploadHSN controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
