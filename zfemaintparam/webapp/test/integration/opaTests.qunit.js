sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'customduty/ui/param/zfemaintparam/test/integration/FirstJourney',
		'customduty/ui/param/zfemaintparam/test/integration/pages/CustomDutyParamList',
		'customduty/ui/param/zfemaintparam/test/integration/pages/CustomDutyParamObjectPage'
    ],
    function(JourneyRunner, opaJourney, CustomDutyParamList, CustomDutyParamObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('customduty/ui/param/zfemaintparam') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheCustomDutyParamList: CustomDutyParamList,
					onTheCustomDutyParamObjectPage: CustomDutyParamObjectPage
                }
            },
            opaJourney.run
        );
    }
);