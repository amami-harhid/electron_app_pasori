async function selectApi() {
    var result = await window.pasoriDb.selectCardsAll();
    console.log('selectCardsAll=', result)
}

window.onload= function(){
    const h1 = document.getElementById("test");
    h1.addEventListener("click", async function(e){
        const rows = await window.pasoriDb.selectCardsAll();
        console.log("in test.js selectCardsAll=", rows);
    })
}