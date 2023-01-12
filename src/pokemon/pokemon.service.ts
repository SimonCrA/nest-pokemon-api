import { Injectable } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();

    try {
      const pokemonDB = await this.pokemonModel
        .create(createPokemonDto)
        .catch((_error) => console.log(_error));

      return pokemonDB;
    } catch (_error) {
      this.handleExceptions(_error);
    }
  }

  findAll(paginationDto: PaginationDto) {
    const { limit = 20, offset = 0 } = paginationDto;

    return this.pokemonModel
      .find({})
      .limit(limit)
      .skip(offset)
      .sort({ no: 1 })
      .select('-__v');
  }

  async findOne(term: string) {
    try {
      let pokemonDB: Pokemon;
      if (!isNaN(+term)) {
        pokemonDB = await this.pokemonModel.findOne({ no: term });
      }

      if (!pokemonDB && isValidObjectId(term)) {
        pokemonDB = await this.pokemonModel.findById(term);
      }
      if (!pokemonDB) {
        pokemonDB = await this.pokemonModel.findOne({ name: term });
      }

      if (!pokemonDB)
        throw new NotFoundException(
          `Pokemon with term, name, or no ${term} not found`,
        );

      return pokemonDB;
    } catch (_error) {
      console.log(_error);
    }
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    try {
      const pokemonDB = await this.findOne(term);

      if (updatePokemonDto.name) {
        updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
      }

      await pokemonDB.updateOne(updatePokemonDto);

      return { ...pokemonDB.toJSON(), ...updatePokemonDto };
    } catch (_error) {
      this.handleExceptions(_error);
    }
  }

  async remove(id: string) {
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id });
    if (deletedCount === 0)
      throw new BadRequestException(`Pokemon with id ${id} not found.`);

    return {};
  }

  private handleExceptions(_error: any) {
    if (_error.code == 11000) {
      throw new BadRequestException(
        `Pokemon already exists in DB ${JSON.stringify(_error.keyValue)}`,
      );
    }

    console.log(_error);
    throw new InternalServerErrorException(`Can't update pokemon`);
  }
}
