const {readFile} = require('fs.promises');
const axios = require('axios');
const distance = require('geo-dist');
const moment = require ('moment');

const fileRead = async(fileName) => {
    const result = await readFile(fileName, 'utf8')
    //console.log(result)
    return result;
}

async function lastHour(id,endTime,sensor) {
    startTime = moment(endTime).subtract(1, 'hours').toISOString();
    console.log(startTime,endTime)
    const getResponse = await axios
    .get(`https://tie.digitraffic.fi/api/beta/weather-history-data/${id}/${sensor}?from=${startTime}&to=${endTime}` , {timeout: 15000})
    .then((response) => response)
    .catch((e)=> console.log("Tuntematon asema ",id))
    if (getResponse) {
        return getResponse.data
    } else return null;
}


async function getHistory(id,sensor) {
    startTime = moment().subtract(1, 'days').toISOString();
    endTime = moment().toISOString();
    // console.log(startTime,endTime)
    const getResponse = await axios
    .get(`https://tie.digitraffic.fi/api/beta/weather-history-data/${id}/${sensor}?from=${startTime}&to=${endTime}` , {timeout: 15000})
    .then((response) => response)
    .catch((e)=> console.log("Tuntematon asema ",id))
    if (getResponse) {
        return getResponse.data
    } else return null;
}

async function getAsemaInfo(id) {
    const getResponse = await axios
    .get(`https://tie.digitraffic.fi/api/weather/v1/stations/${id}` , {timeout: 15000})
    .then((response) => response)
    .catch((e)=> console.log("Tuntematon asema ",id))
    if (getResponse) {
        return getResponse.data
    } else return null;
}

async function getAsemaInfoString(id) {
    const getResponse = await axios
    .get(`https://tie.digitraffic.fi/api/weather/v1/stations/${id}`, {timeout: 20000})
    .then((response) => response)
    .catch((e)=> console.log("Tuntematon asema id:",id))
    if (getResponse && getResponse.status == 200){
        return getResponse.data.properties.id+" "+getResponse.data.properties.names.fi+","+getResponse.data.properties.province+"@"+getResponse.data.geometry.coordinates[0]+","+getResponse.data.geometry.coordinates[1]+","+getResponse.data.geometry.coordinates[2];
    } else return "0000 Error @0,0"
}

async function getAsemaSaaInfo(id)  {
    const getResponse = await axios
        .get(`https://tie.digitraffic.fi/api/weather/v1/stations/${id}/data`, {timeout: 30000})
        .then((response) => response)
        .catch((e)=> {console.log("Tuntematon asema saa ",id)})
     //console.log("STATUS "+getResponse.status)   
    if (getResponse && getResponse.status == 200){
        return getResponse.data
    } else return ""

}


async function getAllSaaInfo() {
    const saaInfo = await axios
            .get('https://tie.digitraffic.fi/api/weather/v1/stations/data')
            .catch((e)=> console.log("invalid request",e))
            return saaInfo.data
        }

async function getSaaasemat() {
    const asemat = await axios
            .get('https://tie.digitraffic.fi/api/weather/v1/stations?lastUpdated=false&state=ACTIVE')
            .then((response) => response)
            .catch((e)=> console.log("invalid request",e))
            return asemat.data
        }

async function SaaAsematLista(searchString) {
    returnData ="";
    i=0;o=0;
    infoData = await getSaaasemat();
        if (infoData) {
            await Promise.all(infoData.features.map(async (asema) => {
                i++;
                id=asema.properties.id;
                let asemaData = await getAsemaInfo(id)
                if (asemaData) {
                    const s = asemaData.properties.id+" "+asemaData.properties.names.fi+","+asemaData.properties.province+"@"+asemaData.geometry.coordinates[0]+","+asemaData.geometry.coordinates[1]+","+asemaData.geometry.coordinates[2];
                        if (s.toLowerCase().includes(searchString.toLowerCase())) {
                            // console.log(">"+ ++o);
                            returnData += s+"*"
                    }
                }
            }))
        }
        //console.log("Return"+returnData);
        return returnData
}

function updateTime(dataMap) {
    upTime = dataMap.has("Ilma ")?dataMap.get("Ilma ").t:""
    return moment(upTime).locale("fi").format('llll')+"  "+moment(upTime).locale("fi").fromNow(); 
}

