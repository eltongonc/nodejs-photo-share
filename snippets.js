var idList = "591efb7d570cadac0b06f3ea";
var idBoard = "591eea3ee00e7d3abf0787da";
/**************
** Lists
**************/
// create
var url = `https://api.trello.com/1/lists`;
axios.post(url,{
    key:key,
    token: token,
    name: "Nodejs",
    idBoard: idBoard
}).catch(err=>{throw err});

// view
var url = `https://api.trello.com/1/lists/${idList}/cards`;
axios.get(url,{
    key:key,
}).then(response=>{
    console.log(response.data);
}).catch(err=>{throw err});
/**************
** Create cards
**************/
var url = `https://api.trello.com/1/cards`;
// Set the destination list for the new card
axios.post(url, {
    key:key,
    token: token,
    name: "DJ KHALED",
    desc: "WE THE BEST",
    pos: "top",
    due: null,
    urlSource : "https://img.memesuper.com/dfd70430813a6a4162a6c5f55b9f2862_mrw-dj-khaled-we-da-best-meme_500-295.jpeg",
    idList: idList
}).catch(err=>{throw err});
