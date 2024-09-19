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
node tiesaa.js <file|-id> [P,L,I,E,a,l,k,+,-,h,w,n,s,i,p,T,M] [d,t,x,X,m,.,s24,@]\
Järjestys:\
'P' pohjoinen
'I' itä
'L' länsi
'E' etelä
'a' aseman numero\
'l' lämpimin ilma
'k' kylmin ilma
'p' ilmanpaine
'T' tien lämpötila
'M' ilman lämpötilan muutos\
'+'/'-' Max/Min lämpötilat
'h' kosteus
'w' tuuli
'n' huonoin näkyvyys
's' sade
'i' sateen intensiteetti\
oletusjärjestys on etäisyys kotoa

'x' näyttää myös asemat joista ei päivitettyä mittausdataa (ilman lämpötilaa), 'X' vain ne\
'd' näyttää etäisyyden kotipisteeseen
't' näyttää tien lämpötilan
'm' mäyttää ilman lämpötilamuutoksen\
'.' ei näytä säätilatekstiä
's24' sademittaus viimeiset 24h, oletus aamu 06-\
@ Vaihtaa kotipisteen @Paikkakunta tai @longitude,latitude (desimaalierotin .)

esim:\
node tiesaa.js nelostie.txt E (=tiedostossa nelostie.txt olevat asemat etelästä lukien)\
node tiesaa.js -2009 (= aseman 2009 tarkemmat tiedot)\
node tiesaa.js Tie w 20 (20 tuulisinta tiesääasemaa)\
node tiesaa.js tieasemat.txt 30 l (30 lämpimintä tiesääasemaa)\
node tiesaa.js tieasemat.txt 30 @Hämeenlinna (30 Hämeenlinnaa lähinnä olevaa tiesääasemaa)

node 24historia.js AAAA BB (näyttää aseman AAAA sensorin BB datat 24h ajalta 5min välein)\
node AsemanSensorit.js (näyttää mitä sensoreita on asemilla)\
node SensoriInfo.js (näyttää sensorien nimet)\
node KaikkiData.js AAAA (näyttää aseman AAAA kaikkien sensorien arvon)\
\
Testattu versioilla: NodeJS v18.15.0, npm 9.5.0
