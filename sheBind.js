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

        result.change = function(o) {
            for( var key in o ) {
                if (!o.hasOwnProperty[key]) {
                    if (_v[key] !== o[key]) {
                        result.changeKey(key, o[key]);
                    }
                }
            }
        }

        result.changeKey = function(name, v){
            if (_v[name] !== v ) {
                _v[name] = v;
                fire("change", name, v);
            }

            return result;
        }

        return result;
    }

    var sheBind = function(obj) {
        // 返回对象
        if (!(this instanceof sheBind)) {
            return new sheBind(obj);
        }

        var result = {
                data : {}
            },
            wrapSel = document.querySelector(obj.el),
            modelArr = Array.prototype.slice.call(wrapSel.querySelectorAll("[v-model]")),
            repeatArr = Array.prototype.slice.call(wrapSel.querySelectorAll("[v-repeat]")),
            nowInputDom = null,
            setRepeat = function(s) {
                var name = s["_name"],
                    tempHtml = s["_tempHtml"],
                    html = "";
                obj.data[name].forEach(function(v){
                    var k = {v : v};
                    html += tempHtml.replace(/\{(.+)\}/g, function(all, $1){
                        var mi = $1, vi = k;
                        mi.split(".").forEach(function(m){
                            vi = vi[m];
                        })
                        return vi || "";
                    });
                });
                s.innerHTML = html;
            },
            setModel = function(s, val) {
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

        // Object.observe(obj.data, function(changes) {
        //     console.log(changes);
        //     changes.forEach(function(v){
        //         fnChange(v.name, v.object[v.name]);
        //     });
        // });
        result.data = new Observe().creat(obj.data).on("change", function(name, val){
            fnChange(name, val);
        });


        modelArr.forEach(function(s){
            var name = s.getAttribute("v-model");
            s["_name"] = name;
            s["_type"] = "model";
            setModel(s, obj.data[name]);

            if (s.nodeName === "INPUT") {
                if ( s.type === "text") {
                    s.addEventListener("input", function(){
                        nowInputDom = s;
                        result.data.changeKey(name, s.value);
                        // obj.data[name] = s.value;
                    });
                } else if (s.type === "radio") {
                    s.addEventListener("change", function(){
                        nowInputDom = s;
                        result.data.changeKey(name, s.value);
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
                            result.data.changeKey(name, (arr.length > 0 ) ? arr.join(",") : "");

                        } else {
                            s.setAttribute("checked", "checked");
                            var arr = (obj.data[name] !== "") ? obj.data[name].split(",") : [];
                            arr.push(s.value);
                            // obj.data[name] = (arr.length > 0 ) ? arr.join(",") : "";
                            result.data.changeKey(name, (arr.length > 0 ) ? arr.join(",") : "");
                        }
                    });
                }
            } else if (s.nodeName === "TEXTAREA"){
                s.addEventListener("input", function(){
                    nowInputDom = s;
                    result.data.changeKey(name, s.value);
                    // obj.data[name] = s.value;
                });
            } else if (s.nodeName === "SELECT"){
                s.addEventListener("change", function(){
                    nowInputDom = s;
                    result.data.changeKey(name, s.value);
                    // obj.data[name] = s.value;
                });
            }
        });

        repeatArr.forEach(function(s){
            s["_name"] = s.getAttribute("v-repeat");
            s["_tempHtml"] = s.querySelector("script").innerHTML;
            s["_type"] = "repeat";

            setRepeat(s);

        });


        return result;
    };



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