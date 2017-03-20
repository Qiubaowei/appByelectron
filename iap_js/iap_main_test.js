var path       = require('path');
var SerialPort = require("serialport");
var fs         = require('fs');
var async      = require('async');
var events     = require("events");

var pathStr1 = path.join(__dirname, "/iap_js/dataproc_test.js");
var pathStr2 = path.join(__dirname, "/iap_js/lib.js");
var dataProcess  = require(pathStr1).dataProcess;
var bufferConcat = require(pathStr2).bufferConcat
var unCompressCan   = require(pathStr2).unCompressCan;
var appendFile   = require(pathStr1).appendFile;


var serial   = document.getElementById('port');
var baudrate = document.getElementById('baudrate');
var progress = document.getElementById('progress');


var button_connect    = document.getElementById('connect');
var button_disconnect = document.getElementById('disconnect');
var button_download   = document.getElementById('saveAll');

global.emitter = new events.EventEmitter();//创建了事件监听器的一个对象
global.port    = null;
global.updown  = null;
global.suffix  = null;

button_connect.onclick    = createConnect;
button_disconnect.onclick = closeConnect;

button_disconnect.disabled = true;

if (button_download)
{
    button_download.onclick = saveAll;
}

//节点扫描
function nodeScan() {

}

// 串口初始化
SerialPort.list(function (err, ports) {
    ports.forEach(function(port) {
        var option = document.createElement("option");
        option.text = port.comName + "  " + port.locationId;
        option.value = port.comName;
        try{
            // 对于更早的版本IE8
            serial.add(option,x.options[null]);
        }catch (e){
            serial.add(option,null);
        }

        console.log(port.comName);
        console.log(port.pnpId);
        console.log(port.manufacturer);
        console.log(port.locationId);
    });
});

emitter.on("re_connect", function(){
    port.close();
    setTimeout(function () {
        createConnect();
    }, 1000)
});

emitter.on("connectAfterUpdate", function (isMusic) {
    port.close();
    port = null;
    setTimeout(function () {
        port = new SerialPort(com, {
            baudRate: baudRate
        });
        emitter.emit("click_event");
        if (isMusic)
        {
            setTimeout(function () {
                sendPortData(isMusic);
            }, 500);
        }
    }, 3000);
});

//发送串口数据
// 根据监听事件触发
emitter.on("send_event", function(frame){
    //console.log("事件触发，调用此回调函数");
    async.waterfall([
        function(callback){
            if (0 == frame)
            {
                var full_frame = 0;
            }
            else
            {
                var full_frame = zip(updown, frame);
            }
            callback(null, full_frame);
        },
        function(arg1, callback){
            if (0 != arg1)
            {
                console.log('sendDDDDDDDDDDDDDDDDDD: ');
                console.log(arg1);
                port.write(arg1);

                // emitter.emit("send_event", getFileData(1))
            }
            callback(null, 'success');
        }
    ], function (err, result) {

    });
});



var receiveBuf = null;

//收到串口数据
emitter.on("click_event", function () {
    port.on("data", function (data) {
        console.error("port.on data: " + JSON.stringify(data))
        console.error(data);
        // if ((21 > data.length) || (null != receiveBuf))
        // {
        //     receiveBuf = bufferConcat(receiveBuf, data);
        // }
        // else
        // {
        //     receiveBuf = data;
        // }
        var buff_t = unCompressCan(data);
        if (('object' == typeof buff_t) && (true == buff_t.isSuccess))
        {
            dataProcess(buff_t.buffer);
            // async.waterfall([
            //     function(callback){
            //         console.log(buff_t.buffer)
            //         var frame =
            //         callback(null, frame);
            //     },
            //     function(arg1, callback){
            //         if ((arg1 != 0) && (arg1 != undefined))
            //         {
            //             emitter.emit("send_event", arg1);
            //         }
            //         callback(null, 'success');
            //     }
            // ], function (err, result) {
            //     receiveBuf = null;
            // });
        }       

    })
});

// //收到错误 串口出现意外
// emitter.on("error_event", function () {
//     port.on('error', function(err) {
//         console.log('Error: ', err.message);
//     })
// })

var com      = null;
var baudRate = null;

global.fileStrVcu  = null;
global.fileStrTbox = null;

//根据所选串口建立连接
function createConnect()
{
    com      = serial.value || "COM1";
    baudRate = Number(baudrate.value) || 9600;
    port = new SerialPort(com, {
        baudRate: baudRate
    });
    var tableHeadVcu = ['序号','时间','音频蓝牙','数据蓝牙','遥控器','文件存储状态','485通信状态','预留','发生事件的id'];
    fileStrVcu  = tableHeadVcu.join(" ") + "\n";
    var tableHeadTbox = ['序号','时间','GPS状态','GSM状态','SIM卡状态','陀螺仪角度','内部电池电压','主电池电压','预留'];
    fileStrTbox = tableHeadTbox.join(" ") + "\n";
    global.orderVcu = null;
    global.orderTbox = null;
    button_connect.setAttribute("class", "btn-gary btn")
    button_disconnect.setAttribute("class", "btn-blue btn")
    button_disconnect.disabled = false;
    button_connect.disabled = true;

    emitter.emit("click_event");
}


//带触发断开连接
function closeConnect() {
    button_disconnect.setAttribute("class", "btn-gary btn")
    button_connect.setAttribute("class", "btn-blue btn")
    // removeClass(button_disconnect, "btn-blue");
    // addClass(button_disconnect, "btn-gary");
    // removeClass(button_connect, "btn-gary");
    // addClass(button_connect, "btn-blue");
    button_disconnect.disabled = true;
    button_connect.disabled = false;
    port.close();
    // fileStrVcu  = null;
    // fileStrTbox = null;
}


//保存日志
function saveAll() {
    //利用对话框返回的值 （true 或者 false）
    if((null == fileStrVcu) && (null == fileStrTbox))
    {
        alert("无日志产生，请检查连接状态！")
    }
    else
    {
        if (button_disconnect.disabled == false)
        {
            alert("请先断开连接！");
        }
        else
        {
            if (confirm("你确定保存日志吗？")) {
                var now = new Date();
                alert("保存日志文件，文件名：xxx_" + now.format("hh-mm")+ ".log");
                appendFile();
            }
        }
    }
}