function getValueWithUnit(dataMap,label,type) {
    return dataMap.has(type)?label+dataMap.get(type).v+dataMap.get(type).u:""
}

function getValueNoUnit(dataMap,label,type) {
    return dataMap.has(type)?label+dataMap.get(type).v:""
}

function getDescription(dataMap,label,type) {
    return dataMap.has(type)?label+dataMap.get(type).d:""
}

function lampoLine(dataMap) {
    return ("Lämpötilat "
    + getValueWithUnit(dataMap," Ilma:","Ilma ")
    + getValueWithUnit(dataMap," ","DIlm")
    + getValueWithUnit(dataMap,"  Tie:","Tie1")+ getValueWithUnit(dataMap," ","DTie1")
    + getValueWithUnit(dataMap," ","Tie2") + getValueWithUnit(dataMap," ","DTie2")
    + getValueWithUnit(dataMap," ","Tie3") + getValueWithUnit(dataMap," ","DTie3")
    + getValueWithUnit(dataMap," ","Tie4") + getValueWithUnit(dataMap," ","DTie4")
    + getValueWithUnit(dataMap,"  Maa:","Maa1")
    + getValueWithUnit(dataMap," ","Maa2") 
    + getValueWithUnit(dataMap," ","Maa3") 
    + getValueWithUnit(dataMap," ","Maa4")
    + getValueWithUnit(dataMap," ","Run1"))
    
}

function tuuliLine(dataMap) {
    return ( "Tuuli "
    + getValueWithUnit(dataMap," Keski:","KTuuli")
    + getValueWithUnit(dataMap,"  Maksimi:","MTuuli")
    + getValueWithUnit(dataMap,"  Suunta:","TSuunt")
    + getValueWithUnit(dataMap,"  Ilmanpaine:", "IPaine" ))
    
}

function sadeLine(dataMap) {
    return (
      getDescription(dataMap,"Sade:","Sade")
    + getValueWithUnit(dataMap," Intensiteetti:","S-Int")
    + getValueWithUnit(dataMap," Summa:","S-Sum")
    + getDescription(dataMap," Olomuoto:","S-Olom")
    + getValueNoUnit(dataMap," Sadetila:","S-Tila") )
}

function keliLine(dataMap) {
    return (
        getDescription(dataMap,"Keli:","Keli1") + getDescription(dataMap," ","Keli2") + getDescription(dataMap," ","Keli3")
        +getDescription(dataMap," Varoitus1:","Varo1")
        +getDescription(dataMap," 2:","Varo2")+getDescription(dataMap," 3:","Varo3")+getDescription(dataMap," 4:","Varo4")
        +getValueWithUnit(dataMap," Lumensyvyys:","LumSyv") +getValueWithUnit(dataMap," ","Lumi_A") +getValueWithUnit(dataMap," ","Lumi_B")
        +getValueWithUnit(dataMap," ","Lumi_C") +getValueWithUnit(dataMap," ","LumiKA"))
}

function pisteLine(dataMap) {
    return (
      getValueWithUnit(dataMap,"Kastepiste:","KastP")
    + getValueWithUnit(dataMap," Jäätymispiste:","JääPi1") + getValueWithUnit(dataMap," ","JääPi2") + getValueWithUnit(dataMap," ","JääPi3") + getValueWithUnit(dataMap," ","JääPi4")
    + getValueWithUnit(dataMap," Kuurapiste:","KuuraP")
    + getValueWithUnit(dataMap," Ilmankosteus:","Koste") )
};

function suolaLine(dataMap) {
    return (
      getValueWithUnit(dataMap,"Kosteuden määrä:","KosMä1")
    + getValueWithUnit(dataMap,"  Suolan määrä:","SuoMä1") + getValueWithUnit(dataMap," ","SuoMä2")
    + getValueWithUnit(dataMap,"  Suolan väkevyys:","SuoVä1") + getValueWithUnit(dataMap," ","SuoVä2") )
}

function nakyLine(dataMap) {
    return (
      getValueWithUnit(dataMap,"Näkyvyys:","Näky_m") + getValueWithUnit(dataMap," ","Näk_km")
    + getValueNoUnit(dataMap," Aurinko:","Aurink")
    + getValueNoUnit(dataMap," Valoa:","Valoa?")
    + getValueNoUnit(dataMap," Sataa:","Sataa"))
}

