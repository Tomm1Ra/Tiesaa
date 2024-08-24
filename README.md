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
node tiesaa.js <file|-id> [P,L,I,E,a,l,k,+,-,h,w,n,s,i,T] [d,t,x]\
Järjestys:\
P pohjoinen
I itä
L länsi
E etelä
a aseman numero
l lämpimin ilma
k kylmin ilma
T tien lämpötila\
+/- Max/Min lämpötilat
h kosteus
w tuuli
n näkyvyys
s sade 24h
i sateen intensiteetti\
oletusjärjestys on (d) etäisyys kotoa

x näyttää asemat joista ei päivitettyä mittausdataa (ilman lämpötilaa)\
t näyttää tien lämpötilan

esim:\
node tiesaa.js nelostie.txt E (=tiedostossa nelostie.txt olevat asemat etelästä lukien)\
node tiesaa.js -2009 (= aseman 2009 tarkemmat tiedot)\
node tiesaa.js Tie w 20 (20 tuulisinta tiesääasemaa)\
node tiesaa.js tieasemat.txt 30 l (30 lämpimintä tiesääasemaa)

node 24historia.js 2012 23 (näyttää aseman  2012 sensorin 23 datat 24h ajalta 5min välein)\
node AsemanSensorit.js (näyttää mitä sensoreita on asemilla)\
node SensoriInfo.js (näyttää sensorien nimet)\
\
Testattu versioilla: NodeJS v18.15.0, npm 9.5.0
