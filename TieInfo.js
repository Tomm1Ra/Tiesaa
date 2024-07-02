const axios = require('axios');
const moment = require ('moment');

async function getLiikenneInfo() {
    const getResponse = await axios
    .get(`https://tie.digitraffic.fi/api/traffic-message/v1/messages?inactiveHours=0&includeAreaGeometry=false&situationType=TRAFFIC_ANNOUNCEMENT`  , {timeout: 15000})
    .then((response) => response)
    .catch((e)=> console.log("Virhe ",e))
    return getResponse.data
}

async function start(consoleline) {

        let liikenneData = await getLiikenneInfo()
            if (liikenneData) {
                for (tapaus of liikenneData.features) {
                    ajankohta = moment(tapaus.properties.releaseTime).format("D.M.YYYY H:mm")
                    for (tieto of tapaus.properties.announcements) {
                        console.log("\n"+tieto.locationDetails.roadAddressLocation.primaryPoint.province,tieto.locationDetails.roadAddressLocation.primaryPoint.municipality,ajankohta)
                        console.log(tieto.title)
                        console.log(tieto.location.description)
                        for (feature of tieto.features) {
                            if (feature.quantity) {
                                console.log(feature.name,feature.quantity,feature.unit)
                            } else {
                                console.log(feature.name)
                            }
                        }
                        if (tieto.comment) console.log(tieto.comment)
                    }
                }
            }
}

start(process.argv);