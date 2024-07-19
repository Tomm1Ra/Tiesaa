const axios = require('axios');

async function getSensoriInfo() {
    const getResponse = await axios
    .get(`https://tie.digitraffic.fi/api/weather/v1/sensors?lastUpdated=false`  , {timeout: 15000})
    .then((response) => response)
    .catch((e)=> console.log("Virhe ",e))
    return getResponse.data
}

async function start(consoleline) {

        let sensoriData = await getSensoriInfo()
            if (sensoriData) {
                for (sensori of sensoriData.sensors) {
                    console.log(sensori.id,sensori.shortName,sensori.name,sensori.unit,sensori.descriptions.fi)
                }
            }
}

start(process.argv);