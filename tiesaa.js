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

function updateTime(mittaukset) {
    upTime = mittaukset["Ilma "]?mittaukset["Ilma "].t:""
    return moment(upTime).locale("fi").format('llll')+"  "+moment(upTime).locale("fi").fromNow(); 
}

function getValueWithUnit(mittaukset,label,type) {
    return mittaukset[type]?label+mittaukset[type].v+mittaukset[type].u:""
}

function getValueNoUnit(mittaukset,label,type) {
    return mittaukset[type]?label+mittaukset[type].v:""
}

function getDescription(mittaukset,label,type) {
    return mittaukset[type]?label+mittaukset[type].d:""
}

function lampoLine(mittaukset) {
    return ("Lämpötila "
    + getValueWithUnit(mittaukset," Ilma:","Ilma ")
    + getValueWithUnit(mittaukset," ","DIlm")
    + getValueWithUnit(mittaukset,"   Tie:","Tie1")+ getValueWithUnit(mittaukset," ","DTie1")
    + getValueWithUnit(mittaukset," ","Tie2") + getValueWithUnit(mittaukset," ","DTie2")
    + getValueWithUnit(mittaukset," ","Tie3") + getValueWithUnit(mittaukset," ","DTie3")
    + getValueWithUnit(mittaukset," ","Tie4") + getValueWithUnit(mittaukset," ","DTie4")
    + getValueWithUnit(mittaukset,"   Maa:","Maa1")
    + getValueWithUnit(mittaukset," ","Maa2") 
    + getValueWithUnit(mittaukset," ","Maa3") 
    + getValueWithUnit(mittaukset," ","Maa4")
    + getValueWithUnit(mittaukset," ","Run1"))
    
}

function tuuliLine(mittaukset) {
    return ( "Tuuli     "
    + getValueWithUnit(mittaukset," Keski:","KTuuli")
    + getValueWithUnit(mittaukset,"  Maksimi:","MTuuli")
    + getValueWithUnit(mittaukset,"  Suunta:","TSuunt")
    + getValueWithUnit(mittaukset,"  Ilmanpaine:", "IPaine" ))
    
}

function sadeLine(mittaukset) {
    return (
      getDescription(mittaukset,"Sade  ","Sade")
    + getValueWithUnit(mittaukset,"  Intensiteetti:","S-Int")
    + getValueWithUnit(mittaukset,"  Summa:","S-Sum")
    + getDescription(mittaukset,"  Olomuoto:","S-Olom")
    + getValueNoUnit(mittaukset,"  Sadetila:","S-Tila") )
}

function keliLine(mittaukset) {
    return (
        getDescription(mittaukset,"Keli  ","Keli1") + getDescription(mittaukset," ","Keli2") + getDescription(mittaukset," ","Keli3")
        +getDescription(mittaukset,"   Varoitus: ","Varo1")
        +getDescription(mittaukset," ","Varo2")+getDescription(mittaukset," ","Varo3")+getDescription(mittaukset," ","Varo4")
        +getValueWithUnit(mittaukset,"  Lumensyvyys:","LumSyv") +getValueWithUnit(mittaukset," ","Lumi_A") +getValueWithUnit(mittaukset," ","Lumi_B")
        +getValueWithUnit(mittaukset," ","Lumi_C") +getValueWithUnit(mittaukset," ","LumiKA"))
}

function pisteLine(mittaukset) {
    return (
      getValueWithUnit(mittaukset,"Kastepiste:","KastP")
    + getValueWithUnit(mittaukset,"  Jäätymispiste:","JääPi1") + getValueWithUnit(mittaukset," ","JääPi2") + getValueWithUnit(mittaukset," ","JääPi3") + getValueWithUnit(mittaukset," ","JääPi4")
    + getValueWithUnit(mittaukset,"  Kuurapiste:","KuuraP")
    + getValueWithUnit(mittaukset,"  Ilmankosteus:","Koste") )
};

function suolaLine(mittaukset) {
    return (
      getValueWithUnit(mittaukset,"Kosteuden määrä:","KosMä1")
    + getValueWithUnit(mittaukset,"  Suolan määrä:","SuoMä1") + getValueWithUnit(mittaukset," ","SuoMä2")
    + getValueWithUnit(mittaukset,"  Suolan väkevyys:","SuoVä1") + getValueWithUnit(mittaukset," ","SuoVä2") )
}

