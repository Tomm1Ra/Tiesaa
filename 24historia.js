const axios = require('axios');
const moment = require ('moment');


async function getAsemaInfo(id) {
    sensor = {}
    const getResponse = await axios
     .get(`https://tie.digitraffic.fi/api/weather/v1/stations/${id}`)
     .then((response) => response)
    .catch((e)=> console.log("Virhe tuntematon asema",id))
    if (getResponse) {
        return getResponse.data
    } else return null;

}
async function getSensoriInfo(id) {
    sensor = {}
    const getResponse = await axios
    .get(`https://tie.digitraffic.fi/api/weather/v1/sensors?lastUpdated=false`  , {timeout: 15000})
    .then((response) => response)
    .catch((e)=> console.log("Virhe ",e))

    for (item of getResponse.data.sensors) {
        if (item.id == id) {
            sensor.unit = item.unit
            sensor.name = item.descriptions.fi
        }
    }
    return sensor
}

async function getHistory(id,sensor) {
    startTime = moment().subtract(1, 'days').toISOString();
    endTime = moment().toISOString();
    const getResponse = await axios
    .get(`https://tie.digitraffic.fi/api/weather/v1/stations/${id}/data/history?sensorId=${sensor}&from=${startTime}&to=${endTime}` , {timeout: 15000})
    .then((response) => response)
    .catch((e)=> console.log("Tuntematon asema ",id,e))
    if (getResponse) {
        return getResponse.data
    } else return null;
}

async function start(consoleline) {
    id = consoleline[2].match(/[0-9]+/)
    sensorId = consoleline[3].match(/[0-9]+/)
    if (consoleline[4]) {d=consoleline[4];} else {d = 1;}
    colWidth=9;
    h='30';
    line = ""
    note = "";
    lineCount = 0;
    header = " h/m"

    asemaData = await getAsemaInfo(id)
    console.log(id[0],asemaData.properties.names.fi)

    sensoriData = await getSensoriInfo(sensorId)
    console.log(sensoriData.name,"("+sensoriData.unit+")")

    history = await getHistory(id,sensorId)

    //console.log(JSON.stringify(history))
    const startHour = moment(history.values[0].measuredTime).format('H');
    const startDay = moment(history.values[0].measuredTime).format('DD');
    hourOn = parseInt(startHour);
    dayOn = parseInt(startDay);
    
    console.log("Alkaa: "+moment(history.values[0].measuredTime).format('DD.MM.YYYY HH:mm'));
    
    for (let a=0;a<=59;a+=5) {
        header +=  ((a+"").padStart(2)+"-"+((a+4)+"").padStart(2)).padStart(colWidth)
    }
    console.log("\n"+header)
/*     for (item of history.values) {
        if (moment(item.measuredTime).format('H') != h)
            {
                if (h!='30') console.log((h+":").padStart(3,' '),line.padStart(12*colWidth,' '))
                h = moment(item.measuredTime).format('H')
                line =""
            }
            line += (item.value.toFixed(d)+"").padStart(colWidth,' ')
    }
    console.log((h+":").padStart(3,' '),line) */
    for( h=hourOn ; h < hourOn+25 ; h++ ) { 
        hx = h > 23 ? h-24 : h ;
        dx = h > 23 ?  moment(history.values[0].measuredTime).add(1, 'days').format('DD') : startDay ;
        //console.log(dx,hx);
        for (item of history.values) {
            if (moment(item.measuredTime).format('H') == hx && moment(item.measuredTime).format('DD') == dx) {
                if (lineCount <= 11) {
                    line += (item.value.toFixed(d)+"").padStart(colWidth,' ')
                }
                lineCount++;
            }
        }
        if (lineCount > 12) note = " *";
        if (dx == startDay && h < hourOn +24) {
            console.log((hx+":").padStart(3,' '),line.padStart(12*colWidth,' ') + note)
        } else {
            console.log((hx+":").padStart(3,' '),line.padEnd(12*colWidth,' ') + note)
        }

        line = "";
        note = "";
        lineCount=0;
    }
}

if (process.argv.length > 3 ) {
    start(process.argv);
} else {
    console.log(" Edellisen 24h mittaustulokset 5min välein")
    console.log(" Parametrit: AsemaId SensorId [desimal]")
}
