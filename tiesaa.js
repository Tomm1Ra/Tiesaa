const {readFile} = require('fs.promises');
const axios = require('axios');
const distance = require('geo-dist');
const moment = require ('moment');

const fileRead = async(fileName) => {
    const result = await readFile(fileName, 'utf8')
    //console.log(result)
    return result;
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

function formatValue(o) {
    o=o+"";
    if (!o.includes('.')) o=o+".0"
    r=o;
    if (o < 10 && o >= 0) r=" "+r;
    if (o > -10) r=" "+r;
    return r;
}

function formatValuePos(o) {
    o=o+"";
    if (!o.includes('.')) o=o+".0"
    r=o;
    if (o < 10) r=" "+r;
    return r;
}


function formatValueInt100(o) {
    o=o+"";
    r=o;
    if (o<10&&o>=0) r=" "+r;
    if (o<100) r=" "+r;
    return r;
}

function formatValueInt10000(o) {
    o=o+"";
    r=o;
    if (o<10&&o>=0) r=" "+r;
    if (o<100) r=" "+r;
    if (o<1000) r=" "+r;
    if (o<10000) r=" "+r;
    return r;
}
function formatValue2desim(o) {
    o=o+"";
    if (!o.includes('.')) o=o+".0"
    r=o;
    if (o.split(".")[1].length<2) r=r+"0";
    if (o<10&&o>=0) r=" "+r;
    if (o<100) r=" "+r;
    if (r=="  0.00") {
        return "  0 " 
    } else return r;
}

function updateTime(dataMap) {
    upTime = dataMap.has("Ilma ")?dataMap.get("Ilma ").t:""
    return moment(upTime).locale("fi").format('llll')+"  "+moment(upTime).locale("fi").fromNow(); 
}

function getValueWithUnit(dataMap,label,type) {
    return dataMap.has(type)?label+dataMap.get(type).v+dataMap.get(type).u:""
}

function getValueNoUnit(dataMap,label,type) {
    return dataMap.has(type)?label+dataMap.get(type).v:"0"
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
        getDescription(dataMap,"Keli:","Keli1") + getDescription(dataMap," ","Keli2")
        +getDescription(dataMap," Varoitus1:","Varo1")
        +getDescription(dataMap," 2:","Varo2")
        +getValueWithUnit(dataMap," Lumensyvyys:","LumSyv") )
}

function pisteLine(dataMap) {
    return (
      getValueWithUnit(dataMap,"Kastepiste:","KastP")
    + getValueWithUnit(dataMap," Jäätymispiste:","JääPi1")
    + getValueWithUnit(dataMap," Kuurapiste:","KuuraP")
    + getValueWithUnit(dataMap," Ilmankosteus:","Koste") )
};

function suolaLine(dataMap) {
    return (
      getValueWithUnit(dataMap,"Kosteuden määrä:","KosMä1")
    + getValueWithUnit(dataMap," Suolan määrä:","SuoMä1")
    + getValueWithUnit(dataMap," Suolan väkevyys:","SuoVä1") )
}

function nakyLine(dataMap) {
    return (
      getValueWithUnit(dataMap,"Näkyvyys:","Näky_m")
    + getValueNoUnit(dataMap," Aurinko:","Aurink")
    + getValueNoUnit(dataMap," Valoa:","Valoa?") )
}

function kitkaLine(dataMap) {
    return (
      getValueWithUnit(dataMap,"Kitka:","Kitka1") + getValueWithUnit(dataMap," ","Kitka2")
    + getValueWithUnit(dataMap," Vettä:","VedMä1")
    + getValueWithUnit(dataMap," Lunta:","LumMä1")
    + getValueWithUnit(dataMap," Jäätä:","JääMä1") )
}