function nakyLine(mittaukset) {
    return (
      getValueWithUnit(mittaukset,"Näkyvyys:","Näky_m") + getValueWithUnit(mittaukset," ","Näk_km")
    + getValueNoUnit(mittaukset,"  Aurinko:","Aurink")
    + getValueNoUnit(mittaukset,"  Valoa:","Valoa?")
    + getValueNoUnit(mittaukset,"  Sataa:","Sataa"))
}

function kitkaLine(mittaukset) {
    return (
      "Kitka:"+getValueWithUnit(mittaukset," ","Kitka1") + getValueWithUnit(mittaukset," ","Kitka2")
    + "  Vettä:"+getValueWithUnit(mittaukset," ","VedMä1") + getValueWithUnit(mittaukset," ","VedMä2")
    + "  Lunta:"+getValueWithUnit(mittaukset," ","LumMä1") + getValueWithUnit(mittaukset," ","LumMä2")
    + "  Jäätä:"+getValueWithUnit(mittaukset," ","JääMä1") + getValueWithUnit(mittaukset," ","JääMä2") )
}

function miscLine(mittaukset) {
    return (
      getValueNoUnit(mittaukset,"\nAseman status:","Stat1") + getValueNoUnit(mittaukset," ","Stat2") + getValueNoUnit(mittaukset," Vika:","AntVik")
    + getValueNoUnit(mittaukset,"  PWD status:","PWDsta") + getValueNoUnit(mittaukset," tila:","PWDtil") + getValueNoUnit(mittaukset," NäkTila:","PWDnäk") + getValueWithUnit(mittaukset," ","PWDrbc") + getValueNoUnit(mittaukset," ","PWDtbc")
    + getValueWithUnit(mittaukset,"\nJohtavuus 1:","Joht1") + getValueWithUnit(mittaukset," 2:","Joht2") + getValueWithUnit(mittaukset," 3:","Joht3") + getValueWithUnit(mittaukset," 4:","Joht4")
    + getValueWithUnit(mittaukset," Pintasignaali 1:","PSig1") + getValueWithUnit(mittaukset," 2:","PSig2") + getValueWithUnit(mittaukset," 3:","PSig3") + getValueWithUnit(mittaukset," 4:","PSig4")
    + getValueWithUnit(mittaukset," Jäätaajuus 1:","JTaaj1") + getValueWithUnit(mittaukset," 2:","JTaaj2") 
    + getValueNoUnit(mittaukset,"\nTienpinta OPT 1:","TilaO1") + getValueNoUnit(mittaukset," 2:","TilaO2")
    + getValueNoUnit(mittaukset," Tila 1:","Tila1") + getValueNoUnit(mittaukset," 2:","Tila2") + getValueNoUnit(mittaukset," 3:","Tila3") + getValueNoUnit(mittaukset," 4:","Tila4")
    + getValueNoUnit(mittaukset," Optinen Keli 1:","KeliO1") + getDescription(mittaukset," varoitus:","VaroO1") 
)

}
function ennusteLine(mittaukset) {
    return (
        getValueNoUnit(mittaukset,"Tuuli:","E-TSuu")
        +getValueNoUnit(mittaukset,"Nopeus:","E-Tuul")
        +getValueNoUnit(mittaukset,"Pilvisyys:","E-Pilv")
        +getValueNoUnit(mittaukset,"Sade","E-SOlo")
        +getValueNoUnit(mittaukset,"Inte","E-SInt")
        +getValueNoUnit(mittaukset,"todnäk","E-STod")
        +getValueNoUnit(mittaukset,"Ilma:","E-Ilma")
        +getValueNoUnit(mittaukset,"Tie","E-Tie")
        +getValueNoUnit(mittaukset,"KasteP","E-KasP")
        +getValueNoUnit(mittaukset,"Sademäärä","E-SS1h")
)

}

function checkMeasureTime(measureTime)
{
    var time  =  moment(measureTime);

    var duration = moment.duration(moment().diff(time));
    var mins = duration.asMinutes();

    return Math.floor(mins)
}

