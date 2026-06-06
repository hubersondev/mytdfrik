import { DataSource } from 'typeorm';
import { City, Country } from '../entities';

/**
 * Référentiel géographique initial (CDC §8.4.1).
 *
 * Portée : les 15 États de la CEDEAO + un ensemble de pays fréquents pour la
 * clientèle de TECHDIFRIK (Maghreb, Europe, Amérique du Nord, etc.). Les villes
 * de Côte d'Ivoire sont détaillées ; quelques grandes villes sont fournies pour
 * les pays voisins afin d'amorcer le sélecteur.
 *
 * Idempotent : un pays est créé si son code ISO n'existe pas ; une ville est
 * créée si le couple (pays, nom) n'existe pas. Les ajouts ultérieurs de
 * l'Administrateur via l'API sont préservés.
 */
const GEO: Array<{ code: string; name: string; cities: string[] }> = [
  // ---------- CEDEAO ----------
  {
    code: 'CI',
    name: "Côte d'Ivoire",
    cities: [
      'Abidjan',
      'Yamoussoukro',
      'Bouaké',
      'Daloa',
      'San-Pédro',
      'Korhogo',
      'Man',
      'Gagnoa',
      'Divo',
      'Abengourou',
      'Anyama',
      'Agboville',
      'Grand-Bassam',
      'Dabou',
      'Soubré',
      'Séguéla',
      'Bondoukou',
      'Odienné',
      'Bingerville',
      'Adzopé',
      'Ferkessédougou',
      'Dimbokro',
      'Katiola',
      'Sinfra',
      'Issia',
    ],
  },
  { code: 'BJ', name: 'Bénin', cities: ['Cotonou', 'Porto-Novo', 'Parakou'] },
  {
    code: 'BF',
    name: 'Burkina Faso',
    cities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou'],
  },
  { code: 'CV', name: 'Cap-Vert', cities: ['Praia', 'Mindelo'] },
  { code: 'GM', name: 'Gambie', cities: ['Banjul', 'Serekunda'] },
  { code: 'GH', name: 'Ghana', cities: ['Accra', 'Kumasi', 'Tamale'] },
  { code: 'GN', name: 'Guinée', cities: ['Conakry', 'Nzérékoré', 'Kankan'] },
  { code: 'GW', name: 'Guinée-Bissau', cities: ['Bissau'] },
  { code: 'LR', name: 'Liberia', cities: ['Monrovia'] },
  { code: 'ML', name: 'Mali', cities: ['Bamako', 'Sikasso', 'Ségou'] },
  { code: 'NE', name: 'Niger', cities: ['Niamey', 'Zinder', 'Maradi'] },
  { code: 'NG', name: 'Nigeria', cities: ['Lagos', 'Abuja', 'Kano', 'Ibadan'] },
  {
    code: 'SN',
    name: 'Sénégal',
    cities: ['Dakar', 'Thiès', 'Saint-Louis', 'Touba'],
  },
  { code: 'SL', name: 'Sierra Leone', cities: ['Freetown'] },
  { code: 'TG', name: 'Togo', cities: ['Lomé', 'Sokodé', 'Kara'] },
  // ---------- Pays fréquents ----------
  {
    code: 'FR',
    name: 'France',
    cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse'],
  },
  { code: 'MA', name: 'Maroc', cities: ['Casablanca', 'Rabat', 'Marrakech'] },
  { code: 'TN', name: 'Tunisie', cities: ['Tunis', 'Sfax'] },
  { code: 'DZ', name: 'Algérie', cities: ['Alger', 'Oran'] },
  { code: 'CM', name: 'Cameroun', cities: ['Douala', 'Yaoundé'] },
  {
    code: 'CD',
    name: 'République démocratique du Congo',
    cities: ['Kinshasa', 'Lubumbashi'],
  },
  { code: 'CG', name: 'Congo', cities: ['Brazzaville', 'Pointe-Noire'] },
  { code: 'GA', name: 'Gabon', cities: ['Libreville'] },
  { code: 'BE', name: 'Belgique', cities: ['Bruxelles'] },
  { code: 'CA', name: 'Canada', cities: ['Montréal', 'Toronto'] },
  { code: 'US', name: 'États-Unis', cities: ['New York', 'San Francisco'] },
  { code: 'GB', name: 'Royaume-Uni', cities: ['Londres'] },
  { code: 'DE', name: 'Allemagne', cities: ['Berlin', 'Francfort'] },
  { code: 'CN', name: 'Chine', cities: ['Pékin', 'Shanghai', 'Shenzhen'] },
  { code: 'AE', name: 'Émirats arabes unis', cities: ['Dubaï', 'Abou Dabi'] },
  { code: 'ZA', name: 'Afrique du Sud', cities: ['Johannesburg', 'Le Cap'] },
];

export async function seedGeo(dataSource: DataSource): Promise<void> {
  const countryRepo = dataSource.getRepository(Country);
  const cityRepo = dataSource.getRepository(City);

  for (const entry of GEO) {
    let country = await countryRepo.findOne({ where: { code: entry.code } });
    if (!country) {
      country = await countryRepo.save(
        countryRepo.create({
          code: entry.code,
          name: entry.name,
          isActive: true,
        }),
      );
    }

    for (const cityName of entry.cities) {
      const existing = await cityRepo.findOne({
        where: { countryId: country.id, name: cityName },
      });
      if (!existing) {
        await cityRepo.insert({
          countryId: country.id,
          name: cityName,
          isActive: true,
        });
      }
    }
  }
}
