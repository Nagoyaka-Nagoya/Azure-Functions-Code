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