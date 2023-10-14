import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { simpleParser } from 'mailparser';
import { readFileSync } from 'fs';

@Injectable()
export class AppService {
  async parseEmail(emailResourceLink: string): Promise<{
    jsonFromAttanch: Array<object>;
    jsonFromBody: object | null;
    jsonFromLink: object | null;
    jsonFromWebsite: object | null;
  }> {
    try {
      let emailContent = null;
      let jsonFromWebsite,
        jsonFromLink,
        jsonFromBody = null;

      if (emailResourceLink.match(/https?:\/\/[^\s]+/)) {
        // Es un URL externo
        emailContent = (await fetch(emailResourceLink)).body;
      } else {
        // Path local
        emailContent = readFileSync(emailResourceLink, 'utf8');
      }

      // Primero buscamos JSON en los adjuntos
      const parsedData = await simpleParser(emailContent);
      const jsonFromAttanch = parsedData.attachments.map((attach) => {
        if (
          attach.type === 'attachment' &&
          attach.contentType === 'application/json'
        ) {
          return JSON.parse(attach.content.toString());
        }
      });

      // Buscamos un JSON dentro del body del email
      const jsonRegex = /{[^}]+}/;
      const jsonMatch = parsedData.text.match(jsonRegex);
      if (jsonMatch) {
        const mailBody = jsonMatch[0];
        jsonFromBody = JSON.parse(mailBody);
      }

      // Buscar link donde puede tener Json
      const jsonLink = parsedData.text.match(/https?:\/\/[^\s]+.json/);
      if (jsonLink) {
        jsonFromLink = await fetch(jsonLink.toString()).then(response => response.json());
      }

      // Get the JSON link from the webpage that is linked in the body of the email.
      const webpageLink = parsedData.text.match(/https?:\/\/[^\s]+/);
      if (webpageLink) {
        const response = await fetch(webpageLink.toString());
        const html = await response.text();
        const jsonLink = html.match(/https?:\/\/[^\s]+.json/);

        if (jsonLink) {
          jsonFromWebsite = await fetch(jsonLink.toString()).then(response => response.json());
        }
      }

      return {
        jsonFromAttanch,
        jsonFromBody,
        jsonFromLink,
        jsonFromWebsite,
      };
    } catch (error) {
      // Manejar el error de forma específica
      console.error('Error al analizar el correo electrónico:', error.message);
      throw new HttpException(
        'Error al analizar el correo electrónico',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
