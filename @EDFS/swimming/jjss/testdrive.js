﻿//******************************************************************************
//	name:	SGM Buick testdrive 1.7.6
//	author:	wally
//	email:	wally.he@hylinkad.com
//	date:	2015-06-27
//	description: 封装试驾接口，方便调用前端程序调用。
//				根据mobile定义ga userId唯一值；testdrive.aspx接口异常捕捉到GA.
//				获取URL后的utm参数，并保存在cookie (utmc_buick), cookie保存时长为30天
//				v1.1 增加hylink.testdrive2()方法
//				v1.2 对decodeURI方法进行了try catch判断, 避免因为url不正确无法执行接下来的js
//				v1.3 增加域名判断, 避免因为chevy与buick搞错
//				v1.4 N/A
//				v1.5 cookie域名不再限制于buick.com.cn, 可写入其它域名, 方便跨域提交接口
//				v1.6 记录最后提交试驾的车型于cookie user_chevy testdrive_car, 提供saveUserData与readUserData两个方法,暂时没开出来
//				v1.7 增加carCnNameMap()与carCnNameMap()两方法, 暂时没开出来.
//				v1.7.1 增加威朗两厢
//				v1.7.2 增加全新一代君越
//				v1.7.3 _onSuccess方法里的两行代码调整顺序
//				v1.7.4 把setCookie与getCookie暴露在hylink里.
//				v1.7.5 可定义isdown参数
//				v1.7.6 getQueryString方法换了代码, 及暴露unserialize方法
//				v.17.7 增加威朗三厢车型
//
//				提供的方法如下：
//				1. hylink.setTestdriveApiPath(path, name);
//					@description 定义试驾接口的路径与名称
//					@param path 提交的url地址，默认为当前项目目录下，如果提交的地址不是当前目录，可重新定义此url
//					@param name [option] 提交的url名称，默认为testdrive.aspx, 一般不需要重新定义。
//					@example hylink.setTestdriveApiPath("../"); hylink.setTestdriveApiPath("", "testdrive-2.aspx");
//				
//				2. hylink.setTestdriveClickEvent(mzClick, gaCatalog, gaAction, gaLabel);
//					@description 当点击提交button时，触发此监测事件代码。
//					@param mzClick 秒针名称
//					@param gaCatalog GA Event catalog
//					@param gaAction GA Event action 一般为 click 或 点击
//					@param gaLabel GA Event label 一般为 申请试驾 或 预约试驾
//					@example hylink.setTestdriveClickEvent("Mobile端-全系促销金牌销售-预约试驾页-提交", "预约试驾页", "点击", "提交");
//
//
//
//				3. hylink.setTestdriveSuccessPV(mzPv, gaPv);
//					@description 当提交数据成功后，触发此监测事件代码。
//					@param mzPv 申请成功秒针PV名称
//					@param gaPv [option] GA Pageview 名称， 一般不用定义，用默认值/testdrive-success
//					@example hylink.setTestdriveSuccessPV("Mobile端-全系促销金牌销售-预约试驾页-预约成功-知道了");
//
//
//
//				4. hylink.testdrive(callbackFn, name, mobile, car, buyPlan, exParams);
//					@description 提交（申请）试驾数据。
//					@param callbackFn 可为Function类型或Object类型，如果为Function类型，当提交接口时，200成功或500，404错误都会调用此callbackFn，如果为Object类型，则有两属性，beforeSubmitFn与completeFn,具体说明看demo
//					@param name 姓名，长度不能超过50位
//					@param mobile 11位手机号码，可以通过hylink.checkMobile(number)来校验手机号码是否正确
//					@param car [option] 车型，必须指定的字串，限定:{}
//					@param buyPlan [option] 意向购车时间，必须是指定的字串，限定:{三个月内，三到六个月，六到十二个月}
//					@param exParams [option] 可为String或Object类型，如果为String, 则表示为经销商名称，如为Object对象，表示其它额外可提交到后台的数据，{}
//					@return 如果执行执行成功，返回true，如果因为参数不正确或其它原因中止，返回false
//					@example hylink.testdrive(function(data){
//												if(data.status=="suc"){console.log("success")}else{console.log("fail")}
//											}, "王测试", "19461041344", "迈锐宝");
//
//
//				4.1 hylink.testdrive2(callbackFn, serializedString);
//					@description 提交（申请）试驾数据。
//					@param callbackFn 可为Function类型或Object类型，如果为Function类型，当提交接口时，200成功或500，404错误都会调用此callbackFn，如果为Object类型，则有两属性，beforeSubmitFn与completeFn,具体说明看demo
//					@param serializedString jquery 提交数据序列化
//					@return 如果执行执行成功，返回true，如果因为参数不正确或其它原因中止，返回false
//					@example hylink.testdrive2(function(data){
//												if(data.status=="suc"){console.log("success")}else{console.log("fail")}
//											}, $(this).serialize());
//
//
//				5. hylink.checkMobile(mobile);
//					@description 检测手机号码正确性
//					@param mobile 手机号码
//					@return 如果手机号码正确, 返回true
//					@example hylink.checkMobile("19477667773");
//
//
//
//				6. hylink.getQueryString(name, url);
//					@description 根据名称拿到Query String
//					@param name 名称
//					@return 参数name对应的值
//					@example hylink.getQueryString("utm_source");
//
//
//				7. hylink.readUserData();
//					@description 读取cookie中的user_chevy, 并返回object
//					@return object
//					@example hylink.readUserData();
//******************************************************************************


