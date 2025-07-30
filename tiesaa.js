const {readFile} = require('fs.promises');
const axios = require('axios');
const distance = require('geo-dist');
const moment = require ('moment');

const fileRead = async(fileName) => {
    const result = await readFile(fileName, 'utf8')
    //console.log(result)
    return result;
}

async function getHistory1h(id,sensor) {
    const getResponse = await axios
    .get(`https://tie.digitraffic.fi/api/weather/v1/stations/${id}/data/history?sensorId=${sensor}` , {timeout: 15000})
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
    .get(`https://tie.digitraffic.fi/api/weather/v1/stations/${id}/data/history?sensorId=${sensor}&from=${startTime}&to=${endTime}` , {timeout: 15000})
    .then((response) => response)
    .catch((e)=> console.log("Tuntematon asema ",id))
    if (getResponse) {
        return getResponse.data.values
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


async function getNewHome(searchString) {
    returnData ={"long":0,"lat":0};
    i=0;o=0;
    infoData = await getSaaasemat();
        if (infoData) {
            await Promise.all(infoData.features.map(async (asema) => {
                i++;
                id=asema.properties.id;
                let asemaData = await getAsemaInfo(id)
                if (asemaData) {
                    const s = ""+asemaData.properties.municipality
                        if (s.toLowerCase().includes(searchString.toLowerCase())) {
                            returnData = {"long":asemaData.geometry.coordinates[0], "lat":asemaData.geometry.coordinates[1]}
                    }
                }
            }))
        }
        return returnData;
}

function updateTime(mittaukset) {
    upTime = mittaukset["Ilma "]?mittaukset["Ilma "].t:""
    return moment(upTime).locale("fi").format('llll')+"  "+moment(upTime).locale("fi").fromNow(); 
}

function getValueWithUnit(mittaukset,label,type,decim) {
    if (decim) return mittaukset[type]?label+mittaukset[type].v.toFixed(decim)+mittaukset[type].u:""
    else return mittaukset[type]?label+mittaukset[type].v+mittaukset[type].u:""
}

function getValueNoUnit(mittaukset,label,type, decim) {
    if (decim) return mittaukset[type]?label+mittaukset[type].v.toFixed(decim):""
    else return mittaukset[type]?label+mittaukset[type].v:""
}

function getValueOnEi(mittaukset,label,type) {
    if (!mittaukset[type]) return "";
    return mittaukset[type].v==1?label+":On":label+":Ei"
}

function getUnit(mittaukset,label,type) {
    return mittaukset[type]?label+mittaukset[type].u:""
}

function getDescription(mittaukset,label,type) {
    return mittaukset[type]?label+mittaukset[type].d:""
}

function saaLuvut(mittaukset) {
    ip="",ipv="",ipd="",ipe="";
    zeroTime = isDST  ? "07" : "06"
    sade = getDescription(mittaukset,"","Sade")
    olomuoto = getDescription(mittaukset,"","S-Olom")
    //sade = sade=="Pouta"?"":sade;
    olomuoto = olomuoto=="Pouta"?"":olomuoto;
    if ((getValueNoUnit(mittaukset,"","IPaine")) != 0) {
        ip = "Ilmanpaine   "
        ipv = getValueWithUnit(mittaukset," ", "IPaine" ).padStart(13," ")
        ipd = getValueWithUnit(mittaukset," ", "DIPain" ).padStart(13," ")
        ipe = " ".padStart(13," ")
    }
    if (mittaukset["Tie"].x==1) mittaukset["Tie"] = null;

        return (
          "\n"+"    Ilma ".padEnd(20," ")+"Tie".padEnd(25," ")+"Maa".padEnd(20," ")+ip+"Tuuli".padEnd(10," ")+"Sade "+sade+" "+olomuoto+"\n"
        + getValueWithUnit(mittaukset," ","Ilma ",1).padStart(10," ").padEnd(16," ")
        + getValueWithUnit(mittaukset," ","Tie",1).padStart(10," ")
        + getValueWithUnit(mittaukset," ","Tie2",1).padStart(10," ")
        + getValueWithUnit(mittaukset," ","Maa",1).padStart(15," ")
        + getValueWithUnit(mittaukset," ","Maa2",1).padStart(10," ")+ipv
        + getValueWithUnit(mittaukset," ","KTuuli",1).padStart(10," ")
        + getValueWithUnit(mittaukset," ","S-Int",2).padStart(12," ")
            +"\n"
        + getValueWithUnit(mittaukset," ","DIlm",1).padStart(12," ").padEnd(16," ")
        + getValueWithUnit(mittaukset," ","DTie1",1).padStart(12," ")
        + getValueWithUnit(mittaukset," ","DTie2",1).padStart(10," ")
        + " ".padStart(24," ")+ipd
        + getValueWithUnit(mittaukset," ","MTuuli",1).padStart(9," ")
        + getValueWithUnit(mittaukset," ","S-Sum",1).padStart(9," ")+" ("+zeroTime +"-)"
        +"\n"+ipe
        + getValueWithUnit(mittaukset," ","TSuunt").padStart(70," ")
        + getValueWithUnit(mittaukset," ","Sad24h",1).padStart(10," ") +" (24h)"
        )
    }

function keliLine(mittaukset) {
    lumi = getValueNoUnit(mittaukset,"","LumSyv")!=0?getValueWithUnit(mittaukset,"  Lumensyvyys:","LumSyv") +getValueWithUnit(mittaukset," ","Lumi_A") +getValueWithUnit(mittaukset," ","Lumi_B"):""+getValueWithUnit(mittaukset," ","Lumi_C") +getValueWithUnit(mittaukset," ","LumiKA")
    return (
        getDescription(mittaukset,"Keli  ","Keli1") + getDescription(mittaukset,",","Keli2") + getDescription(mittaukset,",","Keli3")
        +getDescription(mittaukset,"   Varoitus: ","Varo1")
        +getDescription(mittaukset,",","Varo2")+getDescription(mittaukset,",","Varo3")+getDescription(mittaukset,",","Varo4")
        + lumi
    )
}

function pisteLine(mittaukset) {
    return (
      getValueWithUnit(mittaukset,"Kastepiste:","KastP") + getValueWithUnit(mittaukset," Ero tie:","KpEroT") + getValueWithUnit(mittaukset," Ero tie2:","KpEroT2") + getValueWithUnit(mittaukset," Ero ilma:","KpEroI")
    + " Jäätymispiste"+ getValueWithUnit(mittaukset," 1:","JääPi1") + getValueWithUnit(mittaukset," 2:","JääPi2") + getValueWithUnit(mittaukset," 3:","JääPi3") + getValueWithUnit(mittaukset," 4:","JääPi4")
    + getValueWithUnit(mittaukset,"\nKuurapiste:","KuuraP") + getValueWithUnit(mittaukset," Ero tie:","KuoErT") + getValueWithUnit(mittaukset," Ero Ilma:","KUpErI")
    + getValueWithUnit(mittaukset,"  Ilmankosteus:","Koste") )
};

function suolaLine(mittaukset) {
    return (
      "Kosteuden määrä:" + getValueWithUnit(mittaukset," ","KosMä1") + getValueWithUnit(mittaukset," ","KosMä2")  + getValueWithUnit(mittaukset," ","KosMä3") + getValueWithUnit(mittaukset," ","KosMä4")
    + "  Suolan määrä:" + getValueWithUnit(mittaukset," ","SuoMä1") + getValueWithUnit(mittaukset," ","SuoMä2") + getValueWithUnit(mittaukset," ","SuoMä3") + getValueWithUnit(mittaukset," ","SuoMä4")
    + "  Suolan väkevyys:" + getValueWithUnit(mittaukset," ","SuoVä1") + getValueWithUnit(mittaukset," ","SuoVä2") + getValueWithUnit(mittaukset," ","SuoVä3") + getValueWithUnit(mittaukset," ","SuoVä4") )
}

function nakyLine(mittaukset) {
    return (
      getValueWithUnit(mittaukset,"Näkyvyys:","Näky_m") + getValueWithUnit(mittaukset," ","Näk_km")
    + getValueOnEi(mittaukset,"  Aurinko:","Aurink")
    + getValueOnEi(mittaukset,"  Valoa:","Valoa?")
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
      getValueNoUnit(mittaukset,"\nAseman status:","Stat1") + getValueNoUnit(mittaukset," ","Stat2") + getValueNoUnit(mittaukset," Opt1:","StatO1") + getValueNoUnit(mittaukset," Opt2:","StatO2") + getValueNoUnit(mittaukset," Vika:","AntVik")
    + getValueNoUnit(mittaukset,"\nPWD Tila:","PWDtil") + getValueNoUnit(mittaukset," Anturin tila:","PWDsta") + getValueNoUnit(mittaukset," Näkyvyysanturin tila:","PWDnäk") +  " Takaisinsironnan muutos " +getValueWithUnit(mittaukset," VastOtin:","PWDrbc") + getValueNoUnit(mittaukset," Lähetin:","PWDtbc")
    + getValueWithUnit(mittaukset,"\nJohtavuus 1:","Joht1") + getValueWithUnit(mittaukset," 2:","Joht2") + getValueWithUnit(mittaukset," 3:","Joht3") + getValueWithUnit(mittaukset," 4:","Joht4")
    + getValueWithUnit(mittaukset," Pintasignaali 1:","PSig1") + getValueWithUnit(mittaukset," 2:","PSig2") + getValueWithUnit(mittaukset," 3:","PSig3") + getValueWithUnit(mittaukset," 4:","PSig4")
    + " Jäätaajuus"+getValueWithUnit(mittaukset," 1:","JTaaj1") + getValueWithUnit(mittaukset," 2:","JTaaj2") 
    + "\nTienpinta OPT" + getValueNoUnit(mittaukset," 1:","TilaO1") + getValueNoUnit(mittaukset," 2:","TilaO2")
    + " Tila"+getValueNoUnit(mittaukset," 1:","Tila1") + getValueNoUnit(mittaukset," 2:","Tila2") + getValueNoUnit(mittaukset," 3:","Tila3") + getValueNoUnit(mittaukset," 4:","Tila4")
    + " Optinen Keli" + getValueNoUnit(mittaukset," 1:","KeliO1") + getValueNoUnit(mittaukset," 2:","KeliO2") + " Varoitus"+ getDescription(mittaukset," 1:","VaroO1") + getDescription(mittaukset," 2:","VaroO2") 
    + "\nDSC" + getValueNoUnit(mittaukset," Puhtaus 1:","DSCpu1") + getValueNoUnit(mittaukset," Puhtaus 2:","DSCpu2") + getValueNoUnit(mittaukset," Status 1:","DSCst1") + getValueNoUnit(mittaukset," Status 2:","DSCst2")
    + "\nKuituvaste" + getValueNoUnit(mittaukset," Pieni 1:","KVaP1 ") + getValueNoUnit(mittaukset," Pieni 2:","KVaP2 ") + getValueNoUnit(mittaukset," Suuri 1:","KVaS1 ") + getValueNoUnit(mittaukset," Suuri 2:","KVaS2 ")
    + "\nTurvallisuuslämpö"  + getValueWithUnit(mittaukset," 1:","TurLä1") + getValueWithUnit(mittaukset," 2:","TurLä2") + getValueWithUnit(mittaukset," 3:","TurLä3") + getValueWithUnit(mittaukset," 4:","TurLä4")
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
        case "l+" :
            returnData = data.sort((a,b) => b.mittaukset["Ilma "].v - a.mittaukset["Ilma "].v || a.asema - b.asema);
        break;
        case "l-" :
            returnData = data.sort((a,b) => a.mittaukset["Ilma "].v - b.mittaukset["Ilma "].v || a.asema - b.asema);
        break;
        case "m+" :
            returnData = data.sort((a,b) => b.mittaukset["DIlm"].v - a.mittaukset["DIlm"].v || a.asema - b.asema);
        break;
        case "m-" :
            returnData = data.sort((a,b) => a.mittaukset["DIlm"].v - b.mittaukset["DIlm"].v || a.asema - b.asema);
        break;
        case "t+" :
            returnData = data.sort((a,b) => b.mittaukset["Tie"].v - a.mittaukset["Tie"].v || a.asema - b.asema);
        break;
        case "t-" :
            returnData = data.sort((a,b) => a.mittaukset["Tie"].v - b.mittaukset["Tie"].v || a.asema - b.asema);
        break;
        case "s" : 
        case "r" : 
        case "s+" :
        case "r+" :
            if (sade24) {
                returnData = data.sort((a,b) => b.mittaukset["Sad24h"].v - a.mittaukset["Sad24h"].v || b.mittaukset["S-Int"].v - a.mittaukset["S-Int"].v );
            } else {
                returnData = data.sort((a,b) => b.mittaukset["S-Sum"].v - a.mittaukset["S-Sum"].v || b.mittaukset["Sad24h"].v - a.mittaukset["Sad24h"].v );
            }
        break;
        case "s-" : 
        case "r-" : 
            if (sade24) {
                returnData = data.sort((b,a) => b.mittaukset["Sad24h"].v - a.mittaukset["Sad24h"].v || b.mittaukset["S-Int"].v - a.mittaukset["S-Int"].v );
            } else {
                returnData = data.sort((b,a) => b.mittaukset["S-Sum"].v - a.mittaukset["S-Sum"].v || b.mittaukset["Sad24h"].v - a.mittaukset["Sad24h"].v );
            }
        break;
        case "w+" :
        case "w" :
            returnData = data.sort((a,b) => b.mittaukset["MTuuli"].v - a.mittaukset["MTuuli"].v || a.asema - b.asema);
        break;
        case "w-" :
            returnData = data.sort((a,b) => a.mittaukset["MTuuli"].v - b.mittaukset["MTuuli"].v || a.asema - b.asema);
        break;
        case "h" :
        case "h+" :
            returnData = data.sort((a,b) => b.mittaukset["Koste"].v  - a.mittaukset["Koste"].v  || a.asema - b.asema);
        break;
        case "h-" :
            returnData = data.sort((a,b) => a.mittaukset["Koste"].v  - b.mittaukset["Koste"].v  || a.asema - b.asema);
        break;
        case "i" :
            if (sade24) {
                returnData = data.sort((a,b) => b.mittaukset["S-Int"].v - a.mittaukset["S-Int"].v  || b.mittaukset["Sad24h"].v - a.mittaukset["Sad24h"].v );
            } else {
                returnData = data.sort((a,b) => b.mittaukset["S-Int"].v - a.mittaukset["S-Int"].v  || b.mittaukset["S-Sum"].v - a.mittaukset["S-Sum"].v );
            }
        break;
        case "i-" : 
            if (sade24) {
                returnData = data.sort((b,a) => b.mittaukset["S-Int"].v - a.mittaukset["S-Int"].v  || b.mittaukset["Sad24h"].v - a.mittaukset["Sad24h"].v );
            } else {
                returnData = data.sort((b,a) => b.mittaukset["S-Int"].v - a.mittaukset["S-Int"].v  || b.mittaukset["S-Sum"].v - a.mittaukset["S-Sum"].v );
            }
        break;
        case "+" : 
            returnData = data.sort((a,b) => b.mittaukset["IlmMAX"].v - a.mittaukset["IlmMAX"].v || a.asema - b.asema);
        break;
        case "-" : 
            returnData = data.sort((a,b) => a.mittaukset["IlmMIN"].v - b.mittaukset["IlmMIN"].v || a.asema - b.asema);
        break;
        case "+-" :
            returnData = data.sort((a,b) => a.mittaukset["IlmMAX"].v - b.mittaukset["IlmMAX"].v || a.asema - b.asema);
        break;
        case "-+" :
            returnData = data.sort((a,b) => b.mittaukset["IlmMIN"].v - a.mittaukset["IlmMIN"].v || a.asema - b.asema);
        break;
        case "a" : 
            returnData = data.sort((a,b) => a.asema - b.asema || a.asema - b.asema);
        break;
        case "n" : 
        case "n-" :
            returnData = data.sort((a,b) => a.mittaukset["Näky_m"].v - b.mittaukset["Näky_m"].v || a.asema - b.asema);
        break;
        case "n+" :
            returnData = data.sort((a,b) => b.mittaukset["Näky_m"].v - a.mittaukset["Näky_m"].v || a.asema - b.asema);
        break;
        case "p" :
            returnData = data.sort((a,b) => b.mittaukset["IPaine"].v - a.mittaukset["IPaine"].v || a.asema - b.asema);
        break;
        case 'd':
        case 'd-':
            returnData = data.sort((a,b) => a.mittaukset["Dist"].v - b.mittaukset["Dist"].v);
        break;
        case 'd+':
            returnData = data.sort((a,b) => b.mittaukset["Dist"].v - a.mittaukset["Dist"].v);
        break;
        case 'o':
        case 'O':
            returnData = data;
        break;
        case 'f-':
            returnData = data.sort((a,b) => a.mittaukset["Kitka"].v - b.mittaukset["Kitka"].v || a.asema - b.asema);
        break;
        case 'f+':
            returnData = data.sort((a,b) => b.mittaukset["Kitka"].v - a.mittaukset["Kitka"].v || a.asema - b.asema);
        break;
        case 'lumi-':
            returnData = data.sort((a,b) => a.mittaukset["LumSyv"].v - b.mittaukset["LumSyv"].v || a.asema - b.asema);
        break;
        case 'lumi+':
            returnData = data.sort((a,b) => b.mittaukset["LumSyv"].v - a.mittaukset["LumSyv"].v || a.asema - b.asema);
        break;
        default:
            returnData = data.sort((a,b) => a.mittaukset["Dist"].v - b.mittaukset["Dist"].v);
    }

    return returnData;

}

async function setNewHome(newHomeString, home)
    {
        if (newHomeString.match("[0-9]")) {
            if (newHomeString.match("[0-9]+(\.[0-9]|)[,;][0-9]+(\.[0-9]+|)")) {
                home.longitude=parseFloat(newHomeString.split(/[,;]/)[0])
                home.latitude=parseFloat(newHomeString.split(/[,;]/)[1])
            }
        } else  {
            newHome = await getNewHome(newHomeString)
            if (newHome.long != 0) {
                home.longitude=newHome.long
                home.latitude=newHome.lat
            }
        }
    }

function getKeli(k1, k2) {

    return k1 == "Anturissa on vikaa" ? k2 : k1;
}

function printSaatiedot(fullname, mittaukset, n) {

    offset = fullname.split(" ")[0].length==4 ? "  " : " "
    if (showPlace) {
        line = (n+".").padStart(4," ")
    } else line=""
    line = line + offset + fullname
    line = (line.padEnd(50," ")).substring(49,line);
    line += !mittaukset["Ilma "].x ? (mittaukset["Ilma "].v.toFixed(1)+mittaukset["Ilma "].u).padStart(8," ") : noData.padStart(8," ")
    line += (showMuutos) ? !mittaukset["DIlm"].x ? (mittaukset["DIlm"].v.toFixed(1)+mittaukset["DIlm"].u).padStart(9," ") : noData.padStart(9," ") :""
    line += (showTie) ? !mittaukset["Tie"].x ? (mittaukset["Tie"].v.toFixed(1)+mittaukset["Tie"].u).padStart(8," ") : noData.padStart(8," ") : ""
    line += (showKitka) ? !mittaukset["Kitka"].x ? (mittaukset["Kitka"].v.toFixed(2)+mittaukset["Kitka"].u).padStart(8," ") : noData.padStart(8," ") : ""
    line += (showLumi) ? !mittaukset["LumSyv"].x ? (mittaukset["LumSyv"].v+mittaukset["LumSyv"].u).padStart(8," ") : noData.padStart(8," ") : ""
    line += !mittaukset["IlmMIN"].x ? (mittaukset["IlmMIN"].v.toFixed(1)+mittaukset["IlmMIN"].u).padStart(8," ") : noData.padStart(8," ")
    line += !mittaukset["IlmMAX"].x ? (mittaukset["IlmMAX"].v.toFixed(1)+mittaukset["IlmMAX"].u).padStart(8," ") : noData.padStart(8," ")
    line += (showDistance) ? (mittaukset["Dist"].v.toFixed(1)+mittaukset["Dist"].u).padStart(9," ") : ""
    line += !mittaukset["Koste"].x ? (mittaukset["Koste"].v+mittaukset["Koste"].u).padStart(6," ") : noData.padStart(6," ")
    line += !mittaukset["MTuuli"].x ? (mittaukset["MTuuli"].v.toFixed(1)+mittaukset["MTuuli"].u).padStart(9," ") : noData.padStart(9," ")
    line += !mittaukset["Näky_m"].x ? (mittaukset["Näky_m"].v+mittaukset["Näky_m"].u).padStart(8," ") : noData.padStart(8," ")
    if(sade24) {
        line += !mittaukset["Sad24h"].x ? (mittaukset["Sad24h"].v > 0) ? (mittaukset["Sad24h"].v.toFixed(1)+mittaukset["Sad24h"].u).padStart(8," ") : ".   ".padStart(8," ") : noData.padStart(8," ")
    } else {
        line += !mittaukset["S-Sum"].x ? (mittaukset["S-Sum"].v > 0) ? (mittaukset["S-Sum"].v.toFixed(1)+mittaukset["S-Sum"].u).padStart(8," ") : ".   ".padStart(8," ") : noData.padStart(8," ")
    }
    line += !mittaukset["S-Int"].x ? (mittaukset["S-Int"].v > 0) ? (mittaukset["S-Int"].v.toFixed(2)+mittaukset["S-Int"].u).padStart(11," ") : ".      ".padStart(11," ") : noData.padStart(8," ")+"   "
    line += (showKeli) ? " " + (getKeli(mittaukset["Keli1"].text, mittaukset["Keli2"].text)).padEnd(6," ") : "";
    line += !mittaukset["IPaine"].x ? (mittaukset["IPaine"].v.toFixed(1)+mittaukset["IPaine"].u).padStart(11," "):""
    line += !mittaukset["Ilma "].x ? (mittaukset["Ilma "].mTime>timeNotify ? " *"+mittaukset["Ilma "].mTime+"* " : "") : ""
    line += (showSaatila) ? mittaukset["Säätila"].text=="." ? "" : "  "+mittaukset["Säätila"].text : ""
    return line
}

async function log24History(id)  {
    console.log("\n* 24h historia  Ilma     Tie    Kosteus  Tuuli    Näky    SadeSum   SadeI")
    IlmaHistory = await getHistory(id,1)
    SSumHistory = await getHistory(id,24)
    Tie1History = await getHistory(id,3)
    MaxTuuliHistory = await getHistory(id,17)
    KosteHistory = await getHistory(id,21)
    SIntHistory = await getHistory(id,23)
    NakyHistory = await getHistory(id,58)
    
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
    maxTie = -99; minTie = 99; maxTieT = " "; minTieT = " ";
    eka=true;
    lastSsum=0;
    lastRainI=0;
    lastKosteus=0;
    maxTuuli=0;
    nakyvyys=99999;
    lastValues={}

    for (item of IlmaHistory) {

        if (item.value > maxIlma) {
            maxIlma = item.value;
            maxIlmaT =  moment(item.measuredTime).format('HH:mm')
        }
        if (item.value < minIlma) {
            minIlma = item.value;
            minIlmaT =  moment(item.measuredTime).format('HH:mm')
        }
        if (moment(item.measuredTime).format('H') != h)
        {
            h = moment(item.measuredTime).format('H');
            IlmaVal[h]  = item.value.toFixed(1)+"°C"
            timeIndex[h] = moment(item.measuredTime).format('DD.MM. HH:mm')
            if (eka) {
                startH = h;
                eka = false;
            }
        }
    }
    lastValues["ilmaTemp"] = IlmaHistory[IlmaHistory.length-1].value
    lastValues["ilmaTime"] = IlmaHistory[IlmaHistory.length-1].measuredTime
    validHistory=false;
    for (item of Tie1History) {
        validHistory=true;
        if (item.value > maxTie) {
            maxTie = item.value;
            maxTieT =  moment(item.measuredTime).format('HH:mm')
        }
        if (item.value < minTie) {
            minTie = item.value;
            minTieT =  moment(item.measuredTime).format('HH:mm')
        }
        if (moment(item.measuredTime).format('H') != h)
        {
            h = moment(item.measuredTime).format('H');
            Tie1Val[h] = item.value.toFixed(1)+"°C"
        }
    }
    lastValues["tieTemp"] = validHistory?Tie1History[Tie1History.length-1].value:""
    validHistory=false;
    prev = 0;
    for (item of SSumHistory) {
        validHistory=true;
        if (moment(item.measuredTime).format('H') != h)
        {
            h = moment(item.measuredTime).format('H');
            ssum = prev.toFixed(1)
            SSumVal[h] = (parseFloat(ssum) != 0) ? ssum+"mm" : ""
        }
        prev = item.value;
    }
    lastValues["ssum"] = validHistory?SSumHistory[SSumHistory.length-1].value:""
    validHistory=false;
    for (item of KosteHistory) {
        validHistory=true;
        if (moment(item.measuredTime).format('H') != h)
        {
            h = moment(item.measuredTime).format('H');
            KosteVal[h] = item.value+"%"
        }
        lastKosteus = item.value;
    }
    lastValues["kosteus"]  = validHistory?KosteHistory[KosteHistory.length-1].value:""

    maxtuuli=0;
    h=30;
    validHistory=false;
    for (item of MaxTuuliHistory) {
        validHistory=true;
        if (moment(item.measuredTime).format('H') != h)
        {
            h = moment(item.measuredTime).format('H');
            MaxTuuliVal[h] = maxtuuli.toFixed(1)+"m/s"
            maxtuuli = item.value;
        } else {
            if (item.value > maxtuuli) {
                maxtuuli = item.value;
            }
        }
    }
    lastValues["maxTuuli"] = validHistory?maxtuuli:""

    h=30;
    validHistory=false;
    for (item of SIntHistory) {
        validHistory=true;
        if (moment(item.measuredTime).format('H') != h)
        {
            h = moment(item.measuredTime).format('H');
            SIntVal[h] = (parseFloat(lastRainI) != 0) ? lastRainI.toFixed(2)+"mm/h" : "";
            lastRainI = 0
        } else {
            if (item.value > lastRainI) {
                lastRainI = item.value;
            }
        }
    }
    lastValues["sint"] = validHistory?lastRainI:""

    h=30;
    naky = 99999;
    validHistory=false;
    for (item of NakyHistory) {
        validHistory=true;
        if (moment(item.measuredTime).format('H') != h)
        {
            h = moment(item.measuredTime).format('H');
            if (naky==99999) naky = item.value;
            NakyVal[h] = naky+"m";
            naky = item.value;
        } else {
            if (item.value < naky) {
                naky = item.value;
            }
        }
    }
    lastValues["naky"] = validHistory?naky:""

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

    return (lastValues)
}

async function lastHourHistory(id) {
    IlmaHistory = await getHistory1h(id,1)
    SSumHistory = await getHistory1h(id,24)
    SIntHistory = await getHistory1h(id,23)
    WindHistory = await getHistory1h(id,17)
    h = {}
    h["IlmaH"]=""
    h["SSumH"]=""
    h["SIntH"]=""
    h["MaxTuuli"]=""
    h["starttime"]=""
    h["endtime"]=""

    for (item of IlmaHistory.values) {h["IlmaH"] += (""+item.value.toFixed(1)+" ").padStart(7," ");h["endtime"] = item.measuredTime;if (h["starttime"]=="") h["starttime"]= item.measuredTime}
    for (item of SSumHistory.values) {h["SSumH"] += item.value!=0 ? (""+item.value.toFixed(1)+" ").padStart(7," "):" ".padStart(7," ")}
    for (item of SIntHistory.values) {h["SIntH"] += item.value!=0 ? (""+item.value.toFixed(2)+"").padStart(7," "):" ".padStart(7," ")}
    for (item of WindHistory.values) {h["MaxTuuli"] += (""+item.value.toFixed(1)+" ").padStart(7," ")}
    return h;
}

async function printData(id, lista, limit, detail) {
    tieString = (showTie)? "Tie ".padStart(9," "):""
    kitkaString = (showKitka)? "Kitka".padStart(8," "):""
    muutosString = (showMuutos)?" Muutos".padStart(9," "):""
    etaisyysString = (showDistance)?"Matka".padStart(9," "):""
    lumiString = (showLumi) ? "Lumi".padStart(8," "):""
    sadeString = (sade24) ? "Sade24" : (isDST) ? "Sade07" :"Sade06"
    header = " ".padEnd(50," ")+"Ilma".padStart(6," ")+muutosString+tieString+kitkaString+lumiString+"Min".padStart(7," ")+"Max".padStart(8," ")+etaisyysString+"Kost".padStart(8," ")+"Tuuli".padStart(8," ")+"Näky".padStart(8," ")+sadeString.padStart(9," ")+"SadeI" .padStart(8," ")
    counter = 0;
    fullCount = 0;

    if (detail) {
        mittaukset =lista[0].mittaukset;
        console.log("\nPäivitetty "+updateTime(mittaukset))
        console.log(mittaukset["Säätila"].text);
        console.log("Etäisyys: "+mittaukset["Dist"].v.toFixed(1)+"km    "+" Long/Lat: "+lista[0].lon+"  "+lista[0].lat);
        console.log(saaLuvut(mittaukset));
        console.log(keliLine(mittaukset))
        console.log(kitkaLine(mittaukset))
        console.log("\n"+pisteLine(mittaukset))
        console.log(suolaLine(mittaukset))
        console.log(nakyLine(mittaukset))
        if (showMisc) console.log(miscLine(mittaukset))
        lastHour = await lastHourHistory(id)
        console.log("\nViimeisin tunti",moment(h["starttime"]).format('DD.MM. HH:mm'),"-",moment(h["endtime"]).format('HH:mm'))
        console.log("Ilma    °C", lastHour["IlmaH"])
        console.log("SadeI mm/h", lastHour["SIntH"])
        console.log("SadeSum mm", lastHour["SSumH"])
        console.log("Tuuli  m/s", lastHour["MaxTuuli"])
        lastValues = await log24History(id);
        //console.log(lastValues)
        console.log("%s %s %s %s %s %s %s",
            moment(lastValues.ilmaTime).format('DD.MM. HH:mm'),
            (lastValues.ilmaTemp.toFixed(1)+"°C").padStart(9," "),
            ((lastValues.tieTemp!="")?(lastValues.tieTemp.toFixed(1)+"°C"):"").padStart(8," "),
            ((lastValues.kosteus!="")?(lastValues.kosteus+"%"):"").padStart(5," "),
            ((lastValues.maxTuuli!="")?(lastValues.maxTuuli.toFixed(1)+"m/s"):"").padStart(9," "),
            ((lastValues.naky!="")?(lastValues.naky+"m"):"").padStart(7," "),
            ((lastValues.ssum!="")?(lastValues.ssum.toFixed(1)+"mm"):"").padStart(8," "),
            ((lastValues.sint!="")?(lastValues.sint.toFixed(2)+"mm/h"):"").padStart(11," "))
        console.log("\nIlma  Max:",maxIlmaT,(maxIlma.toFixed(1)+"°C").padStart(7," "),"  Min: ",minIlmaT,(minIlma.toFixed(1)+"°C").padStart(7," "))
        minTie!=99?console.log("Tie   Max:",maxTieT,(maxTie.toFixed(1)+"°C").padStart(7," "),"  Min: ",minTieT,(minTie.toFixed(1)+"°C").padStart(7," ")):"";

    } else{
        console.log(header);
        if (showInvalid) {
            for (perusLine of lista) {
                fullCount++;
                if ((perusLine.mittaukset["Ilma "].v == -99  || perusLine.mittaukset["Ilma "].mTime >= timeReject) || showEmpty) {
                    console.log(printSaatiedot(perusLine.fullname,perusLine.mittaukset,fullCount));
                    if (++counter>=limit) break;
                }
            }
        } else {
            for (perusLine of lista) {
                if ((perusLine.mittaukset["Ilma "].v != -99  && perusLine.mittaukset["Ilma "].mTime <timeReject) || showEmpty) {
                    fullCount++;
                    if ((searchStrings.length == 0 || searchStrings.filter(word => perusLine.fullname.toLowerCase().includes(word.toLowerCase())).length > 0)) {
                        console.log(printSaatiedot(perusLine.fullname,perusLine.mittaukset,fullCount));
                        if (++counter>=limit) break;
                        if (splitPrint && (counter%splitLine == 0)) {
                            console.log("  ")
                        }
                    }
                }
            }
        }
    }
}

async function getTiesaa(rawData,home,saatilat,detail,order,lineLimit,separator) {
    const saatilatMap = new Map();
    const tempNamesMap = new Map();
    const asemaSaatMap = new Map();
    latHome = home.latitude
    longHome = home.longitude
    saatilalines = saatilat.split('\n');
    for (line of saatilalines) {
        sId = line.match(/^([\d]+)/);
        sData = line.match(/(?<=\s)[^\]]+/);
        saatilatMap.set(sId[0],sData[0]);
    }
    perusLista=[];
    puuttuu=false;
    tuntematon=false;
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
    id2=0;
    lines.forEach( (line) => {
        linetemp=line;
        tuntematon=false;
        puuttuu=false;
        id = line.match(/^([\d]+)/);
        if (id) {
            id2=id[0]
            // console.log("ID:"+id[0]);
            if (!line.includes('@')) { //haetaan nimi mapista
                line = tempNamesMap.get(id[0])
            }
            if (!line) line = "Tuntematon:"+linetemp+"@0,0";
            let asemaData = asemaSaatMap.get(parseInt(id[0]));
            if (asemaData==null) {
                {asemaData=[];tuntematon=true};
            } else if (asemaData.length==0) {
                puuttuu =true;
            }
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
                    dist = distance(parseFloat(lati),parseFloat(longi),latHome,longHome).toFixed(1);

                    mittaukset["Ilma "]  ? mittaukset["Ilma "].mTime=checkMeasureTime(mittaukset["Ilma "].t):
                    mittaukset["Ilma "]  ? mittaukset["Ilma "].v = mittaukset["Ilma "].v : (order=='l-')?mittaukset["Ilma "]={x:1,v:99,u:""}:mittaukset["Ilma "]= {x:1,v:-99,u:""};
                    mittaukset["DIlm"] ? mittaukset["DIlm"].v =  mittaukset["DIlm"].v : (order=='m+')?mittaukset["DIlm"] = {x:1,v:0,u:""}:mittaukset["DIlm"] = {x:1,v:99,u:""};
                    if (mittaukset["Tie1"]) {
                        mittaukset["Tie"] =  {v: mittaukset["Tie1"].v,
                                              u: mittaukset["Tie1"].u}
                    } else if (mittaukset["Tie2"]) {
                        mittaukset["Tie"] =  {v: mittaukset["Tie2"].v,
                                              u: mittaukset["Tie2"].u}
                    } else {
                        if (order == "t-") {
                            mittaukset["Tie"] = {x:1,v:99,u:""};
                        } else {
                            mittaukset["Tie"] = {x:1,v:-99,u:""};
                        }
                    }
                    if (mittaukset["Kitka1"]) {
                        mittaukset["Kitka"] =  {v: mittaukset["Kitka1"].v,
                                                u: mittaukset["Kitka1"].u}
                    } else if (mittaukset["Kitka2"]) {
                        mittaukset["Kitka"] =  {v: mittaukset["Kitka2"].v,
                                                u: mittaukset["Kitka2"].u}
                    } else {
                        if (order == "f-") {
                            mittaukset["Kitka"] = {x:1,v:99,u:""};
                        } else {
                            mittaukset["Kitka"] = {x:1,v:-99,u:""};
                        }
                    }
                    if (mittaukset["Maa1"]) {
                        mittaukset["Maa"] =  {v: mittaukset["Maa1"].v,
                                              u: mittaukset["Maa1"].u}
                    } else if (mittaukset["Maa2"]) {
                        mittaukset["Maa"] =  {v: mittaukset["Maa2"].v,
                                              u: mittaukset["Maa2"].u}
                    }
                    mittaukset["Sad24h"] ? mittaukset["Sad24h"].v =  mittaukset["Sad24h"].v: (order=='s-' ||  order=='r-') ? mittaukset["Sad24h"] = {x:1,v:999,u:""}:mittaukset["Sad24h"] = {x:1,v:-1,u:""};
                    mittaukset["S-Sum"]  ? mittaukset["S-Sum"].v =   mittaukset["S-Sum"].v:  (order=='s-' ||  order=='r-') ? mittaukset["S-Sum"] = {x:1,v:999,u:""}:mittaukset["S-Sum"] = {x:1,v:-1,u:""};
                    mittaukset["S-Int"]  ? mittaukset["S-Int"].v =   mittaukset["S-Int"].v:  (order=='i-') ? mittaukset["S-Int"] = {x:1,v:999,u:""}:mittaukset["S-Int"] = {x:1,v:0,u:""};
                    mittaukset["MTuuli"] ? mittaukset["MTuuli"].v =  mittaukset["MTuuli"].v: (order=='w-') ? mittaukset["MTuuli"] = {x:1,v:99,u:"" }:mittaukset["MTuuli"] = {x:1,v:0,u:"" };
                    mittaukset["Koste"]  ? mittaukset["Koste"].v =   mittaukset["Koste"].v:  (order=='h-') ? mittaukset["Koste"] = {x:1,v:999,u:""}:mittaukset["Koste"] = {x:1,v:0,u:""};
                    mittaukset["IlmMIN"] ? mittaukset["IlmMIN"].v =  mittaukset["IlmMIN"].v : (order=='-+') ? mittaukset["IlmMIN"] = {x:1,v:-99,u:""}:mittaukset["IlmMIN"] = {x:1,v:99,u:""};
                    mittaukset["IlmMAX"] ? mittaukset["IlmMAX"].v =  mittaukset["IlmMAX"].v : (order=='+-') ? mittaukset["IlmMAX"] = {x:1,v:99,u:""}:mittaukset["IlmMAX"] = {x:1,v:-99,u:""};
                    mittaukset["Näky_m"] ? mittaukset["Näky_m"].v =  mittaukset["Näky_m"].v : (order=='n+') ? mittaukset["Näky_m"] = {x:1,v:0,u:""}:mittaukset["Näky_m"] = {x:1,v:99999,u:""};
                    mittaukset["Säätila"] ? mittaukset["Säätila"].text = saatilatMap.get(mittaukset["Säätila"].v+"") : mittaukset["Säätila"] = {text:""};
                    mittaukset["S-Tila"] ? mittaukset["S-Tila"].text = saatilatMap.get(mittaukset["S-Tila"].v+"") : mittaukset["S-Tila"] = {text:""};
                    mittaukset["IPaine"] ? mittaukset["IPaine"].v =  mittaukset["IPaine"].v:mittaukset["IPaine"] = {x:1,v:0,u:"" };
                    mittaukset["LumSyv"] ? mittaukset["LumSyv"].v = mittaukset["LumSyv"].v: (order=='lumi-')?mittaukset["LumSyv"]={x:1,v:999,u:""}:mittaukset["LumSyv"]={x:1,v:0,u:""};
                    mittaukset["Dist"] = {v:parseFloat(dist),u:"km"};
                    mittaukset["Keli1"] ? mittaukset["Keli1"].text = mittaukset["Keli1"].d : mittaukset["Keli1"] = {text:" - "};
                    mittaukset["Keli2"] ? mittaukset["Keli2"].text = mittaukset["Keli2"].d : mittaukset["Keli2"] = {text:" - "};
                    if (tuntematon) {mittaukset["Säätila"]={text:"Tuntematon asema"}};
                    if (puuttuu) {mittaukset["Säätila"]={text:"Data puuttuu"}};
                    perusLista.push({"fullname":fullName, "mittaukset": mittaukset, "asema":asm, "lon":longi, "lat":lati});
            }
            };
        }
    );
    perusLista = sortSaaData(perusLista, order)
    printData(id2,perusLista, lineLimit, detail)

}

