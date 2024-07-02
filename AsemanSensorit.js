const axios = require('axios');

async function getSaaasemat() {
    const asemat = await axios
            .get('https://tie.digitraffic.fi/api/weather/v1/stations?lastUpdated=false&state=ACTIVE')
            .then((response) => response)
            .catch((e)=> console.log("invalid request",e))
            return asemat.data
        }

async function getAsemaInfo(id) {
    const getResponse = await axios
    .get(`https://tie.digitraffic.fi/api/weather/v1/stations/${id}` , {timeout: 15000})
    .then((response) => response)
    .catch((e)=> console.log("Tuntematon asema ",id))
    return getResponse.data
}

async function start(consoleline) {

    infoData = await getSaaasemat();
    if (infoData) {
        await Promise.all(infoData.features.map(async (asema) => {
            let asemaData = await getAsemaInfo(asema.properties.id)
                if (asemaData) {
                    const s = asemaData.properties.id+" "+asemaData.properties.names.fi+" "+asemaData.properties.sensors;
                    console.log(s);
                
                }
            }))
        }
}

start(process.argv);