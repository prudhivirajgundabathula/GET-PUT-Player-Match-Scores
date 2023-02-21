const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());

let database = null;

const initializeDBAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error :${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convrtPlayerDetailsDBObjectToResponsiveObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const cnvtMatchDetailsDBObjctToResponsiveObjct = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const cnvtPlayerMatchScoreDBObjtToResponsiveObjt = (dbObject) => {
  return {
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//GET API METHOD Returns a list of all the players in the player table

app.get("/players/", async (request, response) => {
  const getPlayerDetailsQuery = `SELECT * FROM player_details`;
  const playerDetailsArray = await database.all(getPlayerDetailsQuery);
  response.send(
    playerDetailsArray.map((eachPlayer) =>
      convrtPlayerDetailsDBObjectToResponsiveObject(eachPlayer)
    )
  );
});

//GET API METHOD Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId}`;
  const playerArray = await database.get(getPlayerQuery);
  response.send(convrtPlayerDetailsDBObjectToResponsiveObject(playerArray));
});

// PUT API METHOD Updates the details of a specific player based on the player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `UPDATE player_details 
  SET
     player_name = '${playerName}'
     WHERE player_id = ${playerId}`;
  await database.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//GET METHOD API Returns the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `SELECT * FROM match_details WHERE match_id = ${matchId}`;
  const matchArray = await database.get(getMatchQuery);
  response.send(cnvtMatchDetailsDBObjctToResponsiveObjct(matchArray));
});

// GET METHOD API Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `SELECT * FROM player_match_score NATURAL JOIN match_details 
  WHERE player_id = ${playerId}`;

  const playerDetailsArray = await database.all(getPlayerMatchesQuery);
  response.send(
    playerDetailsArray.map((eachMatch) =>
      cnvtMatchDetailsDBObjctToResponsiveObjct(eachMatch)
    )
  );
});

// GET METHOD API Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesQuery = `SELECT * 
  FROM player_match_score NATURAL JOIN player_details
  WHERE match_id = ${matchId};`;
  const matchPlayerArray = await database.all(getMatchesQuery);
  response.send(
    matchPlayerArray.map((eachPlayer) =>
      convrtPlayerDetailsDBObjectToResponsiveObject(eachPlayer)
    )
  );
});

// GET API METHOD Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatistics = `SELECT 
  player_id AS playerId,
  player_name AS playerName, 
  SUM(score) AS totalScore,
  SUM(fours) AS totalFours,
  SUM(sixes) AS totalSixes FROM player_match_score NATURAL JOIN player_details 
  WHERE player_id = ${playerId};`;
  const playerStatsArray = await database.get(getPlayerStatistics);
  response.send(playerStatsArray);
});

module.exports = app;
