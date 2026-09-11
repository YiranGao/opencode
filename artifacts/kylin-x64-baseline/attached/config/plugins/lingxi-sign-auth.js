// Obfuscated build. XOR-key 0x55. Import paths are plain (Node requires them to be literals),
// all sensitive strings (secret, header names, hook name, platform literals) are XOR+Base64 encoded.
const _k=0x55;
const _d=(s)=>Buffer.from(s,'base64').toString().split('').map(c=>String.fromCharCode(c.charCodeAt(0)^_k)).join('');

import {createHash,createHmac} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const _s=_d('OTw7Mi08NjoxMHgmPDI7PDsyeD4wLHgjZHglOTA0JjB4JzAlOTQ2MHg4MA==');
const _H={'t':_d('DXgBPDgwJiE0OCU='),'n':_d('DXgbOjs2MA=='),'p':_d('DXgFOSAyPDt4HTQmPQ=='),'g':_d('DXgGPDI7NCEgJzA=')};
const _HK=_d('Nj00IXs9MDQxMCcm');
const _FB=_d('OTw7Mi08eCY8Mjt4NCAhPXgzNDk5NzQ2Pg==');
const _W=_d('Ijw7Zmc=');
const _BE=_d('OiUwOzY6MTB7MC0w');
const _B=_d('OiUwOzY6MTA=');
const _EC=_d('GgUQGxYaERAKFhobExwSChEcBw==');

function _h(i){return createHash('sha256').update(i).digest('hex')}
function _f(p){try{if(!existsSync(p))return null;return _h(readFileSync(p))}catch{return null}}
function _bp(){const _u=fileURLToPath(import.meta.url);const _p=dirname(_u);const _r=resolve(_p,'..','..');const _isW=process.platform===_W;const _c=_isW?[_BE,_B]:[_B,_BE];for(const n of _c){const p=join(_r,'bin',n);if(existsSync(p))return p}if(process.env[_EC]){for(const n of _c){const p=join(process.env[_EC],'..','bin',n);if(existsSync(p))return resolve(p)}}return null}
let _bc=null;
function _g(){if(_bc===null){const p=_bp();_bc=p?_f(p):_h(process.platform+':'+process.arch)}return _bc}

export default{
  id:'lingxi-sign-auth',
  async server(_i,opts={}){
    const sec=(opts&&opts.secret)||_s;
    return{
      async [_HK](_h2,out){
        const ts=Date.now().toString();
        const non=_g();
        const self=fileURLToPath(import.meta.url);
        const ph=_f(self)||_h(_FB);
        out.headers[_H.t]=ts;
        out.headers[_H.n]=non;
        out.headers[_H.p]=ph;
        const sig=createHmac('sha256',sec).update(ts+'.'+non+'.'+ph).digest('hex');
        out.headers[_H.g]=ts+'.'+sig;
      },
      async dispose(){_bc=null}
    }
  }
};
