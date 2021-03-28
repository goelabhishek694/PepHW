let url="https://www.espncricinfo.com/series/ipl-2020-21-1210595";
let fs=require("fs");
let cheerio=require('cheerio');
let path=require('path');
let request=require('request');
const { createInflate } = require("zlib");
let obj={
    "Delhi Capitals":"DC",
    "Chennai Super Kings":"CSK",
    "Kolkata Knight Riders":"KKR",
    "Mumbai Indians":"MI",
    "Kings XI Punjab":"PBKS",
    "Royal Challengers Bangalore":"RCB",
    "Rajasthan Royals":"RR",
    "Sunrisers Hyderabad":"SRH"
};

function createDir(dirPath){
    if(!fs.existsSync(dirPath)){
        fs.mkdirSync(dirPath);
    }
}

function createFile(teamName,playerName){
    let tn=obj[teamName];
    let pn=playerName.split(" ")[0];
    console.log(tn," ",pn);
    let filePath=path.join(__dirname,"IPL2020",tn,pn+".json");
    if(!fs.existsSync(filePath)){
        let createStream=fs.createWriteStream(filePath);
        createStream.end();
    }
    return filePath;
}

request(url,cb);
function cb(error,response,body){
    if(error) console.log(error);
    else extractHTML(body); 
}

function extractHTML(html){
    let selectorTool=cheerio.load(html);
    let teamsNameArr=selectorTool('.text-left.blue-text.pl-3 a');
    for(let i=0;i<teamsNameArr.length;i++){
        let teamName=selectorTool(teamsNameArr[i]).text();
        let folderName=path.join(__dirname,"IPL2020",teamName);
        createDir(folderName);
    }

    let allResultLink=selectorTool('.widget-items.cta-link a').attr('href');
    //console.log(allResultLink);
    let allResultLinkFull="https://www.espncricinfo.com"+allResultLink;
    getAllMatchPage(allResultLinkFull);
}

function getAllMatchPage(link){
    request(link,cb);
    function cb(err,response,body){
        if(err){
            console.log(err);
        }
        else{
            extractAllMatchPage(body);
        }
    }
}

function extractAllMatchPage(html){
    let selectorTool=cheerio.load(html);
    let allMatchesArr=selectorTool('.row.no-gutters .col-md-8.col-16 .match-cta-container a');
    for(let i=2;i<allMatchesArr.length;i=i+4){
        let matchScorecardLink=selectorTool(allMatchesArr[i]).attr('href');
        // console.log(matchScorecardLink);
        let fullmatchScorecardLink="https://www.espncricinfo.com"+matchScorecardLink;
        getEachMatch(fullmatchScorecardLink);
    }
}

function getEachMatch(link){
    request(link,cb);
    function cb(err,response,body){
        if(err){
            console.log(err);
        }
        else{
            extractEachMatchScorecard(body);
        }
    }
}

function extractEachMatchScorecard(html){
    let selectorTool=cheerio.load(html);
    let playingTeams=selectorTool('.team a p');
    let firstTeam=selectorTool(playingTeams[0]).text();
    let secondTeam=selectorTool(playingTeams[1]).text();
    //date venue 
    let matchDetailsArr=selectorTool('.match-info.match-info-MATCH .description').text().split(","); 
    // we need the last element of array, it contains result of other mathes displayed on webpage as well
    // console.log(matchDetailsArr);
    let matchResultArr=selectorTool('.status-text span'); 
    // contains array
    let matchResult=selectorTool(matchResultArr[matchResultArr.length-1]).text(); 

    let batsmenTables=selectorTool('.table.batsman');
    for(let i=0;i<batsmenTables.length;i++){
        let batsmenTable=selectorTool(batsmenTables[i]);
        let batsmenTableRows=batsmenTable.find('tbody tr');
        // console.log(i==0?firstTeam:secondTeam,batsmenTableRows.length);
        for(let j=0;j<batsmenTableRows.length;j=j+2){
            let batsmanCol=selectorTool(batsmenTableRows[j]).find("td");
            let playerName= selectorTool(batsmanCol[0]).text();
            if(playerName=="Extras") continue;
            // console.log(playerName);
            let filePath=createFile(i==0?firstTeam:secondTeam,playerName);
            let arr=[];
            arr.push({
                "Runs" : selectorTool(batsmanCol[2]).text(),
                "Balls":selectorTool(batsmanCol[3]).text(),
                "4s":selectorTool(batsmanCol[5]).text(),
                "6s":selectorTool(batsmanCol[6]).text(),
                "SR":selectorTool(batsmanCol[7]).text(),
                "date":matchDetailsArr[2],
                "venue":matchDetailsArr[1],
                "result":matchResult,
                "opponent":i==0?secondTeam:firstTeam
            })
            // let filePath=path.join()
            fs.writeFileSync(filePath,JSON.stringify(arr));
        }
    }
}