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

function windDir(wd) {
    
    if (wd >  22 && wd <=  68) return "NE";
    if (wd >  68 && wd <= 113) return " E";
    if (wd > 113 && wd <= 158) return "SE";
    if (wd > 158 && wd <= 203) return " S";
    if (wd > 203 && wd <= 248) return "SW";
    if (wd > 248 && wd <= 293) return " W";
    if (wd > 293 && wd <= 338) return "NW";
    if (wd > 338 || wd <=  22) return " N";
    return "XX";
}

function getSpeedRange(values) {
    speeds = [];
    minSpeed=0, maxSpeed=0, avgSpeed=0;
    for (item of values) {
        speeds.push(item.value)
    }
    minSpeed = speeds.length > 0 ? Math.min(...speeds) : 0;
    maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
    avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b) / speeds.length : 0 ;
    return {minSpeed:minSpeed,maxSpeed:maxSpeed,avgSpeed:avgSpeed.toFixed(1)};
}

function getDirectionRange(values) {
    westBlock = [];
    eastBlock = [];
    avg360 = [];
    startDirection=0, endDirection=0;
    wbMin=0, wbMax=0, ebMin=0, ebMax=0, avg=0;
    for (item of values) {
        if (item.value <= 180) {
            eastBlock.push(item.value)
        } else {
            westBlock.push(item.value) 
        }
    }
    //console.log("W",westBlock)
    //console.log("E",eastBlock)
    if (eastBlock.length == 0) {
        startDirection = Math.min(...westBlock);
        endDirection = Math.max(...westBlock);
        
        avg = westBlock.length > 0 ? westBlock.reduce((a, b) => a + b) / westBlock.length : 0;
    }
    if (westBlock.length == 0) {
        startDirection = Math.min(...eastBlock);
        endDirection = Math.max(...eastBlock);
        avg = eastBlock.length > 0 ? eastBlock.reduce((a, b) => a + b) / eastBlock.length : 0;
    }
    if (westBlock.length > 0 && eastBlock.length > 0) {
        wbMin = Math.min(...westBlock);
        wbMax = Math.max(...westBlock);
        ebMin = Math.min(...eastBlock);
        ebMax = Math.max(...eastBlock);
        //console.log(wbMin,wbMax,ebMin,ebMax)
        if ((360-wbMin + ebMax) < (wbMax-ebMin)) {
            startDirection = Math.min(...westBlock);
            endDirection = Math.max(...eastBlock);
        } else {
            startDirection = Math.min(...eastBlock);
            endDirection = Math.max(...westBlock);

        } 
        for (item of values) {
         avg360.push(item.value > 0 && item.value<startDirection ? item.value+360 : item.value);
         };
         avg = avg360.length > 0 ? avg360.reduce((a, b) => a + b) / avg360.length : 0;
         if (avg > 360) avg-=360;
    }
    return {start:startDirection,end:endDirection,avg:avg.toFixed(0)};

}

function printHistory(history) {
    colWidth=9;
    h='30';
    line = ""
    header = " h/m"

    for (let a=0;a<=59;a+=5) {
        header +=  ((a+"").padStart(2)+"-"+((a+4)+"").padStart(2)).padStart(colWidth)
    }
    console.log("\n"+header)
    for (item of history.values) {
        if (moment(item.measuredTime).format('H') != h)
            {
                if (h!='30') console.log((h+":").padStart(3,' '),line.padStart(12*colWidth,' '))
                h = moment(item.measuredTime).format('H')
                line =""
            }
        line += (item.value+"").padStart(colWidth,' ')
        //console.log(item.measuredTime, item.value);
    }
    console.log((h+":").padStart(3,' '),line);
}