function miscLine(dataMap) {
    return (
      getValueNoUnit(dataMap,"\nAseman status:","Stat1") + getValueNoUnit(dataMap," ","Stat2")
    + getValueNoUnit(dataMap,"  PWD status:","PWDsta") + getValueNoUnit(dataMap," tila:","PWDtil") + getValueNoUnit(dataMap," NäkTila:","PWDnäk") + getValueWithUnit(dataMap," ","PWDrbc") + getValueNoUnit(dataMap," ","PWDtbc")
    + getValueWithUnit(dataMap,"\nJohtavuus 1:","Joht1") + getValueWithUnit(dataMap," 2:","Joht2") + getValueWithUnit(dataMap," 3:","Joht3") + getValueWithUnit(dataMap," 4:","Joht4")
    + getValueWithUnit(dataMap," Pintasignaali 1:","PSig1") + getValueWithUnit(dataMap," 2:","PSig2") + getValueWithUnit(dataMap," 3:","PSig3") + getValueWithUnit(dataMap," 4:","PSig4")
    + getValueWithUnit(dataMap," Jäätaajuus 1:","JTaaj1") + getValueWithUnit(dataMap," 2:","JTaaj2") 
    + getValueNoUnit(dataMap,"\nTienpinta OPT 1:","TilaO1") + getValueNoUnit(dataMap," 2:","TilaO2")
    + getValueNoUnit(dataMap," Tila 1:","Tila1") + getValueNoUnit(dataMap," 2:","Tila2") + getValueNoUnit(dataMap," 3:","Tila3") + getValueNoUnit(dataMap," 4:","Tila4")
    + getValueNoUnit(dataMap," Optinen Keli 1:","KeliO1") + getDescription(dataMap," varoitus:","VaroO1") 
)

}

function checkMeasureTime(measureTime)
{
    var time  =  moment(measureTime);

    var duration = moment.duration(moment().diff(time));
    var mins = duration.asMinutes();

    return mins>7?" *"+Math.floor(mins)+"* ":"";
}

