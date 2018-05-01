import {Injectable} from '@angular/core';

@Injectable()
export class JsonHighlighterService {

  // this in a Typescript adaption from
  // https://stackoverflow.com/questions/4810841/how-can-i-pretty-print-json-using-javascript
  public syntaxHighlight(jsonString: string): string {
    if (!jsonString) {
      return;
    }

    jsonString = jsonString.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return jsonString.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
        let cssClass = 'number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cssClass = 'key';
            if (/_embedded/.test(match) || /_links/.test(match) || /curies/.test(match)) {
              cssClass = 'hal';
            }
          } else {
            cssClass = 'string';
          }
        } else if (/true|false/.test(match)) {
          cssClass = 'boolean';
        } else if (/null/.test(match)) {
          cssClass = 'null';
        }
        return '<span class="' + cssClass + '">' + match + '</span>';
      });
  }
}
