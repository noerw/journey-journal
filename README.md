# my journey journal
Meine Abgabe für das Abschlussprojekt zu GeoSoftware 1 im SS 2015.

Das Reisetagebuch basiert auf auf Leaflet und MongoDB.
Die Abgabe sollte alle Forderungen der Aufgabenstellung erfüllen, bis auf die flickr-Einbindung sowie geotags zu Bildern hinzuzufügen.

Ich habe mit diversen Bibliotheken (
[eins](https://www.npmjs.com/package/flickrapi),
[zwo](https://www.npmjs.com/package/flickr-oauth-and-upload),
[drei](https://www.npmjs.com/package/fickr),
[vier](https://www.npmjs.com/package/flickr)
) versucht Bilder zu flickr hochzuladen, doch bin immer gescheitert. Die Authentifizierung zu flickr funktioniert, doch ein Bild hochzuladen funktioniert nicht - ohne dass ein Fehler zurückgegeben würde.

Um Geotags zu Bildern hinzuzufügen müssten die EXIF Daten manipuliert werden. Im Netz findet man nur JS-Bibliotheken, welche EXIF auslesen, aber nicht manipulieren können. Ohne Bibliothek hab ichs nicht geschafft.

## Funktionsweise
Auf einer Startseite werden alle gespeicherten Reisen angezeigt.
Ist eine ausgewählt worden, wird die Anzeigeseite mit Karte und Sidebar geladen. Über die URL wird die entsprechende Reise nachgeladen und in einer lokalen, global verfügbaren Kopie `journey` gespeichert.
Die einzelnen Orte auf der Karte werden für jeden Reiseabschnitt einzeln geladen und dargestellt. Die Reise und deren Abschnitte sind über die URL direkt referenzierbar.

Wird ein Teil der Route verändert, wird die gesamte Reise direkt zur Datenbank hochgeladen. Auf diese Weise ist die lokale Kopie immer zur Datenbank synchronisiert.

Jeder Ort kann eine Referenz auf ein **Bild** speichern, welches bei Bedarf nachgeladen wird. Das Bild wird in einem externen Schema gespeichert, damit der häufige up-/download der Reise nicht zu groß wird.

Beim **Export** wird die Reise serverseitig auf alle Bild-Referenzen durchsucht, und die zugehörigen Bilder zusammen mit der Reise zurückgeschickt.

Es wird eine modifizierte Version des leaflet-sidebar Plugins verwendet, welches um eine `addPanel(...)` Funktion erweitert wurde, sodass Tabs dynamisch hinzugefügt werden können.

Alle clientseitigen Interaktionen werden in der Datenbank **geloggt**. Dazu besteht ein eigenes Datenbankschema, welches den Zeitpunkt, die IP, die Art der Interaktion und eine Beschreibung speichert.
Zusätzlich werden Requests an den Server gespeichert.
Die Daten können unter `localhost:8080/getAnalytics` abgerufen und bei Bedarf ausgewertet werden. Die Ausgabe kann auch nach IPs mit der angehängten URL-Query `?ip= ...` gefiltert werden.


## dependencies
* MongoDB v2.4.9
* node    v0.10.25

## run
In the root directory enter `npm start`, and the server should run after installing all the npm deps once.
The App is then available under `localhost:8080/`.

## configure
You can configure the server by editing the `config` variable in `server.js#l14`.

* **loglevel**: determines which kind of interaction is logged in the console and to the database. You may select clientside interactions with `'CLIENT-ACTION'`, and/or server requests with `'SERVER-REQ'`.
* **flickr**: API-key and account tokens for the flickr integration.