import { Injectable } from '@nestjs/common';
import { PokeResponse } from './interfaces/poke_response.interface';
import { Model } from 'mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,

    private readonly http: AxiosAdapter,
  ) {}

  async executeSeed() {
    await this.pokemonModel.deleteMany({});

    const data = await this.http.get<PokeResponse>(
      ' https://pokeapi.co/api/v2/pokemon?limit=650',
    );

    const pokeData = data.results.map(({ name, url }) => {
      const segments = url.split('/');

      return { name, no: +segments[segments.length - 2] };
    });

    await this.pokemonModel.insertMany(pokeData);

    return `Seed executed`;
  }
}
