const express = require("express");
const fs = require("fs");
const pokemonRouter = express.Router();
const pokemonTypes = require("../pokemonTypes");

pokemonRouter.get("/", (req, res, next) => {
  const allowedFilter = ["search", "type"];
  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;

    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(
          `Query ${key} is not allowed, allowedFilter are ${allowedFilter}`
        );
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });

    const db = JSON.parse(fs.readFileSync("pokemon.json"));

    let result = [];
    if (filterKeys.length) {
      result = db.filter((pokemon) => {
        return filterKeys.some((condition) => {
          return condition === "type"
            ? pokemon.types.some(
                (type) => type.toLowerCase() === filterQuery.type.toLowerCase()
              )
            : pokemon.name
                .toLowerCase()
                .includes(filterQuery.search.toLowerCase()) ||
                pokemon.id === Number(filterQuery.search.id);
        });
      });
    } else {
      result = db;
    }

    let offset = limit * (page - 1);

    //then select number of result by offset
    result = result.slice(offset, offset + limit);
    //send response
    res.status(200).send({ data: result });
  } catch (error) {
    next(error);
  }
});

pokemonRouter.get("/:id", (req, res, next) => {
  let pokeId = Number(req.params.id);
  try {
    const db = JSON.parse(fs.readFileSync("pokemon.json"));

    const pokeIdx = db.findIndex(
      (pokemon) => Number(pokemon.id) === Number(pokeId)
    );

    if (pokeIdx < 0) {
      const error = new Error("The given ID not valid");
      error.statusCode = 401;
      throw error;
    }

    let pokemon = db[pokeIdx];
    let previousPokemon, nextPokemon;
    if (!pokemon) {
      const notFound = new Error(`Pokemon not found`);
      notFound.statusCode = 401;
      throw notFound;
    } else if (pokeIdx === 0) {
      previousPokemon = db[db.length - 1];
      nextPokemon = db[1];
    } else if (pokeIdx === db.length - 1) {
      previousPokemon = db[db.length - 2];
      nextPokemon = db[0];
    } else {
      previousPokemon = db[pokeIdx - 1];
      nextPokemon = db[pokeIdx + 1];
    }

    let result = { pokemon, previousPokemon, nextPokemon };

    res.send({ data: result });
  } catch (error) {
    next(error);
  }
});

pokemonRouter.post("/", function (req, res, next) {
  const allowedFilter = ["name", "id", "types", "url"];
  const filterKeys = Object.keys(req.body);
  try {
    let err = new Error(`Missing or inappropriate value/key`);
    err.statusCode = 401;

    allowedFilter.forEach((key) => {
      if (!filterKeys.includes(key)) throw err;
    });

    if (!Array.isArray(req.body.types)) {
      err.message = "Types must be a array";
      throw err;
    }

    if (req.body.types.length > 2) {
      err.message = "Pokemon only have 1 or 2 types";
      throw err;
    }

    req.body.types.forEach((type) => {
      if (!pokemonTypes.includes(type.toLowerCase())) {
        err.message = `Pokemon do not have type:${type}`;
        throw err;
      }
    });

    const db = JSON.parse(fs.readFileSync("pokemon.json"));
    if (db.some((pokemon) => Number(pokemon.id) === Number(req.body.id))) {
      err.message = "Pokemon id already taken";
      throw err;
    }

    if (
      db.some((pokemon) => pokemon.name.toLowerCase().includes(req.body.name))
    ) {
      err.message = "Pokemon name already exist";
      throw err;
    }

    const newPokemon = {
      id: Number(req.body.id),
      name: req.body.name.toLowerCase(),
      url: req.body.url.toString(),
      types: req.body.types.map((type) => type.toLowerCase()),
    };

    db.push(newPokemon);
    fs.writeFileSync("pokemon.json", JSON.stringify(db));
    res.send("Pokemon added successful");
  } catch (error) {
    next(error);
  }
});

pokemonRouter.put("/:id", function (req, res, next) {
  const allowUpdate = ["name", "types", "url"];
  try {
    let editPokeId = Number(req.params.id);
    const updateData = req.body;
    console.log(
      "🚀 ~ file: pokemon.api.js:153 ~ updateData",
      Array.isArray(updateData.types),
      updateData.types.length > 2
    );
    const updateKeys = Object.keys(updateData);
    const db = JSON.parse(fs.readFileSync("pokemon.json"));

    if (!updateKeys.length) {
      const err = new Error("No field regconized");
      err.statusCode = 401;
      throw err;
    }

    const notAllow = updateKeys.filter((el) => !allowUpdate.includes(el));
    if (notAllow.length) {
      const exception = new Error(`Update field not allow`);
      exception.statusCode = 401;
      throw exception;
    }

    if (!db.some((pokemon) => Number(pokemon.id) === Number(editPokeId))) {
      const err = new Error("Pokemon not found");
      err.statusCode = 404;
      throw err;
    }

    if (updateData.types.length > 2) {
      const err = new Error("Type is inappropriate");
      throw err;
    }

    updateData.types.forEach((type) => {
      if (!pokemonTypes.includes(type.toLowerCase())) {
        err.message = `Pokemon do not have type:${type}`;
        throw err;
      }
    });

    const updatedPokemonIdx = db.findIndex(
      (pokemon) => Number(pokemon.id) === Number(editPokeId)
    );

    const updatePokemon = { ...db[updatedPokemonIdx], ...updateData };

    db[updatedPokemonIdx] = { ...updatePokemon };

    fs.writeFileSync("pokemon.json", JSON.stringify(db));
    res.send(`Pokemon edited`);
  } catch (error) {
    next(error);
  }
});

pokemonRouter.delete("/:id", (req, res, next) => {
  try {
    const delId = Number(req.params.id);
    const db = JSON.parse(fs.readFileSync("pokemon.json"));

    if (!db.some((pokemon) => Number(pokemon.id) === Number(delId))) {
      const err = new Error("Pokemon not found");
      err.statusCode = 401;
      throw err;
    }

    let updatedDb = db.filter((pokemon) => Number(pokemon.id) !== delId);
    fs.writeFileSync("pokemon.json", JSON.stringify(updatedDb));

    res.send(`Pokemon deleted`);
  } catch (error) {
    next(error);
  }
});

module.exports = pokemonRouter;
