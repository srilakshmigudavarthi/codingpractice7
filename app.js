const express = require('express')
const path = require('path')

const app = express()
app.use(express.json())

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const intilizeDatabaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log(`Server Running at http://localhost:3000`)
    })
  } catch (e) {
    console.log(`Db Error ${e.message}`)
    process.exit(1)
  }
}

intilizeDatabaseAndServer()

const convertPlayerDetailsDBObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}
const convertMatchDetailsDBObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}
//Get Players API
app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
    select
        *
    From
        player_details;`
  const playersArray = await db.all(getPlayersQuery)
  response.send(playersArray)
})

//Get player API
app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
  select 
    *
  from
      player_details
  where
   player_id = ${playerId};`
  const player = await db.get(getPlayerQuery)
  const {player_id, player_name} = player
  const dbResponse = {
    playerId: player_id,
    playerName: player_name,
  }
  response.send(dbResponse)
})

app.put('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchQuery = `
  select 
    *
  from
      match_details
  where
   match_id = ${matchId};`
  await db.run(getMatchQuery)
  response.send('Player Details Updated')
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getPlayerMatchesQuery = `
    select
        *
    From
        player_match_score NATURAL JOIN match_datails
    where player_id=${playerId}`
  const playerMatches = await db.all(getPlayerMatchesQuery)
  response.send(
    playerMatches.map(eachMatch =>
      convertMatchDetailsDBObjectToResponseObject(eachMatch),
    ),
  )
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getPlayerMatchesQuery = `SELECT * FROM player_match_score NATURAL JOIN player_details WHERE match_id=${matchId}`
  const playerMatches = await db.all(getPlayerMatchesQuery)
  response.send(
    playerMatches.map(eachMatch =>
      convertPlayerDetailsDBObjectToResponseObject(eachMatch),
    ),
  )
})

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params

  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `
  const playerScores = await db.get(getPlayerScored)
  response.send(playerScores)
})

module.exports = app
