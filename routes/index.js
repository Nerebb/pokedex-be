const express = require("express");
const router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.status(200).send("Welcome to PokeDex!");
});

router.post('/',function(req,res,next){
    console.log("🚀 ~ file: index.js:10 ~ router.post ~ req", req.body)
    res.send("test router")
})

const pokemonRouter = require("./pokemon.api");
router.use("/pokemons", pokemonRouter);

module.exports = router;