function sortSaaData(data, order) {
    switch (order){
        case "E" :
        case "S" :
            returnData = data.sort((a,b) => a.lat - b.lat);
        break;
        case "P" :
        case "N" :
            returnData = data.sort((a,b) => b.lat - a.lat);
        break;
        case "L" :
        case "W" :
            returnData = data.sort((a,b) => a.lon - b.lon);
        break;
        case "I" :
            returnData = data.sort((a,b) => b.lon - a.lon);
        break;
        case "l" : 
            returnData = data.sort((a,b) => b.mittaukset["Ilma "].v - a.mittaukset["Ilma "].v || a.asema - b.asema);
        break;
        case "k" : 
            returnData = data.sort((a,b) => a.mittaukset["Ilma "].v - b.mittaukset["Ilma "].v || a.asema - b.asema);
        break;
        case "T" :
            returnData = data.sort((a,b) => b.mittaukset["Tie1"].v - a.mittaukset["Tie1"].v || a.asema - b.asema);
        break;
        case "s" : 
        case "r" : 
            returnData = data.sort((a,b) => b.mittaukset["Sad24h"].v - a.mittaukset["Sad24h"].v || b.mittaukset["S-Int"].v - a.mittaukset["S-Int"].v );
        break;
        case "w" : 
            returnData = data.sort((a,b) => b.mittaukset["MTuuli"].v - a.mittaukset["MTuuli"].v || a.asema - b.asema);
        break;
        case "h" : 
            returnData = data.sort((a,b) => b.mittaukset["Koste"].v  - a.mittaukset["Koste"].v  || a.asema - b.asema);
        break;
        case "i" : 
            returnData = data.sort((a,b) => b.mittaukset["S-Int"].v - a.mittaukset["S-Int"].v  || b.mittaukset["Sad24h"].v - a.mittaukset["Sad24h"].v );
        break;
        case "+" : 
            returnData = data.sort((a,b) => b.mittaukset["IlmMAX"].v - a.mittaukset["IlmMAX"].v || a.asema - b.asema);
        break;
        case "-" : 
            returnData = data.sort((a,b) => a.mittaukset["IlmMIN"].v - b.mittaukset["IlmMIN"].v || a.asema - b.asema);
        break;
        case "a" : 
            returnData = data.sort((a,b) => a.asema - b.asema || a.asema - b.asema);
        break;
        case "n" : 
            returnData = data.sort((a,b) => a.mittaukset["Näky_m"].v - b.mittaukset["Näky_m"].v || a.asema - b.asema);
        break;

        default:
            returnData = data.sort((a,b) => a.dist - b.dist);
    }

    return returnData;

}

function printSaatiedot(fullname, mittaukset) {

    line = fullname
    line = (line.padEnd(50," ")).substring(49,line);
    !mittaukset["Ilma "].x ?line += (mittaukset["Ilma "].v.toFixed(1)+mittaukset["Ilma "].u).padStart(7," "):line += "N/A ".padStart(7," ")
    !mittaukset["Tie1"].x && showTie ?line += (mittaukset["Tie1"].v.toFixed(1)+mittaukset["Tie1"].u).padStart(8," "):showTie?line+="".padStart(8," "):line += ""
    !mittaukset["IlmMIN"].x?line += (mittaukset["IlmMIN"].v.toFixed(1)+mittaukset["IlmMIN"].u).padStart(8," "):line += "N/A ".padStart(8," ")
    !mittaukset["IlmMAX"].x?line += (mittaukset["IlmMAX"].v.toFixed(1)+mittaukset["IlmMAX"].u).padStart(8," "):line += "N/A ".padStart(8," ")
    !mittaukset["Koste"].x ?line += (mittaukset["Koste"].v+mittaukset["Koste"].u).padStart(6," "):line += " N/A ".padStart(6," ")
    !mittaukset["MTuuli"].x?line += (mittaukset["MTuuli"].v.toFixed(1)+mittaukset["MTuuli"].u).padStart(9," "):line += "N/A  ".padStart(9," ")
    !mittaukset["Näky_m"].x?line += (mittaukset["Näky_m"].v+mittaukset["Näky_m"].u).padStart(8," "):line += "N/A  ".padStart(8," ")
    !mittaukset["Sad24h"].x?line += (mittaukset["Sad24h"].v.toFixed(1)+mittaukset["Sad24h"].u).padStart(8," "):line += "N/A ".padStart(8," ")
    !mittaukset["S-Int"].x ?line += (mittaukset["S-Int"].v.toFixed(2)+mittaukset["S-Int"].u).padStart(11," "):line += "N/A  ".padStart(11," ")
    mittaukset["IPaine"]?line += (mittaukset["IPaine"].v.toFixed(1)+mittaukset["IPaine"].u).padStart(12," "):line += " "
    line += mittaukset["Ilma "] ?mittaukset["Ilma "].mTime>timeNotify?"*"+mittaukset["Ilma "].mTime+"* ":"":
   
    line += "  "+mittaukset["Säätila"].text;
    return line
}