async function getTiesaa(rawData,home,saatilat,detail,order,lineLimit,separator) {
    const saatilatMap = new Map();
    const tempNamesMap = new Map();
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
    header = ("                                               Ilma    Min     Max    Kosteus  Tuuli    Näky   Sade24h    Sade ")
    //Haetaan aseman nimi ja paikka jos pelkkä numero listassa
    await Promise.all(lines.map(async (line) => {
        id = line.match(/^([\d]+)/);
        if (!line.includes('@') && line.length > 3 && id) {
            line2 = await getAsemaInfoString(id[0])
            tempNamesMap.set(line2.match(/^([\d]+)/)[0],line2);
        }
    }));

    await Promise.all(lines.map(async (line) => {
        id = line.match(/^([\d]+)/);
        if (id) {
            //console.log("ID:"+id[0]);
            if (!line.includes('@')) { //haetaan nimi mapista
                line = tempNamesMap.get(id[0])
            }
            let asemaData = await getAsemaSaaInfo(id[0])
                if (asemaData) {
                    const sensorsMap = new Map();
                    for(const item of asemaData.sensorValues)  {
                        sensorsMap.set(item.shortName,{"t":item.measuredTime,"v":item.value,"u":item.unit,"d":item.sensorValueDescriptionFi})
                    }
                    lineSplit = line.split('@');
                    line = lineSplit[0];
                    fullName=line;
                    lati = 0;
                    longi = 0;
                    if (lineSplit[1]){
                        lati = lineSplit[1].split(',')[1];
                        longi = lineSplit[1].split(',')[0];
                    }
                    dist = distance(parseFloat(lati),parseFloat(longi),latBase,longBase).toFixed(1);
                    st=sensorsMap.has("Säätila")?sensorsMap.get("Säätila").v+"":"0";

                    line = (line+"                                               ").substring(45,line);
                    sensorsMap.has("Ilma ") ?line+=formatValue(sensorsMap.get("Ilma ").v)+sensorsMap.get("Ilma ").u:line+="    N/A"
                    sensorsMap.has("IlmMIN")?line+=" "+formatValue(sensorsMap.get("IlmMIN").v)+sensorsMap.get("IlmMIN").u:line+="    N/A  "
                    sensorsMap.has("IlmMAX")?line+=" "+formatValue(sensorsMap.get("IlmMAX").v)+sensorsMap.get("IlmMAX").u:line+="  N/A  "
                    sensorsMap.has("Koste")?line+="   "+formatValueInt100(sensorsMap.get("Koste").v)+sensorsMap.get("Koste").u:line+="    N/A"
                    sensorsMap.has("MTuuli")?line+="  "+formatValue(sensorsMap.get("MTuuli").v)+sensorsMap.get("MTuuli").u:line+="     N/A  "
                    sensorsMap.has("Näky_m")?line+="  "+formatValueInt10000(sensorsMap.get("Näky_m").v)+sensorsMap.get("Näky_m").u:line+="   N/A  "
                    sensorsMap.has("Sad24h")?line+="  "+formatValuePos(sensorsMap.get("Sad24h").v)+sensorsMap.get("Sad24h").u:line+="     N/A"
                    sensorsMap.has("S-Int")?line+="  "+formatValue2desim(sensorsMap.get("S-Int").v)+sensorsMap.get("S-Int").u:line+="      N/A"
                    sensorsMap.has("IPaine")?line+=" "+formatValue(sensorsMap.get("IPaine").v)+sensorsMap.get("IPaine").u:line+=""
                    sensorsMap.has("Ilma ") ?line+=checkMeasureTime(sensorsMap.get("Ilma ").t):line+=" "

                    line+=" "+saatilatMap.get(st);
                    perusLine=line
                    temp=sensorsMap.has("Ilma ") ?sensorsMap.get("Ilma ").v:order=='k'?99:-99;
                    rain=sensorsMap.has("Sad24h")?sensorsMap.get("Sad24h").v:0;
                    raini=sensorsMap.has("S-Int")?sensorsMap.get("S-Int").v:0;
                    wind=sensorsMap.has("MTuuli")?sensorsMap.get("MTuuli").v:0;
                    koste=sensorsMap.has("Koste")?sensorsMap.get("Koste").v:0;
                    ilmaMin=sensorsMap.has("IlmMIN")?sensorsMap.get("IlmMIN").v:99;
                    ilmaMax=sensorsMap.has("IlmMAX")?sensorsMap.get("IlmMAX").v:-99;
                    linelimit=1000;

                    perusLista.push({"data":perusLine, "lon":longi,"lat":lati,"dist":dist,"temp":temp,"rain":rain,"raini":raini,"ilmaMin":ilmaMin,"ilmaMax":ilmaMax,"wind":wind,"koste":koste});

                    
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
                        console.log(miscLine(sensorsMap)) 
                    }

            }
            };
        }
    ));
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
            perusLista = perusLista.sort((a,b) => b.temp - a.temp);
        break;
        case "k" : 
            perusLista = perusLista.sort((a,b) => a.temp - b.temp);
        break;
        case "s" : 
        case "r" : 
            perusLista = perusLista.sort((a,b) => b.rain- a.rain);
        break;
        case "w" : 
            perusLista = perusLista.sort((a,b) => b.wind- a.wind);
        break;
        case "h" : 
            perusLista = perusLista.sort((a,b) => b.koste- a.koste);
        break;
        case "i" : 
            perusLista = perusLista.sort((a,b) => b.raini- a.raini);
        break;
        case "+" : 
            perusLista = perusLista.sort((a,b) => b.ilmaMax- a.ilmaMax);
        break;
        case "-" : 
            perusLista = perusLista.sort((a,b) => a.ilmaMin- b.ilmaMin);
        break;

        default:
            perusLista = perusLista.sort((a,b) => a.dist - b.dist);
    }
    counter=0;
    if (detail) {

    } else{
        console.log(header);
        for (perusLine of perusLista) {
            console.log(perusLine.data);
            if (++counter>=lineLimit) break;
        }
    }
}

async function start(consoleline) {

    filename = "saatilat.txt";
    order ="d"
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
            if (param.match(/^\-?[a-zA-Z+-]$/)) {
                order = param.includes('-')?param.substring(1):param
            }
            if (param=='-') order = param;
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
            getTiesaa(rawData,config.home,saatilat,0,order,limit,separator);
        } 
    }
}

start(process.argv);
