;globalThis.rpc=function(sock,do_keepalive){
    "use strict";
    var calls = {};
    var closed = false;
    var keepalive;
    var lastcid = 0;
    sock.methods = {};
    sock.onmessage = async function(ev) {
        try {
            var data = JSON.parse(ev.data);
        } catch(e) {
            console.error(e);
            return;
        }
        if(data.type == "call") {
            console.log(('sid' in sock?`[${sock.sid}] `:'')+"RPC(<-)#"+data.callId+" "+JSON.stringify(data.method));
            var err = false;
            try {
                var ret = await sock.methods[data.method](...data.args);
            } catch(e) {
                err=true;
                ret = e+(e.stack?('\n'+e.stack):'');
                console.error(('sid' in sock?`[${sock.sid}] `:'')+"RPC(<-)#"+data.callId+" error",e);
            }
            sock.send(JSON.stringify({
                type: "return",
                callId: data.callId,
                success: !err,
                content: ret
            }));
            console.log(('sid' in sock?`[${sock.sid}] `:'')+"RPC(<-)#"+data.callId+" return");
        } else if (data.type == "return") {
            if(!calls[data.callId]) return;
            if(data.success) {
                calls[data.callId].success(data.content);
            } else {
                calls[data.callId].failure(data.content);
            }
            delete calls[data.callId];
        } else if (data.type == "ping") {
            sock.send(JSON.stringify({
                type: "pong",
                content: data.content
            }));
        }
    }
    sock.call = async function(method, ...args) {
        if(closed) {
            throw "connection failure";
        }
        var cid = lastcid++;
        console.log(('sid' in sock?`[${sock.sid}] `:'')+"RPC(->)#"+cid+" "+JSON.stringify(method));
        var ret;
        try {
            ret= await(new Promise((success,failure)=>{
                calls[cid]={
                    success: success,
                    failure: failure
                };
                sock.send(JSON.stringify({
                    type:"call",
                    callId: cid,
                    method: method,
                    args: args
                }));
            }));
        } catch(e) {
            console.log(('sid' in sock?`[${sock.sid}] `:'')+"RPC(->)#"+cid+" error");
            throw e;
        }
        console.log(('sid' in sock?`[${sock.sid}] `:'')+"RPC(->)#"+cid+" return");
        return ret;
    }
    sock.wait_close = async function() {
        if(closed) {
            throw "connection failure";
        }
        var cid = lastcid++;
        return await(new Promise((success,failure)=>{
            calls[cid] = {
                success:()=>{},
                failure:failure
            };
        }));
    }
    sock.addEventListener('close',function(){
        console.log(('sid' in sock?`[${sock.sid}] `:'')+"disconnected.");
        for(let [_,call] of Object.entries(calls)) {
            call.failure("connection close");
        }
        calls={};
        closed = true;
        if(keepalive!=null){
            clearInterval(keepalive);
            keepalive = null;
        }
    });
    if(do_keepalive) {
        sock.addEventListener('open',function(){
            keepalive = setInterval(()=>{
                sock.send(JSON.stringify({
                    type: "ping",
                    content: Date.now()
                }));
            },10000);
        });
    }
};