function kitkaLine(dataMap) {
    return (
      "Kitka:"+getValueWithUnit(dataMap," ","Kitka1") + getValueWithUnit(dataMap," ","Kitka2")
    + "  Vettä:"+getValueWithUnit(dataMap," ","VedMä1") + getValueWithUnit(dataMap," ","VedMä2")
    + "  Lunta:"+getValueWithUnit(dataMap," ","LumMä1") + getValueWithUnit(dataMap," ","LumMä2")
    + "  Jäätä:"+getValueWithUnit(dataMap," ","JääMä1") + getValueWithUnit(dataMap," ","JääMä2") )
}

function miscLine(dataMap) {
    return (
      getValueNoUnit(dataMap,"\nAseman status:","Stat1") + getValueNoUnit(dataMap," ","Stat2") + getValueNoUnit(dataMap," Vika:","AntVik")
    + getValueNoUnit(dataMap,"  PWD status:","PWDsta") + getValueNoUnit(dataMap," tila:","PWDtil") + getValueNoUnit(dataMap," NäkTila:","PWDnäk") + getValueWithUnit(dataMap," ","PWDrbc") + getValueNoUnit(dataMap," ","PWDtbc")
    + getValueWithUnit(dataMap,"\nJohtavuus 1:","Joht1") + getValueWithUnit(dataMap," 2:","Joht2") + getValueWithUnit(dataMap," 3:","Joht3") + getValueWithUnit(dataMap," 4:","Joht4")
    + getValueWithUnit(dataMap," Pintasignaali 1:","PSig1") + getValueWithUnit(dataMap," 2:","PSig2") + getValueWithUnit(dataMap," 3:","PSig3") + getValueWithUnit(dataMap," 4:","PSig4")
    + getValueWithUnit(dataMap," Jäätaajuus 1:","JTaaj1") + getValueWithUnit(dataMap," 2:","JTaaj2") 
    + getValueNoUnit(dataMap,"\nTienpinta OPT 1:","TilaO1") + getValueNoUnit(dataMap," 2:","TilaO2")
    + getValueNoUnit(dataMap," Tila 1:","Tila1") + getValueNoUnit(dataMap," 2:","Tila2") + getValueNoUnit(dataMap," 3:","Tila3") + getValueNoUnit(dataMap," 4:","Tila4")
    + getValueNoUnit(dataMap," Optinen Keli 1:","KeliO1") + getDescription(dataMap," varoitus:","VaroO1") 
)

}
function ennusteLine(dataMap) {
    return (
        getValueNoUnit(dataMap,"Tuuli:","E-TSuu")
        +getValueNoUnit(dataMap,"Nopeus:","E-Tuul")
        +getValueNoUnit(dataMap,"Pilvisyys:","E-Pilv")
        +getValueNoUnit(dataMap,"Sade","E-SOlo")
        +getValueNoUnit(dataMap,"Inte","E-SInt")
        +getValueNoUnit(dataMap,"todnäk","E-STod")
        +getValueNoUnit(dataMap,"Ilma:","E-Ilma")
        +getValueNoUnit(dataMap,"Tie","E-Tie")
        +getValueNoUnit(dataMap,"KasteP","E-KasP")
        +getValueNoUnit(dataMap,"Sademäärä","E-SS1h")
)

}

function checkMeasureTime(measureTime)
{
    var time  =  moment(measureTime);

    var duration = moment.duration(moment().diff(time));
    var mins = duration.asMinutes();

    return mins>7?" *"+Math.floor(mins)+"* ":"";
}