async function log24History(id)  {
    console.log("\n* 24h historia")
    console.log(" Aika           Ilma     Tie    Kosteus  Tuuli    Näky    SadeSum   Sade")
    IlmaHistory = await getHistory(id[0],1)
    SSumHistory = await getHistory(id[0],24)
    Tie1History = await getHistory(id[0],3)
    MaxTuuliHistory = await getHistory(id[0],17)
    KosteHistory = await getHistory(id[0],21)
    SIntHistory = await getHistory(id[0],23)
    NakyHistory = await getHistory(id[0],58)
    
    timeIndex = [];
    IlmaVal = [];
    SSumVal = [];
    Tie1Val = [];
    MaxTuuliVal = [];
    KosteVal = [];
    SIntVal = [];
    NakyVal = [];
    
    h=30;
    startH=0;
    i = 0;
    maxIlma = -99; minIlma = 99;
    maxTie = -99; minTie = 99; maxTieT = " N/A "; minTieT = " N/A ";
    eka=true;
    lastRainI=0;
    sadeHourMax=0;
    sadeHourMaxLast=0;
    sadeSumma=0;
    kosteus=0;
    maxTuuli=0;
    nakyvyys=99999;
    tieLampo="N/A  ";
    for (item of IlmaHistory) {

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
            IlmaVal[h]  = item.sensorValue.toFixed(1)+"°C"
            timeIndex[h] = moment(item.measuredTime).format('DD.MM. HH:mm')
            if (eka) {
                startH = h;
                eka = false;
            }
        }
    }

    for (item of Tie1History) {

        if (item.sensorValue > maxTie) {
            maxTie = item.sensorValue;
            maxTieT =  moment(item.measuredTime).format('HH:mm')
        }
        if (item.sensorValue < minTie) {
            minTie = item.sensorValue;
            minTieT =  moment(item.measuredTime).format('HH:mm')
        }
        if (moment(item.measuredTime).format('H') != h)
        {
            h = moment(item.measuredTime).format('H');
            Tie1Val[h] = item.sensorValue.toFixed(1)+"°C"
        }
    }

    for (item of SSumHistory) {

        if (moment(item.measuredTime).format('H') != h)
        {
            h = moment(item.measuredTime).format('H');
            ssum = item.sensorValue.toFixed(1)
            SSumVal[h] = (parseFloat(ssum) != 0) ? ssum+"mm" : ""
        }
    }

    for (item of KosteHistory) {
        if (moment(item.measuredTime).format('H') != h)
        {
            h = moment(item.measuredTime).format('H');
            KosteVal[h] = item.sensorValue+"%"
        }
    }

    maxtuuli=0;
    h=30;
    for (item of MaxTuuliHistory) {
        if (moment(item.measuredTime).format('H') != h)
        {
            h = moment(item.measuredTime).format('H');
            MaxTuuliVal[h] = maxtuuli.toFixed(1)+"m/s"
            maxtuuli = item.sensorValue;
        } else {
            if (item.sensorValue > maxtuuli) {
                maxtuuli = item.sensorValue;
            }
        }
    }

    h=30;
    sint=0;
    for (item of SIntHistory) {
        if (moment(item.measuredTime).format('H') != h)
        {
            h = moment(item.measuredTime).format('H');
            SIntVal[h] = (parseFloat(sint) != 0) ? sint.toFixed(2)+"mm/h" : "";
            sint = 0
        } else {
            if (item.sensorValue > sint) {
                sint = item.sensorValue;
            }
        }
    }

    h=30;
    naky = 99999;
    for (item of NakyHistory) {
        if (moment(item.measuredTime).format('H') != h)
        {
            h = moment(item.measuredTime).format('H');
            if (naky==99999) naky = item.sensorValue;
            NakyVal[h] = naky+"m";
            naky = item.sensorValue;
        } else {
            if (item.sensorValue < naky) {
                naky = item.sensorValue;
            }
        }
    }

    for (i=parseInt(startH)+1; i<(parseInt(startH)+25); i++) {
        id = i;
        if (id > 23){ id = id-24}
        console.log(
            timeIndex[id],
            ((IlmaVal[id])?IlmaVal[id]:"").padStart(9," "),
            ((Tie1Val[id])?Tie1Val[id]:"").padStart(8," "),
            ((KosteVal[id])?KosteVal[id]:"").padStart(5," "),
            ((MaxTuuliVal[id])?MaxTuuliVal[id]:"").padStart(9," "),
            ((NakyVal[id])?NakyVal[id]:"").padStart(7," "),
            ((SSumVal[id])?SSumVal[id]:"").padStart(8," "),
            ((SIntVal[id])?SIntVal[id]:"").padStart(11," "),
        )
    }

    return ({"IlmaHistory":IlmaHistory,"SSumHistory":SSumHistory,"lastRainI":lastRainI})
}