async function start(consoleline) {

    filename = "saatilat.txt";
    order ="d"
    showEmpty = false;
    showInvalid = false;
    sade24 = false;
    showTie = false;
    showMuutos = false;
    showSaatila = true;
    showDistance = false;
    showKitka = false;
    showLumi = false;
    showMisc = false;
    showPlace = false;
    showKeli = false;
    splitPrint = false;
    newHomeString=""
    separator='\n'
    isDST = moment().isDST();
    tempString=""
    searchStrings = []
    oneStation = false;
    try {
        saatilat = await fileRead(filename)
    } catch (err) {console.log("error",err)}

    try {
        config = await fileRead("tiesaa.ini")
    } catch (err) {console.log("error",err)}
    config = JSON.parse(config);
    timeNotify=config.timeNotify;
    timeReject=config.timeReject;
    noData=config.noData;
    splitLine=config.splitLine;
    if (typeof timeNotify != 'number') timeNotify = 8;
    if (typeof timeReject != 'number') timeReject = 30;
    if (typeof noData != 'string') noData = "";

    filename = "tiesaa.txt";
    if (consoleline[2]) {
        filename = consoleline[2];
    }

    if (filename.match(/^[0-9]+$/)) oneStation=true;
    if (filename.substring(1).match(/^[0-9]+$/) && !oneStation) {oneStation=true; filename=filename.substring(1)}

    if (oneStation){
        rawData = filename+" :";
        if (consoleline[3]) showMisc = true;
        let asemaData = await getAsemaInfo(filename)
            if (asemaData) {
                const s = asemaData.properties.names.fi+","+asemaData.properties.province+"@"+asemaData.geometry.coordinates[0]+","+asemaData.geometry.coordinates[1]+","+asemaData.geometry.coordinates[2];
                rawData = filename+" "+s;
                console.log(asemaData.id,asemaData.properties.names.fi,asemaData.properties.municipality,asemaData.properties.province,"("+asemaData.properties.roadAddress.contractArea+")")
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
            if (param.match(/^(?=[#a-zA-Z+-])[^dfmtkxX.]{1,2}$/)) {
                order = param.substring(0,1) =='-' ? param.substring(1):param
                tempString = param.substring(0,1) =='#' ? param.substring(1):""
                if (tempString.length > 0) searchStrings.push(tempString);
            }
            if (param.match(/^#.*$/)) {
                tempString = param.substring(0,1) =='#' ? param.substring(1):""
                if (tempString.length > 0) searchStrings.push(tempString);
            }
            if (param.match(/^\\.*$/)) {
                splitPrint = true
                splitLine = param.length > 1 ? parseInt(param.substring(1)):splitLine
            }
            if (param == '-' || param == '-+') order = param;
            if (param == 'x') showEmpty = true;
            if (param == 'X') showInvalid = true;
            if (param == 't') {showTie = true; }
            if (param == 't+' || param == 't-') {showTie = true; order = param}
            if (param == 'm') {showMuutos=true;}
            if (param == 'm+' || param =='m-') {showMuutos=true; order = param}
            if (param == 'f') {showKitka = true; }
            if (param == 'f+' || param == 'f-') {showKitka = true; order = param}
            if (param == '.') showSaatila = false;
            if (param == '!') showPlace = true;
            if (param.substring(0,1) == "*") {showTie = true; showMuutos=true; showDistance=true; sade24=true; limit=50}
            if (param == '**') {showKitka=true; showLumi = true; }
            if (param == 's24' || param == 'S24') sade24 = true;
            if (param == 's0' || param == 'S0') sade24 = false;
            if (param.toLowerCase() == 'lumi') showLumi = true;
            if (param.toLowerCase() == 'lumi+' || param.toLowerCase() == 'lumi-') {showLumi = true; order = param.toLowerCase()}
            if (param == 'd') {showDistance = true;}
            if (param == 'd+' || param =='d-') {showDistance=true; order = param}
            if (param.substring(0,1) == "@") {newHomeString=param.substring(1)}
            if (param == 'k') {showKeli = true;}
        }
        if (limit_temp==-1) limit_temp=1000; else limit=limit_temp;
        limit = ['P','E','I','L','N','W','S','D','a','.'].includes(order)?Math.min(1000,limit_temp):limit;
        if (filename.includes(".")) {
            try {
                rawData = await fileRead(filename)
            } catch (err) {console.log("error",err)}
        } else {
            /* try {
                rawData = await SaaAsematLista(filename);
            } catch (err) {console.log("error",err)}
            separator='*' */
            filename="tieasemat.txt";
            try {
               rawData = await fileRead(filename)
            } catch (err) {console.log("error",err)}
            for (a of consoleline.slice(2)) {
                if (a.length > 2) searchStrings.push(a);
            }
        }
        if (newHomeString!="") await setNewHome(newHomeString, config.home)
        //  console.log(order, showEmpty, showTie, timeNotify, limit, config.home.longitude,config.home.latitude,searchStrings, splitPrint, splitLine, showPlace )
        if (typeof rawData !== 'undefined' && rawData) {
            getTiesaa(rawData,config.home,saatilat,0,order,limit,separator);
        } 
    }
}

start(process.argv);
