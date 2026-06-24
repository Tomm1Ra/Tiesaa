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

function getMaxPeriod(beforeZero, last, data, step) {
    maxPeriod = 0;
    maxIndex = 0;
    fullData =[];
    if (last!=9999) fullData.push(last);
    for (item of data) {
        fullData.push(beforeZero + item.value)
    }
    if (fullData.length > step) {
        for (var i = 0; i < fullData.length - step; i++) {
            //console.log(i,step,fullData[i],fullData[i+step]);
            maxPeriod = Math.max(maxPeriod, fullData[i+step] -fullData[i])
            if (maxPeriod == (fullData[i+step] -fullData[i])) maxIndex = i;
        }
    } else {
        maxPeriod = fullData[fullData.length-1] -fullData[0];
        maxIndex = 0;
    }
    //console.log({v:maxPeriod,i:maxIndex});
    return {v:maxPeriod,i:maxIndex};
}

function getRange(lastMax ,measures) {
    values = [];
    minIntensy=0, maxIntensy=0, avgIntensy=0;
    for (item of measures) {
        values.push(item.value)
    }
    minValue = values.length > 0 ? Math.min(...values) : 0;
    maxValue = values.length > 0 ? Math.max(...values) : 0;
    avgValue = values.length > 0 ? values.reduce((a, b) => a + b) / values.length : 0 ;
    hourRain = lastMax == 9999 ? maxValue : maxValue - lastMax ;
    return {hourRain:hourRain, minValue:minValue, maxValue:maxValue, avgValue:avgValue};
}

function getMaxValue(history) {
    maxValue =  0;
    maxValueTime = null;
    for (item of history.values) {
        if (item.value > maxValue) {
            maxValue = item.value;
            maxValueTime = item.measuredTime;
        }
    }
    return {v:maxValue,d:maxValueTime};

}


