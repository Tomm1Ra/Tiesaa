# Tiesaa
Tiesää asemien tiedot

https://www.digitraffic.fi/tieliikenne/

Digitraffic Road API\
https://tie.digitraffic.fi/swagger/

Käyttö 

Aseta kotikoordinaatit tiesaa.ini home 

Hae asemat\
node asemat.js <ehto> > filenimi.txt\
esim:\
node asemat.js "Tie 4 " > nelostie.txt\
node asemat.js Satakunta > satakunta.txt\
node asemat.js Tie > tieasemat.txt

Hae tiesäätiedot
node tiesaa.js <file|-id> [P,L,I,E,a,l,+,-,h,w,n,s,i,p] [d,t,k,f,x,X,m,.,s24,s0,lumi,@,#,!]\
Järjestys:\
'P' pohjoinen
'I' itä
'L' länsi
'E' etelä
'a' aseman numero\
'l' lämpimin ilma
'd' etäisyys
'p' ilmanpaine\
'+'/'-' Max/Min lämpötilat
'h' kosteus
'w' tuuli
'n' huonoin näkyvyys
's' sade
'i' sateen intensiteetti\
Järjestys [ltm+-hwnsidf] ja + tai - järjestää nousevaan tai laskevaan järjestykseen\
oletusjärjestys on etäisyys kotipisteestä

'x' näyttää myös asemat joista ei päivitettyä mittausdataa (ilman lämpötilaa), 'X' vain ne\
'd' näyttää etäisyyden kotipisteeseen
't' näyttää tien lämpötilan
'k' näyttää tien kelin\
'f' näyttää tien kitkan
'm' näyttää ilman lämpötilamuutoksen\
'.' ei näytä säätilatekstiä
'lumi' näyttää lumensyvyyden
's24' sademittaus viimeiset 24h, 's0' aamulla nollattu sademäärä (oletus)\
'!' näyttää järjestysnumeron\
'@' Vaihtaa kotipisteen @Paikkakunta tai @longitude,latitude (desimaalierotin .) 
'#teksti' filtteröi tekstin sisältävät mukaan

esim:\
node tiesaa.js nelostie.txt E (=tiedostossa nelostie.txt olevat asemat etelästä lukien)\
node tiesaa.js -2009 (= aseman 2009 tarkemmat tiedot)\
node tiesaa.js Tie w 20 (20 tuulisinta tiesääasemaa)\
node tiesaa.js tieasemat.txt 30 l (30 lämpimintä tiesääasemaa)\
node tiesaa.js tieasemat.txt 25 E #mäki (25 paikkaa joissa 'mäki'-teksti etelästä)\
node tiesaa.js tieasemat.txt d 20 @24.456,62.3456 (20 lähintä asemaa annetusta koordinaatista sekä etäisyys niihin)

node 24historia.js AAAA BB (näyttää aseman AAAA sensorin BB datat 24h ajalta 5min välein)\
node AsemanSensorit.js (näyttää mitä sensoreita on asemilla)\
node SensoriInfo.js (näyttää sensorien nimet)\
node KaikkiData.js AAAA (näyttää aseman AAAA kaikkien sensorien arvon)\
\
Testattu versioilla: NodeJS v18.15.0, npm 9.5.0
