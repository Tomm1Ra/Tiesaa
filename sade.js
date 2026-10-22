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
    prev = 0;
    rainBeforeZero = 0;
    if (last!=9999) fullData.push(last);
    for (item of data) {
        if (item.value < prev) rainBeforeZero = prev;
        fullData.push(beforeZero + item.value + rainBeforeZero);
        prev = item.value;
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

function print24History(history, rain5min) {
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
        if (rain5min == true) {
            line += (item.rain5min+"").padStart(colWidth,' ')
        } else {
            line += (item.value+"").padStart(colWidth,' ')
        }
    }
    console.log((h+":").padStart(3,' '),line);
}

function getValueFromHistory(history) {
  
    fullData =[];
    prev = -1;
    for (item of history.values) {
        if (prev == -1) {
            fullData.push(0);
        } else {
            if (item.value < prev) {
                fullData.push(item.value);
            } else {
                fullData.push(item.value - prev);
            }
        }
        prev = item.value;
    }
    a = 0;
    for (item of history.values) {
        item.rain5min = fullData[a].toFixed(1);
        a++;
    }
    return history;
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
    maxVrk5Min = getMaxPeriod(-1*historySumma.values[0].value,0,historySumma.values,1);
    maxVrk10Min = getMaxPeriod(-1*historySumma.values[0].value,0,historySumma.values,2);
    maxVrk15Min = getMaxPeriod(-1*historySumma.values[0].value,0,historySumma.values,3);
    maxVrk30Min = getMaxPeriod(-1*historySumma.values[0].value,0,historySumma.values,6);
    maxVrk1h = getMaxPeriod(-1*historySumma.values[0].value,0,historySumma.values,12);
    maxVrk2h = getMaxPeriod(-1*historySumma.values[0].value,0,historySumma.values,24);
    maxVrk6h = getMaxPeriod(-1*historySumma.values[0].value,0,historySumma.values,72);
    maxIntency = getMaxValue(historyIntensy);
        console.log("\nVoimakkain sade", (maxIntency.v.toFixed(2)+" mm/h").padStart(3*colWidth-1,' '), (maxIntency.v>0?moment(maxIntency.d).format('HH:mm'):""));
        console.log("Vuorokauden max  5min ",maxVrk5Min.v.toFixed(1).padStart(colWidth,' ') + " mm" + (maxVrk5Min.v>0?moment(historySumma.values[maxVrk5Min.i-1].measuredTime).format('HH:mm').padStart(colWidth,' ') + ' -'+ moment(historySumma.values[maxVrk5Min.i-1+1].measuredTime).format('HH:mm').padStart(colWidth,' ')  :"").padStart(colWidth,' '));
        console.log("Vuorokauden max 10min ",maxVrk10Min.v.toFixed(1).padStart(colWidth,' ') + " mm" + (maxVrk10Min.v>0?moment(historySumma.values[maxVrk10Min.i-1].measuredTime).format('HH:mm').padStart(colWidth,' ') + ' -'+ moment(historySumma.values[maxVrk10Min.i-1+2].measuredTime).format('HH:mm').padStart(colWidth,' ')  :"").padStart(colWidth,' '));
        console.log("Vuorokauden max 15min ",maxVrk15Min.v.toFixed(1).padStart(colWidth,' ') + " mm" + (maxVrk15Min.v>0?moment(historySumma.values[maxVrk15Min.i-1].measuredTime).format('HH:mm').padStart(colWidth,' ') + ' -'+ moment(historySumma.values[maxVrk15Min.i-1+3].measuredTime).format('HH:mm').padStart(colWidth,' ')  :"").padStart(colWidth,' '));
        console.log("Vuorokauden max 30min ",maxVrk30Min.v.toFixed(1).padStart(colWidth,' ') + " mm" + (maxVrk30Min.v>0?moment(historySumma.values[maxVrk30Min.i-1].measuredTime).format('HH:mm').padStart(colWidth,' ') + ' -'+ moment(historySumma.values[maxVrk30Min.i-1+6].measuredTime).format('HH:mm').padStart(colWidth,' ')  :"").padStart(colWidth,' '));
        console.log("Vuorokauden max  1h   ",maxVrk1h.v.toFixed(1).padStart(colWidth,' ') + " mm" + (maxVrk1h.v>0?moment(historySumma.values[maxVrk1h.i-1].measuredTime).format('HH:mm').padStart(colWidth,' ') + ' -'+ moment(historySumma.values[maxVrk1h.i-1+12].measuredTime).format('HH:mm').padStart(colWidth,' ')  :"").padStart(colWidth,' '));
        console.log("Vuorokauden max  2h   ",maxVrk2h.v.toFixed(1).padStart(colWidth,' ') + " mm" + (maxVrk2h.v>0?moment(historySumma.values[maxVrk2h.i-1].measuredTime).format('HH:mm').padStart(colWidth,' ') + ' -'+ moment(historySumma.values[maxVrk2h.i-1+24].measuredTime).format('HH:mm').padStart(colWidth,' ')  :"").padStart(colWidth,' '));
        console.log("Vuorokauden max  6h   ",maxVrk6h.v.toFixed(1).padStart(colWidth,' ') + " mm" + (maxVrk6h.v>0?moment(historySumma.values[maxVrk6h.i-1].measuredTime).format('HH:mm').padStart(colWidth,' ') + ' -'+ moment(historySumma.values[maxVrk6h.i-1+72].measuredTime).format('HH:mm').padStart(colWidth,' ')  :"").padStart(colWidth,' '));
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
        historyIntensy = await getHistory(id,voimakkuusAnturi)

        sensoriSumma = await getSensoriInfo(kertymaAnturi)
        historySumma = await getHistory(id,kertymaAnturi)

        sensori24h = await getSensoriInfo(summa24Anturi)
        history24h = await getHistory(id,summa24Anturi)


        if (consoleline.length >3) {
            console.log("\n"+sensoriVoimakkuus.name,"("+sensoriVoimakkuus.unit+")")
            print24History(historyIntensy)
            console.log("\n"+sensoriSumma.name,"("+sensoriSumma.unit+")")
            print24History(historySumma)
            console.log("\n"+sensori24h.name,"("+sensori24h.unit+")")
            print24History(history24h)
            historyPer5min = getValueFromHistory(historySumma);
            console.log("\n Sade per 5min")
            print24History(historyPer5min, true)
        }

    console.log("\n\n Tuntikohtaiset rajat")
    printSadeDaily(historyIntensy, historySumma, history24h)

}

if (process.argv.length > 2 ) {
    start(process.argv);
} else {
    console.log(" Edellisen 24h sademittaukset")
    console.log(" Parametrit: AsemaId ")
}