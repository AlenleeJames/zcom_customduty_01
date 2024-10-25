sap.ui.define([
    "sap/ui/thirdparty/jquery"
], function (jQuery) {
    'use strict';
    return {
        getPersoData: function(){
            const deferred = new jQuery.Deferred();
            deferred.resolve(this._persoData || {});
            return deferred.promise();
        },
        
        setPersoData: function(persData){
            const deferred = new jQuery.Deferred();
            this._persoData = persData;
            deferred.resolve();
            return deferred.promise();
        },
        
        getPersoData: function(){
            const deferred = new jQuery.Deferred();
            deferred.resolve();
            return deferred.promise();
        }
    }
});