async function getTiesaa(rawData,home,saatilat,detail,order,lineLimit,separator,showEmpty) {
    const saatilatMap = new Map();
    const tempNamesMap = new Map();
    const asemaSaatMap = new Map();
    lastIlmaTemp="N/A"
    lastTieTemp="N/A"
    latBase = home.latitude
    longBase = home.longitude
    saatilalines = saatilat.split('\n');
    for (line of saatilalines) {
        sId = line.match(/^([\d]+)/);
        sData = line.match(/(?<=\s)[^\]]+/);
        saatilatMap.set(sId[0],sData[0]);
    }
    perusLista=[];
    lines = rawData.split(separator);
    //console.log("LINES:"+lines)
    console.log("\n"+moment().format("D.M.YYYY H:mm"))
    header = " ".padEnd(46," ")+"Ilma".padStart(5," ")+"Min".padStart(7," ")+"Max".padStart(7," ")+"Kosteus".padStart(12," ")+"Tuuli".padStart(8," ")+"Näky".padStart(7," ")+"Sade24h".padStart(11," ")+"Sade" .padStart(8," ")
    //Haetaan aseman nimi ja paikka jos pelkkä numero listassa
    await Promise.all(lines.map(async (line) => {
        id = line.match(/^([\d]+)/);
        if (!line.includes('@') && line.length > 3 && id) {
            line2 = await getAsemaInfoString(id[0])
            tempNamesMap.set(line2.match(/^([\d]+)/)[0],line2);
        }
    }));

    try {
        allSaaInfo = await getAllSaaInfo() 
    } catch (err) {console.log("error",err)}

    for (asema of allSaaInfo.stations) {
        asemaSaatMap.set(asema.id,asema.sensorValues)
    }

    lines.forEach( (line) => {
        id = line.match(/^([\d]+)/);
        if (id) {
            // console.log("ID:"+id[0]);
            if (!line.includes('@')) { //haetaan nimi mapista
                line = tempNamesMap.get(id[0])
            }
            let asemaData = asemaSaatMap.get(parseInt(id[0]));
                if (asemaData) {
                    const sensorsMap = new Map();
                    for(const item of asemaData)  {
                        sensorsMap.set(item.shortName,{"t":item.measuredTime,"v":item.value,"u":item.unit,"d":item.sensorValueDescriptionFi})
                    }
                    lineSplit = line.split('@');
                    line = lineSplit[0];
                    fullName=line;
                    asm = fullName.split(' ')[0];
                    lati = 0;
                    longi = 0;
                    if (lineSplit[1]){
                        lati = lineSplit[1].split(',')[1];
                        longi = lineSplit[1].split(',')[0];
                    }
                    dist = distance(parseFloat(lati),parseFloat(longi),latBase,longBase).toFixed(1);
                    st=sensorsMap.has("Säätila")?sensorsMap.get("Säätila").v+"":"0";

                    line = (line.padEnd(50," ")).substring(45,line);
                    line += sensorsMap.has("Ilma ") ?((sensorsMap.get("Ilma ").v.toFixed(1))+sensorsMap.get("Ilma ").u).padStart(7," "):"N/A ".padStart(7," ")
                    line += sensorsMap.has("IlmMIN")?((sensorsMap.get("IlmMIN").v.toFixed(1))+sensorsMap.get("IlmMIN").u).padStart(8," "):"N/A ".padStart(8," ")
                    line += sensorsMap.has("IlmMAX")?((sensorsMap.get("IlmMAX").v.toFixed(1))+sensorsMap.get("IlmMAX").u).padStart(8," "):"N/A ".padStart(8," ")
                    line += sensorsMap.has("Koste")?(sensorsMap.get("Koste").v+sensorsMap.get("Koste").u).padStart(7," "):" N/A ".padStart(7," ")
                    line += sensorsMap.has("MTuuli")?((sensorsMap.get("MTuuli").v.toFixed(1))+sensorsMap.get("MTuuli").u).padStart(10," "):"N/A  ".padStart(10," ")
                    line += sensorsMap.has("Näky_m")?((sensorsMap.get("Näky_m").v)+sensorsMap.get("Näky_m").u).padStart(8," "):"N/A  ".padStart(8," ")
                    line += sensorsMap.has("Sad24h")?((sensorsMap.get("Sad24h").v).toFixed(1)+sensorsMap.get("Sad24h").u).padStart(9," "):"N/A ".padStart(9," ")
                    line += sensorsMap.has("S-Int")?((sensorsMap.get("S-Int").v.toFixed(2))+sensorsMap.get("S-Int").u).padStart(11," "):"N/A  ".padStart(11," ")
                    line += sensorsMap.has("IPaine")?((sensorsMap.get("IPaine").v.toFixed(2))+sensorsMap.get("IPaine").u).padStart(12," "):" "
                    line += sensorsMap.has("Ilma ") ?checkMeasureTime(sensorsMap.get("Ilma ").t):" "
                    lastIlmaTemp = sensorsMap.has("Ilma ") ?(sensorsMap.get("Ilma ").v.toFixed(1))+sensorsMap.get("Ilma ").u:"N/A";
                    lastTieTemp = sensorsMap.has("Tie1") ?(sensorsMap.get("Tie1").v.toFixed(1))+sensorsMap.get("Tie1").u:"N/A";

                    line += " "+saatilatMap.get(st);
                    perusLine=line
                    temp=sensorsMap.has("Ilma ") ?sensorsMap.get("Ilma ").v:order=='k'?99:-99;
                    rain=sensorsMap.has("Sad24h")?sensorsMap.get("Sad24h").v:0;
                    raini=sensorsMap.has("S-Int")?sensorsMap.get("S-Int").v:0;
                    wind=sensorsMap.has("MTuuli")?sensorsMap.get("MTuuli").v:0;
                    koste=sensorsMap.has("Koste")?sensorsMap.get("Koste").v:0;
                    ilmaMin=sensorsMap.has("IlmMIN")?sensorsMap.get("IlmMIN").v:99;
                    ilmaMax=sensorsMap.has("IlmMAX")?sensorsMap.get("IlmMAX").v:-99;
                    nakyvyys=sensorsMap.has("Näky_m")?sensorsMap.get("Näky_m").v:99999;
                    linelimit=1000;
                    perusLista.push({"data":perusLine, "asema":asm,"lon":longi,"lat":lati,"dist":dist,"temp":temp,"rain":rain,"raini":raini,"ilmaMin":ilmaMin,"ilmaMax":ilmaMax,"wind":wind,"koste":koste,"nakyvyys":nakyvyys});

                    
                    if (detail) {
                        console.log(fullName)
                        console.log("\n"+header);
                        console.log(perusLista[0].data)
                        console.log("\nEtäisyys:"+perusLista[0].dist+"km"+" Longitude:"+perusLista[0].lon+" Latitude:"+perusLista[0].lat);
                        console.log("Päivitetty "+updateTime(sensorsMap))
                        console.log("\n"+lampoLine(sensorsMap));
                        console.log(tuuliLine(sensorsMap));
                        console.log(sadeLine(sensorsMap) + saatilatMap.get(getValueNoUnit(sensorsMap,"","S-Tila")))
                        console.log(keliLine(sensorsMap))
                        console.log("\n"+pisteLine(sensorsMap))
                        console.log(suolaLine(sensorsMap))
                        console.log(nakyLine(sensorsMap))
                        console.log(kitkaLine(sensorsMap))
                        //console.log(ennusteLine(sensorsMap))
                        //console.log(miscLine(sensorsMap))
                    }

            }
            };
        }
    );
    switch (order){
        case "E" :
        case "S" :
            perusLista = perusLista.sort((a,b) => a.lat - b.lat);
        break;
        case "P" :
        case "N" :
            perusLista = perusLista.sort((a,b) => b.lat - a.lat);
        break;
        case "L" :
        case "W" :
            perusLista = perusLista.sort((a,b) => a.lon - b.lon);
        break;
        case "I" :
            perusLista = perusLista.sort((a,b) => b.lon - a.lon);
        break;
        case "l" : 
            perusLista = perusLista.sort((a,b) => b.temp - a.temp || a.dist - b.dist);
        break;
        case "k" : 
            perusLista = perusLista.sort((a,b) => a.temp - b.temp || a.dist - b.dist);
        break;
        case "s" : 
        case "r" : 
            perusLista = perusLista.sort((a,b) => b.rain- a.rain || b.raini- a.raini);
        break;
        case "w" : 
            perusLista = perusLista.sort((a,b) => b.wind- a.wind || a.asema - b.asema);
        break;
        case "h" : 
            perusLista = perusLista.sort((a,b) => b.koste- a.koste || a.asema - b.asema);
        break;
        case "i" : 
            perusLista = perusLista.sort((a,b) => b.raini- a.raini || b.rain- a.rain );
        break;
        case "+" : 
            perusLista = perusLista.sort((a,b) => b.ilmaMax- a.ilmaMax || a.asema - b.asema);
        break;
        case "-" : 
            perusLista = perusLista.sort((a,b) => a.ilmaMin- b.ilmaMin || a.asema - b.asema);
        break;
        case "a" : 
            perusLista = perusLista.sort((a,b) => a.asema - b.asema || a.asema - b.asema);
        break;
        case "n" : 
            perusLista = perusLista.sort((a,b) => a.nakyvyys - b.nakyvyys || a.asema - b.asema);
        break;

        default:
            perusLista = perusLista.sort((a,b) => a.dist - b.dist);
    }
    counter=0;
    if (detail) {
        console.log("\n* 24h historia")
        console.log(" Aika           Ilma     Tie    Kosteus  Tuuli    Näky    SadeSum   Sade")
        IlmaHistory = await getHistory(id[0],1)
        Tie1History = await getHistory(id[0],3)
        MaxTuuliHistory = await getHistory(id[0],17)
        KosteHistory = await getHistory(id[0],21)
        SIntHistory = await getHistory(id[0],23)
        SSumHistory = await getHistory(id[0],24)
        NakyHistory = await getHistory(id[0],58)
        h=30;
        i = 0;
        maxIlma = -99; minIlma = 99;
        maxTie = -99; minTie = 99; maxTieT = " N/A "; minTieT = " N/A ";
        eka=true;
        lastRainI=0;
        for (item of IlmaHistory) {
            sadeHourMax=0;
            sadeHourMaxLast=0;
            sadeSumma=0;
            kosteus=0;
            maxTuuli=0;
            nakyvyys=99999;
            tieLampo="N/A  ";
            if (item.sensorValue > maxIlma) {
                maxIlma = item.sensorValue;
                maxIlmaT =  moment(item.measuredTime).format('HH:mm')
            }
            if (item.sensorValue < minIlma) {
                minIlma = item.sensorValue;
                minIlmaT =  moment(item.measuredTime).format('HH:mm')
            }
            if (moment(item.measuredTime).format('H') != h)
            {
                h = moment(item.measuredTime).format('H');
                ilma = item.sensorValue.toFixed(1)+"°C"
                for (tieItem of Tie1History) {
                    if (moment(tieItem.measuredTime).isBetween(moment(item.measuredTime).subtract(1,'hours'),moment(item.measuredTime)))
                    {
                        tieLampo  = tieItem.sensorValue.toFixed(1)+"°C";
                        if (tieItem.sensorValue > maxTie) {
                            maxTie = tieItem.sensorValue;
                            maxTieT =  moment(tieItem.measuredTime).format('HH:mm')
                        }
                        if (tieItem.sensorValue < minTie) {
                            minTie = tieItem.sensorValue;
                            minTieT =  moment(tieItem.measuredTime).format('HH:mm')
                        }
                    }
                }
                for (sadeItem of SIntHistory) {
                    if (moment(sadeItem.measuredTime).isBetween(moment(item.measuredTime).subtract(61,'minutes'),moment(item.measuredTime)))
                    {
                        if (sadeItem.sensorValue > sadeHourMax) sadeHourMax = sadeItem.sensorValue;
                    }
                    if (moment(sadeItem.measuredTime).isBetween(moment(item.measuredTime).subtract(1,'minutes'),moment(item.measuredTime).add(1,'hours'),"[]"))
                    {
                        if (sadeItem.sensorValue > sadeHourMaxLast) {
                            sadeHourMaxLast = sadeItem.sensorValue;
                        }
                        lastRainI = sadeHourMaxLast;
                    }
                }
                if (sadeHourMax == 0) {sadeHourMax="      "} else {sadeHourMax=(sadeHourMax.toFixed(2)+"mm/h").padStart(12," ")}
                for (sadeItem of SSumHistory) {
                    if (moment(sadeItem.measuredTime).isBetween(moment(item.measuredTime).subtract(61,'minutes'),moment(item.measuredTime)))
                    {
                        sadeSumma  = sadeItem.sensorValue;
                    }
                }
                if (sadeSumma == 0) {sadeSumma="      "} else {sadeSumma=(sadeSumma.toFixed(1)+"mm").padStart(6," ");}
                for (kosteItem of KosteHistory) {
                    if (moment(kosteItem.measuredTime).isBetween(moment(item.measuredTime).subtract(61,'minutes'),moment(item.measuredTime)))
                    {
                        if (kosteItem.sensorValue > kosteus) kosteus = kosteItem.sensorValue;
                    }
                }
                kosteus = (kosteus+"% ").padStart(7," ");
                for (tuuliItem of MaxTuuliHistory) {
                    if (moment(tuuliItem.measuredTime).isBetween(moment(item.measuredTime).subtract(61,'minutes'),moment(item.measuredTime)))
                    {
                        if (tuuliItem.sensorValue > maxTuuli) maxTuuli = tuuliItem.sensorValue;
                    }
                }
                maxTuuli = (maxTuuli.toFixed(1)+"m/s").padStart(7," ")

                for (nakyItem of NakyHistory) {
                    if (moment(nakyItem.measuredTime).isBetween(moment(item.measuredTime).subtract(61,'minutes'),moment(item.measuredTime)))
                    {
                        if (nakyItem.sensorValue < nakyvyys) nakyvyys = nakyItem.sensorValue;
                    }
                }
                nakyvyys = (nakyvyys+"m ").padStart(9," ")
                if(eka) { //skipataan eka rivi.
                    eka=false
                } else {
                    console.log (moment(item.measuredTime).format('DD.MM. HH:mm')+"  "+ilma.padStart(8," "),tieLampo.padStart(8," "),kosteus,maxTuuli,nakyvyys,sadeSumma+sadeHourMax)
                }
            }
            i++
        }
        console.log("%s %s %s  %s",
            moment(IlmaHistory[IlmaHistory.length-1].measuredTime).format('DD.MM. HH:mm'),
            lastIlmaTemp.padStart(9," "),
            lastTieTemp.padStart(8," "),
            (SSumHistory[SSumHistory.length-1].sensorValue.toFixed(1)+"mm").padStart(31," "),
            (lastRainI>0)?((lastRainI+"mm/h").padStart(11," ")):"")
        console.log("\nIlma Max:",maxIlmaT,(maxIlma.toFixed(1)+"°C").padStart(7," "),"Min: ",minIlmaT,(minIlma.toFixed(1)+"°C").padStart(7," "))
        console.log("Tie  Max:",maxTieT,(maxTie.toFixed(1)+"°C").padStart(7," "),"Min: ",minTieT,(minTie.toFixed(1)+"°C").padStart(7," "))

    } else{
        console.log(header);
        for (perusLine of perusLista) {
            if (perusLine.temp != -99 || showEmpty) {
                console.log(perusLine.data);
                if (++counter>=lineLimit) break;
            }
        }
    }
}

