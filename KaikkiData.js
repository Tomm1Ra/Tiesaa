const axios = require('axios');

async function getAsemaInfo(id) {
    const getResponse = await axios
    .get(`https://tie.digitraffic.fi/api/weather/v1/stations/${id}` , {timeout: 1000})
    .then((response) => response)
    .catch((e)=> console.log("Tuntematon asema ",id))
    if (getResponse) {
        return getResponse.data
    } else return null;
}

async function getAsemaSaaInfo(id)  {
    const getResponse = await axios
        .get(`https://tie.digitraffic.fi/api/weather/v1/stations/${id}/data`, {timeout: 1000})
        .then((response) => response)
        .catch((e)=> {console.log("Tuntematon asema saa ",id)})
     //console.log("STATUS "+getResponse.status)   
    if (getResponse && getResponse.status == 200){
        return getResponse.data
    } else return ""
}

async function start(consoleline) {
    id = consoleline[2].match(/[0-9]+/)
    let asemaData = await getAsemaInfo(id)
        if (asemaData) {
            console.log(asemaData.id,asemaData.properties.names.fi,asemaData.properties.municipality,asemaData.properties.province,"("+asemaData.properties.roadAddress.contractArea+")")
        }
        let asemaMeasures = await getAsemaSaaInfo(id)
        if (asemaMeasures) {
            //console.log(asemaSensorValues)
            searchString = (consoleline[3]) ? consoleline[3] : ""
            asemaMeasures.sensorValues.forEach((sensorValue) => {
                s = sensorValue.shortName + sensorValue.name + sensorValue.unit + sensorValue.id
                desc = sensorValue.sensorValueDescriptionFi ? sensorValue.sensorValueDescriptionFi:""
                if (s.toLowerCase().includes(searchString.toLowerCase()))
                    console.log(sensorValue.id, sensorValue.shortName, sensorValue.name, sensorValue.value, sensorValue.unit, desc)
            })
        }
}

start(process.argv);