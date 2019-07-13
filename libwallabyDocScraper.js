const siteUrl = "https://files.kipr.org/wallaby/wallaby_doc/modules.html";
const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs")

const fetchData = async function(url){
    const result = await axios.get(url);
    return cheerio.load(result.data);
  };
(async() => {
    const $ = await fetchData(siteUrl);
    const dirTable = $('table.directory');
    const tableRow = dirTable.contents();
    // const tableRows = tableRow[0].children();

    let pages = []

    tableRow.contents().each((i, elem) => {
        if(i % 2 == 0) pages.push(elem.children[0].children[1].attribs.href)
    })

    //REMOVE. TESTING ONLY
    // pages = ["group__compass.html"];
    
    for(let pageURL of pages){
        let page = await fetchData("https://files.kipr.org/wallaby/wallaby_doc/" + pageURL);
        let methodSignature = page("table.memname > tbody");
        let methodNameRow = methodSignature.children()[0];
        let methodName = page("table.memname > tbody > tr > td.memname");

        let methods = []

        methodName.each((i, elem) => {

            //gets method name

            let tarElem = elem.children[0];
            let tarData = tarElem.data;
            let loopBreaker = 0;
            while(tarElem.name == "a" && loopBreaker < 10){
                if(tarElem.children[0].data === 'VF'){
                    console.log(tarElem.parent.children[tarElem.parent.children.length - 1].data);
                    tarData = tarElem.parent.children[tarElem.parent.children.length - 1].data;
                    // tarElem = tarElem.parent.children[tarElem.parent.children.length - 1].data
                    break;
                }else{
                    if(tarElem.name == "a"){
                        tarData = tarElem.children[0].data + elem.children[1].data;
                        tarElem = elem.children[1];
                    }

                }
            }

            console.log("tarD: " + tarData);

            // console.log(tarElem)

            //gets method description
            
            let parentElem = tarElem.parent;
            while(parentElem.attribs.class !== "memitem"){
                parentElem = parentElem.parent;
            }

            let childElem;

            for(let c of parentElem.children){
                // console.log(c)
                if(c.attribs !== undefined && c.attribs.class === "memdoc"){
                    childElem = c;
                }
            }

            let descS = ""

            for(let c of childElem.children){
                if(c.name === "p"){
                    childElem = c;
                    descS = childElem.children[0].data;
                }
            }

            methods[i] = {
                name: tarData,
                params: [],
                desc: descS,
            };


             console.log(methods[i].desc)


            //gets method params

            let signatureBody = elem.parent.parent;

            for(let childTableRow of signatureBody.children){
                if(childTableRow.name === "tr" && childTableRow.children !== undefined){
                    for(let childTabledata of childTableRow.children){
                        if(childTabledata.attribs !== undefined && childTabledata.attribs.class === "paramname" && childTabledata.children[0] !== undefined){
                            console.log(childTabledata.children[0].children[0].data);
                            methods[i].params.push(childTabledata.children[0].children[0].data);
                        }
                    }
                }
            }

            // console.log(foundDescForTBody);

            
        // let paramsTable = page("table.params > tbody")
        
        // paramsTable.each((oo, tBody) => {
        //     // console.log(tBody)
        //     for(let tR of tBody.children){
        //         if(tR.children !== undefined){
        //             console.log(tR.children[1].children[0].data);
        //             methods[i].params.push(tR.children[1].children[0].data)
        //         }
        //     }

            
        //     // tBody.children().each((j, tR) => {
        //     //     console.log(tr)
        //     // })
        // })



        });



        console.log("--------------------------------")
        console.log("BEGINNING SNIPPET JSON")
        console.log("\n\n\n")


        let stream = fs.createWriteStream("snippets.txt", {flags:'a'});

        for(let m of methods){
            let mBodyPrefix = m.name.split(" ");
            for(let p = mBodyPrefix.length - 1; p >= 0; p--){
                if(mBodyPrefix[p] != " " && mBodyPrefix[p] != "&nbsp;" && mBodyPrefix[p] !== ""){
                    // console.log("setting mbp: " + mBodyPrefix[p])
                    mBodyPrefix = mBodyPrefix[p];
                    break;
                }
            }
            let paramString = "";
            for(let k = 0; k < m.params.length; k++){
                paramString += "${" + (k+1) + ":" + m.params[k] + "}, " 
            }

            // let prefix = m.name.split("");

            paramString = paramString.substr(0, paramString.length - 2);
            stream.write(`"${m.name}": {\n"scope": "c",\n"prefix": "${mBodyPrefix}",\n"body": "${mBodyPrefix}(${paramString})",\n"description": "${m.desc}"\n},\n`)


        }
        
        // paramsTable.each((i, textObj) => {
        //     console.log(textObj.children[0].data);
        // })
    }


})();