function printintensyHistory(history) {
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

function printSadeDaily(historyIntensy, historySumma, history24h) {
    colWidth =7;

    const startHour = moment(historySumma.values[0].measuredTime).format('H');
    const startDay = moment(historySumma.values[0].measuredTime).format('DD');
    hourOn = parseInt(startHour);
    dayOn = parseInt(startDay);

    //console.log(startHour, hourOn,startDay,moment(),intensy.values[0].measuredTime);
    hx=0;
    console.log(" ".padStart(3,' '),"    Sade".padEnd(colWidth*3,' '), "      Maksimi sade".padEnd(colWidth*3,' '));
    console.log("h".padStart(3,' '), "sum".padStart(colWidth,' '),"24h".padStart(colWidth,' '),"/h".padStart(colWidth,' '), 
        "mm/h".padStart(colWidth,' '),"max10min".padStart(colWidth,' '),"max20min".padStart(colWidth*2,' '));
    lastMax=9999;
    beforeZero = 0;
    for( h=hourOn ; h < hourOn+25 ; h++ ) { 
        summaPart=[];
        history24Part=[];
        intensyPart=[];
        hx = h > 23 ? h-24 : h ;
        dx = h > 23 ?  moment(historySumma.values[0].measuredTime).add(1, 'days').format('DD') : startDay ;
        for (item of historySumma.values) {
            if (moment(item.measuredTime).format('H') == hx && moment(item.measuredTime).format('DD') == dx) {
                summaPart.push(item);
            }
        }

        for (item of history24h.values) {
            if (moment(item.measuredTime).format('H') == hx && moment(item.measuredTime).format('DD') == dx) {
                history24Part.push(item);
            }
        }

        for (item of historyIntensy.values) {
            if (moment(item.measuredTime).format('H') == hx && moment(item.measuredTime).format('DD') == dx) {
                intensyPart.push(item);
            }
        }
        summaRange = getRange(lastMax, summaPart);
        history24Range = getRange(lastMax, history24Part);
        intensyRange = getRange(lastMax, intensyPart);
        beforeZero =  summaRange.minValue < lastMax  && lastMax != 9999 && beforeZero == 0 ? lastMax : beforeZero;
        max10MinPerH = getMaxPeriod(beforeZero, lastMax,summaPart,2)
        max20MinPerH = getMaxPeriod(beforeZero, lastMax,summaPart,4)
        lastMax = summaRange.maxValue + beforeZero;
        intensyRange = getRange(0, intensyPart);
        
//console.log(beforeZero , lastMax);
        console.log((hx+"").padStart(3,' '),((beforeZero + summaRange.maxValue).toFixed(1)+"").padStart(colWidth,' '),(history24Range.maxValue.toFixed(1)+"").padStart(colWidth,' '), (beforeZero + summaRange.hourRain).toFixed(1).padStart(colWidth,' ')+ 
        (intensyRange.maxValue.toFixed(2)+"").padStart(colWidth,' ') + 
        (max10MinPerH.v.toFixed(1)+"").padStart(colWidth,' ') + (max10MinPerH.v>0?moment(summaPart[max10MinPerH.i].measuredTime).format('HH:mm').padStart(colWidth,' '):"").padStart(colWidth,' ') + 
        (max20MinPerH.v.toFixed(1)+"").padStart(colWidth,' ') + (max20MinPerH.v>0?moment(summaPart[max20MinPerH.i].measuredTime).format('HH:mm').padStart(colWidth,' '):"").padStart(colWidth,' '));
        //(maxIntensyRange.minIntensy.toFixed(1)+"").padStart(colWidth,' '),(maxIntensyRange.maxIntensy.toFixed(1)+"").padStart(colWidth,' '),(maxIntensyRange.avgIntensy+"").padStart(colWidth,' '));
        //(directionRange.start+"").padStart(colWidth,' '),(directionRange.end+"").padStart(colWidth,' '),(directionRange.avg+"").padStart(colWidth,' '),windDir(directionRange.avg));
    }
    maxVrk10Min = getMaxPeriod(-1*historySumma.values[0].value,0,historySumma.values,2);
    maxVrk30Min = getMaxPeriod(-1*historySumma.values[0].value,0,historySumma.values,6);
    maxVrk60Min = getMaxPeriod(-1*historySumma.values[0].value,0,historySumma.values,12);
    maxVrk120Min = getMaxPeriod(-1*historySumma.values[0].value,0,historySumma.values,24);
    maxIntency = getMaxValue(historyIntensy);
        console.log("\nVoimakkain sade", (maxIntency.v+" mm/h").padStart(3*colWidth-1,' '), moment(maxIntency.d).format('HH:mm'));
        console.log("Vuorokauden max 10min ",maxVrk10Min.v.toFixed(1).padStart(colWidth,' ') + " mm" + (maxVrk10Min.v>0?moment(historySumma.values[maxVrk10Min.i].measuredTime).format('HH:mm').padStart(colWidth,' '):"").padStart(colWidth,' '));
        console.log("Vuorokauden max 30min ",maxVrk30Min.v.toFixed(1).padStart(colWidth,' ') + " mm" + (maxVrk30Min.v>0?moment(historySumma.values[maxVrk30Min.i].measuredTime).format('HH:mm').padStart(colWidth,' '):"").padStart(colWidth,' '));
        console.log("Vuorokauden max  1h   ",maxVrk60Min.v.toFixed(1).padStart(colWidth,' ') + " mm" + (maxVrk60Min.v>0?moment(historySumma.values[maxVrk60Min.i].measuredTime).format('HH:mm').padStart(colWidth,' '):"").padStart(colWidth,' '));
        console.log("Vuorokauden max  2h   ",maxVrk120Min.v.toFixed(1).padStart(colWidth,' ') + " mm" + (maxVrk120Min.v>0?moment(historySumma.values[maxVrk120Min.i].measuredTime).format('HH:mm').padStart(colWidth,' '):"").padStart(colWidth,' '));


}

async function start(consoleline) {
    id = consoleline[2].match(/[0-9]+/)
    voimakkuusAnturi = "23";
    kertymaAnturi = "24";
    summa24Anturi = "215";
    if (consoleline[4]) {d=consoleline[4];} else {d = 1;}

    asemaData = await getAsemaInfo(id)
    console.log(id[0],asemaData.properties.names.fi)

     
        sensoriVoimakkuus = await getSensoriInfo(voimakkuusAnturi)
        if (consoleline.length >3) console.log("\n"+sensoriVoimakkuus.name,"("+sensoriVoimakkuus.unit+")")

        historyIntensy = await getHistory(id,voimakkuusAnturi)
        if (consoleline.length >3) printintensyHistory(historyIntensy)

        sensoriSumma = await getSensoriInfo(kertymaAnturi)
        if (consoleline.length >3) console.log("\n"+sensoriSumma.name,"("+sensoriSumma.unit+")")

        historySumma = await getHistory(id,kertymaAnturi)
        if (consoleline.length >3) printintensyHistory(historySumma)

        sensori24h = await getSensoriInfo(summa24Anturi)
        if (consoleline.length >3) console.log("\n"+sensori24h.name,"("+sensori24h.unit+")")

        history24h = await getHistory(id,summa24Anturi)
        if (consoleline.length >3) printintensyHistory(history24h)
    

    console.log("\n\n Tuntikohtaiset rajat")
    printSadeDaily(historyIntensy, historySumma, history24h)
    
    //dailyDir = getDirectionRange(historyDirection.values);
/*     dailyIntensy = getIntensyRange(historyIntensy.values);
    dailyMaxIntensy = getIntensyRange(historyMaxIntensy.values);
    console.log("\n:::",(dailyIntensy.minIntensy+"").padStart(colWidth,' '), (dailyIntensy.maxIntensy+"").padStart(colWidth,' '), (dailyIntensy.avgIntensy+"").padStart(colWidth,' '), 
               (dailyMaxIntensy.minIntensy+"").padStart(colWidth,' '), (dailyMaxIntensy.maxIntensy+"").padStart(colWidth,' '), (dailyMaxIntensy.avgIntensy+"").padStart(colWidth,' ') ); */
               //(dailyDir.start+"").padStart(colWidth,' '), (dailyDir.end+"").padStart(colWidth,' '), (dailyDir.avg+"").padStart(colWidth,' '), windDir(dailyDir.avg));
    

}

if (process.argv.length > 2 ) {
    start(process.argv);
} else {
    console.log(" Edellisen 24h tuulimittaukset")
    console.log(" Parametrit: AsemaId ")
}