function printDaily(speed, maxSpeed, direction, parts) {
    colWidth =7;
    speedPart=[];
    directionPart=[];
    const startHour = moment(speed.values[0].measuredTime).format('H');
    const startDay = moment(speed.values[0].measuredTime).format('DD');
    hourOn = parseInt(startHour);
    dayOn = parseInt(startDay);

    //console.log(startHour, hourOn,startDay,moment(),speed.values[0].measuredTime);
    hx=0;
    console.log(" ".padStart(3,' '),"    Keskituuli".padEnd(colWidth*3,' '), "      Maksimi tuuli".padEnd(colWidth*3,' '),"       Tuulen suunta");
    console.log("h".padStart(3,' '), "min".padStart(colWidth,' '),"max".padStart(colWidth,' '),"ka.".padStart(colWidth,' '), 
        "min".padStart(colWidth,' '),"max".padStart(colWidth,' '),"ka.".padStart(colWidth,' '),
        " alku".padStart(colWidth,' ')," loppu".padStart(colWidth,' '),"ka.".padStart(colWidth,' '));
    for( h=hourOn ; h < hourOn+25 ; h++ ) { 
        speedPart=[];
        maxSpeedPart=[];
        directionPart=[];
        hx = h > 23 ? h-24 : h ;
        dx = h > 23 ?  moment(speed.values[0].measuredTime).add(1, 'days').format('DD') : startDay ;
        for (item of speed.values) {
            if (moment(item.measuredTime).format('H') == hx && moment(item.measuredTime).format('DD') == dx) {
                speedPart.push(item);
            }
        }

        for (item of maxSpeed.values) {
            if (moment(item.measuredTime).format('H') == hx && moment(item.measuredTime).format('DD') == dx) {
                maxSpeedPart.push(item);
            }
        }

        for (item of direction.values) {
            if (moment(item.measuredTime).format('H') == hx && moment(item.measuredTime).format('DD') == dx) {
                directionPart.push(item);
            }
        }
        speedRange = getSpeedRange(speedPart);
        maxSpeedRange = getSpeedRange(maxSpeedPart);
        directionRange = getDirectionRange(directionPart);

        console.log((hx+"").padStart(3,' '),(speedRange.minSpeed.toFixed(1)+"").padStart(colWidth,' '),(speedRange.maxSpeed.toFixed(1)+"").padStart(colWidth,' '),(speedRange.avgSpeed+"").padStart(colWidth,' '),
        (maxSpeedRange.minSpeed.toFixed(1)+"").padStart(colWidth,' '),(maxSpeedRange.maxSpeed.toFixed(1)+"").padStart(colWidth,' '),(maxSpeedRange.avgSpeed+"").padStart(colWidth,' '),
        (directionRange.start+"").padStart(colWidth,' '),(directionRange.end+"").padStart(colWidth,' '),(directionRange.avg+"").padStart(colWidth,' '),windDir(directionRange.avg));

    }


}

async function start(consoleline) {
    id = consoleline[2].match(/[0-9]+/)
    voimakkuusAnturi = "16";
    puuskaAnturi = "17";
    suuntaAnturi = "18";
    if (consoleline[4]) {d=consoleline[4];} else {d = 1;}

    asemaData = await getAsemaInfo(id)
    console.log(id[0],asemaData.properties.names.fi)

    sensoriMTuuli = await getSensoriInfo(voimakkuusAnturi)
    console.log("\n"+sensoriMTuuli.name,"("+sensoriMTuuli.unit+")")

    historySpeed = await getHistory(id,voimakkuusAnturi)
    printHistory(historySpeed)


    sensoriMTuuli = await getSensoriInfo(puuskaAnturi)
    console.log("\n"+sensoriMTuuli.name,"("+sensoriMTuuli.unit+")")

    historyMaxSpeed = await getHistory(id,puuskaAnturi)
    printHistory(historyMaxSpeed)

    sensoriTSuunt = await getSensoriInfo(suuntaAnturi)
    console.log("\n"+sensoriTSuunt.name,"("+sensoriTSuunt.unit+")")

    historyDirection = await getHistory(id,suuntaAnturi)
    printHistory(historyDirection)

    console.log("\n\n Tuntikohtaiset rajat")
    printDaily(historySpeed, historyMaxSpeed, historyDirection)
    
    dailyDir = getDirectionRange(historyDirection.values);
    dailySpeed = getSpeedRange(historySpeed.values);
    dailyMaxSpeed = getSpeedRange(historyMaxSpeed.values);
    console.log("\n:::",(dailySpeed.minSpeed+"").padStart(colWidth,' '), (dailySpeed.maxSpeed+"").padStart(colWidth,' '), (dailySpeed.avgSpeed+"").padStart(colWidth,' '), 
               (dailyMaxSpeed.minSpeed+"").padStart(colWidth,' '), (dailyMaxSpeed.maxSpeed+"").padStart(colWidth,' '), (dailyMaxSpeed.avgSpeed+"").padStart(colWidth,' '), 
               (dailyDir.start+"").padStart(colWidth,' '), (dailyDir.end+"").padStart(colWidth,' '), (dailyDir.avg+"").padStart(colWidth,' '), windDir(dailyDir.avg));
    

}

if (process.argv.length > 2 ) {
    start(process.argv);
} else {
    console.log(" Edellisen 24h tuulimittaukset")
    console.log(" Parametrit: AsemaId ")
}