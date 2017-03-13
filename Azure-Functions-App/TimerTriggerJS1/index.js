module.exports = function (context, myTimer) {
    var timeStamp = new Date().toISOString();
    
    if(myTimer.isPastDue)
    {
        context.log('JavaScript is running late!');
    }
    context.log('JavaScript timer trigger function ran!', timeStamp);   
    
    context.log('sending httpRequest');

    var request = require('request');

    // tv_status用のヘッダー
    var headersTvStatus = {
        'X-Cybozu-API-Token':'PCBBd9mcIsoLMZvJcDpdighEUk08j613ratvz5lx'
    };

    // tv_program用のヘッダー
    var headersTvProgram = {
        'X-Cybozu-API-Token':'o8CC0GkR6nV1QwYjQ8a4irBTtFIqyAQk2RmrUShR'
    }

    // tv_program用ののurlパラム
    var paramsTvProgram = '?app=10&query='+
        encodeURIComponent('');
        //'&fields[0]=' + encodeURIComponent('channel')+
        //'&fields[1]=' + encodeURIComponent('power')+
        //'&fields[2]=' + encodeURIComponent('created_at');

    // tv_programu用ののurl
    var urlTvProgram = 'https://918gh.cybozu.com/k/v1/records.json' + paramsTvProgram;

    // tv_program用のオプション
    var optionsTvProgram = {
        url: urlTvProgram,
        method: 'GET',
        headers: headersTvProgram,
    }

    var result = {};

    request(optionsTvProgram, function (errorTvProgram, responseTvTrogram, bodyTvProgram) {
        resTvProgram = JSON.parse(bodyTvProgram);

        // tv_status用のurlパラム
        var paramsTvStatus = '?app=6&query='+
            encodeURIComponent('created_at >= FROM_TODAY(-7, DAYS)')+
            '&fields[0]=' + encodeURIComponent('channel')+
            '&fields[1]=' + encodeURIComponent('power')+
            '&fields[2]=' + encodeURIComponent('created_at');

        // tv_status用ののurl
        var urlTvStatus = 'https://918gh.cybozu.com/k/v1/records.json' + paramsTvStatus;

        // tv_status用のオプション
        var optionsTvStatus = {
            url: urlTvStatus,
            method: 'GET',
            headers: headersTvStatus,
        }

        var weekdays = [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ];

        resTvProgram.records.forEach(function(val,index){
            // 要素をそれぞれ取得
            let recordId = val.id.value;
            let tweetId = val.twitter_id.value;
            let channelTvProgram = val.channel.value;
            let startTime = val.start_time.value;
            let endTime = val.end_time.value;
            let startTimeValue = Number(startTime.substr(0,startTime.length-3))*60 + Number(startTime.substr(3));
            let endTimeValue = Number(endTime.substr(0,endTime.length-3))*60 + Number(endTime.substr(3));
            let daysTvProgram = val.day.value;
            let flag = false;
            let flag2 = false;
            let twitterDate = "";

            request(optionsTvStatus, (errorTvStatus, responseTvStatus, bodyTvStatus) => {
                resTvStatus = JSON.parse(bodyTvStatus);
                resTvStatus.records.forEach((val2,index2) => {
                    // twitter : 2017-01-11_22:05:30_JST
                    // 要素をそれぞれ取得
                    channelTvStatus = val2.channel.value;
                    timeTvStatus = val2.created_at.value.substr(11);
                    timeTvStatus = timeTvStatus.substr(0,timeTvStatus.length-1);
                    timeValueTvStatus = Number(timeTvStatus.substr(0,timeTvStatus.length-6))*60 + Number(timeTvStatus.substr(0,timeTvStatus.length-3).substr(3));
                    dateTvStatusString = val2.created_at.value.substr(0, val2.created_at.value.length-10);
                    weekdayTvStatus = new Date(dateTvStatusString);
                    dayTvStatus = weekdays[weekdayTvStatus.getDay()];
                    twitterDate = dateTvStatusString + "_" + timeTvStatus + "_JST";

                    if((channelTvStatus == channelTvProgram) &&
                        (timeValueTvStatus >= startTimeValue) &&
                        (timeValueTvStatus <= endTimeValue) &&
                        (daysTvProgram.indexOf(dayTvStatus) >= 0)
                        ) {
                            if(recordId == "4"){
                                flag = true;
                            }
                            if(tweetId != ""){
                                flag2 = true;
                            }
                    }
                });
                if(flag){
                    context.log("ok");
                    S_Catch(recordId);
                }
                if(flag2){
                    context.log("ok");
                    GetTwitter(tweetId, twitterDate ,channelTvProgram);
                }

            });
        });
    });

function S_Catch(id) {

    var client = require('cheerio-httpcli');


    function toHalfWidth(strVal) {
        // 半角変換
        var halfVal = strVal.replace(/[！-～]/g,
            function (tmpStr) {
                // 文字コードをシフト
                return String.fromCharCode(tmpStr.charCodeAt(0) - 0xFEE0);
            }
        );

        // 文字コードシフトで対応できない文字の変換
        return halfVal.replace(/”/g, "\"")
            .replace(/’/g, "'")
            .replace(/‘/g, "`")
            .replace(/￥/g, "\\")
            .replace(/　/g, " ")
            .replace(/〜/g, "~");
    }

    client.fetch("http://www2.ctv.co.jp/catch/", (err, $, res) => {


        list = [];

        $("div.post").each((i, e) => {
            //context.log($(e).text());
            const text = toHalfWidth($(e).text());
            const r = text.match(/(20\d{1,2})年(\d{1,2})月(\d{1,2})日 放送/m);
            if (r === null || r.length !== 4) return;
            const y = Number.parseInt(r[1]);
            const m = Number.parseInt(r[2]);
            const d = Number.parseInt(r[3]);

            const date = new Date(y, m-1, d);
            let current;
            text.match(/(0\d{1,4}-|\(0\d{1,4}\) ?)?\d{1,4}-\d{4}/m)
            text.split("\n").forEach(l => {
                if (l.startsWith("●")) {
                    if (current) {
                        current.text = current.text.trim();
                        list.push(current);
                        current = null;
                    }
                    current = {};
                    current.date = date;
                    current.title = l.substr(1);
                    current.text = "";
                } else if (current) {
                    current.text += l + "\n";
                }
            })
            if (current) {
                current.text = current.text.trim();
                list.push(current);
            }
        })
        getImages(list);
    });


    function getImages(list) {
        
        Promise.all( list.map(i => {
            
            const body = { "Text": i.title };

            var rp = require('request-promise');

            var postRecords = function () {

                var req = {
                    "method": "POST",
                    "url": "https://prod-08.northcentralus.logic.azure.com/workflows/3ee258acac534a039d8899aa63810914/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Edyt6Xr2zgC8c74VA_Jgw52HvMhzm8SDyK-UzJy2dP0",
                    //"headers": header_data,
                    "json": body
                };
                return req;
            };

            return rp(postRecords())
                .then(function (resp) {
                    const img = resp[0].contentUrl;
                    context.log(img);
                    i.image = img;
                    return i;
                })
                .catch(function (error) {
                    //context.log("dame");
                    context.log(JSON.stringify(error));
                }
            );


        }) ).then( x => {
            post2Kintone(x);
        } )

    }


    //YYY - MM - DDTHH:MM: SS±HH: MM
    function post2Kintone(list) {
        var body = {
            "app": 13,
            "records": list.map(item => {
                return {
                    "postdate": {
                        "value": `${item.date.getYear() + 1900}-${item.date.getMonth() + 1}-${item.date.getDate()}`
                    },
                    "program": { "value": id },
                    "webContent": { "value": JSON.stringify(item) },
                    "twitterContent": { "value": "" }

                }
            })
        };
        var rp = require('request-promise');


        var GET_URL = 'https://918gh.cybozu.com/k/v1/records.json';
        var APP_ID = 13; //アプリID


        var postRecords = function () {
            var header_data = {
                //"X-Cybozu-Authorization": 'xxxxxxxxxxxxxxxxx'
                'Content-type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Cybozu-API-Token': 'Vy64prjjfDO6KBSpDozgB4CqpFiubpZcCy6afNJV'
            };

            var req = {
                "method": "POST",
                "url": GET_URL + '?app=' + APP_ID,
                "headers": header_data,
                "json": body
            };
            return req;
        };

        rp(postRecords())
            .then(function (resp) {
                context.log(JSON.stringify(resp));
                context.done();
            })
            .catch(function (error) {
                context.log(JSON.stringify(error));
                context.done();
            }
            );
    };

}

    function GetTwitter(twitterid, date, programid) {

        var request = require('request');
        let Srequest = require('sync-request');


        //function( twitterid,start )

        TwitterDataStub("ctvcatch", "2016-1-1");
        //PostKintone("hoge","huga");

        function TwitterDataStub(twitter, start) {
            const headers = {
                "Content-Type": "application/json",
            }
            const body = {
                "TwitterID": twitter,
                "StartTime": start
            }
            // context.log("REqest Start");
            // //リクエスト送信
            // const res = request("GET", 'http://jsonstub.com/twitterdata', { "headers": headers });
            // context.log(res);

            //オプションを定義
            var options = {
                url: "https://prod-04.northcentralus.logic.azure.com/workflows/7daf3e3f436e43bfa40e0928da55fc14/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=CBHm7rCBFXW61PmrJkrT6Rfda-Tsx1fxl2nakwVH0YE",
                method: 'POST',
                headers: headers,
                json: body
            }
            //リクエスト送信
            request(options,
                function (error, response, body) {
                    //console.log(body);
                    //res = JSON.parse(body);
                    //context.log(body);
                    // context.done();
                    PostKintone("ID", body);
                });

        }

        function PostKintone(Uid, Tweet) {
            console.log("####");
            console.log(Tweet);
            var body = {
                "app": 13,
                "records": Tweet.map(t => {
                    const date = new Date(t.CreatedAt);
                    return {

                        "postdate": { "value": `${date.getYear() + 1900}-${date.getMonth() + 1}-${date.getDate()}` },
                        "program": { "value": programid },
                        "webContent": { "value": "" },
                        "twitterContent": { "value": JSON.stringify(t) }
                    }
                })
            };

            var url = 'https://918gh.cybozu.com/k/v1/records.json?app=13';

            var headers = {
                'Content-type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-Cybozu-API-Token': 'Vy64prjjfDO6KBSpDozgB4CqpFiubpZcCy6afNJV'
            };

            //オプションを定義
            var options = {
                url: url,
                method: 'POST',
                headers: headers,
                json: body
            }
            //リクエスト送信
            request(options,
                function (error, response, body) {
                    //res = JSON.parse(body);
                    console.log(body);
                    // context.done();
                })
        }
    };
};