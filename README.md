# my journey journal
Meine Abgabe für das Abschlussprojekt zu GeoSoftware 1 im SS 2015.
Das Reisetagebuch basiert auf auf Leaflet und MongoDB und wurde hauptsächlich mit Firefox 40.0 getestet.
Die Abgabe sollte bis auf die flickr-Einbindung alle Forderungen der Aufgabenstellung erfüllen.

Ich habe mit diversen Bibliotheken (
[eins](https://www.npmjs.com/package/flickrapi),
[zwo](https://www.npmjs.com/package/flickr-oauth-and-upload),
[drei](https://www.npmjs.com/package/fickr),
[vier](https://www.npmjs.com/package/flickr),
[fünf](https://www.npmjs.com/package/flickr-with-uploads),
[sechs](https://www.npmjs.com/package/flickr-upload)
) versucht Bilder zu flickr hochzuladen, doch bin immer gescheitert. Die Authentifizierung zu flickr funktioniert, doch ein Bild hochzuladen funktioniert nicht - mit dem Fehler 'Filetype not recognized'.
[Da auch andere Programme seit einigen Wochen dieses Problem zu haben scheinen](https://www.flickr.com/help/forum/en-us/72157654828581053/), gehe ich von einer (undokumentierten) Änderung in der Flickr API aus.

## Funktionsweise
Auf einer Startseite werden alle gespeicherten Reisen angezeigt.
Ist eine erstellt/ausgewählt/importiert worden, wird die Anzeigeseite mit Karte und Sidebar geladen. Abhängig von der URL-Query wird die entsprechende Reise nachgeladen und in einer lokalen, global verfügbaren Kopie `journey` gespeichert.
Die einzelnen Orte auf der Karte werden für jeden Reiseabschnitt einzeln geladen und dargestellt. Die Reise und deren Abschnitte sind über die URL direkt referenzierbar.

Wird ein Teil der Reise verändert, wird die gesamte Reise direkt zur Datenbank hochgeladen. Auf diese Weise ist die lokale Kopie immer zur Datenbank synchronisiert.

**Orte** (Punkte, Polylinien) sind immer einem Abschnitt zugeordnet, und können auf der Karte über die leaflet-draw Toolbar hinzugefügt werden.
Jeder Ort kann eine Referenz auf ein **Bild** speichern, welches bei Bedarf nachgeladen wird. Das Bild wird in einem externen Schema gespeichert, damit der häufige up-/download der Reise nicht zu groß wird.
Beim Einfügen eines Bildes in die Datenbank, werden - sofern es einem Marker auf der Karte zugeordnet ist - dessen Koordinaten in die EXIF GPS Werte (**'geotag'**) geschrieben.

Beim **Export** wird die Reise serverseitig auf alle Bild-Referenzen durchsucht, und die zugehörigen Bilder zusammen mit der Reise zurückgeschickt.

Es wird eine modifizierte Version des leaflet-sidebar Plugins verwendet, welches um eine `addPanel(...)` Funktion erweitert wurde, sodass Tabs dynamisch hinzugefügt werden können.

Alle clientseitigen Interaktionen werden in der Datenbank **geloggt**. Dazu besteht ein eigenes Datenbankschema, welches den Zeitpunkt, die IP, die Art der Interaktion und eine Beschreibung speichert.
Zusätzlich werden auch Requests an den Server gespeichert.
Die Daten können unter `localhost:8080/getAnalytics` abgerufen und bei Bedarf ausgewertet werden. Die Ausgabe kann nach IPs mit der angehängten URL-Query `?ip= ...` gefiltert werden.

## dependencies
* mongoDB v2.4.9
* node    v0.10.25

## run
Before the first run, make shure you have nodeJS, npm and mongoDB installed on your machine.
Then install all npm dependencies by calling `sudo npm install` in the apps root directory.

To start the server enter `npm start`, and the server should listen on `localhost:8080/`.

## configure
You can configure the server by editing the `config` variable in `server.js#l14`.

* **loglevel**: determines which kind of interaction is logged in the console and to the database. You may select clientside interactions with `'CLIENT-ACTION'`, and/or server requests with `'SERVER-REQ'`.
* **flickr**: API-key and account tokens for the flickr integration.

Norwin Roosen, 2015-09-07