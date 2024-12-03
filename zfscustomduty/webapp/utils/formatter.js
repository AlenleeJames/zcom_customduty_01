sap.ui.define([], function () {
	"use strict";
	return {
		
	/*Formatter Function*/
		
		formatStatusState: function(status) {
		    switch (status) {
		      case "Success":
		        return "Success"; // Green status
		      case "Error":
		        return "Error"; // Yellow status	
			  case "Warning":
				return "Warning"; // Yellow status
		      default:
		        return "None";    // Default (no color)
		    }
		  },
		  
		  formatStatusIcon: function(status) {
		    switch (status) {		     
		      case "Success":
		        return "sap-icon://status-positive"; // Green icon		     
		      case "Error":
		        return "sap-icon://status-negative"; // Red icon
				case "Warning":
					return "sap-icon://message-warning"; // Default icon (gray)
		      default:
		        return "sap-icon://status-inactive"; // Default icon (gray)
		    }
		  }

	};
});
