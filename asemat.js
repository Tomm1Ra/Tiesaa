//const moment = require('moment-timezone');
const axios = require('axios');

function getAsemaInfo(id,cb) {
    axios({
        method: 'get',
        url: `https://tie.digitraffic.fi/api/weather/v1/stations/${id}`
    }).then((response) => {
        if (response){
            //console.log(response);
            cb(response.data);
        }else {
            console.log("get info fail");
            cb({"data":[]});
        }
    }).catch((e)=>{console.log("Virhe asema ",id);cb({"data":[]})});
}

function getSaaasemat(callback) {
    axios({
        method: 'get',
        url: "https://tie.digitraffic.fi/api/weather/v1/stations?lastUpdated=false&state=ACTIVE"
    }).then((response) => {
        if (response){
            //console.log(response);
            callback(response.data);

        }else {
            console.log("get info fail");
            callback({"data":[]});
        }
    }).catch((e)=>{console.log("invalid request",e);callback({"data":[]})});
}

function SaaAsematLista(searchString) {
    getSaaasemat(function(infoData) {
        if (infoData) {
            for(n=0;n<infoData.features.length;n++) {
                id=infoData.features[n].properties.id;
                //console.log(n,id);
                getAsemaInfo(id,function(asemaData){
                    if (asemaData.properties) {
                        const s= asemaData.properties.names.fi+asemaData.properties.municipality+asemaData.properties.province
                        if (s.toLowerCase().includes(searchString.toLowerCase()))
                        console.log(asemaData.properties.id,asemaData.properties.names.fi,asemaData.properties.province,
                            "@"+asemaData.geometry.coordinates[0]+","+asemaData.geometry.coordinates[1]+","+asemaData.geometry.coordinates[2]);
                    }
                });
            }
        } else {
            console.log(' Mitä vittua ');
        }


})
}
searchString='';
if (process.argv[2]) searchString=process.argv[2]
SaaAsematLista(searchString)