window.hylink = window.hylink || {};
	
(function (hy, $jq) {
	if((location.hostname=="localhost" && location.hostname=="127.0.0.1" && location.hostname.indexOf("192.168.")!=0) &&
		location.hostname.indexOf('buick.com.cn')==-1)	
		alert('调用[别克]"testdrive.js"的域名不正确, 当前域名是:['+location.hostname+']');

	var _apiName = "ajaxget.aspx ";
	var _apiPath = "";
	var _mzPV = null;
	var _gaPV = "/testdrive-success";
	var _mzClick = null;
	var _gaCatalog = null;
	var _gaAction = null;
	var _gaLabel = null;
	var _isSubmit = false;//是否在提交中....

	

	function testdrive(callbackFn, name, mobile, car, buyPlan, exParams){
		if(name==null || name==""){alert("姓名不能为空");return;}
		if(mobile==null || mobile==""){alert("手机不能为空");return;}
		var paramObj = _parseParamObj({name:name, mobile:mobile, car:car, buyPlan:buyPlan}, exParams);
		
		var completeFn = function(data){return false;};
		var beforeSubmitFn = function(param){return false;};
		if(typeof callbackFn=="function"){
			completeFn = callbackFn;
		}else if(callbackFn!=null && typeof callbackFn == "object"){
			if(typeof callbackFn["completeFn"]=="function"){
				completeFn	=	callbackFn["completeFn"];
			}
			if(typeof callbackFn["beforeSubmitFn"]=="function"){
				beforeSubmitFn	=	callbackFn["beforeSubmitFn"];
			}
		}

		if(beforeSubmitFn(paramObj))	return false;//返回false时，继续以下代码，否则中止以下代码
		if(paramObj._ok_!==true)	return false;
		if(window.ga!=null && typeof ga=="function")	ga('set', 'userId', parseInt(mobile).toString(36));//定义userId, 用于跨屏跟踪
		
		if(hylink.trackEvent) hylink.trackEvent(_mzClick, _gaCatalog, _gaAction, _gaLabel);

		if(_isSubmit)	return false;	_isSubmit = true;
		delete paramObj._ok_;
		//_calljQueryAjax(paramObj, completeFn);

		_callAjax(paramObj, completeFn);

		return true;
	}

	function testdrive2(callbackFn, serializedString){
		var serObj = unserialize(serializedString);

		return testdrive(callbackFn, serObj.realname, serObj.mobile, serObj.trycar, serObj.buyplan, serObj);
	}

	function setApiPath(path, name){
		if(path!=null){
			_apiPath 	= 	path;//default value ""
		}
		if(name!=null){
			_apiName	=	name;//default value testdrive.aspx
		}
	}

	function setClickEvent(mzClick, gaCatalog, gaAction, gaLabel){
		if(mzClick!=null){
			_mzClick	=	mzClick;//default value null
		}
		if(gaLabel!=null){
			_gaCatalog	=	gaCatalog;//default value null
			_gaAction	=	gaAction;//default value null
			_gaLabel	=	gaLabel;//default value null
		}
	}

	function setSuccessPV(mzPv, gaPv){
		if(mzPv!=null){
			_mzPV	=	mzPv;//default value null
		}
		if(gaPv!=null){
			_gaPV	=	gaPv;//default value /testdrive-success
		}
	}

	function _init(){
		//if($jq==null){//需要jquery支持，暂且先这样，之后会修改为不需要依赖jquery方式来提交
			//alert("need jQuery");return;
		//}

		var s = location.search;
		if(s.indexOf("?")==0)	s = s.substr(1);
		var qsNewObj = unserialize(s) || {};
		var qsOldObj = unserialize(_getCookie("utmc_buick")) || {};
		var utmNames = ["utm_source", "utm_campaign", "utm_medium", "utm_term", "utm_content"];
		
		for(var i=0;i<utmNames.length;i++){
			var qsNewName = qsNewObj[utmNames[i]];
			if(!!qsNewName){
				qsOldObj[utmNames[i]] = qsNewName;
			}
		}
		
		_setCookie("utmc_buick", serialize(qsOldObj), 30);//保存30天
	}
	//通过内置的httprequest来提交数据
	function _callAjax(paramObj, completeFn){
		_loadRequest(_apiPath+_apiName, paramObj, function(xhr){
				if(xhr.status === 200) {//OK
					var data;
					if(window.JSON && JSON.parse){
						data = JSON.parse(xhr.responseText);
					}else{
						data = (new Function("return " + xhr.responseText))();
					}
					_onSuccess(paramObj, data, completeFn);
				}else{//error
					_onError(paramObj, xhr, completeFn);
				}
			});
	}
	//通过jquery来调用post， 这里并没使用此方式
	function _calljQueryAjax(paramObj, completeFn){
		$jq.post(_apiPath + _apiName, paramObj, 
			function(data){
				_onSuccess(paramObj, data, completeFn);
			}, "json").error(function(errObj){
					_onError(paramObj, errObj, completeFn);
				});
	}

	function _onSuccess(paramObj, data, completeFn){
		_isSubmit = false;
		data.leadId = data.leadId ? data.leadId : data.msg;
		var cbResult = completeFn(data);
		if(!cbResult && data.status=="suc"){//当_completeFn返回值为false时，会执行以下代码，当返回值为true时，跳过以下代码执行
			if(_mzPV==null || _mzPV==""){if(window.console || window.console.warn) console.warn("mzPV没有定义");}
			if(hylink.trackPV){
            	if(data.leadId!="") hylink.trackLeads(paramObj.realname, paramObj.mobile, data.leadId, paramObj);
            	hylink.trackPV(_mzPV, _gaPV);
            }
            _saveTestdriveUserData(paramObj.trycar);
		}
	}

	function _onError(paramObj, data, callbackFn){
		_isSubmit = false;
		if(window.ga!=null && typeof ga=="function")
			ga('send', 'exception', {
									  'exDescription': location.href,
									  'exFatal': true,
									  'appName': _apiName,
									  'appVersion': 'status:'+data.status
									});
		var cbResult = callbackFn({status:"err", statusCode:data.status, statusText:data.statusText, responseText:data.responseText});
		if(!cbResult){//当_completeFn返回值为false时，会执行以下代码，当返回值为true时，跳过以下代码执行
			//TODO, 这里应调用另一个备选接口，只简单地把数据保存下来。
			//_loadRequest("http://www.buick.com.cn/buick-api/testdrive-log.aspx",paramObj, function(){});
		}
	}

	//代码jQuery.post方法
	function _loadRequest(url, paramObj, callback) {
        var xhr;
        if(typeof XMLHttpRequest !== 'undefined') xhr = new XMLHttpRequest();
        else {
            var versions = ["MSXML2.XmlHttp.5.0", 
                            "MSXML2.XmlHttp.4.0",
                            "MSXML2.XmlHttp.3.0", 
                            "MSXML2.XmlHttp.2.0",
                            "Microsoft.XmlHttp"];
 
             for(var i = 0, len = versions.length; i < len; i++) {
                try {
                    xhr = new ActiveXObject(versions[i]); break;
                } catch(e){}
             } // end for
        }
         
        xhr.onreadystatechange = function () {
            if(xhr.readyState === 4) {
                callback(xhr);
            }
        }

        xhr.open('POST', url, true);
        xhr.setRequestHeader("Accept","application/json, text/javascript, */*; q=0.01");
        xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
        xhr.send(_urlEncode(paramObj));
    }

	function _parseParamObj(value, exParams){
		var obj = {_ok_:true};
		if(typeof(exParams)=="string"){
			obj.dealer	=	_trim(value.dealer);
		}else if(exParams!=null && typeof(exParams)=="object"){
			var params = ["dealer", "channelsource", "province", "city"];
			for(var i=0,len=params.length;i<len;i++){
				var param = params[i];
				if(exParams[param]!=null) obj[param] = _trim(exParams[param]);
			}
			obj.isdown = exParams.isdown==0 ? 0 : 1;//isdown: 是否下发? 1是下发(默认), 0是不下发
			var params = ["source", "campaign", "medium", "term", "content"];
			for(var i=0,len=params.length;i<len;i++){
				var param = params[i];
				if(exParams[param]!=null) obj["utm_"+param] = _trim(exParams[param]);
			}
		}


		if(obj.dealer!=null && obj.dealer!=""){ 
			if(obj.dealer.indexOf("SJ")!=0){
				alert("经销商code不正确【"+obj.dealer+"】");
				obj._ok_ = false;
			}else if(obj.car==""){
				alert("车型不能为空");
				obj._ok_ = false;
			}else if(obj.buyPlan==""){
				alert("意向购车时间不能为空");
				obj._ok_ = false;
			}
		}

		obj.realname = _trim(value.name);
		obj.mobile = _trim(value.mobile);
		obj.trycar = _trim(value.car);
		obj.buyplan = _trim(value.buyPlan);
		
		if(obj.trycar!=null && obj.trycar!=""){
			if(obj.trycar=="全新君威")	obj.trycar="君威";
			else if(obj.trycar=="威朗三厢")	obj.trycar="威朗";
				
			if(carList(obj.trycar)==null){
				obj._ok_ = false;
				alert("车型不正确: 【"+obj.trycar+"】");
			}
		}
		
		if(obj.buyPlan!=null && obj.buyPlan!=""){
			if({"三个月内":3,"三到六个月":6,"六到十二个月":12}[obj.buyPlan]==null){
				obj._ok_ = false;
				alert("意向购车时间: 【"+obj.buyPlan+"】");
			}
		}

		
		var httpArr = _apiPath.split("://");
		var http1 = httpArr[1];
		if(http1!=null){
			var domain = http1.split("/")[0];
			if(domain!=document.domain){//跨域提交，cookie不会跟随。
				var utmcBuick = _getCookie("utmc_buick");//所以要把cookie的utm值取了出来当参数提交出去。
				if(utmcBuick!=null){//当跨域提交时，服务器接口需要定义header [Access-Control-Allow-Origin:*]
					var utmArr = utmcBuick.split("&");
					var utmNames = ["source", "campaign", "medium", "term", "content"];
					var utmObj = {};
					for(var i=0,len=utmArr.length;i<len;i++){
						var nv = utmArr[i];
						var nvArr = nv.split("=");
						utmObj[nvArr[0]] = nvArr[1];
					}

					for(var i=0,len=utmNames.length;i<len;i++){
						var utmName = "utm_"+utmNames[i];
						if(obj[utmName]==null || obj[utmName]==""){
							obj[utmName] = utmObj[utmName];
						}
					}
				}
			}
		}
		
		obj.isopen = 1;//是否正式, 无用
		//obj.isdown = 1;//是否下发
		obj.type = 'postinfo';//only for buick
		return obj;
	}

	function _trim(value){
		if(typeof(value)=="number")	return value;
		return value ? value.replace(/(^\s*)|(\s*$)/g, "") : "";
	}

	function serialize(qsOldObj){
		var s = "";
		for(var prop in qsOldObj){
			if(prop==null || prop=="") continue;
			s += prop+"="+qsOldObj[prop]+"&";
		}
		return s.substr(0, s.length-1);
	}

	function unserialize(serializedString){
		if(!serializedString)	return null;
		var str = '';
		try{
			str = decodeURI(serializedString);
		}catch(err){
			if(window.console && window.console.error)	console.error(err);
			return {};
		}
		var pairs = str.split('&');
		var obj = {}, p, idx, val;
		for (var i=0, n=pairs.length; i < n; i++) {
			p = pairs[i].split('=');
			idx = p[0];
 
			if (idx.indexOf("[]") == (idx.length - 2)) {
				// Eh um vetor
				var ind = idx.substring(0, idx.length-2)
				if (obj[ind] === undefined) {
					obj[ind] = [];
				}
				obj[ind].push(p[1]);
			}
			else {
				obj[idx] = p[1];
			}
		}
		return obj;
	}

	function _saveTestdriveUserData(value){
		var car = carList(value);
		if(car){
			_saveUserData("testdrive_car", car);
		}
	}

	function _saveUserData(name, value){
		if(value==null || value=="")	return;
		var user = _readUserData();
		user = user ? user : {};
		user[name] = value;

		_setCookie("user_buick", serialize(user),30);
	}

	function _readUserData(){
		var user =  _getCookie("user_buick");
		if(user==null || user=="" || user.indexOf("=")==-1){
			return {};
		}else{
			return unserialize(user);
		}
	}

	/*function _loadJquery(){
		var c = document.createElement('script');
	    c.type = 'text/javascript';
	    c.async = true;
	    c.charset = 'utf-8';
	    c.src = 'http://libs.baidu.com/jquery/'+(window.addEventListener||(document.documentMode>=9)?'2.1.1':'1.11.1')+'/jquery.min.js';
	    var h = document.getElementsByTagName('script')[0];
	    h.parentNode.insertBefore(c, h);
	}*/

	function checkMobile (m){
	    return /^0?1[3|5|7|8][0-9]\d{8}$/.test(m) ? true : /^0?194\d{8}$/.test(m);
	};


	function carList(value){
		var obj =   {"昂科雷":"enclave","昂科威":"envison", "昂科拉":"encore", "GL8商务车":"gl8", "全新君越":"lacrosse", "全新一代君越":"lacrosse",
					"全新君威":"newregal", "君威":"regal","威朗":"verano", "威朗两厢":"veranogs","威朗三厢":"verano",
			"全新英朗":"excellegt", "英朗 XT":"excellext", "凯越":"excelle", "林荫大道":"parkavenue"};
		if(value!=null && typeof(value)=="string" && value!=""){
			return obj[value];
		}else if(arguments.length==0){
			return obj;
		}
		return null;
	}

	function _carEnNameMap(value){
		var obj =  {"昂科雷":"enclave","昂科威":"envison", "昂科拉":"encore", "GL8商务车":"gl8", "全新君越":"lacrosse", "全新一代君越":"lacrosse", 
			"全新君威":"newregal", "君威":"regal","威朗":"verano", "威朗两厢":"veranogs","威朗三厢":"verano","全新英朗":"excellegt", "英朗 XT":"excellext", "凯越":"excelle"};
		if(value!=null && typeof(value)=="string" && value!=""){
			return obj[value];
		}else if(arguments.length==0){
			return obj;
		}
		return null;
	}

	function _carCnNameMap(value){
		var obj = {"enclave":"昂科雷","envison":"昂科威","encore":"昂科拉","gl8":"GL8商务车","lacrosse":"全新君越","lacrosse":"全新一代君越",
				"newregal":"全新君威","regal":"君威","verano":"威朗三厢","veranogs":"威朗两厢","excellegt":"全新英朗","excellext":"英朗 XT","excelle":"凯越"};
		if(value!=null && typeof(value)=="string" && value!=""){
			return obj[value];
		}else if(arguments.length==0){
			return obj;
		}
		return null;
	}

	function getQueryString(name, url){ 
	    if (!url) url = window.location.search;
	    name = name.replace(/[\[\]]/g, "\\$&");
	    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	        results = regex.exec(url);
	    if (!results) return null;
	    if (!results[2]) return '';
	    return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    function _setCookie(name,value,expiredays) {  
        var exdate = new Date();
        //if(expiredays==null) {expiredays = 0;}
        if(typeof expiredays =="number")	exdate.setDate(exdate.getDate() + expiredays);
        
        document.cookie=name+ "=" +value+((expiredays==null) ? "" : ";expires="+exdate.toGMTString())+
        	";path=/;"+(location.hostname.indexOf("buick.com.cn")!=-1 ? "domain=buick.com.cn" : "");
        //console.log(name, value, expiredays)
    }

    function _getCookie(name){
	    var result = null;
	    //对cookie信息进行相应的处理，方便搜索
	    var myCookie = ""+document.cookie+";"; 
	    var searchName = ""+name+"=";
	    var startOfCookie = myCookie.indexOf(searchName);
	    var endOfCookie;
	    if(startOfCookie != -1){
	        startOfCookie += searchName.length;
	        endOfCookie = myCookie.indexOf(";",startOfCookie);
	        result = (myCookie.substring(startOfCookie,endOfCookie));
	    }
	    return result;
	 }

    function _urlEncode (param, key) {
	  if(param==null) return '';
	  var paramStr = '';
	  var t = typeof (param);
	  if (t == 'string' || t == 'number' || t == 'boolean') {
	    paramStr += '&' + key + '=' +  encodeURIComponent(param);
	  } else {
	    for (var i in param) {
	      var k = key == null ? i : key + (param instanceof Array ? '[' + i + ']' : '.' + i);
	      paramStr += _urlEncode(param[i], k);
	    }
	  }
	  return paramStr;
	};

    _init();

	hy.setTestdriveApiPath = setApiPath;
	hy.setTestdriveClickEvent = setClickEvent;
	hy.setTestdriveSuccessPV = setSuccessPV;
	hy.checkMobile = checkMobile;
	hy.getQueryString = getQueryString;
	hy.unserialize = unserialize;
	hy.carList = carList;
	hy.setCookie = _setCookie;
	hy.getCookie = _getCookie;
	hy.saveUserData = _saveUserData;
	hy.readUserData = _readUserData;
	hy.carCnNameMap = _carCnNameMap;
	hy.carEnNameMap = _carEnNameMap;//暂时不开放出来
	hy.testdrive = testdrive;
	hy.testdrive2 = testdrive2;
})(window.hylink, window.$);
/*

*/