async function printData(lista, limit, detail) {
    tieString = (showTie)?" Tie".padStart(8," "):""
    header = " ".padEnd(50," ")+"Ilma".padStart(5," ")+tieString+"Min".padStart(8," ")+"Max".padStart(7," ")+"Kost".padStart(8," ")+"Tuuli".padStart(8," ")+"Näky".padStart(7," ")+"Sade24h".padStart(10," ")+"Sade" .padStart(7," ")
    counter=0;

    if (detail) {
        mittaukset =lista[0].mittaukset;
        console.log(lista[0].fullname)
        console.log("\n"+header);
        console.log(printSaatiedot(lista[0].fullname, mittaukset))
        console.log("\nEtäisyys: "+lista[0].dist+"km    "+" Longitude: "+lista[0].lon+" Latitude: "+lista[0].lat);
        console.log("Päivitetty "+updateTime(mittaukset))
        console.log("\n"+lampoLine(mittaukset));
        console.log(tuuliLine(mittaukset));
        console.log(sadeLine(mittaukset) + mittaukset["S-Tila"].text)
        console.log(keliLine(mittaukset))
        console.log("\n"+pisteLine(mittaukset))
        console.log(suolaLine(mittaukset))
        console.log(nakyLine(mittaukset))
        console.log(kitkaLine(mittaukset))
        weatherDetails = await log24History(id);
        //console.log(weatherDetails.IlmaHistory[0])
        console.log("%s %s %s  %s",
            moment(weatherDetails.IlmaHistory[weatherDetails.IlmaHistory.length-1].measuredTime).format('DD.MM. HH:mm'),
            mittaukset["lastIlmaTemp"].v.padStart(9," "),
            mittaukset["lastTieTemp"].v.padStart(8," "),
            ((weatherDetails.SSumHistory.length>0)?(weatherDetails.SSumHistory[weatherDetails.SSumHistory.length-1].sensorValue.toFixed(1)+"mm"):"").padStart(31," "),
            (weatherDetails.lastRainI>0)?((weatherDetails.lastRainI+"mm/h").padStart(11," ")):"")
        console.log("\nIlma Max:",maxIlmaT,(maxIlma.toFixed(1)+"°C").padStart(7," "),"Min: ",minIlmaT,(minIlma.toFixed(1)+"°C").padStart(7," "))
        console.log("Tie  Max:",maxTieT,(maxTie.toFixed(1)+"°C").padStart(7," "),"Min: ",minTieT,(minTie.toFixed(1)+"°C").padStart(7," "))

    } else{
        console.log(header);
        for (perusLine of lista) {
            if ((perusLine.mittaukset["Ilma "].v != -99  && perusLine.mittaukset["Ilma "].mTime <timeReject) || showEmpty) {
                console.log(printSaatiedot(perusLine.fullname,perusLine.mittaukset));
                if (++counter>=limit) break;
            }
        }
    }
}

