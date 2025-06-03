"use strict";
var durl=new URL(document.location);
durl.href=durl.href.replace(/^http/,"ws");
durl.pathname=durl.pathname+"api";
durl.hash="";

var sock;
var on_reconnect = [];
async function login_info() {
    var data = await sock.call("login_info");
    sock.username = data.username;
    sock.login_info = data;
}
async function initSock() {
    var oldsock=sock;
    if(oldsock && oldsock.elinksd && oldsock.elinksd.parentElement) {
        delete oldsock.elinksd.parentElement.got
        oldsock.elinksd.remove();
    }
    sock=new WebSocket(durl);
    rpc(sock, true);
    sock.onclose=()=>{
        setTimeout(initSock,5000)
    };
    sock.elinksd = document.createElement("div");
    sock.elinksd.innerHTML=`<h1>Коды</h1>
    <form id="elinks_new_f">
        <textarea name="elinks_new_desc" id="elinks_new_desc"></textarea><br>
        <input type="text" name="elinks_new_name" id="elinks_new_name">
        <button type="submit">Создать</button>
    </form>
    <ul id="elinks_inner"></ul>`;
    sock.elinksd.querySelector("#elinks_new_f").onsubmit = async function(e){
        e.preventDefault();
        try {
            await sock.call("link_create",sock.elinksd.querySelector("#elinks_new_name").value,sock.elinksd.querySelector("#elinks_new_desc").value);
            sock.elinksd.querySelector("#elinks_new_name").value = "";
            sock.elinksd.querySelector("#elinks_new_desc").value = "";
        } catch(e) {
            alert(e);
            return;
        }
    }
    sock.methods.notify_links = async function(urlbase, links) {
        var inn = sock.elinksd.querySelector("#elinks_inner");
        sock.links_noted = true;
        var elinks=document.querySelector("#elinks");
        if(elinks&&!elinks.got) {
            elinks.got=true;
            elinks.append(sock.elinksd);
        }
        inn.innerHTML="";
        for (let lnk of links) {
            let [name, desc] = [lnk.name, lnk.desc];
            let elem = document.createElement("li");
            elem.innerText=urlbase+"/"+name+"/doc/";
            elem.innerHTML=`<a href=${elem.innerText}>${name}</a>`;
            elem.innerHTML="<button style=\"margin-right:1em\">[X]</button> "+elem.innerHTML+"<span style=\"white-space:pre-wrap\"></span>";
            elem.querySelector("span").innerText = desc ? " - " + desc : "";
            (name=>{
                elem.querySelector("button").onclick = async function(e) {
                    e.preventDefault();
                    try {
                        await sock.call("link_delete",name);
                    } catch(e) {
                        alert(e);
                        return;
                    }
                }
            })(name);
            inn.append(elem);
        }
    }
    await(new Promise((succ,err)=>{
        sock.onopen=async ()=>{
            console.log("Connected.");
            if(localStorage.lmscheat_auth) {
                try{
                    sock.authed = await sock.call("auth",localStorage.lmscheat_auth);
                } catch(e) {
                    console.error(e);
                    delete localStorage.lmscheat_auth;
                    if(oldsock!=null && oldsock.authed) {
                        document.location.reload();
                    }
                }
                await login_info();
            }
            for(let f of on_reconnect) {
                f();
            }
            on_reconnect=[];
            succ();
        };
        sock.onerror=err;
    }));
    delete sock.onerror;
    delete sock.onclose;
    delete sock.onopen;
}

