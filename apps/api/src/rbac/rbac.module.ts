import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role, RolePermission, User } from '../database/entities';
import { RbacService } from './rbac.service';
import { PermissionsController, RolesController } from './roles.controller';
import { RolesService } from './roles.service';

/**
 * Module RBAC dynamique (ADR-004).
 *
 * Global : `RbacService` (résolution scope + permissions) est consommé par la
 * stratégie JWT de l'AuthModule à chaque requête. Expose aussi le CRUD des
 * rôles et le catalogue de permissions.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Role, RolePermission, User])],
  controllers: [RolesController, PermissionsController],
  providers: [RbacService, RolesService],
  exports: [RbacService, RolesService],
})
export class RbacModule {}
