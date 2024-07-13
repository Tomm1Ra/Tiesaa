# Tiesaa
Tiesää asemien tiedot

Digitraffic Road API
https://tie.digitraffic.fi/swagger/

Käyttö 

Aseta kotikoordinaatit tiesaa.ini home 

Hae asemat
node asemat.js <ehto>
esim:
node asemat.js "Tie 4 " > nelostie.txt\
node asemat.js Tie > tieasemat.txt\

Hae tiesäätiedot
node tiesaa.js <file|-id> [P,L,I,E,a,l,k,+,-,h,w,n,s,i] [d]
Järjestys:\
P pohjoinen
I itä
L länsi
E etelä
a aseman numero
l lämpimin ilma
k kylmin ilma
+/- Max/Min lämpötilat
h kosteus
w tuuli
n näkyvyys
s sade 24h
i sateen intensiteetti\
oletus järjestys on etäisyys kotoa

esim:\
node tiesaa.js nelostie.txt E (=tiedostossa nelostie.txt olevat asemat etelästä lukien)\
node tiesaa.js -2009 (= aseman 2009 tarkemmat tiedot)\
node tiesaa.js Tie w 20 (20 tuulisinta tiesääasemaa)