function loginForm() {
    var elem_login = document.createElement("div");
    elem_login.innerHTML = `
        <form>
            <p>
                <label for="username">Имя пользователя: </label><br>
                <input type="text" name="username" id="username">
            </p>
            <p>
                <label for="username">Пароль: </label><br>
                <input type="password" name="password" id="password">
            </p>
            <p>
                <button type="submit">Войти</button>
            </p>
            <p>
                <a href="javascript:void(0)" class="swapbtw">Нет аккаунта (регистрация)?</a>
            </p>
        </form>
    `
    var elem_register = document.createElement("div");
    elem_register.innerHTML = `
        <form>
            <p>
                <label for="username">Имя пользователя: </label><br>
                <input type="text" name="username" id="username">
            </p>
            <p>
                <label for="username">Пароль: </label><br>
                <input type="password" name="password" id="password">
            </p>
            <p>
                <label for="username">Повторите пароль: </label><br>
                <input type="password" name="password2" id="password2">
            </p>
            <p>
                <label for="username">Код приглашения: </label><br>
                <input type="text" name="regtok" id="regtok">
            </p>
            <p>
                <button type="submit">Зарегистрироваться</button>
            </p>
            <p>
                <a href="javascript:void(0)" class="swapbtw">Есть аккаунт (вход)?</a>
            </p>
        </form>
    `
    $("form",elem_login)[0].onsubmit=async function(e){
        e.preventDefault();
        try {
            localStorage.lmscheat_auth = await sock.call("login", {
                username: $("#username")[0].value,
                password: $("#password")[0].value
            })
        } catch(e) {
            alert(e);
            return;
        }
        cur.remove();
        await login_info();
        main();
    }
    $("form",elem_register)[0].onsubmit=async function(e){
        e.preventDefault();
        if($("#password")[0].value!=$("#password2")[0].value) {
            alert("Пароли не совпадают.");
            return;
        }
        try {
            localStorage.lmscheat_auth = await sock.call("register", {
                username: $("#username")[0].value,
                password: $("#password")[0].value,
                token: $("#regtok")[0].value
            })
        } catch(e) {
            alert(e);
            return;
        }
        cur.remove();
        await login_info();
        main();
    }
    var [cur,next] = [elem_login,elem_register];
    [cur,next].map(f=>{
        $(".swapbtw",f)[0].onclick=function(){
            cur.replaceWith(next);
            [cur,next]=[next,cur];
        }
    })
    document.body.appendChild(elem_login);
}

var axam;

