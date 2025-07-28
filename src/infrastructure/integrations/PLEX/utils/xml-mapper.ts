import { xml2js, js2xml } from 'xml-js';

export function xmlToObject(xml: string): any {
  return xml2js(xml, { compact: true });
}

export function objectToXml(obj: any): string {
  return js2xml(obj, { compact: true, ignoreComment: true, spaces: 2 });
}
