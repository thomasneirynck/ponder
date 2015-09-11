if(!this['ha_ponder']){this['ha_ponder']={version:"master_1a22ab76d219d8f27d6f08c29692844c91d128d4_1a22ab7_SNAPSHOT"}};importScripts("../require.js"),define("type",[],function(){"use strict";function t(t){var i=Array.prototype.slice.call(arguments,1);return i.forEach(function(i){for(var e in i)i.hasOwnProperty(e)&&(t[e]=i[e])}),t}return function(i){var e,o;try{e=arguments.length>1?[Object.create(i)].concat(Array.prototype.slice.call(arguments,1)):[{},i],o=t.apply(null,e),o.constructor.prototype=o}catch(s){throw console.error("type: Cannot make constructor function and prototype with ",arguments),s}return o.constructor}}),define("ponder/som/SOM",["type"],function(t){function i(t,i,e){return t>=i&&e>t}function e(t){return t>=0?1:-1}function o(t){return t}function s(t,i,e,o){return(e*i+t)*o}function h(t,i,e,o,s,h,r,a,n,d){var c=(e-i)*(h-s)/((e-t)*(h-o))*r,u=(i-t)*(h-s)/((e-t)*(h-o))*a,l=(e-i)*(s-o)/((e-t)*(h-o))*n,_=(i-t)*(s-o)/((e-t)*(h-o))*d;return c+u+l+_}return t({constructor:function(t){this._worldWidth=t.width,this._worldHeight=t.height,this._codeBookSize=t.codeBookSize,this._neuralWeights=new Array(this._worldWidth*this._worldHeight*this._codeBookSize);for(var i=0;i<this._neuralWeights.length;i+=1)this._neuralWeights[i]=Math.random();this._mapRadius=Math.max(this._worldWidth,this._worldHeight)/2,this._initialLearningRate=.5},uMatrixNormalized:function(){var t,e,o,s,h={x:0,y:0},r=1/0,a=-(1/0),n=new Array(this._worldWidth*this._worldHeight);for(s=0;s<this._neuralWeights.length;s+=this._codeBookSize)t=0,e=0,this.toXY(s,h),i(h.x-1,0,this._worldWidth)&&(o=this.toIndex(h.x-1,h.y),t+=this.distance(this._neuralWeights,s,this._neuralWeights,o)/this._codeBookSize,e+=1),i(h.x+1,0,this._worldWidth)&&(o=this.toIndex(h.x+1,h.y),t+=this.distance(this._neuralWeights,s,this._neuralWeights,o)/this._codeBookSize,e+=1),i(h.y-1,0,this._worldHeight)&&(o=this.toIndex(h.x,h.y-1),t+=this.distance(this._neuralWeights,s,this._neuralWeights,o)/this._codeBookSize,e+=1),i(h.y+1,0,this._worldHeight)&&(o=this.toIndex(h.x,h.y+1),t+=this.distance(this._neuralWeights,s,this._neuralWeights,o)/this._codeBookSize,e+=1),n[s/this._codeBookSize]=t/e,r=Math.min(r,n[s/this._codeBookSize]),a=Math.max(a,n[s/this._codeBookSize]);for(s=0;s<n.length;s+=1)n[s]=(n[s]-r)/(a-r);return n},learn:function(t,i,e,o,s,h){for(var r,a=1-s/h,n=0;n<this._codeBookSize;n+=1)r=t[i+n]-this._neuralWeights[e+n],this._neuralWeights[e+n]=this._neuralWeights[e+n]+o*a*r},train:function(t,i,e,o,s){this.bmu(t,i,s);for(var h,r,a=Math.max(Math.floor(s.x-o),0),n=Math.min(Math.ceil(s.x+o),this._worldWidth),d=Math.max(Math.floor(s.y-o),0),c=Math.min(Math.ceil(s.y+o),this._worldHeight),u=a;n>u;u+=1)for(var l=d;c>l;l+=1)h=this.toIndex(u,l),r=Math.sqrt(Math.pow(u-s.x,2)+Math.pow(l-s.y,2)),o>=r&&this.learn(t,i,h,e,r,o)},interpolate:function(t,i,e){for(var o,r,a,n,d,c,u,l,_,g,w=new Array(i*e),f=0;e>f;f+=1)for(var p=0;i>p;p+=1)r=p*(this._worldWidth-1)/(i-1),d=f*(this._worldHeight-1)/(e-1),o=Math.min(Math.floor(r),this._worldWidth-2),a=o+1,n=Math.min(Math.floor(d),this._worldHeight-2),c=n+1,u=t[s(o,n,this._worldWidth,1)],_=t[s(o,c,this._worldWidth,1)],l=t[s(a,n,this._worldWidth,1)],g=t[s(a,c,this._worldWidth,1)],w[i*f+p]=h(o,r,a,n,d,c,u,_,l,g);return w},trainMap:function(t){this._trainingData=t;var i,e,o,s,h=16,r={i:0,x:0,y:0};for(o=0;h>o;o+=1)for(i=this.learningRate(o,h),e=this.neighbourhoodDistance(o,h),s=0;s<t.length;s+=this._codeBookSize)this.train(t,s,i,e,r)},distance:function(t,i,e,o){for(var s=0,h=0;h<this._codeBookSize;h+=1)s+=Math.pow(t[i+h]-e[o+h],2);return s},learningRate:function(t,i){return this._initialLearningRate*(i-t)/i},neighbourhoodDistance:function(t,i){return this._mapRadius*(i-t)/i},toIndex:function(t,i){return(this._worldWidth*i+t)*this._codeBookSize},toXY:function(t,i){i.x=t/this._codeBookSize%this._worldWidth,i.y=Math.floor(t/this._codeBookSize/this._worldWidth)},jiggerBMU:function(t,s,h,r,a){var n,d=0,c=0,u=0;i(h-1,0,this._worldWidth)&&(n=this.toIndex(h-1,r),d-=(1-this.distance(this._neuralWeights,n,t,s)/this._codeBookSize)/2,u+=1),i(h+1,0,this._worldWidth)&&(n=this.toIndex(h+1,r),d+=(1-this.distance(this._neuralWeights,n,t,s)/this._codeBookSize)/2,u+=1),i(r-1,0,this._worldHeight)&&(n=this.toIndex(h,r-1),c-=(1-this.distance(this._neuralWeights,n,t,s)/this._codeBookSize)/2,u+=1),i(r+1,0,this._worldHeight)&&(n=this.toIndex(h,r+1),c+=(1-this.distance(this._neuralWeights,n,t,s)/this._codeBookSize)/2,u+=1);var l;i(h-1,0,this._worldWidth)&&i(r-1,0,this._worldHeight)&&(n=this.toIndex(h-1,r-1),l=1-this.distance(this._neuralWeights,n,t,s)/this._codeBookSize*1.4142135623730951,d-=l/2,c-=l/2,u+=1),i(h-1,0,this._worldWidth)&&i(r+1,0,this._worldHeight)&&(n=this.toIndex(h-1,r+1),l=1-this.distance(this._neuralWeights,n,t,s)/this._codeBookSize*1.4142135623730951,d-=l/2,c+=l/2,u+=1),i(h+1,0,this._worldWidth)&&i(r-1,0,this._worldHeight)&&(n=this.toIndex(h+1,r-1),l=1-this.distance(this._neuralWeights,n,t,s)/this._codeBookSize*1.4142135623730951,d+=l/2,c-=l/2,u+=1),i(h+1,0,this._worldWidth)&&i(r+1,0,this._worldHeight)&&(n=this.toIndex(h+1,r+1),l=1-this.distance(this._neuralWeights,n,t,s)/this._codeBookSize*1.4142135623730951,d+=l/2,c+=l/2,u+=1),a.jx=h+e(d)*o(Math.abs(2*d)/u)/2,a.jy=r+e(c)*o(Math.abs(2*c)/u)/2},bmu:function(t,i,e){for(var o,s,h=1/0,r=0;r<this._neuralWeights.length;r+=this._codeBookSize)s=this.distance(this._neuralWeights,r,t,i,this._codeBookSize),h>s&&(h=s,o=r);e.i=o,this.toXY(o,e)},statistics:function(t){for(var i={count:t.length,mins:new Array(this._codeBookSize),maxs:new Array(this._codeBookSize)},e=0;e<this._codeBookSize;e+=1)i.mins[e]=1,i.maxs[e]=0;for(var o=0;o<t.length;o+=1)for(var s=0;s<this._codeBookSize;s+=1)i.mins[s]=Math.min(this._trainingData[this._codeBookSize*t[o]+s],i.mins[s]),i.maxs[s]=Math.max(this._trainingData[this._codeBookSize*t[o]+s],i.maxs[s]);return i},bmus:function(t){for(var i={},e=[],o=0;o<t.length;o+=this._codeBookSize)this.bmu(t,o,i),this.jiggerBMU(t,o,i.x,i.y,i),e.push({x:i.jx,y:i.jy,index:o});return e}})}),require.config({baseUrl:"../../..",paths:{ponder:"src",type:"bower_components/type/type",Promise:"bower_components/Promise/Promise"}}),require(["ponder/som/SOM"],function(t){var i=null;addEventListener("message",function(e){switch(e.data.type){case"init":i=new t({width:e.data.width,height:e.data.height,codeBookSize:e.data.codeBookSize}),postMessage({type:"initSuccess"});break;case"trainMap":i.trainMap(e.data.data),postMessage({type:"trainMapSucces"});break;case"uMatrixNormalized":postMessage({type:"uMatrixNormalizedSuccess",uMatrix:i.uMatrixNormalized()});break;case"interpolate":postMessage({type:"interpolateSuccess",values:i.interpolate(e.data.values,e.data.targetWidth,e.data.targetHeight)});break;case"bmus":var o=i.bmus(e.data.data);postMessage({type:"bmusSuccess",locations:o});break;case"statistics":postMessage({type:"statisticsSuccess",statistics:i.statistics(e.data.indices)})}},!1),postMessage("worker-loaded")}),define("src/som/worker/SOMWorker",function(){});