async function start(consoleline) {

    filename = "saatilat.txt";
    order ="d"
    showEmpty=false;
    separator='\n'
    try {
        saatilat = await fileRead(filename)
    } catch (err) {console.log("error",err)}

    try {
        config = await fileRead("tiesaa.ini")
    } catch (err) {console.log("error",err)}
    config = JSON.parse(config);

    filename = "tiesaa.txt";
    if (consoleline[2]) {
        filename = consoleline[2];
    }

    if (filename.charAt(0) =='-'){
        rawData = consoleline[2].substring(1)+" :";
        let asemaData = await getAsemaInfo(consoleline[2].substring(1))
            if (asemaData) {
                const s = asemaData.properties.names.fi+","+asemaData.properties.province+"@"+asemaData.geometry.coordinates[0]+","+asemaData.geometry.coordinates[1]+","+asemaData.geometry.coordinates[2];
                rawData = consoleline[2].substring(1)+" "+s;
                getTiesaa(rawData,config.home,saatilat,1);
            }
    } else{
        limit=config.sortLimit;
        if (typeof limit != 'number') limit = 30;
        limit_temp=-1;
        for (param of consoleline)
            {if (param.match(/^\-?[0-9]+/)) {
                limit_temp = param.includes('-')?param.substring(1):param
            }
            if (param.match(/^\-?[a-wA-W+-]$/)) {
                order = param.includes('-')?param.substring(1):param
            }
            if (param == '-') order = param;
            if (param == 'x') showEmpty = true;
        }
        if (limit_temp==-1) limit_temp=1000; else limit=limit_temp;
        limit = ['P','E','I','L','N','W','S','d'].includes(order)?Math.min(1000,limit_temp):limit;
        if (filename.includes(".")) {
            try {
                rawData = await fileRead(filename)
            } catch (err) {console.log("error",err)}
        } else {
            try {
                rawData = await SaaAsematLista(filename);
            } catch (err) {console.log("error",err)}
            separator='*'
        }
        if (typeof rawData !== 'undefined' && rawData) {
            getTiesaa(rawData,config.home,saatilat,0,order,limit,separator,showEmpty);
        } 
    }
}

start(process.argv);
