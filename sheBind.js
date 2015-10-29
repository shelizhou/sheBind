/**
 * name : sheBind
 * Description : 数据 双向绑定
 * createtime: 2014-12-08
 * version: 0.1
 * author: she
 */

;(function(undefined) {
    
    "use strict";

    var Observe = function () {
        var result = {},
            handlers = {},
            _v;

        function changeKey(name, v){
            if (_v[name] !== v ) {
                _v[name] = v;
                fire("change", name, v);
            }
            return result;
        }

        result.on = function(type, handler) {
            if (typeof handlers[type] == 'undefined') {
                handlers[type] = [];
            }
            handlers[type].push(handler);

            return result;
        };

        function fire(type) {
            var data = Array.prototype.slice.call(arguments, 1);
            if (handlers[type] instanceof Array) {
                var handl = handlers[type];
                for (var i = 0, len = handl.length; i < len; i++) {
                    handl[i].apply(result, data);
                }
            }
            return result;
        };

        result.creat = function(v) {
            _v = v;
            return result;
        }

        result.change = function(o, val) {
            if (typeof o === "object") {
                for( var key in o ) {
                    if (!o.hasOwnProperty[key]) {
                        if (_v[key] !== o[key]) {
                            changeKey(key, o[key]);
                        }
                    }
                }
            } else {
                changeKey(o, val);
            }
        }


        result.addArray = function(name, v) {
            _v[name] = _v[name] || [];
            _v[name].push(v);
            fire("addArray", name, v);
            return result;
        }

        return result;
    }


    var sheBind = function(obj) {
        // 返回对象
        if (!(this instanceof sheBind)) {
            return new sheBind(obj);
        }

        if (!obj.el) return;
        obj.data = obj.data || {};
        var result = this,
            _this = this,
            data = new Observe().creat(obj.data),
            allDom = {},
            wrapSel = typeof obj.el === "string" ? document.querySelector(obj.el) : obj.el,

            // 单个值
            modelArr = Array.prototype.slice.call(wrapSel.querySelectorAll("[v-model]")),

            // 模板引擎
            repeatArr = Array.prototype.slice.call(wrapSel.querySelectorAll("[v-template]")),

            nowInputDom = null,
            tmpl = function(html, data) {
                var result="var p=[];with(obj){p.push('"
                    +html.replace(/[\r\n\t]/g," ")
                    .replace(/<%=(.*?)%>/g,"');p.push($1);p.push('")
                    .replace(/<%/g,"');")
                    .replace(/%>/g,"p.push('")
                    +"');}return p.join('');";

                var fn = new Function(["obj", "_help"],result);
                return fn(data, _this.help);
            },

            // 设置返回的dom，兼容jQuery
            setAllDom = function(key, sel){
                if (!allDom[key]) {
                    if (typeof $ !== "undefined") {
                        allDom[key] = $(sel);
                    } else {
                        allDom[key] = [sel];
                    }
                } else {
                    if (typeof $ !== "undefined") {
                        allDom[key] = allDom[key].add($(sel));
                    } else {
                        allDom[key].push(sel);
                    }
                }
            },
            setRepeat = function(s) {
                var name = s["_name"],
                    tempHtml = s["_tempHtml"];
                s.innerHTML = tmpl(tempHtml, {_v: obj.data[name] || []});
            },
            setModel = function(s, val) {
                if (typeof val === "undefined") return;
                if (s === nowInputDom) {
                    nowInputDom = null;
                    return;
                }
                if (s.nodeName === "INPUT") {
                    if ( s.type === "text" ) {
                        s.value = val;
                    } else if ( s.type === "radio") {
                        if (s.value === val) {
                            s.setAttribute("checked", "checked");
                        } else {
                            s.removeAttribute("checked");
                        }
                    } else if ( s.type === "checkbox" ) {
                        if (val.split(",").some(function(v){ return v === s.value; })) {
                            s.setAttribute("checked", "checked");
                        } else {
                            s.removeAttribute("checked");
                        }
                    }
                } else if (s.nodeName === "SELECT"){
                    Array.prototype.slice.call(s.childNodes).forEach(function(opt){
                        if (opt.value === val) {
                            s.selectedIndex = opt.index;
                        }
                    });
                } else if (s.nodeName === "TEXTAREA"){
                    s.value = val;
                } else {
                    s.innerHTML = val;
                }
            },
            fnChange = function(name, val) {
                modelArr.forEach(function(s){
                    if (s["_name"] === name){
                        setModel(s, val);
                    }
                });
                repeatArr.forEach(function(s){
                    if (s["_name"] === name){
                        setRepeat(s);
                    }
                });
            };

        
        data.on("change", function(name, val){
            fnChange(name, val);
        });
        data.on("addArray", function(name, val){
            repeatArr.forEach(function(s){
                if (s["_name"] === name){
                    s.innerHTML += tmpl(s["_tempHtml"], {_v: [val]});
                }
            });
        });


        modelArr.forEach(function(s){
            var name = s.getAttribute("v-model");
            s["_name"] = name;
            setAllDom(name, s);
            setModel(s, obj.data[name]);

            if (s.nodeName === "INPUT") {
                if ( s.type === "text") {
                    s.addEventListener("input", function(){
                        nowInputDom = s;
                        data.change(name, s.value);
                        // obj.data[name] = s.value;
                    });
                } else if (s.type === "radio") {
                    s.addEventListener("change", function(){
                        nowInputDom = s;
                        data.change(name, s.value);
                        // obj.data[name] = s.value;
                    });
                } else if ( s.type === "checkbox" ) {
                    s.addEventListener("change", function(){
                        // console.dir(s)
                        nowInputDom = s;
                        if ( s.getAttribute("checked") ) {
                            s.removeAttribute("checked");
                            var arr = (obj.data[name] !== "" ? obj.data[name].split(",") : []).filter(function(v){ return v !== s.value; });
                            // obj.data[name] = (arr.length > 0 ) ? arr.join(",") : "";
                            data.change(name, (arr.length > 0 ) ? arr.join(",") : "");

                        } else {
                            s.setAttribute("checked", "checked");
                            var arr = (obj.data[name] !== "") ? obj.data[name].split(",") : [];
                            arr.push(s.value);
                            // obj.data[name] = (arr.length > 0 ) ? arr.join(",") : "";
                            data.change(name, (arr.length > 0 ) ? arr.join(",") : "");
                        }
                    });
                }
            } else if (s.nodeName === "TEXTAREA"){
                s.addEventListener("input", function(){
                    nowInputDom = s;
                    data.change(name, s.value);
                    // obj.data[name] = s.value;
                });
            } else if (s.nodeName === "SELECT"){
                s.addEventListener("change", function(){
                    nowInputDom = s;
                    data.change(name, s.value);
                    // obj.data[name] = s.value;
                });
            }
        });

        repeatArr.forEach(function(s){
            s["_name"] = s.getAttribute("v-template");
            s["_tempHtml"] = s.querySelector("script").innerHTML;
            setAllDom(s["_name"], s);
            setRepeat(s);

        });

        result.change = data.change;
        result.addArray = data.addArray;
        result.data = obj.data;
        result.dom = allDom;

        return result;
    };

    // 方法
    sheBind.prototype.help = {};
    sheBind.prototype.onHelp = function(name, fn) {
        // if (!this.help[name]) {
            this.help[name] = fn;
        // }
    }

    // 检测上下文环境是否为 AMD 或者 CMD   
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(function() {
            return sheBind;
        });

    // 检查上下文是否为 node
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = sheBind;
        
    } else {
        window.sheBind = sheBind;
    }

})();