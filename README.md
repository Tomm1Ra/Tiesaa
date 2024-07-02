# Tiesaa
Tiesää asemien tiedot

Digitraffic Road API
https://tie.digitraffic.fi/swagger/

Käyttö 

Hae asemat
node asemat.js <ehto>
esim:
node asemat.js "Tie 4 "

Hae tiesäätiedot
node tiesaa.js <file|-id> [P,L,I,E,l,k,+,-,h,w,s,i] [d]
Järjestys:
P pohjoinen
I itä
L länsi
E etelä
l lämpimin ilma
k kylmin ilma
+ max lämpötila
- min lämpötila
h kosteus
w tuuli
s sade 24h
i sateen intensiteetti
oletus järjestys on etäisyys kotoa

esim:
node tiesaa.js nelostie.txt E (=tiedostossa nelostie.txt olevat asemat etelästä lukien)
node tiesaa.js -2009 (= aseman 2009 tarkemmat tiedot)
node tiesaa.js Tie w 20 (20 tuulisinta tiesääasemaa)