async function examlist(base,preid) {
    var elem = document.createElement("div");
    elem.innerHTML=`
    <h2>Сейчас на экзамене:</h2>
    <ul id="examlist"></ul>
    `;
    var nobody = document.createElement("li");
    nobody.textContent = "(не кого нету)";
    var list = $("#examlist",elem);
    list.append(nobody);
    sock.wait_close().catch(()=>{
        console.warn("disconnected examlist");
        elem.remove();
        on_reconnect.push(()=>examlist(base,current_exam_id));
    });
    var exams = {};
    axam=exams;
    var current_exam_id = preid;
    var current_exam = document.createElement("div");
    function set_suggests() {
        var exam = exams[current_exam_id];
        for(let [i,qu] of exam.suggestions.entries()) {
            var doc = current_exam.docs[i]
            if(!doc) throw "no doc "+i;
            var genans = (ai)=>(
                (ai!=null)
                ?((exam.questions[i].answers[ai]?.key)??`???(${ai})`)
                :('')
            );
            var anstex = $(".exam-iua",doc)[0].textContent = genans(exam.answers[i]);
            var cat = $(".exam-notes",doc)[0];
            cat.textContent='';
            for(let [ni,note] of Object.entries(exam.notes[i])) {
                let b = document.createElement("pre")
                b.textContent = note.owner + ': ' + note.text;
                cat.append(b);
                if(note.owner==sock.username) {
                    let buts = document.createElement("div");
                    let ebut = document.createElement("button");
                    ebut.textContent="изменить";
                    ebut.onclick=function(){
                        note_form(this.parentElement.parentElement, i, ni, exams[current_exam_id].notes[i][ni].text);
                    };
                    buts.append(ebut);
                    let dbut = document.createElement("button");
                    dbut.textContent="удалить";
                    dbut.onclick=async function(){
                        await sock.call("add_note", current_exam_id, i, ni, null);
                    }
                    buts.append(" ",dbut);
                    b.append(buts);
                }
            }
            var uue = $(".exam-uan",doc)[0].textContent =
                [...Object.entries(qu)]
                    .map(([name,ai])=>(`${name}(${genans(ai)})`));
            $(".exam-quil"+i)[0].textContent = ["[ "+(i+1)+" ]. ",anstex?`${anstex}, `:"",uue].join("");
            $(`[name="answers[${i+1}]"]`,doc).map((_,e)=>(e.value==(qu[sock.username]??"null")&&(e.checked=true),e));
        }
    }
    function note_form(orig, i, ni, dtext) {
        dtext = dtext ?? "";
        var el = document.createElement("form");
        el.innerHTML=`<div>
            <div><textarea name="text"></textarea></div>
            <button class="cancel-btn">Отмена</button>
            <button type="submit">Сохранить</button>
        </div>`;
        var text = $("textarea",el)[0];
        text.value = dtext;
        $(".cancel-btn",el).click(function(){
            el.replaceWith(orig);
        });
        el.onsubmit=async function(e){
            e.preventDefault();
            await sock.call("add_note", current_exam_id, i, ni, text.value);
            el.replaceWith(orig);
        }
        orig.replaceWith(el);
    }
    sock.methods.notify_init_exam = async function(exam_id,exam) {
        var anelem = document.createElement("li");
        anelem.innerHTML="<a href='javascript:void(0)'></a>";
        anelem.exam_id=exam_id;
        var aneleml=$('a',anelem)[0];
        aneleml.textContent=exam.name;
        aneleml.onclick=function(e){
            if(e)
                e.preventDefault();
            if(current_exam_id==exam_id) {
                var old_curexam = current_exam;
                current_exam = document.createElement("div");
                old_curexam.replaceWith(current_exam);
                current_exam_id = undefined;
                return;
            }
            current_exam_id = exam_id;
            var old_curexam = current_exam;
            current_exam = document.createElement("div");
            old_curexam.replaceWith(current_exam);
            current_exam.i = current_exam_id;
            current_exam.docs=[];
            current_exam.innerHTML=`
            <div class='exam-view'>
            <h2 class='exam-name'></h2>
            <p><a href="https://ourworldofpixels.com/${current_exam_id}">Рисовашка</a> <a class="exprintbtn" href="javascript:void(0)">Печать</a></p>
            <ul class="exam-quefol"></ul>
            <div class='exam-questions'></div>
            </div>
            `;
            $(".exam-name",current_exam)[0].textContent = exam.name;
            $(".exprintbtn",current_exam).click(()=>{
                printer(exam);
            })
            var curqusel=null;
            for(let [i,qu] of exam.questions.entries()) {
                let uri = document.createElement("a");
                let uric = document.createElement("li");
                uric.append(uri);
                uri.textContent = "<...>";
                uri.setAttribute("href","javascript:void(0)");
                uri.setAttribute("class","exam-quil"+i);
                $(".exam-quefol",current_exam).append(uric);
                let doc = document.createElement("div");
                uri.onclick = function() {
                    if(curqusel!=null) { curqusel.style.display = "none"; curqusel.remove(); }
                    if(curqusel==doc) { curqusel=null; return; }
                    curqusel = doc;
                    doc.style.display = null;
                    uri.parentElement.append(doc);
                };
                current_exam.docs[i]=doc;
                doc.i = i;
                doc.style.display = "none";
                doc.innerHTML = `
                    <p>
                        <h3><span class="exam-i"></span> <span class="exam-iua"></span></h3>
                        <p class="exam-qu"></p>
                        <ul class="exam-anl">
                        <li>
                        <input type="radio" id="answer${i}" name="answers[${i+1}]" value="null" checked>
                        <label for="answer${i}">(ответ не выбран)</label>
                        </li>
                        </ul>
                        <p>Ответили: <span class="exam-uan"></span></p>
                        <p>Заметки <button class="exam-add-note">+</button><div class="exam-notes"></div></p><br>
                    </p>`;
                $('.exam-qu',doc)[0].innerHTML = qu.text;
                $('.exam-i',doc)[0].textContent = ""+(i+1);
                $('.exam-add-note',doc).click(function(){
                    note_form(this, i, null);
                });
                var anl=$('.exam-anl',doc)[0];
                doc.radios={};
                var proc_radio=(e,ai)=>{
                    doc.radios[ai]=e;
                    e.onchange=async()=>{
                        if(e.checked){
                            await sock.call('suggest_answer',current_exam_id,i,ai);
                        }
                    }
                };
                $("input",doc).first().map((_,e)=>{proc_radio(e,null);});
                for(let [ai,aq] of qu.answers.entries()) {
                    var andoc = document.createElement("li");
                    var name = `answer${i}_${ai}`;
                    andoc.innerHTML=`
                        <input type="radio" id="${name}" name="answers[${i+1}]" value="${ai}">
                        <label for="${name}"></label>`;
                    $('label',andoc)[0].innerHTML = `<span>${aq.key}: </span>`+aq.text;
                    $('input',andoc).map((_,e)=>{proc_radio(e,ai);});
                    anl.append(andoc);
                }
                //$('.exam-questions',current_exam).append(doc);
            }
            set_suggests();
        }
        list.append(anelem);
        nobody.remove();
        exams[exam_id] = exam;
    }
    sock.methods.notify_update_exam = async function(exam_id,exam) {
        exams[exam_id].suggestions = exam.suggestions;
        exams[exam_id].notes = exam.notes;
        exams[exam_id].answers = exam.answers;
        exams[exam_id].name = exam.name;
        $("li",list).filter((_,e)=>e.exam_id==exam_id).first().map((_,e)=>{
            $('a',e)[0].textContent=exam.name;
        });
        if(current_exam_id == exam_id) {
            $(".exam-view",current_exam).first().map((_,e)=>{
                $(".exam-name",e)[0].textContent = exam.name;
            });
            set_suggests();
        }
    }
    sock.methods.notify_die_exam = async function(exam_id) {
        $("li",list).filter((_,e)=>e.exam_id==exam_id).remove();
        if(!$("li",list).length){
            list.append(nobody);
        }
        if(current_exam_id==exam_id) {
            var old_curexam = current_exam;
            current_exam = document.createElement("div");
            old_curexam.replaceWith(current_exam);
            current_exam_id = undefined;
        }
    }
    await sock.call("subscribe_examlist");
    if(current_exam_id!=null) {
        $("li",list).filter((_,e)=>e.exam_id==current_exam_id).first().map((_,e)=>{
            $('a',e)[0].onclick();
        });
    }
    elem.appendChild(current_exam);
    base.appendChild(elem);
}

