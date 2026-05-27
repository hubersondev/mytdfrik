import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AccountActivationToken,
  Organization,
  PasswordResetToken,
  Session,
  User,
} from '../database/entities';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Organization,
      Session,
      AccountActivationToken,
      PasswordResetToken,
    ]),
  ],
  controllers: [UsersController, OrganizationsController],
  providers: [UsersService, OrganizationsService],
  exports: [UsersService, OrganizationsService],
})
export class UsersModule {}
