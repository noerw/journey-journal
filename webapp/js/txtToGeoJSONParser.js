/**  
* @desc   Parse a textfile containing line coordinates to a GeoJSON-object
* @author Norwin Roosen, Susanne Schröder-Bergen
* @date   150507
*/

"use strict";

// create logger & register it to consoleAppender
JL("parseLogger").setOptions({"appenders": [consoleAppender]});

/**  
* @desc   Parses a textfile containing WGS84-coordinates of lines into a GeoJSON GeometryCollection.
* @param  textToParse: String containing the file data
* @return the parsed lines as GeoJSON object
*/
function parseTxtToGeoJson (textToParse) {
     // array of strings, containing each textline
     var textLines = textToParse.split('\n');
     // array of geographic lines, storing the parsed coordinates
     var lines = [];
     
     // begin parsing
     // for each line
     for (var lineNum = 0; lineNum < textLines.length; lineNum++) {
          //storing the coordinates in a line
          var line = [];
          var commentPos;     // position in the string where a comment starts
          var commaPos;       // position in the string where separating comma is
          
          // remove comments
          commentPos = textLines[lineNum].search('//');
          if (commentPos != -1) { textLines[lineNum] = textLines[lineNum].slice(0, commentPos); }
          
          // search for separators ', ' and store coordinates in the array
          commaPos = textLines[lineNum].search(', ');
          if (commaPos != -1) {
               for (var i = 0; i < 3; i++) {
                    // search for separator ', '
                    commaPos = textLines[lineNum].search(', ');
                    // store characters until first comma as coordinate
                    line[i] = parseFloat(textLines[lineNum].slice(0, commaPos));
                    // remove parsed string
                    textLines[lineNum] = textLines[lineNum].slice(commaPos + 2, textLines[lineNum].length);
               }
               // parse last coord in the line
               line[3] = parseFloat(textLines[lineNum]);
               lines.push(line);
          }
     }
     if (lines.length == 0) {
          JL("parseLogger").error("no lines could be read from the file");
     } else {
          JL("parseLogger").info(lines.length + " lines were parsed from the file");
     }
     
     return JSON.parse(createGeoJSON(lines));
};

/**  
* @desc   helper function converting an array of lines into a GeoJSON GeometryCollection
* @param  lines: array containing the lines
* @return the GeoJSON object as a string
*/
function createGeoJSON (lines) {
     var result = '{\n\t"type": "GeometryCollection",\n\t"geometries": [\n'
     
     for (var lineNum = 0; lineNum < lines.length; lineNum++) {
          
          var elementString = '\t\t{ "type": "LineString", "coordinates": [ [';
          elementString += lines[lineNum][1] + ', ';
          elementString += lines[lineNum][0] + '], [';
          elementString += lines[lineNum][3] + ', ';
          elementString += lines[lineNum][2] + '] ] },\n';
          
          result += elementString;
     }
     //remove comma from last element
     result = result.slice(0, result.length - 2);
     
     result += '\n\t]\n}';
     
     return result;
};