async function main() {
    var elem = document.createElement("div");
    var elem_login = document.createElement("div");
    elem_login.innerHTML = `
        <form>
            <p>
                <label for="username">Пароль: </label><br>
                <input type="password" id="passwd_password">
            </p>
            <p>
                <label for="username">Новое имя пользователя: </label><br>
                <input type="text" id="passwd_new_username">
            </p>
            <p>
                <label for="username">Новый пароль: </label><br>
                <input type="password" id="passwd_new_password">
            </p>
            <p>
                <label for="username">Повторите новый пароль: </label><br>
                <input type="password" id="passwd_new_password_repeat">
            </p>
            <p>
                Оставьте поля пустыми если не хотите изменить.
            </p>
            <p>
                <button type="submit">Сменить</button>
                <button id="passwd_close">Отмена</button>
            </p>
        </form>
    `;
    var elem_login_alt = document.createElement("span");
    elem_login_alt.innerHTML="<button id=\"passwd_open\">Сменить логин/пароль</button>";
    $("form",elem_login)[0].onsubmit=async function(e){
        e.preventDefault();
        try {
            if($("#passwd_new_password")[0].value != $("#passwd_new_password_repeat")[0].value)
                throw "пароли не совпадают";
            await sock.call("passwd", {
                password: $("#passwd_password")[0].value,
                new_username: $("#passwd_new_username")[0].value,
                new_password: $("#passwd_new_password")[0].value,
            })
        } catch(e) {
            alert(e);
            return;
        }
        window.location.reload();
    }
    function elogsw(e) {
        if(e!=null) e.preventDefault();
        elem_login.replaceWith(elem_login_alt);
        [elem_login,elem_login_alt] = [elem_login_alt,elem_login];
    }
    $("#passwd_close",elem_login)[0].onclick = elogsw;
    $("#passwd_open",elem_login_alt)[0].onclick = elogsw;
    elem.innerHTML = `
    <p>Добро пожаловать, ${sock.username}!</p> <button id="logout">Выйти</button>
    `+`<div id="passwd_container"></div>`+(sock.login_info.is_admin?`
    <p>Вы админ.</p>
    `:``)+`
    <form id="new_regtok">
        <input type="text" name="regtok" id="regtok">
        <button type="submit">Создать приглашение</button>
    </form>
    `+`<div id="elinks"></div>`;
    examlist(elem);
    (el=>{if(sock.links_noted){
        el.got=true;
        el.append(sock.elinksd);
    }})(elem.querySelector("#elinks"));
    $("#passwd_container",elem)[0].replaceWith(elem_login);
    elogsw();
    $("#logout",elem)[0].onclick=async function(e){
        await sock.call("logout");
        delete localStorage.lmscheat_auth;
        document.location.reload();
    }
    $("#new_regtok",elem).first().map((i,e)=>{
        e.onsubmit=async function(ev) {
            ev.preventDefault();
            try {
                await sock.call("regtok", {token:$("#regtok",e)[0].value});
                alert("Приглашение создано.");
                $("#regtok",e)[0].value = "";
            } catch(e) {
                alert(e);
            }
        }
    })
    document.body.appendChild(elem);
}

