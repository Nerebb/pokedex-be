const CSVtoJson = require("./dataCsvToJson");
const fs = require("fs");
const { stringify } = require("querystring");
async function checkImgUrl(name) {
  const imagePath1 = `public/images/${name}.png`;
  const imagePath2 = `public/images/${name}.jpg`;

  try {
    await fs.promises.access(imagePath1, fs.constants.F_OK);
    return imagePath1;
  } catch (error) {
    try {
      await fs.promises.access(imagePath2, fs.constants.F_OK);
      return imagePath2;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}

// CSVtoJson("kaggle/pokemon.csv", "kaggle/pokemonImgData.json");
// CSVtoJson("kaggle/pokedexDetail.csv", "kaggle/pokemonDetailData.json");

async function filterData() {
  let pokemons = fs.readFileSync("kaggle/pokemonImgData.json");
  pokemons = JSON.parse(pokemons);

  let detailData = fs.readFileSync("kaggle/pokemonDetailData.json");
  detailData = JSON.parse(detailData);

  if (!pokemons.length) {
    console.log("No data found");
    return;
  }

  let filteredData = [];
  for (let i = 0; i < pokemons.length; i++) {
    let filterPokemon = {};
    ImgUrl = await checkImgUrl(pokemons[i].Name);
    //get ImgUrl
    if (ImgUrl) {
      let result = ImgUrl.replace(/^public\//, "/");
      filterPokemon.url = result;
    }

    //ConvertName
    filterPokemon.name = pokemons[i].Name.toLowerCase();

    //Adding detail Data
    let pokemonDetail = detailData.find((pokemon) =>
      pokemon.name.toLowerCase().includes(pokemons[i].Name.toLowerCase())
    );


    if (pokemonDetail) {
      filterPokemon.height = pokemonDetail.height_m + " meters";
      filterPokemon.weight = pokemonDetail.weight_kg + " kg";
      filterPokemon.category = pokemonDetail.species.toLowerCase();
      filterPokemon.abilities = pokemonDetail.ability_1.toLowerCase();
    }

    //Generate Id
    filterPokemon.id = i + 1;
    //Joining types
    filterPokemon.types = [];
    if (pokemons[i].Type1) {
      filterPokemon.types.push(pokemons[i].Type1.toLowerCase());
    }
    if (pokemons[i].Type2) {
      filterPokemon.types.push(pokemons[i].Type2.toLowerCase());
    }
    filteredData.push(filterPokemon);
  }

  fs.writeFileSync("pokemon.json", JSON.stringify(filteredData));
  console.log("Data filter compeleted");
}

filterData();
