sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'zfsfieldmapping/test/integration/FirstJourney',
		'zfsfieldmapping/test/integration/pages/CustomDutyFieldMappingList',
		'zfsfieldmapping/test/integration/pages/CustomDutyFieldMappingObjectPage'
    ],
    function(JourneyRunner, opaJourney, CustomDutyFieldMappingList, CustomDutyFieldMappingObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('zfsfieldmapping') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheCustomDutyFieldMappingList: CustomDutyFieldMappingList,
					onTheCustomDutyFieldMappingObjectPage: CustomDutyFieldMappingObjectPage
                }
            },
            opaJourney.run
        );
    }
);