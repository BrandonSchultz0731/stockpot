import { join } from 'path';
import { readFileSync } from 'fs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import * as Handlebars from 'handlebars';

@Injectable()
export class EmailService {
  private readonly fromEmail = 'support@chefpixel.app';
  private readonly fromName = 'ChefPixel';
  private readonly templates: Record<string, Handlebars.TemplateDelegate>;

  constructor(private readonly configService: ConfigService) {
    sgMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));

    // nest-cli copies assets to dist/auth/templates/ while compiled JS lives
    // in dist/server/src/auth/. Resolve from the dist root.
    const distRoot = join(__dirname, '..', '..', '..');
    const templatesDir = join(distRoot, 'auth', 'templates');
    this.templates = {
      passwordReset: this.loadTemplate(join(templatesDir, 'password-reset.hbs')),
      socialReminder: this.loadTemplate(join(templatesDir, 'social-provider-reminder.hbs')),
    };
  }

  private loadTemplate(path: string): Handlebars.TemplateDelegate {
    const source = readFileSync(path, 'utf-8');
    return Handlebars.compile(source);
  }

  async sendPasswordResetEmail(
    to: string,
    firstName: string,
    resetCode: string,
  ): Promise<void> {
    await sgMail.send({
      to,
      from: { email: this.fromEmail, name: this.fromName },
      subject: 'Reset your ChefPixel password',
      html: this.templates.passwordReset({ firstName, resetCode }),
    });
  }

  async sendSocialProviderReminder(
    to: string,
    firstName: string,
    provider: string,
  ): Promise<void> {
    await sgMail.send({
      to,
      from: { email: this.fromEmail, name: this.fromName },
      subject: 'Sign in to ChefPixel',
      html: this.templates.socialReminder({ firstName, provider }),
    });
  }
}
