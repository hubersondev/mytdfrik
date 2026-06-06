import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { City, Country } from '../database/entities';
import { CitiesController } from './cities.controller';
import { CitiesService } from './cities.service';
import { CountriesController } from './countries.controller';
import { CountriesService } from './countries.service';

/**
 * Module géographique (CDC §8.4.1) — référentiels pays et villes utilisés
 * pour normaliser la localisation des organisations clientes.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Country, City])],
  controllers: [CountriesController, CitiesController],
  providers: [CountriesService, CitiesService],
  exports: [CountriesService, CitiesService],
})
export class GeoModule {}
