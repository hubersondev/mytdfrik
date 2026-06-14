import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { GlobalSearchQueryDto } from './dto/global-search.dto';
import { SearchService } from './search.service';

@ApiTags('search')
@ApiBearerAuth()
@Controller({ path: 'search', version: '1' })
export class SearchController {
  constructor(private readonly service: SearchService) {}

  @Get()
  @ApiOperation({
    summary:
      'Recherche globale transverse (demandes, utilisateurs, catalogue) cloisonnée par droits',
  })
  search(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: GlobalSearchQueryDto,
  ) {
    return this.service.search(
      {
        id: user.id,
        scope: user.scope,
        organizationId: user.organizationId,
        permissions: user.permissions,
      },
      query.q,
    );
  }
}