async function getTiesaa(rawData,home,saatilat,detail,order,lineLimit,separator) {
    const saatilatMap = new Map();
    const tempNamesMap = new Map();
    const asemaSaatMap = new Map();
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
                    mittaukset = {}
                    for(const item of asemaData)  {
                        mittaukset[item.shortName] = {"t":item.measuredTime,"v":item.value,"u":item.unit,"d":item.sensorValueDescriptionFi}
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

                    mittaukset["Ilma "]  ? mittaukset["Ilma "].mTime=checkMeasureTime(mittaukset["Ilma "].t):
                    mittaukset["Ilma "]  ? mittaukset["Ilma "].v = mittaukset["Ilma "].v:order=='k'?mittaukset["Ilma "]={x:1,v:99,u:""}:mittaukset["Ilma "]= {x:1,v:-99,u:""};
                    mittaukset["Tie1"] ? mittaukset["Tie1"].v =  mittaukset["Tie1"].v:mittaukset["Tie1"] = {x:1,v:0,u:""};
                    mittaukset["Sad24h"] ? mittaukset["Sad24h"].v =  mittaukset["Sad24h"].v:mittaukset["Sad24h"] = {x:1,v:0,u:""};
                    mittaukset["S-Int"]  ? mittaukset["S-Int"].v =   mittaukset["S-Int"].v:mittaukset["S-Int"] = {x:1,v:0,u:""};
                    mittaukset["MTuuli"] ? mittaukset["MTuuli"].v =  mittaukset["MTuuli"].v:mittaukset["MTuuli"] = {x:1,v:0,u:"" };
                    mittaukset["Koste"]  ? mittaukset["Koste"].v =   mittaukset["Koste"].v:mittaukset["Koste"] = {x:1,v:0,u:""};
                    mittaukset["IlmMIN"] ? mittaukset["IlmMIN"].v =  mittaukset["IlmMIN"].v:mittaukset["IlmMIN"] = {x:1,v:99,u:""};
                    mittaukset["IlmMAX"] ? mittaukset["IlmMAX"].v =  mittaukset["IlmMAX"].v:mittaukset["IlmMAX"] = {x:1,v:-99,u:""};
                    mittaukset["Näky_m"] ? mittaukset["Näky_m"].v =  mittaukset["Näky_m"].v:mittaukset["Näky_m"] = {x:1,v:99999,u:""};
                    mittaukset["Säätila"] ? mittaukset["Säätila"].text =  saatilatMap.get(mittaukset["Säätila"].v+""):mittaukset["Säätila"] = {text:""};
                    mittaukset["S-Tila"] ? mittaukset["S-Tila"].text =  saatilatMap.get(mittaukset["S-Tila"].v+""):mittaukset["S-Tila"] = {text:""};
                    linelimit=1000;
                    perusLista.push({"fullname":fullName, "mittaukset": mittaukset, "asema":asm, "lon":longi, "lat":lati, "dist":dist});

                    
                    if (detail) {
                        mittaukset["Ilma "] ? mittaukset["lastIlmaTemp"] = {v:mittaukset["Ilma "].v.toFixed(1)+mittaukset["Ilma "].u}:mittaukset["lastIlmaTemp"] ={v:"N/A"};
                        mittaukset["Tie1"]  ? mittaukset["lastTieTemp"] = {v:mittaukset["Tie1"].v.toFixed(1)+mittaukset["Tie1"].u}:mittaukset["lastTieTemp"] ={v:"N/A"};
                    }

            }
            };
        }
    );
    perusLista = sortSaaData(perusLista, order)
    printData(perusLista, lineLimit, detail)

}

async function start(consoleline) {

    filename = "saatilat.txt";
    order ="d"
    showEmpty=false;
    showTie=false;
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
        timeNotify=config.timeNotify;
        timeReject=config.timeReject;
        if (typeof limit != 'number') limit = 30;
        if (typeof timeNotify != 'number') timeNotify = 8;
        if (typeof timeReject != 'number') timeReject = 30;
        limit_temp=-1;
        for (param of consoleline)
            {if (param.match(/^\-?[0-9]+/)) {
                limit_temp = param.includes('-')?param.substring(1):param
            }
            if (param.match(/^\-?[a-sA-Su-wzU-W+-]$/)) {
                order = param.includes('-')?param.substring(1):param
            }
            if (param == '-') order = param;
            if (param == 'x') showEmpty = true;
            if (param == 't') showTie = true;
            if (param == 'T') {showTie = true; order = param}
        }
        if (limit_temp==-1) limit_temp=1000; else limit=limit_temp;
        limit = ['P','E','I','L','N','W','S','d','a'].includes(order)?Math.min(1000,limit_temp):limit;
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
        //console.log(order, showEmpty, showTie, timeNotify)
        if (typeof rawData !== 'undefined' && rawData) {
            getTiesaa(rawData,config.home,saatilat,0,order,limit,separator);
        } 
    }
}

start(process.argv);