async function init() {
    await initSock();
    if(!sock.authed){
        loginForm();
    } else {
        main();
    }
}


// admin tools

window.seval = async function(f,...a) {
    f=(f.constructor.name=="AsyncFunction"
        ? 'return await ('+f+')(...args)'
        : 'return await (async '+f+')(...args)'
    );
    return await sock.call('eval',f,...a)
}
window.assim_recalc = async function() {
    await seval(()=>{
        let vals = Object.values(appdata.exams);
        let subjs = {};
        let sc=e=>(subjs[e]??(subjs[e]={exs:[],base:null}));
        vals.forEach(e=>{
            if(e.subject && !e.base) {
                let sub=sc(e.subject);
                sub.exs.push(e);
            } else if (e.subject && e.base) {
                let sub=sc(e.subject);
                sub.base = e;
            }
        });
        for (let [sub,sc] of Object.entries(subjs)) {
            let dirty = false;
            if(!sc.base) {
                sc.base = {};
                sc.base.exam_idpub = auth_token();
                sc.base.exam_id = auth_token();
                sc.base.questions = [];
                sc.base.notes = [];
                sc.base.answers = [];
                sc.base.suggestions = [];
                sc.base.timestamp = Math.floor(Date.now()/1000);
                sc.base.online = 0;
                sc.base.base = true;
                sc.base.name = "БАЗА: "+sub;
                sc.base.subject = sub;
                dirty = true;
                appdata.exams[sc.base.exam_idpub] = sc.base;
            }
            let qus = {};
            let dels={};
            for(let [i,q] of sc.base.questions.entries()) {
                let qn = sigmatize_q(q)
                if(!(qn in qus)) {
                    qus[qn] = i;
                } else {
                    dels[i] = true;
                    console.log('appending',sc.base.suggestions[qus[qn]],sigmoid_cismute(
                            sigmoid_transmute(sc.base.suggestions[i],q),
                            sc.base.questions[qus[qn]]
                        ))
                    sc.base.suggestions[qus[qn]] = denuled({
                        ...sc.base.suggestions[qus[qn]],
                        ...sigmoid_cismute(
                            sigmoid_transmute(sc.base.suggestions[i],q),
                            sc.base.questions[qus[qn]]
                        )
                    })
                    dirty = true;
                }
            };
            let quis = {};
            for(let ex of sc.exs) {
                for (let q of ex.questions) {
                    let qn = sigmatize_q(q);
                    quis[qn] = true;
                    if(qus[qn]==null) {
                        sc.base.questions.push(q);
                        sc.base.notes.push({});
                        sc.base.answers.push(null);
                        sc.base.suggestions.push({});
                        qus[qn]=true;
                        dirty = true;
                    }
                }
            }
            for(let qn in qus) {
                if(!(qn in quis)) {
                    dels[qus[qn]] = true;
                    dirty = true;
                }
            }
            if (dirty) {
                sc.base.questions = sc.base.questions.filter((e,i)=>!(i in dels));
                sc.base.answers = sc.base.answers.filter((e,i)=>!(i in dels));
                sc.base.suggestions = sc.base.suggestions.filter((e,i)=>!(i in dels));
                sc.base.notes = sc.base.notes.filter((e,i)=>!(i in dels));
                while (sc.base.online>0) close_exam(sc.base.exam_idpub);
                open_exam(sc.base.exam_idpub);
            }
        }
        appdata_dirty = true;
    });
}
window.subjnames = async function(...a) {
    return await seval((sub)=>{
        return Object.values(appdata.exams).filter(e=>e.subject==sub).map(e=>e.name)
    },...a);
}
window.subjlist = async function() {
    return await seval(()=>{
        var subjs={};
        Object.values(appdata.exams).map(e=>subjs[e.subject]=true);
        return Object.keys(subjs);
    });
}
window.subjfetch = async function(...a) {
    return await seval((sub)=>{
        return Object.values(appdata.exams).filter(e=>e.subject==sub)
    },...a);
}
window.assimilate = async function(...arg) {
    await seval((...arg)=>{
        let vals = Object.values(appdata.exams);
        arg.map(([e,f,ee])=>vals.slice(e,ee!=null?(ee+1):ee).map(e=>{if(f!=null)e.subject=f;else delete e.subject}));
        appdata_dirty = true;
    },...arg);
}
window.sexnames = async function(...a) {
    return await seval((i,i2)=>{
        return Object.values(appdata.exams).slice(i,i!=null?((i2??i)+1):[][0]).map(e=>(new Date(e.timestamp*1000)).toLocaleString('ru-RU',{timezone:"Asia/Tashkent"})+" " + (e.code?"("+e.code+") ":"")+e.subject+": "+e.name);
    },...a);
}
window.sexkill = async function(...a) {
    return await seval((i,i2)=>{
        let exam = Object.values(appdata.exams).slice(i,(i2??i)+1);
        exam.forEach(exam=>{
            while (exam.online>0) close_exam(exam.exam_idpub);
            delete appdata.exams[exam.exam_idpub];
            appdata_dirty = true;
        });
        return exam.map(e=>e.name);
    },...a);
}
window.sexfetch = async function(...a) {
    return await seval((i,i2)=>{
        let exam = Object.values(appdata.exams).slice(i,(i2??i)+1);
        return exam;
    },...a);
}

