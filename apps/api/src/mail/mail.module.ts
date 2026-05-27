import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

/**
 * MailModule — global (CDC §7.4) pour exposer MailService partout sans
 * réimporter explicitement. Pas d'entité ni de configuration runtime
 * supplémentaire ; la config SendGrid est lue depuis ConfigModule (déjà
 * global dans AppModule).
 */
@Global()
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
