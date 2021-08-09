const axiosConfig = require("./axiosConfig.js");
const config = require("../config.json");

function secToMs(seconds) {
    let minutes = Math.floor (seconds / 60);
    return { minutes: minutes, seconds: seconds - minutes * 60 };
};

async function getPatch() {
    return axiosConfig.get("https://ddragon.leagueoflegends.com/api/versions.json")
    .then((response) => {
        let patch = response.data[0];
        let url_patch = patch.split(".");
        url_patch.pop();
        url_patch = url_patch.join("-");
        console.log(patch);
        return {patch: patch, url_patch: url_patch};
    })
    .catch((err) => {
        console.log(err);
        return {};
    });
};

async function getUserInfo (summonerName) {
    return axiosConfig.get(`${config.api.riot.region}/lol/summoner/v4/summoners/by-name/${summonerName}`)
    .then((response) => {
        const summonerInfo = response.data;
        return summonerInfo;
    })
};

async function getChampMastery(userID, max) {
    return axiosConfig.get(`${config.api.riot.region}/lol/champion-mastery/v4/champion-masteries/by-summoner/${userID}?api_key=${config.api.riot.key}`)
    .then((response) => {
        return response.data.slice(0, max);
    });
}; 

async function champIDtoName(userID, patch) {
    return axiosConfig.get(`http://ddragon.leagueoflegends.com/cdn/${patch}/data/en_US/champion.json`)
    .then((response) => {
        const champlist = response.data.data;
        let name = Object.values(champlist).filter(champion => champion.key === userID);
        if (name.length) {
            return {name: name[0].name, image: name[0].image.full, title: name[0].title};
        }
    })
    .catch((err) => {
        console.log(err);
    });
};

async function getMatchHistory(userID) {
    return axiosConfig.get(`${config.api.riot.region}/lol/match/v4/matchlists/by-account/${userID}`)
    .then(response => {
        return response.data;
    })
    .catch((err) => {
        console.log(err);
    })
};

async function getMatchDetails(matchID, username) {

    /**
     * End point returns data object on success
     * Fields that are relevant are: 
     *     participantIdentities - [Objects] return player_id if player.accountId == ours
     *     participants - after retrieving participant ID we match it within this list to get details
     *     gameDuration - 
     *     We won't be able to display the items currently so the only relevant fields we need from the returned object is:
     *         stats.kills, stats.deaths, stats.assists, stats.win, 
     */


    return axiosConfig.get(`${config.api.riot.region}/lol/match/v4/matches/${matchID}`)
    .then((response) => {
        const matchInfo = response.data;
        let gameDuration = secToMs(matchInfo.gameDuration);
        let [player] = matchInfo.participantIdentities.filter((participant) => participant.player.summonerName === username);
        let [playerDetails] = matchInfo.participants.filter((participant) => participant.participantID === player.participantID);
        return {
            win: playerDetails.stats.win, 
            kills: playerDetails.stats.kills,
            assists: playerDetails.stats.assists, 
            deaths: playerDetails.stats.deaths,
            length: gameDuration
        };
    })
};

module.exports = {
    getPatch: getPatch,
    getUserInfo: getUserInfo,
    getChampMastery: getChampMastery,
    champIDtoName: champIDtoName,
    getMatchHistory: getMatchHistory,
    getMatchDetails: getMatchDetails
};