window.killTest = async function() {
	return await seval(_=>Object.values(appdata.exams).filter(e=>e.subject==null&&e.name.match(/\(ignore\)$/)).forEach(e=>{delete appdata.exams[e.exam_idpub]}))
}

window.sleep = async function(i) {
    let suc; setTimeout(_=>suc(),i);
    return await (new Promise((s)=>{suc=s}));
}

window.printer = async function(...vals) {
    let olb = document.body
    let newb = document.createElement("body")
    document.body.replaceWith(newb);
    ((vals)=>{
        var i=0;
        var qmap = new Map();
        var uids = new Map();
        var uid=1;
        vals.forEach(e=>{
            var cuid = uids.get(e)??(uid++);
            uids.set(e,cuid);
            e.questions.forEach((ee,qi)=>{
                var q = qmap.get(ee.text)??{
                    text: ee.text,
                    answers:[],
                    suggestions:{},
                    aset: new Map(),
                    asinset: new Map(),
                };
                qmap.set(ee.text,q);
                ee.answers.forEach(eee=>{
                    q.aset.set(eee.text,(q.aset.get(eee.text)??0)+1);
                    var asins = q.asinset.get(eee.text)??[];
                    q.asinset.set(eee.text,asins);
                    asins.push(uid);
                });
                q.answers.push(e.answers[qi]!=null?ee.answers[e.answers[qi]].text:[][0]);
                q.suggestions = {
                    ...q.suggestions,
                    ...Object.fromEntries(
                        Object.entries(e.suggestions[qi])
                            .map(eee=>[eee[0]+Math.random()+Math.random(),ee.answers[eee[1]].text])
                    )
                };
            });
        });

        [...qmap.values()].forEach(ee=>{
            var elss = document.createElement("section");
            document.body.append(elss);
            var elssh = document.createElement("h1");
            var answ = [...ee.answers,...Object.values(ee.suggestions)]
                .filter(e=>e!=null);
            elssh.innerHTML=(++i)+". "+`(${answ.length} ответ(ов)) `+ee.text;
            var elssl = document.createElement("ol");
            elssl.setAttribute("type","A");
            elss.append(elssh,elssl);
            [...ee.aset.entries()].forEach(([eee,cc])=>{
                var elssa = document.createElement("li");
                elssl.append(elssa);
                var pc=Math.floor(answ.filter(e=>e==eee).length/answ.length*100)+"%";
                var asins = ee.asinset.get(eee);
                elssa.innerHTML= (asins.length>0?asins.map(e=>"#"+e).join()+" ":"")+((ee.answers.find(e=>e==eee)!=null)?`<b>(${pc})</b> `:`(${pc}) `)+ eee
            });
        })
    })(vals);
    await sleep(200);
    print()
    await sleep(200);
    document.body.replaceWith(olb)
}


// /admin tools

init();
