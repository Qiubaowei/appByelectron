var path       = require('path');
var SerialPort = require("serialport");
var fs         = require('fs');
var async      = require('async');
var events     = require("events");

var dataProcess  = require('C:/myProgram/nodejs692/iap_js/dataproc').dataProcess;
var getCmdFrame  = require('C:/myProgram/nodejs692/iap_js/dataproc').getCmdFrame;
var readFileData = require('C:/myProgram/nodejs692/iap_js/dataproc').readFileData;
var getFileData  = require('C:/myProgram/nodejs692/iap_js/dataproc').getFileData;
var zip          = require('C:/myProgram/nodejs692/iap_js/lib').zip;
var calDataNum   = require('C:/myProgram/nodejs692/iap_js/lib').calDataNum;
var bufferSlice  = require('C:/myProgram/nodejs692/iap_js/lib').bufferSlice;
var bufferConcat = require('C:/myProgram/nodejs692/iap_js/lib').bufferConcat;
var checkRep     = require('C:/myProgram/nodejs692/iap_js/lib').checkRep;
var unCompress   = require('C:/myProgram/nodejs692/iap_js/lib').unCompress;
var getFileType  = require('C:/myProgram/nodejs692/iap_js/lib').getFileType;


var serial   = document.getElementById('port');
var baudrate = document.getElementById('baudrate');
var progress = document.getElementById('progress');


var button_connect    = document.getElementById('connect');
var button_update     = document.getElementById('update');
var button_disconnect = document.getElementById('disconnect');
var button_download   = document.getElementById('download');
var button_scan       = document.getElementById('scan');

var input_fileField     = document.getElementById('fileField');
var input_fileField_rmf = document.getElementById('fileField2');

global.emitter = new events.EventEmitter();//创建了事件监听器的一个对象
global.port    = null;
global.updown  = null;
global.suffix  = null;

button_connect.onclick    = createConnect;
button_update.onclick     = sendPortData;
button_disconnect.onclick = closeConnect;

button_disconnect.disabled = true;

if (button_scan)
{
    button_scan.onclick = nodeScan;
}
if (button_download)
{
    button_download.onclick = download;
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
        if ((7 > data.length) || (null != receiveBuf))
        {
            receiveBuf = bufferConcat(receiveBuf, data);
        }
        else
        {
            receiveBuf = data;
        }
        console.log(receiveBuf);
        var buff_t = unCompress(receiveBuf);
        if (('object' == typeof buff_t))
        {
            async.waterfall([
                function(callback){
                    var frame = dataProcess(buff_t);
                    callback(null, frame);
                },
                function(arg1, callback){
                    if ((arg1 != 0) && (arg1 != undefined))
                    {
                        emitter.emit("send_event", arg1);
                    }
                    callback(null, 'success');
                }
            ], function (err, result) {
                receiveBuf = null;
            });
        }
        if ('number' == (typeof buff_t))
        {
            var errBuf = null;
            switch (buff_t)
            {
                case 0x01:
                    errBuf = new Buffer([0x01,0x21,0]);
                    break;
                case 0x02:
                    errBuf = new Buffer([0x01,0x22,0]);
                    break;
                case 0x03:
                    errBuf = new Buffer([0x01,0x23,0]);
                    break;
                case 0x04:
                    errBuf = new Buffer([0x01,0x24,0]);
                    break;
                case 0x05:
                    errBuf = new Buffer([0x01,0x25,0]);
                    break;
                default:
                    errBuf = 0;
                    break;
            }
            receiveBuf = null;
            emitter.emit("send_event", errBuf);
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

//根据所选串口建立连接
function createConnect()
{
    com      = serial.value || "COM3";
    baudRate = Number(baudrate.value) || 115200;
    port = new SerialPort(com, {
        baudRate: baudRate
    });

    button_connect.setAttribute("class", "btn-gary btn")
    button_disconnect.setAttribute("class", "btn-blue btn")
    // removeClass(button_connect, "btn-blue");
    // addClass(button_connect, "btn-gary");
    // removeClass(button_disconnect, "btn-gary");
    // addClass(button_disconnect, "btn-blue");
    button_disconnect.disabled = false;
    button_connect.disabled = true;

    emitter.emit("click_event");
    // emitter.emit("error_event");
    //progress.innerHTML = "写入数据......0%";
}

global.isBin = null;
global.isRmf = null;

//更新到车上
function sendPortData(dumpMusic)
{
    if (null == port)
    {
        alert("请先连接串口");
        return;
    }
    var filePath = input_fileField.value || input_fileField_rmf.value;
    if (input_fileField.value)
    {
        isBin = true;
    }
    if (input_fileField_rmf.value)
    {
        isRmf = true;
    }
    console.log(dumpMusic)
    if(dumpMusic == true)
    {
        filePath = input_fileField_rmf.value;
    }
    suffix       = getFileType(filePath);
    if (0 != suffix)
    {
        readFileData(filePath);
        updown = "down";
        var typeCmd = 0x01;
        var buf = getCmdFrame(typeCmd);
    	emitter.emit('send_event', buf);
    	console.time('写入文件成功')
    }
    else
    {
        alert('请先选择文件');
    }
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
}

function hasClass(elem, cls){
    cls = cls || '';
    if(cls.replace(/\s/g, '').length == 0) return false;
    return new RegExp(' ' + cls + ' ').test(' ' + elem.className + ' ');
}

function addClass(elem, cls){
    if(!hasClass(elem, cls)){
        elem.className += ' ' + cls;
    }
}

function removeClass(elem, cls){
    if(hasClass(elem, cls)){
        var newClass = ' ' + elem.className.replace(/[\t\r\n]/g, '') + ' ';
        while(newClass.indexOf(' ' + cls + ' ') >= 0){
            newClass = newClass.replace(' ' + cls + ' ', ' ');
        }
        elem.className = newClass.replace(/^\s+|\s+$/g, '');
    }
}

//带触发下载到软件
function download() {
    updown = "up";
}