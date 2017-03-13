
module.exports = function (context, myQueueItem) {
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

S_Catch(4);
}